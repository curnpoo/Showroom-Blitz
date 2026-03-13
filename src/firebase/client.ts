import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getToken,
  initializeAppCheck,
  ReCaptchaV3Provider,
  type AppCheck,
} from 'firebase/app-check';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

let appCheckInstance: AppCheck | null | undefined;
let appCheckInitialized = false;
let firebaseConfigWarningShown = false;

export const hasFirebaseClientConfig = () =>
  Boolean(
    firebaseConfig.apiKey
      && firebaseConfig.authDomain
      && firebaseConfig.projectId
      && firebaseConfig.appId,
  );

export const initializeFirebaseApp = (): FirebaseApp | null => {
  if (!hasFirebaseClientConfig()) {
    if (!firebaseConfigWarningShown) {
      console.warn('[firebase] Missing configuration, skipping Firebase initialization.');
      firebaseConfigWarningShown = true;
    }
    return null;
  }
  if (!getApps().length) {
    return initializeApp(firebaseConfig);
  }
  return getApps()[0];
};

export const initializeFirebaseAppCheck = (): AppCheck | null => {
  if (appCheckInitialized) {
    return appCheckInstance ?? null;
  }

  const firebaseApp = initializeFirebaseApp();
  const siteKey = import.meta.env.VITE_FIREBASE_APP_CHECK_SITE_KEY;
  if (!firebaseApp || !siteKey || typeof window === 'undefined') {
    appCheckInitialized = true;
    appCheckInstance = null;
    return null;
  }

  const debugToken = import.meta.env.VITE_FIREBASE_APP_CHECK_DEBUG_TOKEN;
  if (debugToken) {
    window.FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken === 'true' ? true : debugToken;
  }

  appCheckInstance = initializeAppCheck(firebaseApp, {
    provider: new ReCaptchaV3Provider(siteKey),
    isTokenAutoRefreshEnabled: true,
  });
  appCheckInitialized = true;
  return appCheckInstance;
};

export const getFirebaseAppCheckToken = async (): Promise<string | null> => {
  const appCheck = initializeFirebaseAppCheck();
  if (!appCheck) {
    return null;
  }

  const { token } = await getToken(appCheck, false);
  return token;
};

declare global {
  interface Window {
    FIREBASE_APPCHECK_DEBUG_TOKEN?: string | boolean;
  }
}
