import "dotenv/config";
import express from "express";
import path from "path";
import bodyParser from "body-parser";
import Stripe from "stripe";
import fs from "node:fs";
import nodemailer from "nodemailer";
import { initializeApp, getApps, cert, type AppOptions } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

type PlanId = "monthly" | "yearly" | "lifetime";

const PLAN_CONFIG: Record<PlanId, { name: string; amount: number; interval?: "month" | "year" }> = {
  monthly: { name: "PREMIUM Monthly", amount: Number(process.env.STRIPE_MONTHLY_AMOUNT || 999), interval: "month" },
  yearly: { name: "PREMIUM Yearly", amount: Number(process.env.STRIPE_YEARLY_AMOUNT || 6999), interval: "year" },
  lifetime: { name: "PREMIUM Lifetime", amount: Number(process.env.STRIPE_LIFETIME_AMOUNT || 12999) },
};

const PREMIUM_ACTIVATION_MESSAGE =
  "Your PREMIUM subscription will take effect when you sign in to the mobile app with this same email address.";

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "voice-reader-1c712";
const FIREBASE_WEB_API_KEY =
  process.env.FIREBASE_WEB_API_KEY ||
  process.env.VITE_FIREBASE_API_KEY ||
  "AIzaSyCFTZ4qulGO45z9grA4oLH0fBTHC9xnz4E";
const FIRESTORE_DATABASE_ID = process.env.FIRESTORE_DATABASE_ID || "(default)";

function isDefaultCredentialsError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("Could not load the default credentials") || message.includes("Unable to detect a Project Id");
}

function getFirebaseAdminOptions(): AppOptions {
  const rawServiceAccount =
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64
      ? Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64, "base64").toString("utf8")
      : process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (rawServiceAccount) {
    const serviceAccount = JSON.parse(rawServiceAccount);
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
    }
    return {
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id || FIREBASE_PROJECT_ID,
    };
  }

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
    return {
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id || FIREBASE_PROJECT_ID,
    };
  }

  return { projectId: FIREBASE_PROJECT_ID };
}

function getAppUrl() {
  return process.env.APP_URL || "http://localhost:3000";
}

function getStripe() {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  if (stripeSecret.includes("replace_me")) {
    throw new Error("STRIPE_SECRET_KEY still contains a placeholder. Paste your real secret key in .env.");
  }

  if (stripeSecret.startsWith("pk_")) {
    throw new Error("STRIPE_SECRET_KEY must be a secret key, not a publishable key. Use your test secret for test mode.");
  }

  if (!stripeSecret.startsWith("sk_") && !stripeSecret.startsWith("rk_")) {
    throw new Error("Invalid Stripe secret key format. Please verify your STRIPE_SECRET_KEY configuration.");
  }

  return new Stripe(stripeSecret, { apiVersion: "2024-06-20" as any });
}

function getEmailTransporter() {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;

  if (!smtpHost || !smtpUser || !smtpPassword) {
    console.warn("SMTP not configured. Email receipts will not be sent. Configure SMTP_HOST, SMTP_USER, and SMTP_PASSWORD in .env");
    return null;
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
  });
}

function toTimestamp(seconds?: number | null) {
  return seconds ? Timestamp.fromDate(new Date(seconds * 1000)) : null;
}

function stripeSecondsToDate(seconds?: number | null) {
  return seconds ? new Date(seconds * 1000) : null;
}

function getPlanFromMetadata(value: unknown): PlanId {
  return value === "yearly" || value === "lifetime" ? value : "monthly";
}

async function requireFirebaseUser(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) {
      return res.status(401).json({ error: "Authentication token required." });
    }

    try {
      const decodedToken = await getAuth().verifyIdToken(token);
      res.locals.firebaseUser = decodedToken;
    } catch (error) {
      if (!isDefaultCredentialsError(error)) {
        throw error;
      }

      const lookupResponse = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_WEB_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: token }),
        }
      );
      const lookupData = await lookupResponse.json();
      const firebaseUser = lookupData.users?.[0];
      if (!lookupResponse.ok || !firebaseUser?.localId) {
        throw new Error(lookupData.error?.message || "Firebase Auth REST verification failed.");
      }

      console.warn("Firebase Admin credentials are not configured. Verified token with Firebase Auth REST fallback.");
      res.locals.firebaseUser = {
        uid: firebaseUser.localId,
        email: firebaseUser.email,
      };
    }
    next();
  } catch (error) {
    console.error("Firebase token verification failed:", error);
    res.status(401).json({ error: "Invalid or expired authentication token." });
  }
}

