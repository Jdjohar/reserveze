import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Employee } from '@/models';
import mongoose from 'mongoose';

const DEMO_BUSINESS_ID = new mongoose.Types.ObjectId('6681a28a30182496a75f829f');

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId') || DEMO_BUSINESS_ID.toString();

    const list = await Employee.find({ businessId, isActive: true }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, employees: list });
  } catch (error: any) {
    console.error('Failed to fetch team members:', error);
    return NextResponse.json({ success: false, error: error.message || 'Database error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const businessId = body.businessId || DEMO_BUSINESS_ID.toString();

    if (!body.firstName || !body.lastName || !body.email) {
      return NextResponse.json({ success: false, error: 'First name, last name, and email are required.' }, { status: 400 });
    }

    const newEmployee = await Employee.create({
      businessId,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      role: body.role || 'STAFF',
      calendarIds: body.calendarIds || [],
      serviceIds: body.serviceIds || [],
      isActive: true
    });

    return NextResponse.json({ success: true, employee: newEmployee });
  } catch (error: any) {
    console.error('Failed to create team member:', error);
    return NextResponse.json({ success: false, error: error.message || 'Database error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, firstName, lastName, email, phone, role, calendarIds, serviceIds, isActive } = body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Valid employee ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined) updateData.role = role;
    if (calendarIds !== undefined) updateData.calendarIds = calendarIds;
    if (serviceIds !== undefined) updateData.serviceIds = serviceIds;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await Employee.findByIdAndUpdate(id, { $set: updateData }, { new: true });
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Team member not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, employee: updated });
  } catch (error: any) {
    console.error('Failed to update team member:', error);
    return NextResponse.json({ success: false, error: error.message || 'Database error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Valid employee ID is required' }, { status: 400 });
    }

    // Soft delete/deactivate so we preserve history for booked appointments
    const updated = await Employee.findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true });
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Team member not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete team member:', error);
    return NextResponse.json({ success: false, error: error.message || 'Database error' }, { status: 500 });
  }
}
