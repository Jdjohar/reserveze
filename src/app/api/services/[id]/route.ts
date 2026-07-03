import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Service } from '@/models';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const resolvedParams = await params;
    const serviceId = resolvedParams.id;
    const body = await req.json();

    const hours = body.durationHours || 0;
    const mins = body.durationMinutes || 0;
    const totalDuration = (hours * 60) + mins;

    const updatedService = await Service.findByIdAndUpdate(
      serviceId,
      {
        name: body.name,
        duration: totalDuration,
        durationHours: hours,
        durationMinutes: mins,
        price: body.price,
        maxCapacity: body.maxCapacity,
        advanceBookingDays: body.advanceBookingDays,
        advanceBookingHours: body.advanceBookingHours,
        advanceBookingMinutes: body.advanceBookingMinutes,
        imageUrl: body.imageUrl,
        isActive: body.isActive
      },
      { new: true } // returns the updated document
    );

    if (!updatedService) {
      return NextResponse.json({ success: false, error: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, service: updatedService });
  } catch (error: any) {
    console.error('Failed to update service:', error);
    return NextResponse.json({ success: false, error: error.message || 'Database error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const resolvedParams = await params;
    const serviceId = resolvedParams.id;

    const deletedService = await Service.findByIdAndDelete(serviceId);

    if (!deletedService) {
      return NextResponse.json({ success: false, error: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Service deleted successfully' });
  } catch (error: any) {
    console.error('Failed to delete service:', error);
    return NextResponse.json({ success: false, error: error.message || 'Database error' }, { status: 500 });
  }
}
