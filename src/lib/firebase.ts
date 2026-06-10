import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Read Firebase config from Vite env when available to support multiple environments
const env = (import.meta as any).env || {};
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || env.VITE_FIREBASE_APIKEY || "AIzaSyCFTZ4qulGO45z9grA4oLH0fBTHC9xnz4E",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || env.VITE_FIREBASE_AUTHDOMAIN || "voice-reader-1c712.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || env.VITE_FIREBASE_PROJECTID || "voice-reader-1c712",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || env.VITE_FIREBASE_STORAGEBUCKET || "voice-reader-1c712.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || env.VITE_FIREBASE_MESSAGING_SENDERID || "125701768506",
  appId: env.VITE_FIREBASE_APP_ID || env.VITE_FIREBASE_APPID || "1:125701768506:web:2bd1ae5c72dcd71130fc03",
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || env.VITE_FIREBASE_MEASUREMENTID || "G-YGQS9VJ7ET",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// User Context Utilities
export async function syncUserDocument(user: any) {
    if (!user) return null;
    const userRef = doc(db, 'users', user.uid);
    try {
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
            try {
                await setDoc(userRef, {
                    email: user.email,
                    uid: user.uid,
                    premiumStatus: 'FREE',
                    premiumActivationMessage: 'Your PREMIUM subscription will take effect when you sign in to the mobile app with this same email address.',
                    premiumStartDate: null,
                    premiumEndDate: null,
                    nextRenewalDate: null,
                    subscriptionType: null,
                    subscriptionCancelAtPeriodEnd: false,
                    subscriptionCanceledAt: null,
                    billingInterval: null,
                    isLifetime: false,
                    stripeCustomerId: null,
                    stripeSubscriptionId: null,
                    stripeLastCheckoutSessionId: null,
                    lastPaymentDate: null,
                    lastPaymentAmount: null,
                    lastPaymentCurrency: null,
                    lastReceiptUrl: null,
                    lastInvoiceUrl: null,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
                return { 
                    email: user.email, 
                    premiumStatus: 'FREE',
                    premiumActivationMessage: 'Your PREMIUM subscription will take effect when you sign in to the mobile app with this same email address.',
                    premiumStartDate: null,
                    premiumEndDate: null,
                    nextRenewalDate: null,
                    subscriptionType: null,
                    stripeCustomerId: null,
                    isLifetime: false
                };
            } catch (setErr) {
                handleFirestoreError(setErr, OperationType.CREATE, `users/${user.uid}`);
            }
        }
        return snap.data();
    } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
    }
}
