import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import fs from 'node:fs';
import { initializeApp, getApps, cert, type App, type AppOptions } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

type PlanId = 'monthly' | 'yearly' | 'lifetime';
type PlanConfig = { name: string; amount: number; interval?: 'month' | 'year' };

const DEFAULT_PRODUCTION_APP_URL = 'https://videototextservices.vercel.app';
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'voice-reader-1c712';

const PLAN_CONFIG: Record<PlanId, PlanConfig> = {
  monthly: { name: 'PREMIUM Monthly', amount: Number(process.env.STRIPE_MONTHLY_AMOUNT || 999), interval: 'month' },
  yearly: { name: 'PREMIUM Yearly', amount: Number(process.env.STRIPE_YEARLY_AMOUNT || 6999), interval: 'year' },
  lifetime: { name: 'PREMIUM Lifetime', amount: Number(process.env.STRIPE_LIFETIME_AMOUNT || 12999) },
};

const PREMIUM_ACTIVATION_MESSAGE =
  'Your PREMIUM subscription will take effect when you sign in to the mobile app with this same email address.';

let stripeClient: Stripe | null = null;

function normalizeUrl(value?: string | null) {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withProtocol.replace(/\/+$/, '');
}

function isLocalUrl(value: string) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(value);
}

function isVercelRuntime() {
  return process.env.VERCEL === '1' || Boolean(process.env.VERCEL_URL);
}

export function getStripe() {
  if (stripeClient) return stripeClient;

  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured.');
  if (key.startsWith('pk_')) throw new Error('STRIPE_SECRET_KEY must be a secret key, not a publishable key.');
  if (!key.startsWith('sk_') && !key.startsWith('rk_')) throw new Error('Invalid STRIPE_SECRET_KEY format.');

  stripeClient = new Stripe(key);
  return stripeClient;
}

export async function verifyFirebaseIdToken(authHeader?: string) {
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader || '';
  if (!token) return null;

  const adminApp = getFirebaseAdminApp(false);
  if (adminApp) {
    try {
      const decoded = await getAuth(adminApp).verifyIdToken(token);
      return { uid: decoded.uid, email: decoded.email };
    } catch (error) {
      console.warn('Firebase Admin token verification failed, trying REST fallback.');
    }
  }

  const apiKey = process.env.FIREBASE_WEB_API_KEY || process.env.VITE_FIREBASE_API_KEY;
  if (!apiKey) throw new Error('VITE_FIREBASE_API_KEY is not configured.');
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
    console.error('Firebase REST token verification failed', e);
    return null;
  }
}

export function getAppUrl() {
  const appUrl = normalizeUrl(process.env.APP_URL);
  if (appUrl && !(isVercelRuntime() && isLocalUrl(appUrl))) return appUrl;

  const productionUrl = normalizeUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  if (productionUrl) return productionUrl;

  const deploymentUrl = normalizeUrl(process.env.VERCEL_URL);
  if (deploymentUrl) return deploymentUrl;

  if (isVercelRuntime()) return DEFAULT_PRODUCTION_APP_URL;
  return 'http://localhost:3000';
}

export function setCorsHeaders(req: VercelRequest, res: VercelResponse, methods: string) {
  const requestOrigin = Array.isArray(req.headers.origin) ? req.headers.origin[0] : req.headers.origin;
  const appUrl = getAppUrl();
  const allowed = new Set([
    appUrl,
    normalizeUrl(process.env.APP_URL),
    normalizeUrl(process.env.VERCEL_URL),
    normalizeUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL),
    DEFAULT_PRODUCTION_APP_URL,
  ].filter(Boolean));

  res.setHeader('Access-Control-Allow-Origin', requestOrigin && allowed.has(normalizeUrl(requestOrigin)) ? requestOrigin : appUrl);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Stripe-Signature');
  res.setHeader('Cache-Control', 'no-store');
}

function getServiceAccountJson() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64) {
    return Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64, 'base64').toString('utf8');
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) return process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (serviceAccountPath && fs.existsSync(serviceAccountPath)) return fs.readFileSync(serviceAccountPath, 'utf8');

  return '';
}

