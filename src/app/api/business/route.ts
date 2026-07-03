import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Business, User } from '@/models';
import mongoose from 'mongoose';

const DEMO_BUSINESS_ID = new mongoose.Types.ObjectId('6681a28a30182496a75f829f');

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    let business = null;

    if (email) {
      const user = await User.findOne({ email });
      if (user) {
        business = await Business.findOne({ merchantId: user._id });
      }
    }

    if (!business) {
      const businessId = searchParams.get('businessId') || DEMO_BUSINESS_ID.toString();
      if (mongoose.Types.ObjectId.isValid(businessId)) {
        business = await Business.findById(businessId);
      }
      if (!business) {
        business = await Business.findOne({ slug: businessId.toLowerCase() });
      }
    }

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business workspace not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, business });
  } catch (error: any) {
    console.error('Failed to get business profile:', error);
    return NextResponse.json({ success: false, error: error.message || 'Database error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { businessId, slug, name, phone, whatsapp, email, logoUrl, address, plan, buyCredits } = body;

    const id = businessId || DEMO_BUSINESS_ID.toString();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid business ID' }, { status: 400 });
    }

    const updateData: any = {};

    // If slug is updated, check if it's unique across other businesses
    if (slug !== undefined) {
      const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-_]/g, '');
      if (cleanSlug) {
        const existing = await Business.findOne({ slug: cleanSlug, _id: { $ne: id } });
        if (existing) {
          return NextResponse.json({ success: false, error: 'This booking slug is already taken. Please choose another one.' }, { status: 409 });
        }
      }
      updateData.slug = cleanSlug;
    }

    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (whatsapp !== undefined) updateData.whatsapp = whatsapp;
    if (email !== undefined) updateData.email = email;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    if (address !== undefined) updateData.address = address;
    
    if (plan !== undefined) {
      updateData.plan = plan;
      updateData.smsCreditsCap = plan === 'PRO' ? 500 : 100;
    }

    const updateQuery: any = { $set: updateData };
    if (buyCredits !== undefined && typeof buyCredits === 'number') {
      updateQuery.$inc = { bookingCreditsBalance: buyCredits };
    }

    const updated = await Business.findByIdAndUpdate(
      id,
      updateQuery,
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, business: updated });
  } catch (error: any) {
    console.error('Failed to update business profile:', error);
    return NextResponse.json({ success: false, error: error.message || 'Database error' }, { status: 500 });
  }
}
