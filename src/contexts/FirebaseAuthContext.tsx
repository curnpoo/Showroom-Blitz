import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  browserSessionPersistence,
  getRedirectResult,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithRedirect,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from 'firebase/auth';

import {
  getFirebaseAppCheckToken,
  hasFirebaseClientConfig,
  initializeFirebaseApp,
  initializeFirebaseAppCheck,
} from '../firebase/client';
import type { AppUser } from '../types/auth';

type AuthError = string | null;

type MeResponse = {
  authEnabled?: boolean;
  csrfToken?: string;
  user?: AppUser | null;
  error?: {
    message?: string;
  };
};

type FirebaseAuthContextValue = {
  user: AppUser | null;
  loading: boolean;
  error: AuthError;
  csrfToken: string | null;
  authEnabled: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
};

const FirebaseAuthContext = createContext<FirebaseAuthContextValue | undefined>(undefined);

const readPayload = async (response: Response): Promise<MeResponse> => {
  return response.json().catch(() => ({}));
};

export const FirebaseAuthProvider = ({ children }: { children: ReactNode }) => {
  const firebaseApp = useMemo(() => initializeFirebaseApp(), []);
  const auth = useMemo(() => (firebaseApp ? getAuth(firebaseApp) : null), [firebaseApp]);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [serverAuthEnabled, setServerAuthEnabled] = useState(false);
  const [sessionRecovered, setSessionRecovered] = useState(false);

  const clientAuthEnabled = hasFirebaseClientConfig();

  const refreshMe = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });
      const payload = await readPayload(response);
      setCsrfToken(payload.csrfToken ?? null);
      setServerAuthEnabled(Boolean(payload.authEnabled));
      setUser(payload.user ?? null);
      if (!response.ok) {
        throw new Error(payload.error?.message ?? 'Unable to load auth state');
      }
      setError(null);
    } catch (err) {
      setUser(null);
      setServerAuthEnabled(false);
      setError(err instanceof Error ? err.message : 'Unable to load auth state');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshMe();
  }, [refreshMe]);

  useEffect(() => {
    initializeFirebaseAppCheck();
  }, []);

  const exchangeIdTokenForSession = useCallback(
    async (firebaseUser: FirebaseUser) => {
      if (!auth) {
        throw new Error('Firebase auth is not initialized.');
      }

      if (!csrfToken) {
        await refreshMe();
      }

      const csrf = csrfToken || (await (async () => {
        const response = await fetch('/api/auth/me', { credentials: 'include' });
        const payload = await readPayload(response);
        setCsrfToken(payload.csrfToken ?? null);
        setServerAuthEnabled(Boolean(payload.authEnabled));
        return payload.csrfToken ?? null;
      })());

      if (!csrf) {
        throw new Error('Unable to establish CSRF protection.');
      }

      const idToken = await firebaseUser.getIdToken(true);
      const appCheckToken = await getFirebaseAppCheckToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrf,
      };
      if (appCheckToken) {
        headers['X-Firebase-AppCheck'] = appCheckToken;
      }

      const response = await fetch('/api/auth/session', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ idToken }),
      });
      const payload = await readPayload(response);
      if (!response.ok) {
        throw new Error(payload.error?.message ?? 'Unable to sign in');
      }
      setCsrfToken(payload.csrfToken ?? null);
      setUser(payload.user ?? null);
      setServerAuthEnabled(true);
      setError(null);

      await firebaseSignOut(auth).catch(() => undefined);
    },
    [auth, csrfToken, refreshMe],
  );

  useEffect(() => {
    if (!auth || !clientAuthEnabled) return;

    let cancelled = false;
    const completeRedirectSignIn = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (!result?.user || cancelled) return;
        setLoading(true);
        setError(null);
        await exchangeIdTokenForSession(result.user);
        setSessionRecovered(true);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to sign in');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void completeRedirectSignIn();

    return () => {
      cancelled = true;
    };
  }, [auth, clientAuthEnabled, exchangeIdTokenForSession]);

  useEffect(() => {
    if (!auth || !clientAuthEnabled || sessionRecovered) return;

    let cancelled = false;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser || cancelled || user) {
        return;
      }

      setLoading(true);
      try {
        await exchangeIdTokenForSession(firebaseUser);
        if (!cancelled) {
          setSessionRecovered(true);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to sign in');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [auth, clientAuthEnabled, exchangeIdTokenForSession, sessionRecovered, user]);

  const login = useCallback(async () => {
    if (!auth || !clientAuthEnabled) {
      setError('Firebase sign-in is not fully configured.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Redirect auth needs state to survive the full-page round trip.
      await setPersistence(auth, browserSessionPersistence);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithRedirect(auth, provider);
      return;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  }, [auth, clientAuthEnabled, exchangeIdTokenForSession]);

  const logout = useCallback(async () => {
    if (!csrfToken) {
      setError('Unable to verify logout request.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-CSRF-Token': csrfToken,
        },
      });
      const payload = await readPayload(response);
      if (!response.ok) {
        throw new Error(payload.error?.message ?? 'Unable to log out');
      }
      setCsrfToken(payload.csrfToken ?? null);
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to log out');
    } finally {
      setLoading(false);
    }
  }, [csrfToken]);

  const updateDisplayName = useCallback(
    async (name: string) => {
      if (!csrfToken) {
        throw new Error('Unable to verify profile update.');
      }

      const appCheckToken = await getFirebaseAppCheckToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      };
      if (appCheckToken) {
        headers['X-Firebase-AppCheck'] = appCheckToken;
      }

      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        credentials: 'include',
        headers,
        body: JSON.stringify({ displayName: name }),
      });
      const payload = await readPayload(response);
      if (!response.ok) {
        throw new Error(payload.error?.message ?? 'Unable to save display name');
      }
      setUser(payload.user ?? null);
      setError(null);
    },
    [csrfToken],
  );

  return (
    <FirebaseAuthContext.Provider
      value={{
        user,
        loading,
        error,
        csrfToken,
        authEnabled: clientAuthEnabled && serverAuthEnabled,
        login,
        logout,
        refreshMe,
        updateDisplayName,
      }}
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
