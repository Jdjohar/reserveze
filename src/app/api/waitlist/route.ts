import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Waitlist } from '@/models';
import { sendEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { name, email } = await req.json();

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: 'Name and email are required fields.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await Waitlist.findOne({ email: cleanEmail });

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'You are already registered on our waitlist! We will notify you when we launch.'
      });
    }

    await Waitlist.create({
      name: name.trim(),
      email: cleanEmail
    });

    // Send welcome email to user
    await sendEmail({
      to: cleanEmail,
      subject: 'Welcome to the Reserveze Waitlist!',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background-color: #6366f1; color: #ffffff; padding: 12px; border-radius: 12px; font-weight: bold; font-size: 20px;">R</div>
            <h1 style="color: #6366f1; font-size: 24px; font-weight: 800; margin: 12px 0 0 0;">Reserveze</h1>
          </div>
          <h2 style="font-size: 20px; font-weight: 700; text-align: center; margin-bottom: 20px;">You are on the list! 🎉</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #475569;">Hi <strong>${name}</strong>,</p>
          <p style="font-size: 14px; line-height: 1.6; color: #475569;">
            Thank you for joining the exclusive waitlist for <strong>Reserveze</strong> – the next-generation operating system for modern service brands.
          </p>
          <p style="font-size: 14px; line-height: 1.6; color: #475569;">
            Whether you run a beauty salon, medical clinic, or scheduling platform, Reserveze is engineered to automate your client booking flow, availability parameters, and multi-location branch calendars in one place, while keeping notifications smart and cost-effective.
          </p>
          <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; padding: 15px; border-radius: 12px; margin: 25px 0; text-align: center;">
            <span style="font-size: 12px; text-transform: uppercase; font-weight: 800; tracking: 0.05em; color: #64748b; block;">Your Status</span>
            <div style="font-size: 18px; font-weight: bold; color: #059669; margin-top: 5px;">Early Access Pending</div>
          </div>
          <p style="font-size: 14px; line-height: 1.6; color: #475569;">
            We will notify you immediately as soon as we open early beta access slots in your region.
          </p>
          <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-top: 30px;">
            Best regards,<br/>
            <strong>The Reserveze Team</strong>
          </p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
          <p style="font-size: 10px; color: #94a3b8; text-align: center; line-height: 1.5;">
            You received this email because you registered on the Reserveze waitlist.<br/>
            &copy; 2026 Reserveze. All rights reserved.
          </p>
        </div>
      `
    });

    // Send alert email to admin
    const adminEmail = process.env.SMTP_USER || 'info@reserveze.com';
    await sendEmail({
      to: adminEmail,
      subject: `New Waitlist Signup: ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #f8fafc; color: #1e293b;">
          <h2 style="color: #6366f1; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-top: 0;">New Waitlist Entry</h2>
          <p style="font-size: 14px;">A new subscriber has joined the waitlist for Reserveze:</p>
          <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 6px 0; font-weight: bold; width: 120px; color: #64748b;">Full Name:</td>
                <td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Email Address:</td>
                <td style="padding: 6px 0; color: #0f172a;">${cleanEmail}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Timestamp:</td>
                <td style="padding: 6px 0; color: #0f172a;">${new Date().toLocaleString()}</td>
              </tr>
            </table>
          </div>
        </div>
      `
    });

    return NextResponse.json({
      success: true,
      message: 'Thank you for joining! A confirmation email has been sent.'
    });
  } catch (err: any) {
    console.error('[Waitlist API Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}