async function getUserDataForCheckout(uid: string) {
  try {
    const userRef = getFirestore().collection("users").doc(uid);
    const userDoc = await userRef.get();
    return { userRef, userData: (userDoc.data() || {}) as any, adminAvailable: true };
  } catch (error) {
    if (!isDefaultCredentialsError(error)) {
      throw error;
    }

    console.warn("Firebase Admin credentials are missing. Checkout will continue without pre-writing stripeCustomerId.");
    return { userRef: null, userData: {} as any, adminAvailable: false };
  }
}

function firestoreRestValue(value: unknown): Record<string, unknown> {
  if (value === null || value === undefined) return { nullValue: null };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  return { stringValue: String(value) };
}

async function patchUserViaFirestoreRest(userId: string, idToken: string, updates: Record<string, unknown>) {
  const fields = Object.fromEntries(Object.entries(updates).map(([key, value]) => [key, firestoreRestValue(value)]));
  const updateMask = Object.keys(updates)
    .map((field) => `updateMask.fieldPaths=${encodeURIComponent(field)}`)
    .join("&");
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/${encodeURIComponent(
    FIRESTORE_DATABASE_ID
  )}/documents/users/${encodeURIComponent(userId)}?${updateMask}`;

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || "Firestore REST user update failed.");
  }
}

async function writePaymentViaFirestoreRest(userId: string, idToken: string, paymentId: string, payment: Record<string, unknown>) {
  const fields = Object.fromEntries(Object.entries(payment).map(([key, value]) => [key, firestoreRestValue(value)]));
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/${encodeURIComponent(
    FIRESTORE_DATABASE_ID
  )}/documents/users/${encodeURIComponent(userId)}/payments/${encodeURIComponent(paymentId)}`;

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || "Firestore REST payment update failed.");
  }
}

async function writePremiumState(
  userId: string,
  idToken: string | null,
  updates: Record<string, unknown>,
  payment?: Record<string, unknown>
) {
  try {
    await getFirestore()
      .collection("users")
      .doc(userId)
      .set(
        {
          ...updates,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    if (payment) {
      await writePaymentRecord(userId, payment);
    }
    return "admin";
  } catch (error) {
    if (!idToken || !isDefaultCredentialsError(error)) {
      throw error;
    }

    console.warn("Firebase Admin credentials are missing. Writing verified premium state with Firestore REST fallback.");
    const now = new Date();
    await patchUserViaFirestoreRest(userId, idToken, {
      ...updates,
      updatedAt: now,
    });

    if (payment) {
      await writePaymentViaFirestoreRest(userId, idToken, String(payment.stripeCheckoutSessionId || payment.stripeEventId || Date.now()), {
        ...payment,
        createdAt: now,
      });
    }
    return "rest";
  }
}

async function buildPremiumStateFromCheckoutSession(sessionId: string) {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription", "invoice"],
  });

  if (session.status !== "complete") {
    throw new Error("Stripe checkout session is not complete yet.");
  }

  const planId = getPlanFromMetadata(session.metadata?.planId);
  const isLifetime = planId === "lifetime";
  const subscription = typeof session.subscription === "object" ? session.subscription : null;
  const invoice = typeof session.invoice === "object" ? session.invoice : null;
  const premiumEndDate = isLifetime ? null : stripeSecondsToDate((subscription as any)?.current_period_end);
  
  // Check if trial is active (trial_period_days > 0 means trial is in effect)
  const hasActiveTrial = (subscription as any)?.trial_end && (subscription as any)?.trial_end > Math.floor(Date.now() / 1000);
  const premiumStatus = hasActiveTrial ? "PREMIUM_TRIAL" : "PREMIUM";

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
      stripeCustomerId: String(session.customer || ""),
      stripeSubscriptionId: session.subscription ? String(typeof session.subscription === "string" ? session.subscription : session.subscription.id) : null,
      stripeLastCheckoutSessionId: session.id,
      lastPaymentDate: new Date(),
      lastPaymentAmount: session.amount_total || PLAN_CONFIG[planId].amount,
      lastPaymentCurrency: session.currency || "usd",
      lastInvoiceUrl: invoice?.hosted_invoice_url || null,
      lastReceiptUrl: invoice?.hosted_invoice_url || null,
      premiumActivationMessage: PREMIUM_ACTIVATION_MESSAGE,
    },
    payment: {
      type: isLifetime ? "lifetime_payment" : "checkout",
      planId,
      amount: session.amount_total || PLAN_CONFIG[planId].amount,
      currency: session.currency || "usd",
      status: session.payment_status,
      stripeCheckoutSessionId: session.id,
      invoiceUrl: invoice?.hosted_invoice_url || null,
    },
  };
}

