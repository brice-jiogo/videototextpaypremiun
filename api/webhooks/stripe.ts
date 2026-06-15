import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getStripe, PLAN_CONFIG, setCorsHeaders } from '../_helpers';
import Stripe from 'stripe';
import fs from 'fs';
import { initializeApp, getApps, cert, type AppOptions } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';

function isDefaultCredentialsError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('Could not load the default credentials') || message.includes('Unable to detect a Project Id');
}

function getFirebaseAdminOptions(): AppOptions {
  const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || '';
  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64
    ? Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64, 'base64').toString('utf8')
    : process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '';

  if (rawServiceAccount) {
    const serviceAccount = JSON.parse(rawServiceAccount);
    if (serviceAccount.private_key) serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    return { credential: cert(serviceAccount), projectId: serviceAccount.project_id || FIREBASE_PROJECT_ID };
  }

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    return { credential: cert(serviceAccount), projectId: serviceAccount.project_id || FIREBASE_PROJECT_ID };
  }

  return { projectId: process.env.FIREBASE_PROJECT_ID || '' } as AppOptions;
}

async function buildPremiumStateFromCheckoutSession(sessionId: string) {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['subscription', 'invoice'] });
  if (session.status !== 'complete') throw new Error('Stripe checkout session is not complete yet.');

  const planId = session.metadata?.planId === 'yearly' || session.metadata?.planId === 'lifetime' ? (session.metadata?.planId as string) : 'monthly';
  const isLifetime = planId === 'lifetime';
  const subscription = typeof session.subscription === 'object' ? session.subscription : null;
  const invoice = typeof session.invoice === 'object' ? session.invoice : null;
  const premiumEndDate = isLifetime ? null : (subscription && (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000) : null);

  const hasActiveTrial = (subscription as any)?.trial_end && (subscription as any).trial_end > Math.floor(Date.now() / 1000);
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
      billingInterval: (PLAN_CONFIG as any)[planId]?.interval || null,
      isLifetime,
      subscriptionCancelAtPeriodEnd: false,
      subscriptionCanceledAt: null,
      stripeCustomerId: String(session.customer || ''),
      stripeSubscriptionId: session.subscription ? String(typeof session.subscription === 'string' ? session.subscription : (session.subscription as any).id) : null,
      stripeLastCheckoutSessionId: session.id,
      lastPaymentDate: new Date(),
      lastPaymentAmount: session.amount_total || (PLAN_CONFIG as any)[planId]?.amount,
      lastPaymentCurrency: session.currency || 'usd',
      lastInvoiceUrl: invoice?.hosted_invoice_url || null,
      lastReceiptUrl: invoice?.hosted_invoice_url || null,
    },
    payment: {
      type: isLifetime ? 'lifetime_payment' : 'checkout',
      planId,
      amount: session.amount_total || (PLAN_CONFIG as any)[planId]?.amount,
      currency: session.currency || 'usd',
      status: session.payment_status,
      stripeCheckoutSessionId: session.id,
      invoiceUrl: invoice?.hosted_invoice_url || null,
    },
  };
}

async function writePremiumState(userId: string, updates: Record<string, unknown>, payment?: Record<string, unknown>) {
  try {
    await getFirestore()
      .collection('users')
      .doc(userId)
      .set({ ...updates, updatedAt: FieldValue.serverTimestamp() }, { merge: true });

    if (payment) {
      const paymentId = String(payment.stripeCheckoutSessionId || payment.stripeEventId || Date.now());
      await getFirestore().collection('users').doc(userId).collection('payments').doc(paymentId).set({ ...payment, createdAt: FieldValue.serverTimestamp() }, { merge: true });
    }
    return 'admin';
  } catch (err: any) {
    if (!isDefaultCredentialsError(err)) throw err;
    console.warn('Firebase Admin unavailable, webhook cannot write premium state without admin credentials.');
    return 'none';
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS preflight
  setCorsHeaders(req, res, 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  const sig = req.headers['stripe-signature'] as string | undefined;
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).send('Webhook secret not configured');
  }

  // read raw body
  let buf = '';
  try {
    req.setEncoding('utf8');
    for await (const chunk of req) buf += chunk;
  } catch (err: any) {
    console.error('Failed to read raw body', err?.message || err);
    return res.status(400).send('Invalid request body');
  }

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    if (!sig) throw new Error('Missing stripe signature');
    event = stripe.webhooks.constructEvent(Buffer.from(buf), sig, secret);
  } catch (err: any) {
    console.error('Webhook signature verification failed', err?.message || err);
    return res.status(400).send(`Webhook Error: ${err?.message || err}`);
  }

  // initialize firebase admin if possible
  try {
    if (!getApps().length) initializeApp(getFirebaseAdminOptions());
  } catch (err: any) {
    console.warn('Firebase admin init failed (may be running without admin):', err?.message || err);
  }

  try {
    // Handle event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id || session.metadata?.userId;
        if (!userId) break;

        const premiumState = await buildPremiumStateFromCheckoutSession(session.id);
        const writeMode = await writePremiumState(String(userId), premiumState.updates, { ...premiumState.payment, stripeEventId: event.id });
        console.log('Webhook processed checkout.session.completed, writeMode=', writeMode);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        // update user by customer id if possible
        try {
          const firestore = getFirestore();
          const snapshot = await firestore.collection('users').where('stripeCustomerId', '==', String(invoice.customer)).limit(1).get();
          if (!snapshot.empty) {
            const userDoc = snapshot.docs[0];
            if ((invoice as any).subscription) {
              const subscription = await stripe.subscriptions.retrieve(String((invoice as any).subscription));
              await userDoc.ref.set({
                lastPaymentDate: invoice.created ? Timestamp.fromDate(new Date(invoice.created * 1000)) : null,
                lastPaymentAmount: invoice.amount_paid,
                lastPaymentCurrency: invoice.currency,
                lastInvoiceUrl: invoice.hosted_invoice_url || null,
                lastReceiptUrl: invoice.hosted_invoice_url || null,
                updatedAt: FieldValue.serverTimestamp(),
              }, { merge: true });
              // also update subscription fields
              await userDoc.ref.set({
                premiumStatus: 'PREMIUM',
                stripeSubscriptionId: subscription.id,
                updatedAt: FieldValue.serverTimestamp(),
              }, { merge: true });
            } else {
              await userDoc.ref.set({
                lastPaymentDate: invoice.created ? Timestamp.fromDate(new Date(invoice.created * 1000)) : null,
                lastPaymentAmount: invoice.amount_paid,
                lastPaymentCurrency: invoice.currency,
                lastInvoiceUrl: invoice.hosted_invoice_url || null,
                lastReceiptUrl: invoice.hosted_invoice_url || null,
                updatedAt: FieldValue.serverTimestamp(),
              }, { merge: true });
            }
          }
        } catch (err: any) {
          console.warn('invoice.paid: Firestore admin unavailable or failed:', err?.message || err);
        }
        break;
      }

      default:
        console.log('Unhandled webhook event type', event.type);
    }

    // Optionally record event id to avoid duplicate processing
    try {
      if (getApps().length) {
        await getFirestore().collection('stripeEvents').doc(event.id).set({ type: event.type, processedAt: FieldValue.serverTimestamp() });
      }
    } catch (err: any) {
      console.warn('Failed to record stripe event in Firestore:', err?.message || err);
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error('Stripe webhook processing failed', err?.message || err);
    console.error(err?.stack || err);
    // Return 200 to avoid Stripe retries when admin is unavailable, but indicate processingError
    return res.status(200).json({ received: true, processingError: true });
  }
}
