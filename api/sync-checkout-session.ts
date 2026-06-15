import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildPremiumStateFromCheckoutSession, setCorsHeaders, verifyFirebaseIdToken, writePremiumState } from './_helpers';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(req, res, 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  try {
    const user = await verifyFirebaseIdToken(req.headers.authorization as string | undefined);
    if (!user) return res.status(401).json({ error: 'Authentication required' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const sessionId = String(body.sessionId || '');
    if (!sessionId.startsWith('cs_')) return res.status(400).json({ error: 'A valid Stripe session_id is required' });

    const premiumState = await buildPremiumStateFromCheckoutSession(sessionId);
    if (String(premiumState.userId || '') !== user.uid) {
      return res.status(403).json({ error: 'This checkout session does not belong to the signed-in user.' });
    }

    const writeMode = await writePremiumState(user.uid, premiumState.updates, premiumState.payment);

    res.json({
      success: true,
      writeMode,
      premiumStatus: premiumState.updates.premiumStatus,
      subscriptionType: premiumState.updates.subscriptionType,
    });
  } catch (err: any) {
    console.error('sync-checkout-session failed', err?.message || err);
    res.status(500).json({ error: err?.message || 'Server error' });
  }
}
