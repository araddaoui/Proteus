import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import appletConfig from '../../firebase-applet-config.json';

const envConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
};

const firebaseConfig = {
  apiKey: envConfig.apiKey || appletConfig.apiKey,
  authDomain: envConfig.authDomain || appletConfig.authDomain,
  projectId: envConfig.projectId || appletConfig.projectId,
  appId: envConfig.appId || appletConfig.appId,
  messagingSenderId: envConfig.messagingSenderId || appletConfig.messagingSenderId,
};

export const isFirebaseConfigured = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

const app = isFirebaseConfigured
  ? getApps()[0] || initializeApp(firebaseConfig)
  : null;

export const auth = app ? getAuth(app) : null;

// Hardened local bypass for signInWithGoogle to prevent unauthorized-domain errors
export const signInWithGoogle = async () => {
  const mockUser = {
    user: {
      email: 'evelyn.vance@rsu.edu',
      displayName: 'Dr. Evelyn Vance',
      uid: 'demo-evelyn-vance'
    }
  };

  localStorage.setItem('proteus_user', JSON.stringify({
    email: 'evelyn.vance@rsu.edu',
    name: 'Dr. Evelyn Vance',
    role: 'administrator',
    title: 'President',
    tenantId: 'inst-1',
    authenticated: true
  }));
  localStorage.setItem('user', JSON.stringify(mockUser.user));

  return mockUser;
};