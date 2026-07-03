import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Appointment, Calendar, Client, Service } from '@/models';
import mongoose from 'mongoose';

const DEMO_BUSINESS_ID = new mongoose.Types.ObjectId('6681a28a30182496a75f829f');

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId') || DEMO_BUSINESS_ID.toString();

    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      return NextResponse.json({ success: false, error: 'Invalid business ID' }, { status: 400 });
    }

    const calendars = await Calendar.find({ businessId });
    const calendarIds = calendars.map(c => c._id);

    const appointments = await Appointment.find({ calendarId: { $in: calendarIds } }).sort({ startTime: 1 });
    
    // Populate client and service info manually
    const clientIds = appointments.map(a => a.clientId).filter(Boolean);
    const serviceIds = appointments.map(a => a.serviceId).filter(Boolean);

    const [clients, services] = await Promise.all([
      Client.find({ _id: { $in: clientIds } }),
      Service.find({ _id: { $in: serviceIds } })
    ]);

    const mapped = appointments.map(appt => {
      const client = clients.find(c => c._id.toString() === appt.clientId.toString());
      const service = services.find(s => s._id.toString() === appt.serviceId.toString());
      return {
        ...appt.toObject(),
        clientName: client ? `${client.firstName} ${client.lastName}` : 'Walk-in Client',
        serviceName: service ? service.name : 'Standard Appointment',
        price: service ? service.price : 45
      };
    });

    return NextResponse.json({ success: true, appointments: mapped });
  } catch (error: any) {
    console.error('Failed to fetch appointments:', error);
    return NextResponse.json({ success: false, error: error.message || 'Database error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { calendarId, serviceId, clientId, startTime, endTime, status, primaryChannel, notes, botTimestamp, captchaAnswer, captchaInput } = body;

    // 1. Anti-Bot checks
    if (botTimestamp) {
      const timeElapsed = Date.now() - Number(botTimestamp);
      if (timeElapsed < 2500) {
        return NextResponse.json({ success: false, error: 'Verification error: booking submitted too quickly (bot activity suspected).' }, { status: 400 });
      }
    }

    if (captchaAnswer !== undefined && captchaInput !== undefined) {
      if (Number(captchaInput) !== Number(captchaAnswer)) {
        return NextResponse.json({ success: false, error: 'Verification error: human verification check failed. Please try again.' }, { status: 400 });
      }
    }

    // 2. Resolve calendar location & check business prepaid credits
    if (!calendarId || !mongoose.Types.ObjectId.isValid(calendarId)) {
      return NextResponse.json({ success: false, error: 'Valid calendar workspace ID is required' }, { status: 400 });
    }

    const calendar = await Calendar.findById(calendarId);
    if (!calendar) {
      return NextResponse.json({ success: false, error: 'Calendar location workspace not found' }, { status: 404 });
    }

    const BusinessModel = mongoose.models.Business || mongoose.model('Business');
    const business = await BusinessModel.findById(calendar.businessId);
    if (!business) {
      return NextResponse.json({ success: false, error: 'Business profile not found' }, { status: 404 });
    }

    // Validate prepaid balance limit
    if (business.bookingCreditsBalance !== undefined && business.bookingCreditsBalance <= 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Booking temporarily unavailable: merchant has exhausted their prepaid booking credit balance. Please notify the business owner.' 
      }, { status: 402 });
    }

    // 3. Register the appointment
    const newAppointment = await Appointment.create({
      calendarId,
      serviceId: serviceId || new mongoose.Types.ObjectId(),
      clientId: clientId || new mongoose.Types.ObjectId(),
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      status: status || 'PENDING',
      primaryChannel: primaryChannel || 'email',
      notes
    });

    // 4. Deduct 1 prepaid credit from business balance
    await BusinessModel.findByIdAndUpdate(calendar.businessId, {
      $inc: { bookingCreditsBalance: -1 }
    });

    return NextResponse.json({ success: true, appointment: newAppointment });
  } catch (error: any) {
    console.error('Failed to create appointment:', error);
    return NextResponse.json({ success: false, error: error.message || 'Database error' }, { status: 500 });
  }
}
