import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, syncUserDocument } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { checkPremiumStatus } from '../lib/utils';

interface AuthContextType {
  user: User | null;
  userData: any | null;
  isLoading: boolean;
  isPremium: boolean;
  daysRemaining: number;
  isTrialActive: boolean;
  daysRemainingInTrial: number;
  premiumStatus: string;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  isLoading: true,
  isPremium: false,
  daysRemaining: 0,
  isTrialActive: false,
  daysRemainingInTrial: 0,
  premiumStatus: 'FREE',
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Sync/create user document in Firestore
        try {
          await syncUserDocument(firebaseUser);
        } catch (err) {
          console.error('Could not sync user document. Check Firestore rules.', err);
        }

        // Real-time listener — picks up webhook-triggered premium upgrades instantly
        unsubscribeSnapshot = onSnapshot(
          doc(db, 'users', firebaseUser.uid),
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              const premiumInfo = checkPremiumStatus(data);
              setUserData({ ...data, ...premiumInfo });
            } else {
              const premiumInfo = checkPremiumStatus({ premiumStatus: 'FREE' });
              setUserData({
                email: firebaseUser.email,
                premiumStatus: 'FREE',
                ...premiumInfo,
              });
            }
            setIsLoading(false);
          },
          (err) => {
            console.error('Snapshot error. Check Firestore rules.', err);
            const premiumInfo = checkPremiumStatus({ premiumStatus: 'FREE' });
            setUserData({
              email: firebaseUser.email,
              premiumStatus: 'FREE',
              ...premiumInfo,
            });
            setIsLoading(false);
          }
        );
      } else {
        setUserData(null);
        setIsLoading(false);
        if (unsubscribeSnapshot) unsubscribeSnapshot();
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        isLoading,
        isPremium: userData?.isPremiumActive ?? false,
        daysRemaining: userData?.daysRemainingInSubscription ?? 0,
        isTrialActive: userData?.premiumStatus === 'PREMIUM_TRIAL',
        daysRemainingInTrial: userData?.daysRemainingInTrial ?? 0,
        premiumStatus: userData?.premiumStatus ?? 'FREE',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
