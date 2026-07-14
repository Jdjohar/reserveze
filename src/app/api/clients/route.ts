import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Client } from '@/models';
import mongoose from 'mongoose';

const DEMO_BUSINESS_ID = new mongoose.Types.ObjectId('6681a28a30182496a75f829f');

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId') || DEMO_BUSINESS_ID.toString();
    const email = searchParams.get('email');

    if (email) {
      const client = await Client.findOne({ businessId, email: email.toLowerCase().trim() });
      return NextResponse.json({ success: true, client });
    }

    const list = await Client.find({ businessId }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, clients: list });
  } catch (error: any) {
    console.error('Failed to fetch clients:', error);
    return NextResponse.json({ success: false, error: error.message || 'Database error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const businessId = body.businessId || DEMO_BUSINESS_ID.toString();

    if (!body.email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    const emailKey = body.email.toLowerCase().trim();

    // Server-side validation
    const { validateEmail, validatePhone } = await import('@/lib/validation');
    const emailCheck = validateEmail(emailKey);
    if (!emailCheck.isValid) {
      return NextResponse.json({ success: false, error: 'Invalid email address format.' }, { status: 400 });
    }
    if (emailCheck.isDisposable) {
      return NextResponse.json({ success: false, error: 'Disposable email addresses are not allowed.' }, { status: 400 });
    }
    if (body.phone && !validatePhone(body.phone)) {
      return NextResponse.json({ success: false, error: 'Invalid phone number format.' }, { status: 400 });
    }

    // Find if client with same email exists for this business
    let client = await Client.findOne({ businessId, email: emailKey });

    if (client) {
      // If existing client doesn't have a calendarId but the request has one, update it!
      if (!client.calendarId && body.calendarId && mongoose.Types.ObjectId.isValid(body.calendarId)) {
        client.calendarId = new mongoose.Types.ObjectId(body.calendarId);
        await client.save();
      }
    } else {
      client = await Client.create({
        businessId,
        calendarId: body.calendarId || undefined,
        firstName: body.firstName,
        lastName: body.lastName,
        email: emailKey,
        phone: body.phone,
        company: body.company,
        primaryNotificationChannel: body.primaryNotificationChannel || 'email'
      });
    }

    return NextResponse.json({ success: true, client });
  } catch (error: any) {
    console.error('Failed to create/update client:', error);
    return NextResponse.json({ success: false, error: error.message || 'Database error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, firstName, lastName, email, phone, company, primaryNotificationChannel } = body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Valid client ID is required.' }, { status: 400 });
    }

    // Server-side validation
    const { validateEmail, validatePhone } = await import('@/lib/validation');
    if (email) {
      const emailCheck = validateEmail(email);
      if (!emailCheck.isValid) {
        return NextResponse.json({ success: false, error: 'Invalid email address format.' }, { status: 400 });
      }
      if (emailCheck.isDisposable) {
        return NextResponse.json({ success: false, error: 'Disposable email addresses are not allowed.' }, { status: 400 });
      }
    }
    if (phone && !validatePhone(phone)) {
      return NextResponse.json({ success: false, error: 'Invalid phone number format.' }, { status: 400 });
    }

    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email.toLowerCase().trim();
    if (phone !== undefined) updateData.phone = phone;
    if (company !== undefined) updateData.company = company;
    if (primaryNotificationChannel !== undefined) updateData.primaryNotificationChannel = primaryNotificationChannel;

    const updated = await Client.findByIdAndUpdate(id, { $set: updateData }, { new: true });
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Client not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, client: updated });
  } catch (error: any) {
    console.error('Failed to update client:', error);
    return NextResponse.json({ success: false, error: error.message || 'Database error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Valid client ID is required.' }, { status: 400 });
    }

    const deleted = await Client.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Client not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Client deleted successfully.' });
  } catch (error: any) {
    console.error('Failed to delete client:', error);
    return NextResponse.json({ success: false, error: error.message || 'Database error' }, { status: 500 });
  }
}
