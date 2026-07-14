import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Appointment, Calendar, Client, Service } from '@/models';
import mongoose from 'mongoose';
import { sendEmail } from '@/lib/email';

const DEMO_BUSINESS_ID = new mongoose.Types.ObjectId('6681a28a30182496a75f829f');

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId') || DEMO_BUSINESS_ID.toString();
    const clientId = searchParams.get('clientId');

    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      return NextResponse.json({ success: false, error: 'Invalid business ID' }, { status: 400 });
    }

    const calendars = await Calendar.find({ businessId });
    const calendarIds = calendars.map(c => c._id);

    let apptQuery: any = { calendarId: { $in: calendarIds } };
    if (clientId && mongoose.Types.ObjectId.isValid(clientId)) {
      apptQuery.clientId = new mongoose.Types.ObjectId(clientId);
    }

    const appointments = await Appointment.find(apptQuery).sort({ startTime: -1 });
    
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
      if (timeElapsed < 1500) {
        return NextResponse.json({ success: false, error: 'Verification error: booking submitted too quickly (bot activity suspected). Please retry.' }, { status: 400 });
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

    // 5. Send Email Notifications (Async / Non-blocking)
    try {
      const [client, service] = await Promise.all([
        Client.findById(clientId),
        Service.findById(serviceId)
      ]);

      if (client && client.email) {
        const clientDateStr = new Date(startTime).toLocaleString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short'
        });

        // Email to Client
        sendEmail({
          to: client.email,
          subject: `Booking Request Received - ${business.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
              <h2 style="color: #6200ee; text-align: center;">Booking Submitted!</h2>
              <p>Hi <strong>${client.firstName} ${client.lastName}</strong>,</p>
              <p>Thank you for booking with us! We have received your booking request for the following service slot:</p>
              
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Service:</strong> ${service ? service.name : 'Standard Appointment'}</p>
                <p style="margin: 5px 0;"><strong>Date & Time:</strong> ${clientDateStr}</p>
                <p style="margin: 5px 0;"><strong>Location:</strong> ${calendar.name}</p>
                <p style="margin: 5px 0;"><strong>Booking Reference:</strong> REZ-${newAppointment._id.toString().slice(-6).toUpperCase()}</p>
                <p style="margin: 5px 0;"><strong>Status:</strong> <span style="background-color: #fff9c4; color: #f57f17; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; text-transform: uppercase;">PENDING CONFIRMATION</span></p>
              </div>

              <p>You can track the live status, manager assignments, or notes for this booking anytime by clicking the link below:</p>
              <div style="text-align: center; margin: 25px 0;">
                <a href="http://localhost:3000/booking/track/${newAppointment._id}" style="background-color: #6200ee; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">View Live Booking Status</a>
              </div>

              <p style="font-size: 11px; color: #757575; text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
                This is an automated transaction receipt from Reserveze Scheduling engine.
              </p>
            </div>
          `
        }).catch(err => console.error('Error sending client booking email:', err));
      }

      // Email to Admin
      if (business && business.email) {
        const clientName = client ? `${client.firstName} ${client.lastName}` : 'Walk-in Client';
        const clientEmail = client ? client.email : 'N/A';
        const clientPhone = client ? (client.phone || 'N/A') : 'N/A';
        const adminDateStr = new Date(startTime).toLocaleString();

        sendEmail({
          to: business.email,
          subject: `Alert: New Booking Received - ${service ? service.name : 'Service'}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
              <h2 style="color: #6200ee;">New Booking Request</h2>
              <p>You have received a new appointment scheduling request on Reserveze.</p>

              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="margin: 0 0 10px 0; color: #333;">Appointment Summary</h4>
                <p style="margin: 5px 0;"><strong>Customer Name:</strong> ${clientName}</p>
                <p style="margin: 5px 0;"><strong>Customer Email:</strong> ${clientEmail}</p>
                <p style="margin: 5px 0;"><strong>Customer Phone:</strong> ${clientPhone}</p>
                <p style="margin: 5px 0;"><strong>Requested Service:</strong> ${service ? service.name : 'Standard Appointment'}</p>
                <p style="margin: 5px 0;"><strong>Scheduled Time:</strong> ${adminDateStr}</p>
                <p style="margin: 5px 0;"><strong>Target Workspace:</strong> ${calendar.name}</p>
                <p style="margin: 5px 0;"><strong>Booking Reference:</strong> REZ-${newAppointment._id.toString().slice(-6).toUpperCase()}</p>
              </div>

              <p>To approve, cancel, or edit this appointment slot, please visit your merchant administrative calendar:</p>
              <div style="text-align: center; margin: 25px 0;">
                <a href="http://localhost:3000/merchant/dashboard" style="background-color: #6200ee; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">Manage Bookings Dashboard</a>
              </div>
            </div>
          `
        }).catch(err => console.error('Error sending admin booking email:', err));
      }
    } catch (err) {
      console.error('Non-blocking notifications trigger error:', err);
    }

    return NextResponse.json({ success: true, appointment: newAppointment });
  } catch (error: any) {
    console.error('Failed to create appointment:', error);
    return NextResponse.json({ success: false, error: error.message || 'Database error' }, { status: 500 });
  }
}
