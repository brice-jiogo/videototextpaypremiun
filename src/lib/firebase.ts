import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCFTZ4qulGO45z9grA4oLH0fBTHC9xnz4E",
  authDomain: "voice-reader-1c712.firebaseapp.com",
  projectId: "voice-reader-1c712",
  storageBucket: "voice-reader-1c712.firebasestorage.app",
  messagingSenderId: "125701768506",
  appId: "1:125701768506:web:2bd1ae5c72dcd71130fc03",
  measurementId: "G-YGQS9VJ7ET"
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
                    premiumStartDate: null,
                    premiumEndDate: null,
                    subscriptionType: null,
                    stripeCustomerId: null,
                    stripeSubscriptionId: null,
                    lastPaymentDate: null,
                    lastPaymentAmount: null,
                    lastReceiptUrl: null,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
                return { 
                    email: user.email, 
                    premiumStatus: 'FREE',
                    premiumStartDate: null,
                    premiumEndDate: null,
                    subscriptionType: null,
                    stripeCustomerId: null
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
