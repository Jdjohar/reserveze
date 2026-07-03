import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Calendar, Availability } from '@/models';
import mongoose from 'mongoose';

const DEMO_BUSINESS_ID = new mongoose.Types.ObjectId('6681a28a30182496a75f829f');

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId') || DEMO_BUSINESS_ID.toString();

    const list = await Calendar.find({ businessId });
    return NextResponse.json({ success: true, calendars: list });
  } catch (error: any) {
    console.error('Failed to get calendars:', error);
    return NextResponse.json({ success: false, error: error.message || 'Database error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { businessId, name, timezone, timeFormat, phone, email, address, slug, count = 1, importFromId } = body;

    const bizId = businessId || DEMO_BUSINESS_ID.toString();

    if (!mongoose.Types.ObjectId.isValid(bizId)) {
      return NextResponse.json({ success: false, error: 'Invalid business ID' }, { status: 400 });
    }

    // 1. Fetch the business to check its plan limits
    const BusinessModel = mongoose.models.Business || mongoose.model('Business');
    const business = await BusinessModel.findById(bizId);
    if (!business) {
      return NextResponse.json({ success: false, error: 'Business profile not found' }, { status: 404 });
    }

    // Determine plan: Pro if smsCreditsCap === 500 or business.plan === 'PRO'
    const isPro = business.smsCreditsCap === 500 || business.plan === 'PRO';
    const limit = isPro ? 10 : 1;

    // 2. Count existing calendars for this business
    const existingCount = await Calendar.countDocuments({ businessId: bizId });
    if (existingCount + Number(count) > limit) {
      return NextResponse.json({ 
        success: false, 
        error: `Action blocked: creating ${count} locations would exceed your active plan limit of ${limit} calendar locations. (Currently using: ${existingCount}).`
      }, { status: 403 });
    }

    // 3. Load import data template if specified
    let templateData: any = null;
    let templateAvailabilities: any[] = [];
    if (importFromId && mongoose.Types.ObjectId.isValid(importFromId)) {
      templateData = await Calendar.findById(importFromId);
      if (templateData) {
        templateAvailabilities = await Availability.find({ calendarId: importFromId });
      }
    }

    // Resolve base name prefix
    let baseName = name;
    if (!baseName) {
      if (templateData) {
        baseName = templateData.name.replace(/\(Main Location\)/gi, '').replace(/\(Main Branch\)/gi, '').replace(/- Location \d+/gi, '').replace(/- Branch \d+/gi, '').trim();
      } else {
        baseName = business.name || 'Branch';
      }
    }

    const createdCalendars = [];
    const itemsCount = Math.max(1, Number(count));

    for (let i = 0; i < itemsCount; i++) {
      // Name formatting
      const finalName = (itemsCount === 1 && name) ? name : `${baseName} - Location ${existingCount + i + 1}`;
      
      // Slug generating
      let finalSlug = undefined;
      if (slug) {
        const baseSlug = slug.toLowerCase().replace(/[^a-z0-9-_]/g, '');
        const candidateSlug = i === 0 ? baseSlug : `${baseSlug}-loc-${i + 1}`;
        const duplicate = await Calendar.findOne({ slug: candidateSlug });
        if (!duplicate) {
          finalSlug = candidateSlug;
        }
      }

      // Inherited fields from template
      const inheritedPhone = phone || (templateData ? templateData.phone : '');
      const inheritedEmail = email || (templateData ? templateData.email : '');
      const inheritedAddress = address || (templateData ? templateData.address : '');
      const inheritedTimezone = timezone || (templateData ? templateData.timezone : 'UTC');
      const inheritedFormat = timeFormat || (templateData ? templateData.timeFormat : '12h');

      // Create calendar
      const newCal = await Calendar.create({
        businessId: bizId,
        name: finalName,
        timezone: inheritedTimezone,
        timeFormat: inheritedFormat,
        phone: inheritedPhone,
        email: inheritedEmail,
        address: inheritedAddress,
        slug: finalSlug || undefined
      });

      createdCalendars.push(newCal);

      // Clone availability rules if template was found
      if (templateAvailabilities.length > 0) {
        for (const rule of templateAvailabilities) {
          await Availability.create({
            calendarId: newCal._id,
            dayOfWeek: rule.dayOfWeek,
            isEnabled: rule.isEnabled,
            startTime: rule.startTime,
            endTime: rule.endTime,
            breaks: rule.breaks || []
          });
        }
      } else {
        // Create standard default weekly hours
        for (let day = 1; day <= 5; day++) {
          await Availability.create({
            calendarId: newCal._id,
            dayOfWeek: day,
            isEnabled: true,
            startTime: '09:00',
            endTime: '17:00',
            breaks: []
          });
        }
      }
    }

    return NextResponse.json({ success: true, calendars: createdCalendars });
  } catch (error: any) {
    console.error('Failed to create calendar:', error);
    return NextResponse.json({ success: false, error: error.message || 'Database error' }, { status: 500 });
  }
}
