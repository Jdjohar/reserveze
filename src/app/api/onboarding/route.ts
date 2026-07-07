import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User, Business, Calendar, Availability, Service, Employee } from '@/models';
import mongoose from 'mongoose';
import crypto from 'crypto';

const SALT = 'appoint-salt-123456';

function hashPassword(password: string): string {
  return crypto.pbkdf2Sync(password, SALT, 1000, 64, 'sha512').toString('hex');
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    // 1. Find the signed up user, or fallback
    const targetEmail = body.merchantEmail || "alex@reserveze.com";
    const targetName = body.merchantName || "Alex Mercer";

    let user = await User.findOne({ email: targetEmail });
    if (!user) {
      user = await User.create({
        name: targetName,
        email: targetEmail,
        role: 'MERCHANT'
      });
    }

    // 2. Create or update Business profile
    let business = await Business.findOne({ merchantId: user._id });
    const bizPayload = {
      merchantId: user._id,
      name: body.businessName || 'My Business',
      type: body.category || 'other',
      phone: body.phone,
      email: body.email,
      logoUrl: body.logoUrl,
      whatsapp: body.whatsapp,
      address: body.address,
      plan: 'PRO' as const, // Default plan to PRO for unlocked capacity (10 locations)
      bookingCreditsBalance: 50, // default credits
      notificationPreferences: {
        email: body.preferredNotification === 'email',
        sms: body.preferredNotification === 'sms',
        whatsapp: body.preferredNotification === 'whatsapp'
      }
    };

    if (business) {
      business = await Business.findByIdAndUpdate(business._id, bizPayload, { new: true });
    } else {
      business = await Business.create(bizPayload);
    }

    if (!business) {
      return NextResponse.json({ success: false, error: 'Failed to create business document' }, { status: 500 });
    }

    // 3. Re-create Calendars & Availability
    // Clear old ones first for fresh setup
    await Calendar.deleteMany({ businessId: business._id });

    const createdCalendarIds: mongoose.Types.ObjectId[] = [];
    if (body.calendars && Array.isArray(body.calendars)) {
      for (const cal of body.calendars) {
        const newCal = await Calendar.create({
          businessId: business._id,
          name: cal.name,
          timeFormat: cal.timeFormat || '12h',
          phone: cal.phone,
          email: cal.email,
          address: cal.address,
          slug: cal.slug
        });

        createdCalendarIds.push(newCal._id as mongoose.Types.ObjectId);

        // Add availability schedule records for each weekday (Sun = 0, Mon = 1, ..., Sat = 6)
        const daysMap: { [key: string]: number } = { 
          'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 
        };

        const activeDays = cal.availability?.days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        
        for (const day of ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']) {
          const isEnabled = activeDays.includes(day);
          await Availability.create({
            calendarId: newCal._id,
            dayOfWeek: daysMap[day],
            isEnabled,
            startTime: cal.availability?.startTime || '09:00',
            endTime: cal.availability?.endTime || '17:00'
          });
        }
      }
    }

    // 4. Create Services
    await Service.deleteMany({ businessId: business._id });
    const createdServiceIds: mongoose.Types.ObjectId[] = [];
    if (body.services && Array.isArray(body.services)) {
      for (const svc of body.services) {
        const newSvc = await Service.create({
          businessId: business._id,
          name: svc.name,
          price: svc.price || 0,
          duration: svc.duration || 30,
          durationHours: Math.floor((svc.duration || 30) / 60),
          durationMinutes: (svc.duration || 30) % 60,
          isActive: true
        });
        createdServiceIds.push(newSvc._id as mongoose.Types.ObjectId);
      }
    }

    // 5. Create Team Members
    await Employee.deleteMany({ businessId: business._id });
    if (body.team && Array.isArray(body.team)) {
      for (const member of body.team) {
        const cleanEmail = member.email.toLowerCase().trim();
        await Employee.create({
          businessId: business._id,
          firstName: member.firstName,
          lastName: member.lastName,
          email: cleanEmail,
          phone: member.phone || '',
          role: member.role || 'STAFF',
          calendarIds: createdCalendarIds,
          serviceIds: createdServiceIds,
          isActive: true
        });

        // Create User login credential mapping for the team member
        const finalPassword = member.password || `Reserveze-${Math.floor(1000 + Math.random() * 9000)}`;
        const passwordHash = hashPassword(finalPassword);
        let tUser = await User.findOne({ email: cleanEmail });
        if (!tUser) {
          await User.create({
            name: `${member.firstName} ${member.lastName}`,
            email: cleanEmail,
            passwordHash,
            role: 'MERCHANT'
          });
        } else {
          tUser.passwordHash = passwordHash;
          await tUser.save();
        }
      }
    }

    return NextResponse.json({ success: true, businessId: business._id });
  } catch (error: any) {
    console.error('Failed to complete onboarding database sync:', error);
    return NextResponse.json({ success: false, error: error.message || 'Database error' }, { status: 500 });
  }
}
