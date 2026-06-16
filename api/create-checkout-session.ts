import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getStripe, verifyFirebaseIdToken, PLAN_CONFIG, getAppUrl, setCorsHeaders } from './_helpers.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(req, res, 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  try {
    const user = await verifyFirebaseIdToken(req.headers.authorization as string | undefined);
    if (!user) return res.status(401).json({ error: 'Authentication required' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const planId = String(body.planId || 'monthly') as keyof typeof PLAN_CONFIG;
    const plan = PLAN_CONFIG[planId];
    if (!plan) return res.status(400).json({ error: 'Unknown plan' });

    const stripe = getStripe();
    const customer = await stripe.customers.create({ email: user.email, metadata: { userId: user.uid } });

    const appUrl = getAppUrl();
    const priceData: any = {
      currency: 'usd',
      product_data: {
        name: plan.name,
        description: planId === 'lifetime' ? 'One-time payment for lifetime premium access.' : `Recurring premium subscription billed every ${plan.interval}.`,
      },
      unit_amount: plan.amount,
    };

    if (plan.interval) priceData.recurring = { interval: plan.interval };

    const sessionParams: any = {
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [{ price_data: priceData, quantity: 1 }],
      mode: planId === 'lifetime' ? 'payment' : 'subscription',
      success_url: `${appUrl}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing?canceled=true`,
      client_reference_id: user.uid,
      metadata: { userId: user.uid, planId },
    };

    if (plan.interval) {
      sessionParams.subscription_data = { metadata: { userId: user.uid, planId } };
    } else {
      sessionParams.invoice_creation = { enabled: true };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    res.json({ url: session.url, id: session.id });
  } catch (err: any) {
    console.error('create-checkout-session failed', err?.message || err);
    console.error(err?.stack || err);
    res.status(500).json({ error: err?.message || 'Server error' });
  }
}
