import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Employee, User } from '@/models';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { sendEmail } from '@/lib/email';

const SALT = 'appoint-salt-123456';

function hashPassword(password: string): string {
  return crypto.pbkdf2Sync(password, SALT, 1000, 64, 'sha512').toString('hex');
}

const DEMO_BUSINESS_ID = new mongoose.Types.ObjectId('6681a28a30182496a75f829f');

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId') || DEMO_BUSINESS_ID.toString();
    const calendarId = searchParams.get('calendarId');

    const query: any = { businessId, isActive: true };
    if (calendarId) {
      query.calendarIds = calendarId;
    }

    const list = await Employee.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, employees: list });
  } catch (error: any) {
    console.error('Failed to fetch team members:', error);
    return NextResponse.json({ success: false, error: error.message || 'Database error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const businessId = body.businessId || DEMO_BUSINESS_ID.toString();

    if (!body.firstName || !body.lastName || !body.email) {
      return NextResponse.json({ success: false, error: 'First name, last name, and email are required.' }, { status: 400 });
    }

    const cleanEmail = body.email.toLowerCase().trim();
    const finalPassword = body.password || `Reserveze-${Math.floor(1000 + Math.random() * 9000)}`;

    const newEmployee = await Employee.create({
      businessId,
      firstName: body.firstName,
      lastName: body.lastName,
      email: cleanEmail,
      phone: body.phone,
      role: body.role || 'STAFF',
      calendarIds: body.calendarIds || [],
      serviceIds: body.serviceIds || [],
      isActive: true
    });

    // Create User login credential mapping
    const passwordHash = hashPassword(finalPassword);
    let user = await User.findOne({ email: cleanEmail });
    if (!user) {
      await User.create({
        name: `${body.firstName} ${body.lastName}`,
        email: cleanEmail,
        passwordHash,
        role: 'MERCHANT'
      });
    } else {
      user.passwordHash = passwordHash;
      await user.save();
    }

    // Send Welcome Email containing credentials (Async / Non-blocking)
    try {
      const BusinessModel = mongoose.models.Business || mongoose.model('Business');
      const business = await BusinessModel.findById(businessId);
      const businessName = business ? business.name : 'your company';

      sendEmail({
        to: cleanEmail,
        subject: `Welcome to ${businessName} on Reserveze - Account Details`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
            <h2 style="color: #6200ee; text-align: center;">Welcome to the Team!</h2>
            <p>Hi <strong>${body.firstName}</strong>,</p>
            <p>An administrative staff account has been created for you at <strong>${businessName}</strong> on the Reserveze scheduling platform.</p>

            <p>Here are your secure dashboard login credentials:</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 13px;">
              <p style="margin: 5px 0;"><strong>Control Panel:</strong> <a href="http://localhost:3000/login">http://localhost:3000/login</a></p>
              <p style="margin: 5px 0;"><strong>Username / Email:</strong> ${cleanEmail}</p>
              <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="background-color: #e0e0e0; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-family: monospace;">${finalPassword}</code></p>
            </div>

            <p style="color: #d32f2f; font-size: 11px;">⚠️ Please change your temporary password immediately after logging in for the first time by visiting your profile settings.</p>

            <p>If you have any questions, please reach out to your business manager or administrator.</p>

            <p style="font-size: 11px; color: #757575; text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
              This is an automated invitation from Reserveze Team Management.
            </p>
          </div>
        `
      }).catch(err => console.error('Error sending team welcome email:', err));
    } catch (err) {
      console.error('Welcome email notification trigger error:', err);
    }

    return NextResponse.json({ success: true, employee: newEmployee, tempPassword: finalPassword });
  } catch (error: any) {
    console.error('Failed to create team member:', error);
    return NextResponse.json({ success: false, error: error.message || 'Database error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, firstName, lastName, email, phone, role, calendarIds, serviceIds, isActive } = body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Valid employee ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email.toLowerCase().trim();
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined) updateData.role = role;
    if (calendarIds !== undefined) updateData.calendarIds = calendarIds;
    if (serviceIds !== undefined) updateData.serviceIds = serviceIds;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await Employee.findByIdAndUpdate(id, { $set: updateData }, { new: true });
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Team member not found' }, { status: 404 });
    }

    // Update password if passed
    if (body.password) {
      const passwordHash = hashPassword(body.password);
      const cleanEmail = (email || updated.email).toLowerCase().trim();
      let user = await User.findOne({ email: cleanEmail });
      if (!user) {
        await User.create({
          name: `${updated.firstName} ${updated.lastName}`,
          email: cleanEmail,
          passwordHash,
          role: 'MERCHANT'
        });
      } else {
        user.passwordHash = passwordHash;
        await user.save();
      }
    }

    return NextResponse.json({ success: true, employee: updated });
  } catch (error: any) {
    console.error('Failed to update team member:', error);
    return NextResponse.json({ success: false, error: error.message || 'Database error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Valid employee ID is required' }, { status: 400 });
    }

    // Soft delete/deactivate so we preserve history for booked appointments
    const updated = await Employee.findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true });
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Team member not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete team member:', error);
    return NextResponse.json({ success: false, error: error.message || 'Database error' }, { status: 500 });
  }
}