async function findLatestCompletedCheckoutSessionForUser(uid: string, email?: string) {
  const stripe = getStripe();
  const customerQueries = [`metadata['userId']:'${uid}'`];
  if (email) {
    customerQueries.push(`email:'${email.replace(/'/g, "\\'")}'`);
  }

  const customerIds = new Set<string>();
  for (const query of customerQueries) {
    const customers = await stripe.customers.search({ query, limit: 5 });
    customers.data.forEach((customer) => customerIds.add(customer.id));
  }

  let latestSession: Stripe.Checkout.Session | null = null;
  for (const customerId of customerIds) {
    const sessions = await stripe.checkout.sessions.list({
      customer: customerId,
      limit: 10,
      expand: ["data.subscription", "data.invoice"],
    });

    for (const session of sessions.data) {
      const belongsToUser = session.client_reference_id === uid || session.metadata?.userId === uid || session.customer_details?.email === email;
      if (session.status !== "complete" || !belongsToUser) continue;
      if (!latestSession || session.created > latestSession.created) {
        latestSession = session;
      }
    }
  }

  if (!latestSession) {
    throw new Error("No completed Stripe checkout session was found for this user.");
  }

  return buildPremiumStateFromCheckoutSession(latestSession.id);
}

async function findUserByCustomer(customerId: string) {
  const snapshot = await getFirestore().collection("users").where("stripeCustomerId", "==", customerId).limit(1).get();
  return snapshot.empty ? null : snapshot.docs[0];
}

async function writePaymentRecord(userId: string, payment: Record<string, unknown>) {
  const paymentId = String(payment.stripeEventId || payment.stripeInvoiceId || payment.stripeChargeId || Date.now());
  await getFirestore()
    .collection("users")
    .doc(userId)
    .collection("payments")
    .doc(paymentId)
    .set({ ...payment, createdAt: FieldValue.serverTimestamp() }, { merge: true });
}

