import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  reauthenticateWithPopup,
} from 'firebase/auth';
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
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function signInWithGoogle() {
  if (!auth) return { user: null, error: 'Firebase authentication is not configured.' };
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Google sign-in failed.';
    return { user: null, error: message };
  }
}

export async function reauthenticateWithGoogle() {
  if (!auth?.currentUser) throw new Error('No signed-in user to reauthenticate.');
  await reauthenticateWithPopup(auth.currentUser, googleProvider);
  return auth.currentUser.getIdToken(true);
}

export async function logOutFromFirebase() {
  if (!auth) return;
  await signOut(auth);
}
