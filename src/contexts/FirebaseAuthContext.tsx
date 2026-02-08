import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut, updateProfile, type User } from 'firebase/auth';
import { initializeFirebaseApp } from '../firebase/client';

type AuthError = string | null;

type FirebaseAuthContextValue = {
  user: User | null;
  loading: boolean;
  error: AuthError;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
  updateDisplayName: (name: string) => Promise<void>;
};

const FirebaseAuthContext = createContext<FirebaseAuthContextValue | undefined>(undefined);

export const FirebaseAuthProvider = ({ children }: { children: ReactNode }) => {
  const firebaseApp = useMemo(() => initializeFirebaseApp(), []);
  const auth = useMemo(() => (firebaseApp ? getAuth(firebaseApp) : null), [firebaseApp]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError>(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);
      },
      (firebaseError) => {
        setError(firebaseError.message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [auth]);

  const login = useCallback(async () => {
    if (!auth) {
      setError('Firebase has not been configured');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  }, [auth]);

  const logout = useCallback(async () => {
    if (!auth) return;
    setLoading(true);
    try {
      await firebaseSignOut(auth);
    } finally {
      setLoading(false);
    }
  }, [auth]);

  const getIdToken = useCallback(async () => {
    if (!auth) return null;
    const currentUser = auth.currentUser;
    if (!currentUser) return null;
    return currentUser.getIdToken();
  }, [auth]);

  const updateDisplayName = useCallback(
    async (name: string) => {
      if (!auth) throw new Error('Firebase has not been configured');
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('No authenticated user');
      await updateProfile(currentUser, { displayName: name });
      setUser({ ...currentUser });
    },
    [auth]
  );

  return (
    <FirebaseAuthContext.Provider
      value={{ user, loading, error, login, logout, getIdToken, updateDisplayName }}
    >
      {children}
    </FirebaseAuthContext.Provider>
  );
};

export const useFirebaseAuth = () => {
  const context = useContext(FirebaseAuthContext);
  if (!context) {
    throw new Error('useFirebaseAuth must be used within FirebaseAuthProvider');
  }
  return context;
};
