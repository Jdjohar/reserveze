import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripeSecret = process.env.STRIPE_SECRET_KEY || '';

export async function POST(req: NextRequest) {
  try {
    const { businessId, credits, price, planType } = await req.json();

    if (!businessId || !price) {
      return NextResponse.json({ success: false, error: 'businessId and price are required' }, { status: 400 });
    }

    const itemName = planType === 'PRO' ? 'Reserveze PRO Subscription Upgrade' : `${credits} Reserveze Booking Credits`;
    const itemDesc = planType === 'PRO' ? 'Unlimited locations, 500 SMS/WhatsApp capacity, and priority support.' : 'Prepaid scheduling slots for location branches.';
    const itemMetadata: any = {
      businessId,
      price: price.toString(),
    };
    if (planType) {
      itemMetadata.planType = planType;
    } else {
      itemMetadata.credits = credits.toString();
    }

    const successParams = planType ? `planType=${planType}&price=${price}` : `credits=${credits}&price=${price}`;

    if (stripeSecret) {
      const stripe = new Stripe(stripeSecret);

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: itemName,
                description: itemDesc,
              },
              unit_amount: Math.round(price * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `http://localhost:3000/merchant/plans?success=true&session_id={CHECKOUT_SESSION_ID}&${successParams}`,
        cancel_url: `http://localhost:3000/merchant/plans?cancelled=true`,
        metadata: itemMetadata,
      });

      return NextResponse.json({ success: true, url: session.url });
    } else {
      console.log(`[Stripe Checkout] Simulator mode active (STRIPE_SECRET_KEY missing). Redirecting to mock success.`);
      const mockSuccessUrl = `http://localhost:3000/merchant/plans?success=true&mock=true&${successParams}`;
      return NextResponse.json({ success: true, url: mockSuccessUrl });
    }
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Payment initiation failed' }, { status: 500 });
  }
}
