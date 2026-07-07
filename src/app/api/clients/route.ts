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
