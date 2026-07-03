import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Service } from '@/models';
import mongoose from 'mongoose';

// Fallback demo business ID in case none is passed
const DEMO_BUSINESS_ID = new mongoose.Types.ObjectId('6681a28a30182496a75f829f');

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId') || DEMO_BUSINESS_ID.toString();

    const list = await Service.find({ businessId }).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, services: list });
  } catch (error: any) {
    console.error('Failed to get services:', error);
    return NextResponse.json({ success: false, error: error.message || 'Database error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const businessId = body.businessId || DEMO_BUSINESS_ID.toString();

    // calculate total duration in minutes
    const hours = body.durationHours || 0;
    const mins = body.durationMinutes || 0;
    const totalDuration = (hours * 60) + mins;

    const newService = await Service.create({
      businessId,
      name: body.name,
      duration: totalDuration,
      durationHours: hours,
      durationMinutes: mins,
      price: body.price || 0,
      maxCapacity: body.maxCapacity || 1,
      advanceBookingDays: body.advanceBookingDays || 0,
      advanceBookingHours: body.advanceBookingHours || 0,
      advanceBookingMinutes: body.advanceBookingMinutes || 0,
      imageUrl: body.imageUrl,
      isActive: body.isActive ?? true
    });

    return NextResponse.json({ success: true, service: newService });
  } catch (error: any) {
    console.error('Failed to create service:', error);
    return NextResponse.json({ success: false, error: error.message || 'Database error' }, { status: 500 });
  }
}
