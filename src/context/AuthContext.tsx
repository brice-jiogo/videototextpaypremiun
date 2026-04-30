import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, syncUserDocument } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';
import { checkPremiumStatus } from '../lib/utils';

interface AuthContextType {
  user: User | null;
  userData: any | null;
  isLoading: boolean;
  isPremium: boolean;
  daysRemaining: number;
  authError: string | null;
  isEmailVerified: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  isLoading: true,
  isPremium: false,
  daysRemaining: 0,
  authError: null,
  isEmailVerified: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeSnapshot: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setAuthError(null);
      setUser(firebaseUser);
      if (firebaseUser) {
        // Check email verification status
        if (!firebaseUser.emailVerified) {
          setAuthError('Please verify your email address before continuing.');
        }
        
        // Sync document initially just in case it doesn't exist
        try {
            await syncUserDocument(firebaseUser);
        } catch (err) {
            console.error("Could not sync user document. Make sure your Firestore Rules are configured.", err);
            setAuthError('Failed to sync user data. Please try again.');
        }

        // Listen for changes (e.g. webhook upgrades them to PREMIUM)
        unsubscribeSnapshot = onSnapshot(
            doc(db, 'users', firebaseUser.uid),
            (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const premiumInfo = checkPremiumStatus(data);
                    setUserData({
                      ...data,
                      ...premiumInfo
                    });
                } else {
                    const premiumInfo = checkPremiumStatus({ premiumStatus: 'FREE' });
                    setUserData({ 
                      email: firebaseUser.email,
                      premiumStatus: 'FREE',
                      ...premiumInfo
                    });
                }
                setIsLoading(false);
            },
            (err) => {
                console.error("Snapshot error on user. Make sure your Firestore Rules are configured.", err);
                const premiumInfo = checkPremiumStatus({ premiumStatus: 'FREE' });
                setUserData({ 
                  email: firebaseUser.email,
                  premiumStatus: 'FREE',
                  ...premiumInfo
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

  const isEmailVerified = user?.emailVerified || false;

  return (
    <AuthContext.Provider value={{ 
      user, 
      userData, 
      isLoading,
      isPremium: userData?.isPremiumActive ?? false,
      daysRemaining: userData?.premiumStatus === 'PREMIUM_TRIAL' 
        ? userData?.daysRemainingInTrial 
        : userData?.daysRemainingInSubscription ?? 0,
      authError,
      isEmailVerified
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
