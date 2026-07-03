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

    const newClient = await Client.create({
      businessId,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      company: body.company,
      primaryNotificationChannel: body.primaryNotificationChannel || 'email'
    });

    return NextResponse.json({ success: true, client: newClient });
  } catch (error: any) {
    console.error('Failed to create client:', error);
    return NextResponse.json({ success: false, error: error.message || 'Database error' }, { status: 500 });
  }
}
