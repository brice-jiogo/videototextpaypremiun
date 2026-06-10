import Stripe from 'stripe';

const PLAN_CONFIG: Record<string, { name: string; amount: number; interval?: 'month' | 'year' }> = {
  monthly: { name: 'PREMIUM Monthly', amount: Number(process.env.STRIPE_MONTHLY_AMOUNT || 999), interval: 'month' },
  yearly: { name: 'PREMIUM Yearly', amount: Number(process.env.STRIPE_YEARLY_AMOUNT || 6999), interval: 'year' },
  lifetime: { name: 'PREMIUM Lifetime', amount: Number(process.env.STRIPE_LIFETIME_AMOUNT || 12999) },
};

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
  return new Stripe(key, { apiVersion: '2024-06-20' } as any);
}

export async function verifyFirebaseIdToken(authHeader?: string) {
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader || '';
  if (!token) return null;
  const apiKey = process.env.VITE_FIREBASE_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token }),
    });
    const data = await res.json();
    if (!res.ok) return null;
    const user = data.users?.[0];
    if (!user) return null;
    return { uid: user.localId, email: user.email };
  } catch (e) {
    return null;
  }
}

export function getAppUrl() {
  if (process.env.APP_URL) return process.env.APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

export { PLAN_CONFIG };
