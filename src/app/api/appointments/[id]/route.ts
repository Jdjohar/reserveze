import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Appointment, Client, Service, Business } from '@/models';
import mongoose from 'mongoose';
import { sendEmail } from '@/lib/email';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid appointment ID' }, { status: 400 });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 });
    }

    // Load related items
    const client = await Client.findById(appointment.clientId);
    const service = await Service.findById(appointment.serviceId);
    
    let business = null;
    if (client) {
      business = await Business.findById(client.businessId);
    }

    return NextResponse.json({
      success: true,
      appointment,
      client,
      service,
      business
    });
  } catch (error: any) {
    console.error('Failed to get appointment details:', error);
    return NextResponse.json({ success: false, error: error.message || 'Database error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid appointment ID' }, { status: 400 });
    }

    const updated = await Appointment.findByIdAndUpdate(
      id,
      { status: body.status },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 });
    }

    // Send Booking Status Update Email (Async / Non-blocking)
    try {
      const client = await Client.findById(updated.clientId);
      const service = await Service.findById(updated.serviceId);
      const CalendarModel = mongoose.models.Calendar || mongoose.model('Calendar');
      const calendar = await CalendarModel.findById(updated.calendarId);
      const business = calendar ? await Business.findById(calendar.businessId) : null;

      if (client && client.email && business) {
        const clientDateStr = new Date(updated.startTime).toLocaleString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short'
        });

        // Determine status display details
        let statusTitle = 'Booking Updated';
        let statusDescription = `Your appointment status has been updated to <strong>${updated.status}</strong>.`;
        let statusColor = '#f57f17'; // default yellow

        if (updated.status === 'CONFIRMED') {
          statusTitle = 'Booking Confirmed!';
          statusDescription = 'Great news! Your booking has been approved and confirmed by the merchant.';
          statusColor = '#2e7d32'; // green
        } else if (updated.status === 'COMPLETED') {
          statusTitle = 'Booking Completed!';
          statusDescription = 'Your appointment has been successfully completed. Thank you for choosing us!';
          statusColor = '#1565c0'; // blue
        } else if (updated.status === 'CANCELLED') {
          statusTitle = 'Booking Cancelled';
          statusDescription = 'Your appointment has been cancelled. If you believe this is an error, please contact the business.';
          statusColor = '#c62828'; // red
        }

        sendEmail({
          to: client.email,
          subject: `${statusTitle} - ${business.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
              <h2 style="color: ${statusColor}; text-align: center;">${statusTitle}</h2>
              <p>Hi <strong>${client.firstName} ${client.lastName}</strong>,</p>
              <p>${statusDescription}</p>
              
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="margin: 0 0 10px 0; color: #333;">Booking Summary</h4>
                <p style="margin: 5px 0;"><strong>Service:</strong> ${service ? service.name : 'Standard Appointment'}</p>
                <p style="margin: 5px 0;"><strong>Date & Time:</strong> ${clientDateStr}</p>
                <p style="margin: 5px 0;"><strong>Location:</strong> ${calendar ? calendar.name : 'Branch Location'}</p>
                <p style="margin: 5px 0;"><strong>Status:</strong> <span style="background-color: ${statusColor}1A; color: ${statusColor}; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; text-transform: uppercase;">${updated.status}</span></p>
              </div>

              <p>You can view full details or reschedule options live on the booking tracking portal:</p>
              <div style="text-align: center; margin: 25px 0;">
                <a href="http://localhost:3000/booking/track/${updated._id}" style="background-color: #6200ee; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">Track Booking Details</a>
              </div>

              <p style="font-size: 11px; color: #757575; text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
                This is an automated status update from Reserveze Scheduling engine.
              </p>
            </div>
          `
        }).catch(err => console.error('Error sending client status update email:', err));
      }
    } catch (err) {
      console.error('Non-blocking status update notifications error:', err);
    }

    return NextResponse.json({ success: true, appointment: updated });
  } catch (error: any) {
    console.error('Failed to update appointment status:', error);
    return NextResponse.json({ success: false, error: error.message || 'Database error' }, { status: 500 });
  }
}
