import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Transaction } from '@/models';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId || !mongoose.Types.ObjectId.isValid(businessId)) {
      return NextResponse.json({ success: false, error: 'Valid businessId is required' }, { status: 400 });
    }

    const txs = await Transaction.find({ businessId })
      .sort({ createdAt: -1 })
      .limit(100);

    return NextResponse.json({ success: true, transactions: txs });
  } catch (error: any) {
    console.error('Failed to get transactions:', error);
    return NextResponse.json({ success: false, error: error.message || 'Database error' }, { status: 500 });
  }
}
