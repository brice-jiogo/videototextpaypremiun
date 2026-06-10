import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getStripe, verifyFirebaseIdToken } from './_helpers';

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

    const sessionId = String(req.body?.sessionId || '');
    if (!sessionId.startsWith('cs_')) return res.status(400).json({ error: 'A valid Stripe session_id is required' });

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['subscription', 'invoice'] });
    // Basic ownership check
    if (String(session.client_reference_id || session.metadata?.userId || '') !== user.uid) {
      return res.status(403).json({ error: 'This checkout session does not belong to the signed-in user.' });
    }

    res.json({ success: true, session });
  } catch (err: any) {
    console.error('sync-checkout-session failed', err?.message || err);
    res.status(500).json({ error: err?.message || 'Server error' });
  }
}