async function updateUserFromSubscription(subscription: Stripe.Subscription, extra: Record<string, unknown> = {}) {
  const customerId = String(subscription.customer);
  const userDoc = await findUserByCustomer(customerId);
  if (!userDoc) return;

  const cancelAtPeriodEnd = Boolean(subscription.cancel_at_period_end);
  const currentPeriodEnd = toTimestamp((subscription as any).current_period_end);
  await userDoc.ref.set(
    {
      premiumStatus: cancelAtPeriodEnd ? "CANCELING" : "PREMIUM",
      premiumEndDate: currentPeriodEnd,
      nextRenewalDate: cancelAtPeriodEnd ? null : currentPeriodEnd,
      subscriptionCancelAtPeriodEnd: cancelAtPeriodEnd,
      subscriptionCanceledAt: toTimestamp((subscription as any).canceled_at),
      stripeSubscriptionId: subscription.id,
      premiumActivationMessage: PREMIUM_ACTIVATION_MESSAGE,
      updatedAt: FieldValue.serverTimestamp(),
      ...extra,
    },
    { merge: true }
  );
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  if (!getApps().length) {
    initializeApp(getFirebaseAdminOptions());
  }

  app.post("/api/webhooks/stripe", bodyParser.raw({ type: "application/json" }), async (req, res) => {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return res.status(400).send("STRIPE_WEBHOOK_SECRET is not configured.");
    }

    let event: Stripe.Event;
    try {
      event = getStripe().webhooks.constructEvent(req.body, req.headers["stripe-signature"] as string, webhookSecret);
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const firestore = getFirestore();
    const eventRef = firestore.collection("stripeEvents").doc(event.id);
    const eventDoc = await eventRef.get();
    if (eventDoc.exists) {
      return res.json({ received: true, duplicate: true });
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.client_reference_id || session.metadata?.userId;
          if (!userId) break;

          const premiumState = await buildPremiumStateFromCheckoutSession(session.id);
          await writePremiumState(userId, null, premiumState.updates, {
            ...premiumState.payment,
            stripeEventId: event.id,
          });
          break;
        }

        case "invoice.paid": {
          const invoice = event.data.object as Stripe.Invoice;
          const userDoc = await findUserByCustomer(String(invoice.customer));
          if (!userDoc) break;

          if ((invoice as any).subscription) {
            const subscription = await getStripe().subscriptions.retrieve(String((invoice as any).subscription));
            await updateUserFromSubscription(subscription, {
              lastPaymentDate: toTimestamp(invoice.created),
              lastPaymentAmount: invoice.amount_paid,
              lastPaymentCurrency: invoice.currency,
              lastInvoiceUrl: invoice.hosted_invoice_url || null,
              lastReceiptUrl: invoice.hosted_invoice_url || null,
            });
          } else {
            await userDoc.ref.set(
              {
                lastPaymentDate: toTimestamp(invoice.created),
                lastPaymentAmount: invoice.amount_paid,
                lastPaymentCurrency: invoice.currency,
                lastInvoiceUrl: invoice.hosted_invoice_url || null,
                lastReceiptUrl: invoice.hosted_invoice_url || null,
                updatedAt: FieldValue.serverTimestamp(),
              },
              { merge: true }
            );
          }

          await writePaymentRecord(userDoc.id, {
            type: "invoice",
            amount: invoice.amount_paid,
            currency: invoice.currency,
            status: invoice.status,
            stripeInvoiceId: invoice.id,
            stripeEventId: event.id,
            invoiceUrl: invoice.hosted_invoice_url || null,
          });
          break;
        }

        case "customer.subscription.updated": {
          await updateUserFromSubscription(event.data.object as Stripe.Subscription);
          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          const userDoc = await findUserByCustomer(String(subscription.customer));
          if (!userDoc) break;
          await userDoc.ref.set(
            {
              premiumStatus: "FREE",
              premiumEndDate: null,
              nextRenewalDate: null,
              subscriptionCancelAtPeriodEnd: false,
              subscriptionCanceledAt: FieldValue.serverTimestamp(),
              stripeSubscriptionId: null,
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
          break;
        }

        case "charge.succeeded": {
          const charge = event.data.object as Stripe.Charge;
          const userDoc = charge.customer ? await findUserByCustomer(String(charge.customer)) : null;
          if (!userDoc) break;
          await userDoc.ref.set(
            {
              lastPaymentDate: toTimestamp(charge.created),
              lastPaymentAmount: charge.amount,
              lastPaymentCurrency: charge.currency,
              lastReceiptUrl: charge.receipt_url || null,
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
          await writePaymentRecord(userDoc.id, {
            type: "charge",
            amount: charge.amount,
            currency: charge.currency,
            status: charge.status,
            receiptUrl: charge.receipt_url || null,
            stripeChargeId: charge.id,
            stripeEventId: event.id,
          });
          break;
        }

        case "charge.refunded": {
          const charge = event.data.object as Stripe.Charge;
          const userDoc = charge.customer ? await findUserByCustomer(String(charge.customer)) : null;
          if (!userDoc) break;
          await userDoc.ref.set(
            {
              premiumStatus: "FREE",
              premiumEndDate: null,
              nextRenewalDate: null,
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
          await writePaymentRecord(userDoc.id, {
            type: "refund",
            amount: -charge.amount_refunded,
            currency: charge.currency,
            status: "refunded",
            receiptUrl: charge.receipt_url || null,
            stripeChargeId: charge.id,
            stripeEventId: event.id,
          });
          break;
        }

        default:
          break;
      }

      await eventRef.set({ type: event.type, processedAt: FieldValue.serverTimestamp() });
      res.json({ received: true });
    } catch (error) {
      console.error("Stripe webhook processing failed", error);
      res.status(500).json({ received: true, processingError: true });
    }
  });

  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/create-checkout-session", requireFirebaseUser, async (req, res) => {
    try {
      const planId = req.body.planId as PlanId;
      const plan = PLAN_CONFIG[planId];
      if (!plan) {
        return res.status(400).json({ error: "Unknown plan." });
      }

      const uid = res.locals.firebaseUser.uid as string;
      const email = res.locals.firebaseUser.email as string | undefined;
      const { userRef, userData, adminAvailable } = await getUserDataForCheckout(uid);
      const stripe = getStripe();
      const appUrl = getAppUrl();

      let customerId = userData.stripeCustomerId as string | undefined;
      if (!customerId) {
        const customer = await stripe.customers.create({ email, metadata: { userId: uid } });
        customerId = customer.id;
        if (adminAvailable && userRef) {
          await userRef.set({ stripeCustomerId: customerId, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        }
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: plan.name,
                description:
                  planId === "lifetime"
                    ? "One-time payment for lifetime premium access."
                    : `Recurring premium subscription billed every ${plan.interval}.`,
              },
              unit_amount: plan.amount,
              recurring: plan.interval ? { interval: plan.interval } : undefined,
            },
            quantity: 1,
          },
        ],
        mode: planId === "lifetime" ? "payment" : "subscription",
        invoice_creation: planId === "lifetime" ? { enabled: true } : undefined,
        success_url: `${appUrl}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/pricing?canceled=true`,
        client_reference_id: uid,
        metadata: { userId: uid, planId },
        subscription_data: plan.interval ? { metadata: { userId: uid, planId }, trial_period_days: 7 } : undefined,
      });

      res.json({ id: session.id, url: session.url });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/sync-checkout-session", requireFirebaseUser, async (req, res) => {
    try {
      const uid = res.locals.firebaseUser.uid as string;
      const authHeader = req.headers.authorization || "";
      const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
      const sessionId = String(req.body.sessionId || "");

      if (!sessionId.startsWith("cs_")) {
        return res.status(400).json({ error: "A valid Stripe checkout session_id is required." });
      }

      const premiumState = await buildPremiumStateFromCheckoutSession(sessionId);
      if (premiumState.userId !== uid) {
        return res.status(403).json({ error: "This checkout session does not belong to the signed-in user." });
      }

      const writeMode = await writePremiumState(uid, idToken, premiumState.updates, premiumState.payment);
      res.json({
        success: true,
        writeMode,
        premiumStatus: premiumState.updates.premiumStatus,
        subscriptionType: premiumState.updates.subscriptionType,
      });
    } catch (error: any) {
      console.error("Checkout session sync failed", error);
      res.status(500).json({ error: error.message || "Failed to sync checkout session." });
    }
  });

  app.post("/api/sync-latest-checkout-session", requireFirebaseUser, async (req, res) => {
    try {
      const uid = res.locals.firebaseUser.uid as string;
      const email = res.locals.firebaseUser.email as string | undefined;
      const authHeader = req.headers.authorization || "";
      const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

      const premiumState = await findLatestCompletedCheckoutSessionForUser(uid, email);
      if (premiumState.userId !== uid && premiumState.session.customer_details?.email !== email) {
        return res.status(403).json({ error: "No verified checkout session belongs to this user." });
      }

      const writeMode = await writePremiumState(uid, idToken, premiumState.updates, premiumState.payment);
      res.json({
        success: true,
        writeMode,
        premiumStatus: premiumState.updates.premiumStatus,
        subscriptionType: premiumState.updates.subscriptionType,
      });
    } catch (error: any) {
      console.error("Latest checkout session sync failed", error);
      res.status(500).json({ error: error.message || "Failed to sync latest checkout session." });
    }
  });

  app.post("/api/create-portal-session", requireFirebaseUser, async (req, res) => {
    try {
      const uid = res.locals.firebaseUser.uid as string;
      const email = res.locals.firebaseUser.email as string | undefined;
      const stripe = getStripe();
      let customerId: string | null = null;
      let lastInvoiceUrl: string | null = null;

      // Try to get Stripe customer ID from Firestore (admin)
      try {
        const userDoc = await getFirestore().collection("users").doc(uid).get();
        const userData = (userDoc.data() as any) || {};
        customerId = userData.stripeCustomerId || null;
        lastInvoiceUrl = userData.lastInvoiceUrl || userData.lastReceiptUrl || null;
      } catch (adminError) {
        if (!isDefaultCredentialsError(adminError)) throw adminError;
        console.warn("Firebase Admin unavailable, using Stripe search fallback for billing portal");
      }

      // If not found in Firestore, search Stripe by email/metadata
      if (!customerId && email) {
        try {
          const customers = await stripe.customers.search({
            query: `email:'${email.replace(/'/g, "\\'")}'`,
            limit: 1,
          });
          if (customers.data.length > 0) {
            customerId = customers.data[0].id;
          }
        } catch (searchError) {
          console.warn("Stripe customer search failed:", searchError);
        }
      }

      if (!customerId) {
        // Fallback: if we have a last invoice URL, return it so frontend can open it
        if (lastInvoiceUrl) {
          return res.json({ url: lastInvoiceUrl, fallback: true, message: "No Stripe customer found. Opening last invoice instead." });
        }
        return res.status(400).json({ error: "No Stripe customer found for this account. Complete a payment first." });
      }

      try {
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: `${getAppUrl()}/dashboard`,
        });
        res.json({ url: portalSession.url });
      } catch (portalError: any) {
        // Customer portal not configured in Stripe dashboard (common in test mode)
        // Fall back to last invoice URL so user can at least see their payment
        console.warn("Billing portal session creation failed (portal may not be configured):", portalError.message);
        if (lastInvoiceUrl) {
          return res.json({ url: lastInvoiceUrl, fallback: true, message: "Billing portal not configured. Opening last invoice instead." });
        }
        // Try to get latest invoice directly from Stripe as last resort
        try {
          const invoices = await stripe.invoices.list({ customer: customerId, limit: 1, status: "paid" });
          if (invoices.data.length > 0 && invoices.data[0].hosted_invoice_url) {
            return res.json({ url: invoices.data[0].hosted_invoice_url, fallback: true, message: "Billing portal not configured. Opening last invoice instead." });
          }
        } catch (_) { /* ignore */ }
        return res.status(500).json({ error: portalError.message || "Billing portal not configured. Please set it up in your Stripe Dashboard under Settings > Billing > Customer portal." });
      }
    } catch (error: any) {
      console.error("Billing portal creation failed:", error);
      res.status(500).json({ error: error.message || "Failed to create billing portal session" });
    }
  });


  app.post("/api/cancel-subscription", requireFirebaseUser, async (req, res) => {
    try {
      const uid = res.locals.firebaseUser.uid as string;
      const email = res.locals.firebaseUser.email as string | undefined;
      const stripe = getStripe();
      let userData: any = {};

      // Try to get user data from Firestore (admin)
      try {
        const userRef = getFirestore().collection("users").doc(uid);
        const userDoc = await userRef.get();
        userData = (userDoc.data() || {}) as any;
      } catch (adminError) {
        if (!isDefaultCredentialsError(adminError)) throw adminError;
        console.warn("Firebase Admin unavailable, searching Stripe for subscription");
      }

      let stripeSubscriptionId = userData.stripeSubscriptionId;

      // If subscription ID not found, search Stripe by customer email
      if (!stripeSubscriptionId && email) {
        try {
          const customers = await stripe.customers.search({
            query: `email:'${email.replace(/'/g, "\\'")}'`,
            limit: 1,
          });
          if (customers.data.length > 0) {
            const customerId = customers.data[0].id;
            const subscriptions = await stripe.subscriptions.list({
              customer: customerId,
              status: "active",
              limit: 1,
            });
            if (subscriptions.data.length > 0) {
              stripeSubscriptionId = subscriptions.data[0].id;
            }
          }
        } catch (searchError) {
          console.warn("Stripe subscription search failed:", searchError);
        }
      }

      if (userData?.isLifetime || userData?.subscriptionType === 'lifetime') {
        return res.status(400).json({ error: "Lifetime access is a one-time purchase and has no recurring payment to stop." });
      }
      if (!stripeSubscriptionId) {
        return res.status(400).json({ error: "No active subscription found for this account." });
      }

      const subscription = await stripe.subscriptions.update(stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      // Try to update Firestore, but don't fail if we can't
      try {
        await updateUserFromSubscription(subscription, {
          premiumStatus: "CANCELING",
          subscriptionCanceledAt: FieldValue.serverTimestamp(),
        });
      } catch (firestoreError) {
        if (!isDefaultCredentialsError(firestoreError)) throw firestoreError;
        console.warn("Could not update Firestore (no admin credentials), but Stripe subscription updated successfully");
      }

      res.json({ 
        success: true, 
        cancelAt: toTimestamp((subscription as any).current_period_end)?.toDate().toISOString(),
        message: "Subscription scheduled for cancellation at period end"
      });
    } catch (error: any) {
      console.error("Cancel subscription failed:", error);
      res.status(500).json({ error: error.message || "Failed to cancel subscription" });
    }
  });

  app.get("/api/billing-history", requireFirebaseUser, async (req, res) => {
    try {
      const uid = res.locals.firebaseUser.uid as string;
      const email = res.locals.firebaseUser.email as string | undefined;
      const stripe = getStripe();
      const payments: any[] = [];
      let firestoreCustomerId: string | null = null;

      // First try Firestore (admin) — get both the payments sub-collection and the stripeCustomerId
      try {
        const userDoc = await getFirestore().collection("users").doc(uid).get();
        const userData = (userDoc.data() || {}) as any;
        firestoreCustomerId = userData.stripeCustomerId || null;

        const snapshot = await getFirestore()
          .collection("users")
          .doc(uid)
          .collection("payments")
          .orderBy("createdAt", "desc")
          .limit(25)
          .get();

        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          // Normalize Firestore Timestamps to ISO strings so the frontend can parse them
          const normalize = (ts: any) => {
            if (!ts) return null;
            if (typeof ts?.toDate === "function") return ts.toDate().toISOString();
            if (ts?._seconds !== undefined) return new Date(ts._seconds * 1000).toISOString();
            if (ts?.seconds !== undefined) return new Date(ts.seconds * 1000).toISOString();
            return ts;
          };
          payments.push({
            id: docSnap.id,
            ...data,
            createdAt: normalize(data.createdAt),
            date: normalize(data.date || data.createdAt),
          });
        });
      } catch (adminError) {
        if (!isDefaultCredentialsError(adminError)) throw adminError;
        console.warn("Firebase Admin unavailable, using Stripe invoices/charges as fallback");
      }

      // If Firestore returned no payments, fetch directly from Stripe using the customerId we know
      if (payments.length === 0) {
        // Build list of customer IDs to check — start with the one in Firestore
        const customerIdsToCheck = new Set<string>();
        if (firestoreCustomerId) customerIdsToCheck.add(firestoreCustomerId);

        // Also search by email as backup
        if (email) {
          try {
            const customers = await stripe.customers.search({
              query: `email:'${email.replace(/'/g, "\\'")}' OR metadata['userId']:'${uid}'`,
              limit: 5,
            });
            customers.data.forEach((c) => customerIdsToCheck.add(c.id));
          } catch (searchError) {
            console.warn("Stripe customer search failed:", searchError);
          }
        }

        for (const customerId of customerIdsToCheck) {
          try {
            // Get invoices
            const invoices = await stripe.invoices.list({
              customer: customerId,
              limit: 25,
              status: "paid",
            });

            for (const invoice of invoices.data) {
              if (!payments.find((p) => p.id === invoice.id)) {
                payments.push({
                  id: invoice.id,
                  type: "invoice",
                  amount: invoice.amount_paid,
                  currency: invoice.currency,
                  status: invoice.status,
                  createdAt: new Date(invoice.created * 1000).toISOString(),
                  date: new Date(invoice.created * 1000).toISOString(),
                  invoiceUrl: invoice.hosted_invoice_url,
                  receiptUrl: invoice.hosted_invoice_url,
                });
              }
            }

            // Get charges as well
            const charges = await stripe.charges.list({
              customer: customerId,
              limit: 25,
              expand: ["data.invoice"],
            });

            for (const charge of charges.data) {
              if (!payments.find((p) => p.id === charge.id)) {
                payments.push({
                  id: charge.id,
                  type: "charge",
                  amount: charge.amount,
                  currency: charge.currency,
                  status: charge.status,
                  createdAt: new Date(charge.created * 1000).toISOString(),
                  date: new Date(charge.created * 1000).toISOString(),
                  receiptUrl: charge.receipt_url,
                  invoiceUrl: (charge as any).invoice?.hosted_invoice_url || null,
                });
              }
            }
          } catch (stripeError) {
            console.warn(`Stripe payment history fetch failed for customer ${customerId}:`, stripeError);
          }
        }

        // Sort by date descending
        payments.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
      }

      res.json({ payments });
    } catch (error: any) {
      console.error("Billing history fetch failed:", error);
      res.status(500).json({ error: error.message || "Failed to load billing history" });
    }
  });

  app.get("/api/subscription-details", requireFirebaseUser, async (req, res) => {
    try {
      const uid = res.locals.firebaseUser.uid as string;
      const email = res.locals.firebaseUser.email as string | undefined;
      const stripe = getStripe();
      let userData: any = {};

      // Try to get user data from Firestore
      try {
        const userDoc = await getFirestore().collection("users").doc(uid).get();
        userData = (userDoc.data() || {}) as any;
      } catch (adminError) {
        if (!isDefaultCredentialsError(adminError)) throw adminError;
        console.warn("Firebase Admin unavailable, searching Stripe for subscription details");
      }

      let subscriptionDetails: any = null;

      // If we have subscription ID, get details from Stripe
      if (userData.stripeSubscriptionId) {
        try {
          subscriptionDetails = await stripe.subscriptions.retrieve(userData.stripeSubscriptionId);
        } catch (err) {
          console.warn("Failed to retrieve subscription by ID:", err);
        }
      }

      // If not found, search by customer
      if (!subscriptionDetails && email) {
        try {
          const customers = await stripe.customers.search({
            query: `email:'${email.replace(/'/g, "\\'")}'`,
            limit: 1,
          });

          if (customers.data.length > 0) {
            const customerId = customers.data[0].id;
            const subscriptions = await stripe.subscriptions.list({
              customer: customerId,
              status: "active",
              limit: 1,
            });

            if (subscriptions.data.length > 0) {
              subscriptionDetails = subscriptions.data[0];
            }
          }
        } catch (searchError) {
          console.warn("Stripe subscription search failed:", searchError);
        }
      }

      // Fallback for Lifetime users if no subscription is found in Stripe
      if (!subscriptionDetails && (userData?.isLifetime || userData?.subscriptionType === 'lifetime')) {
        return res.json({
          subscription: {
            status: 'active',
            plan: { name: 'Lifetime Premium', amount: 12999, currency: 'usd' },
            autoRenewal: false,
            isLifetime: true
          }
        });
      }

      if (!subscriptionDetails) {
        return res.json({ subscription: null, message: "No active subscription found" });
      }

      // Calculate next billing date
      const daysUntilNextBilling = Math.ceil(
        ((subscriptionDetails as any).current_period_end * 1000 - Date.now()) / (1000 * 60 * 60 * 24)
      );

      res.json({
        subscription: {
          id: subscriptionDetails.id,
          status: subscriptionDetails.status,
          plan: {
            interval: (subscriptionDetails as any).items?.data?.[0]?.plan?.interval,
            name: (subscriptionDetails as any).items?.data?.[0]?.plan?.nickname,
            amount: (subscriptionDetails as any).items?.data?.[0]?.price?.unit_amount,
            currency: (subscriptionDetails as any).items?.data?.[0]?.price?.currency,
          },
          currentPeriodStart: new Date((subscriptionDetails as any).current_period_start * 1000),
          currentPeriodEnd: new Date((subscriptionDetails as any).current_period_end * 1000),
          nextBillingDate: new Date((subscriptionDetails as any).current_period_end * 1000),
          daysUntilNextBilling,
          cancelAtPeriodEnd: subscriptionDetails.cancel_at_period_end,
          trialEnd: subscriptionDetails.trial_end ? new Date(subscriptionDetails.trial_end * 1000) : null,
          autoRenewal: !subscriptionDetails.cancel_at_period_end,
          metadata: subscriptionDetails.metadata,
        },
      });
    } catch (error: any) {
      console.error("Subscription details fetch failed:", error);
      res.status(500).json({ error: error.message || "Failed to fetch subscription details" });
    }
  });

  app.post("/api/send-receipt", requireFirebaseUser, async (req, res) => {
    try {
      const uid = res.locals.firebaseUser.uid as string;
      const email = res.locals.firebaseUser.email as string | undefined;
      const { invoiceUrl, receiptUrl, amount, currency, type } = req.body;

      if (!email) {
        return res.status(400).json({ error: "User email not available." });
      }

      if (!invoiceUrl && !receiptUrl) {
        return res.status(400).json({ error: "Either invoiceUrl or receiptUrl is required." });
      }

      const transporter = getEmailTransporter();
      if (!transporter) {
        // SMTP not configured, but don't fail - just skip email
        console.log(`Receipt email for ${email} would have been sent (SMTP not configured)`);
        return res.json({ success: true, message: "Receipt generated but email not sent (SMTP not configured)" });
      }

      const receiptLink = invoiceUrl || receiptUrl;
      const formattedAmount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD',
      }).format((amount || 0) / 100);

      const mailOptions = {
        from: process.env.SMTP_USER,
        to: email,
        subject: `Your Premium Subscription Receipt - ${formattedAmount}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); color: white; padding: 20px; border-radius: 8px; }
                .content { background: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 8px; }
                .receipt-link { display: inline-block; background: #f59e0b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
                .footer { color: #6b7280; font-size: 12px; text-align: center; margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0;">Receipt</h1>
                </div>
                <div class="content">
                  <p>Hi ${email.split('@')[0]},</p>
                  <p>Thank you for your subscription! Your payment of <strong>${formattedAmount}</strong> has been received.</p>
                  <p><strong>Payment Type:</strong> ${type || 'Subscription'}</p>
                  <a href="${receiptLink}" target="_blank" class="receipt-link">View Full Receipt</a>
                  <p>Keep this receipt for your records. You'll receive this confirmation at the email address associated with your account.</p>
                </div>
                <div class="footer">
                  <p>© 2025 PREMIUM. All rights reserved.</p>
                  <p>If you have any questions, please contact our support team.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      };

      await transporter.sendMail(mailOptions);
      
      // Update user document with receipt sent timestamp
      await getFirestore()
        .collection("users")
        .doc(uid)
        .set({ lastReceiptEmailSent: FieldValue.serverTimestamp() }, { merge: true });

      res.json({ success: true, message: "Receipt email sent successfully" });
    } catch (error: any) {
      console.error("Failed to send receipt email:", error);
      res.status(500).json({ error: error.message || "Failed to send receipt email" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  server.on('error', (e: any) => {
    if (e.code === 'EADDRINUSE') {
      console.error(`❌ Error: Port ${PORT} is already in use. Please kill the existing process or use a different port (e.g., PORT=3001 npm run dev).`);
      process.exit(1);
    }
  });
}

startServer();
