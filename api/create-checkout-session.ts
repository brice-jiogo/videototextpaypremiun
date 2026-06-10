import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getStripe, verifyFirebaseIdToken, PLAN_CONFIG, getAppUrl } from './_helpers';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = process.env.APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '*');
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');
  try {
    const user = await verifyFirebaseIdToken(req.headers.authorization as string | undefined);
    if (!user) return res.status(401).json({ error: 'Authentication required' });

    const planId = (req.body && req.body.planId) || 'monthly';
    const plan = PLAN_CONFIG[planId];
    if (!plan) return res.status(400).json({ error: 'Unknown plan' });

    const stripe = getStripe();
    const customer = await stripe.customers.create({ email: user.email, metadata: { userId: user.uid } });

    const appUrl = getAppUrl();
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: plan.name },
            unit_amount: plan.amount,
            recurring: plan.interval ? { interval: plan.interval } : undefined,
          },
          quantity: 1,
        },
      ],
      mode: planId === 'lifetime' ? 'payment' : 'subscription',
      success_url: `${appUrl}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing?canceled=true`,
      client_reference_id: user.uid,
      metadata: { userId: user.uid, planId },
      subscription_data: plan.interval ? { metadata: { userId: user.uid, planId }, trial_period_days: 7 } : undefined,
    });

    res.json({ url: session.url, id: session.id });
  } catch (err: any) {
    console.error('create-checkout-session failed', err?.message || err);
    res.status(500).json({ error: err?.message || 'Server error' });
  }
}
