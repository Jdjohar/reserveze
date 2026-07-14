import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Client, Appointment, Calendar, Service } from '@/models';
import mongoose from 'mongoose';

const DEMO_BUSINESS_ID = new mongoose.Types.ObjectId('6681a28a30182496a75f829f');

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId') || DEMO_BUSINESS_ID.toString();
    const q = searchParams.get('q') || '';

    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      return NextResponse.json({ success: false, error: 'Invalid business ID' }, { status: 400 });
    }

    if (!q.trim()) {
      return NextResponse.json({ success: true, clients: [], appointments: [] });
    }

    const searchQuery = q.trim();

    // 1. Find clients matching search query
    const clients = await Client.find({
      businessId,
      $or: [
        { firstName: { $regex: searchQuery, $options: 'i' } },
        { lastName: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } },
        { phone: { $regex: searchQuery, $options: 'i' } }
      ]
    }).limit(10);

    // 2. Find calendars for the business
    const calendars = await Calendar.find({ businessId });
    const calendarIds = calendars.map(c => c._id);

    // Find client IDs that match search query to look up their appointments
    const matchingClientIds = clients.map(c => c._id);

    // 3. Find appointments in those calendars matching search query or matching client IDs
    const appointments = await Appointment.find({
      calendarId: { $in: calendarIds },
      $or: [
        { notes: { $regex: searchQuery, $options: 'i' } },
        { clientId: { $in: matchingClientIds } }
      ]
    }).sort({ startTime: -1 }).limit(10);

    // Populate client and service info manually
    const clientIds = appointments.map(a => a.clientId).filter(Boolean);
    const serviceIds = appointments.map(a => a.serviceId).filter(Boolean);

    const [clientsPop, servicesPop] = await Promise.all([
      Client.find({ _id: { $in: clientIds } }),
      Service.find({ _id: { $in: serviceIds } })
    ]);

    const mappedAppointments = appointments.map(appt => {
      const clientObj = clientsPop.find(c => c._id.toString() === appt.clientId.toString());
      const serviceObj = servicesPop.find(s => s._id.toString() === appt.serviceId.toString());
      return {
        ...appt.toObject(),
        clientName: clientObj ? `${clientObj.firstName} ${clientObj.lastName}` : 'Walk-in Client',
        serviceName: serviceObj ? serviceObj.name : 'Standard Appointment',
        price: serviceObj ? serviceObj.price : 45
      };
    });

    return NextResponse.json({
      success: true,
      clients,
      appointments: mappedAppointments
    });
  } catch (error: any) {
    console.error('Failed to search:', error);
    return NextResponse.json({ success: false, error: error.message || 'Database error' }, { status: 500 });
  }
}
