import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase'; // Your Firebase auth instance
import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';

export interface AuthState {
  user: FirebaseUser | null;
  firebaseToken: string | null; // To store the ID token
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [firebaseToken, setFirebaseToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          setFirebaseToken(token);
        } catch (error) {
          console.error("Error getting Firebase ID token:", error);
          setFirebaseToken(null);
          // Potentially sign out the user if token retrieval fails critically
        }
      } else {
        setFirebaseToken(null);
      }
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return {
    user,
    firebaseToken,
    isLoading,
    isAuthenticated: !!user, // True if user object is not null
  };
}
