import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { connectToDatabase } from '@/lib/db';
import { Business, Transaction } from '@/models';
import { sendEmail } from '@/lib/email';

const stripeSecret = process.env.STRIPE_SECRET_KEY || '';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'sessionId is required' }, { status: 400 });
    }

    if (!stripeSecret) {
      return NextResponse.json({ success: false, error: 'Stripe is in simulator mode. Webhook keys not configured.' }, { status: 400 });
    }

    const stripe = new Stripe(stripeSecret);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      const { businessId, credits, price } = session.metadata || {};

      if (businessId && credits) {
        const creditsNum = parseInt(credits, 10);
        const priceNum = parseFloat(price || '0');

        console.log(`[Verify Session] Session paid. Atomically crediting ${creditsNum} credits to business ${businessId}.`);

        // Atomically top up credits to prevent double spending
        const updateResult = await Business.updateOne(
          { _id: businessId, processedSessions: { $ne: session.id } },
          { 
            $inc: { bookingCreditsBalance: creditsNum }, 
            $addToSet: { processedSessions: session.id } 
          }
        );

        if (updateResult.modifiedCount > 0) {
          // Log Transaction record
          await Transaction.create({
            businessId,
            amount: priceNum,
            credits: creditsNum,
            sessionId: session.id,
            status: 'PAID'
          });

          const updated = await Business.findById(businessId);
          if (updated && updated.email) {
            const creditsPrice = Number(priceNum.toFixed(2));
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
                  <p>Thank you for your purchase! This is a confirmation that your payment has been processed successfully via Stripe.</p>

                  <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px;">
                    <thead>
                      <tr style="border-bottom: 2px solid #eee;">
                        <th style="padding: 10px 0; text-align: left;">Item Description</th>
                        <th style="padding: 10px 0; text-align: right;">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Prepaid Booking Credits (${creditsNum} credits)</strong></td>
                        <td style="padding: 10px 0; text-align: right; border-bottom: 1px solid #eee;">$${creditsPrice.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 15px 0; font-weight: bold; font-size: 14px;">Total Paid</td>
                        <td style="padding: 15px 0; text-align: right; font-weight: bold; font-size: 14px; color: #2e7d32;">$${creditsPrice.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>

                  <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 25px 0; font-size: 12px;">
                    <p style="margin: 5px 0;"><strong>Active SaaS Plan:</strong> ${updated.plan || 'BASIC'}</p>
                    <p style="margin: 5px 0;"><strong>Current Booking Balance:</strong> ${updated.bookingCreditsBalance} credits remaining</p>
                    <p style="margin: 5px 0;"><strong>Payment Method:</strong> Secure Stripe Checkout</p>
                    <p style="margin: 5px 0;"><strong>Status:</strong> <span style="background-color: #c8e6c9; color: #2e7d32; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold;">PAID</span></p>
                  </div>

                  <p>If you have any questions or need to dispute charges, please reach out to billing@reserveze.com.</p>
                </div>
              `
            }).catch(err => console.error('Error sending verified session billing email:', err));
          }
        }
      }
      return NextResponse.json({ success: true, status: 'paid' });
    } else {
      return NextResponse.json({ success: false, error: 'Payment is not fully processed' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Session verification error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Verification failed' }, { status: 500 });
  }
}
