import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Calendar } from '@/models';
import mongoose from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Calendar ID or Slug is required' }, { status: 400 });
    }

    let calendar = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      calendar = await Calendar.findById(id);
    }
    if (!calendar) {
      calendar = await Calendar.findOne({ slug: id.toLowerCase() });
    }

    if (!calendar) {
      return NextResponse.json({ success: false, error: 'Calendar location not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, calendar });
  } catch (error: any) {
    console.error('Failed to get calendar detail:', error);
    return NextResponse.json({ success: false, error: error.message || 'Database error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid calendar ID' }, { status: 400 });
    }

    let cleanSlug = undefined;
    if (body.slug !== undefined) {
      cleanSlug = body.slug.toLowerCase().replace(/[^a-z0-9-_]/g, '');
      if (cleanSlug) {
        const duplicate = await Calendar.findOne({ slug: cleanSlug, _id: { $ne: id } });
        if (duplicate) {
          return NextResponse.json({ success: false, error: 'This location booking slug is already taken. Please choose another one.' }, { status: 409 });
        }
      }
    }

    const updateFields: any = {
      name: body.name,
      timeFormat: body.timeFormat || '12h',
      timezone: body.timezone || 'UTC',
      phone: body.phone,
      email: body.email,
      address: body.address
    };

    if (body.slug !== undefined) {
      updateFields.slug = cleanSlug || null;
    }

    const updated = await Calendar.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Calendar not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, calendar: updated });
  } catch (error: any) {
    console.error('Failed to update calendar:', error);
    return NextResponse.json({ success: false, error: error.message || 'Database error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid calendar ID' }, { status: 400 });
    }

    const deleted = await Calendar.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Calendar not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Calendar deleted successfully' });
  } catch (error: any) {
    console.error('Failed to delete calendar:', error);
    return NextResponse.json({ success: false, error: error.message || 'Database error' }, { status: 500 });
  }
}
