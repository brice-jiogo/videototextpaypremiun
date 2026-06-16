import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildPremiumStateFromCheckoutSession, getStripe, setCorsHeaders, verifyFirebaseIdToken, writePremiumState } from './_helpers.js';

function escapeStripeSearchValue(value: string) {
  return value.replace(/'/g, "\\'");
}

async function findLatestCompletedCheckoutSession(user: { uid: string; email?: string }) {
  const stripe = getStripe();
  const customerIds = new Set<string>();
  const queries = [`metadata['userId']:'${escapeStripeSearchValue(user.uid)}'`];

  if (user.email) queries.push(`email:'${escapeStripeSearchValue(user.email)}'`);

  for (const query of queries) {
    const customers = await stripe.customers.search({ query, limit: 5 });
    customers.data.forEach((customer) => customerIds.add(customer.id));
  }

  let latestSessionId = '';
  let latestCreated = 0;

  for (const customer of customerIds) {
    const sessions = await stripe.checkout.sessions.list({ customer, limit: 10 });
    for (const session of sessions.data) {
      const belongsToUser = session.client_reference_id === user.uid || session.metadata?.userId === user.uid || session.customer_details?.email === user.email;
      if (belongsToUser && session.status === 'complete' && session.created > latestCreated) {
        latestSessionId = session.id;
        latestCreated = session.created;
      }
    }
  }

  if (!latestSessionId) throw new Error('No completed Stripe checkout session was found for this account.');
  return buildPremiumStateFromCheckoutSession(latestSessionId);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(req, res, 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  try {
    const user = await verifyFirebaseIdToken(req.headers.authorization as string | undefined);
    if (!user) return res.status(401).json({ error: 'Authentication required' });

    const premiumState = await findLatestCompletedCheckoutSession(user);
    if (premiumState.userId !== user.uid && premiumState.session.customer_details?.email !== user.email) {
      return res.status(403).json({ error: 'No verified checkout session belongs to this user.' });
    }

    const writeMode = await writePremiumState(user.uid, premiumState.updates, premiumState.payment);

    res.json({
      success: true,
      writeMode,
      premiumStatus: premiumState.updates.premiumStatus,
      subscriptionType: premiumState.updates.subscriptionType,
    });
  } catch (err: any) {
    console.error('sync-latest-checkout-session failed', err?.message || err);
    res.status(500).json({ error: err?.message || 'Server error' });
  }
}
