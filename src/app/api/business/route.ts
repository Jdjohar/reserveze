import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Business, User } from '@/models';
import mongoose from 'mongoose';
import { sendEmail } from '@/lib/email';

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
      business = await Business.findOne({ slug: 'jdwebservices' });
      if (!business) {
        business = await Business.findOne({});
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
    const { businessId, slug, name, phone, whatsapp, email, logoUrl, address, plan, buyCredits, price, holidaySyncEnabled } = body;

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
    if (holidaySyncEnabled !== undefined) {
      updateData.holidaySyncEnabled = holidaySyncEnabled;
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

    // Log Transaction record
    if (buyCredits !== undefined && typeof buyCredits === 'number') {
      try {
        const parsedPrice = price !== undefined ? Number(price) : Number((buyCredits * 0.05).toFixed(2));
        const TransactionModel = mongoose.models.Transaction || mongoose.model('Transaction');
        await TransactionModel.create({
          businessId: updated._id,
          amount: parsedPrice,
          credits: buyCredits,
          sessionId: 'SIM_' + Math.random().toString(36).substring(2, 10).toUpperCase(),
          status: 'PAID'
        });
      } catch (txErr) {
        console.error('Failed to log simulated transaction:', txErr);
      }
    }

    // Send Billing Invoice Email (Async / Non-blocking)
    if (updated && updated.email && (plan !== undefined || buyCredits !== undefined)) {
      try {
        let billingItemHtml = '';
        let totalAmount = 0;

        if (plan !== undefined) {
          billingItemHtml += `
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>SaaS Plan Subscription (${plan})</strong></td>
              <td style="padding: 10px 0; text-align: right; border-bottom: 1px solid #eee;">$${plan === 'PRO' ? '15.00' : '0.00'}</td>
            </tr>
          `;
          totalAmount += plan === 'PRO' ? 15.00 : 0.00;
        }

        if (buyCredits !== undefined && buyCredits > 0) {
          const creditsPrice = price !== undefined ? Number(price) : Number((buyCredits * 0.05).toFixed(2));
          billingItemHtml += `
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Prepaid Booking Credits (${buyCredits} credits)</strong></td>
              <td style="padding: 10px 0; text-align: right; border-bottom: 1px solid #eee;">$${creditsPrice.toFixed(2)}</td>
            </tr>
          `;
          totalAmount += creditsPrice;
        }

        if (totalAmount > 0) {
          sendEmail({
            to: updated.email,
            subject: `Invoice & Billing Confirmation - ${updated.name}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
                <div style="text-align: center; border-bottom: 2px solid #6200ee; padding-bottom: 15px; margin-bottom: 20px;">
                  <h2 style="color: #6200ee; margin: 0;">Reserveze Billing</h2>
                  <p style="margin: 5px 0; font-size: 11px; color: #757575;">Invoice Receipt & Transaction Confirmation</p>
                </div>

                <p>Hi <strong>${updated.name} Team</strong>,</p>
                <p>Thank you for your purchase! This is a confirmation that your payment has been processed successfully.</p>

                <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px;">
                  <thead>
                    <tr style="border-bottom: 2px solid #eee;">
                      <th style="padding: 10px 0; text-align: left;">Item Description</th>
                      <th style="padding: 10px 0; text-align: right;">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${billingItemHtml}
                    <tr>
                      <td style="padding: 15px 0; font-weight: bold; font-size: 14px;">Total Paid</td>
                      <td style="padding: 15px 0; text-align: right; font-weight: bold; font-size: 14px; color: #2e7d32;">$${totalAmount.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>

                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 25px 0; font-size: 12px;">
                  <p style="margin: 5px 0;"><strong>Active SaaS Plan:</strong> ${updated.plan}</p>
                  <p style="margin: 5px 0;"><strong>SMS/WhatsApp Limit:</strong> ${updated.smsCreditsCap} messages/mo</p>
                  <p style="margin: 5px 0;"><strong>Current Booking Balance:</strong> ${updated.bookingCreditsBalance} credits remaining</p>
                  <p style="margin: 5px 0;"><strong>Payment Method:</strong> Secure Card Checkout (Simulated)</p>
                  <p style="margin: 5px 0;"><strong>Status:</strong> <span style="background-color: #c8e6c9; color: #2e7d32; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold;">PAID</span></p>
                </div>

                <p>If you have any questions or need to dispute charges, please reach out to billing@reserveze.com.</p>

                <p style="font-size: 11px; color: #757575; text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
                  Thank you for choosing Reserveze as your scheduling partner!
                </p>
              </div>
            `
          }).catch(err => console.error('Error sending billing email:', err));
        }
      } catch (err) {
        console.error('Non-blocking billing notifications error:', err);
      }
    }

    return NextResponse.json({ success: true, business: updated });
  } catch (error: any) {
    console.error('Failed to update business profile:', error);
    return NextResponse.json({ success: false, error: error.message || 'Database error' }, { status: 500 });
  }
}
