import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Availability, Calendar } from '@/models';
import mongoose from 'mongoose';

const DEMO_BUSINESS_ID = new mongoose.Types.ObjectId('6681a28a30182496a75f829f');

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const calendarId = searchParams.get('calendarId');
    const businessId = searchParams.get('businessId') || DEMO_BUSINESS_ID.toString();

    let query: any = {};
    if (calendarId && mongoose.Types.ObjectId.isValid(calendarId)) {
      query.calendarId = new mongoose.Types.ObjectId(calendarId);
    } else {
      // Fallback: find first calendar of business
      const firstCal = await Calendar.findOne({ businessId });
      if (firstCal) {
        query.calendarId = firstCal._id;
      } else {
        return NextResponse.json({ success: true, availabilities: [] });
      }
    }

    const list = await Availability.find(query).sort({ dayOfWeek: 1 });
    return NextResponse.json({ success: true, availabilities: list });
  } catch (error: any) {
    console.error('Failed to get availability:', error);
    return NextResponse.json({ success: false, error: error.message || 'Database error' }, { status: 500 });
  }
}