function getFirebaseAdminOptions(): AppOptions | null {
  const rawServiceAccount = getServiceAccountJson();
  if (!rawServiceAccount) return null;

  const serviceAccount = JSON.parse(rawServiceAccount);
  if (serviceAccount.private_key) serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  return { credential: cert(serviceAccount), projectId: serviceAccount.project_id || FIREBASE_PROJECT_ID };
}

function getFirebaseAdminApp(required = true): App | null {
  if (getApps().length) return getApps()[0];

  const options = getFirebaseAdminOptions();
  if (!options) {
    if (required) throw new Error('Firebase Admin credentials are not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON_BASE64 in Vercel.');
    return null;
  }

  return initializeApp(options);
}

function stripeSecondsToDate(seconds?: number | null) {
  return seconds ? new Date(seconds * 1000) : null;
}

function getPlanFromMetadata(value: unknown): PlanId {
  return value === 'yearly' || value === 'lifetime' ? value : 'monthly';
}

export async function buildPremiumStateFromCheckoutSession(sessionId: string) {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['subscription', 'invoice'] });
  if (session.status !== 'complete') throw new Error('Stripe checkout session is not complete yet.');

  const planId = getPlanFromMetadata(session.metadata?.planId);
  const isLifetime = planId === 'lifetime';
  const subscription = typeof session.subscription === 'object' ? session.subscription : null;
  const invoice = typeof session.invoice === 'object' ? session.invoice : null;
  const premiumEndDate = isLifetime ? null : stripeSecondsToDate((subscription as any)?.current_period_end);
  const hasActiveTrial = Boolean((subscription as any)?.trial_end && (subscription as any).trial_end > Math.floor(Date.now() / 1000));
  const premiumStatus = hasActiveTrial ? 'PREMIUM_TRIAL' : 'PREMIUM';

  return {
    session,
    planId,
    userId: session.client_reference_id || session.metadata?.userId || null,
    updates: {
      premiumStatus,
      premiumStartDate: new Date(),
      premiumEndDate,
      nextRenewalDate: isLifetime ? null : premiumEndDate,
      subscriptionType: planId,
      billingInterval: PLAN_CONFIG[planId].interval || null,
      isLifetime,
      subscriptionCancelAtPeriodEnd: false,
      subscriptionCanceledAt: null,
      stripeCustomerId: String(session.customer || ''),
      stripeSubscriptionId: session.subscription ? String(typeof session.subscription === 'string' ? session.subscription : session.subscription.id) : null,
      stripeLastCheckoutSessionId: session.id,
      lastPaymentDate: new Date(),
      lastPaymentAmount: session.amount_total || PLAN_CONFIG[planId].amount,
      lastPaymentCurrency: session.currency || 'usd',
      lastInvoiceUrl: invoice?.hosted_invoice_url || null,
      lastReceiptUrl: invoice?.hosted_invoice_url || null,
      premiumActivationMessage: PREMIUM_ACTIVATION_MESSAGE,
    },
    payment: {
      type: isLifetime ? 'lifetime_payment' : 'checkout',
      planId,
      amount: session.amount_total || PLAN_CONFIG[planId].amount,
      currency: session.currency || 'usd',
      status: session.payment_status,
      stripeCheckoutSessionId: session.id,
      invoiceUrl: invoice?.hosted_invoice_url || null,
    },
  };
}

export async function writePremiumState(userId: string, updates: Record<string, unknown>, payment?: Record<string, unknown>) {
  const app = getFirebaseAdminApp(true);
  const firestore = getFirestore(app);

  await firestore.collection('users').doc(userId).set({ ...updates, updatedAt: FieldValue.serverTimestamp() }, { merge: true });

  if (payment) {
    const paymentId = String(payment.stripeCheckoutSessionId || payment.stripeEventId || Date.now());
    await firestore.collection('users').doc(userId).collection('payments').doc(paymentId).set(
      { ...payment, createdAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
  }

  return 'admin';
}

export { PLAN_CONFIG };
