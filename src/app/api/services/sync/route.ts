import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Service } from '@/models';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const { businessId, calendarId } = body;
    if (!businessId || !calendarId) {
      return NextResponse.json({ success: false, error: 'businessId and calendarId are required' }, { status: 400 });
    }

    // 1. Fetch all central business services (calendarId is null/undefined)
    const centralServices = await Service.find({
      businessId,
      $or: [
        { calendarId: { $exists: false } },
        { calendarId: null }
      ]
    });

    if (centralServices.length === 0) {
      return NextResponse.json({ success: true, message: 'No central services to sync.', syncedCount: 0 });
    }

    let syncedCount = 0;
    const syncedServices = [];

    // 2. Clone each central service for this specific location/calendar if it doesn't exist
    for (const svc of centralServices) {
      const exists = await Service.findOne({
        businessId,
        calendarId,
        name: svc.name
      });

      if (!exists) {
        const cloned = await Service.create({
          businessId,
          calendarId,
          name: svc.name,
          duration: svc.duration,
          durationHours: svc.durationHours,
          durationMinutes: svc.durationMinutes,
          price: svc.price,
          maxCapacity: svc.maxCapacity,
          advanceBookingDays: svc.advanceBookingDays,
          advanceBookingHours: svc.advanceBookingHours,
          advanceBookingMinutes: svc.advanceBookingMinutes,
          imageUrl: svc.imageUrl,
          isActive: svc.isActive
        });
        syncedServices.push(cloned);
        syncedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${syncedCount} services from central business.`,
      syncedCount,
      services: syncedServices
    });
  } catch (error: any) {
    console.error('Failed to sync services:', error);
    return NextResponse.json({ success: false, error: error.message || 'Database error' }, { status: 500 });
  }
}
