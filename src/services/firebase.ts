import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID
export const firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Google Sign-In with popup
export async function signInWithGoogle() {
  try {
    const { signInWithPopup } = await import('firebase/auth');
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user, error: null };
  } catch (err: any) {
    console.warn('Google sign-in popup error or iframe sandbox restriction:', err);
    return { user: null, error: err?.message || 'Google sign-in popup blocked or unavailable in iframe environment' };
  }
}

// Sign out helper
export async function logOutFromFirebase() {
  try {
    const { signOut } = await import('firebase/auth');
    await signOut(auth);
  } catch (err) {
    console.warn('Firebase sign-out error:', err);
  }
}

// Test connection on boot per Firebase skill guidelines
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(firestore, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or initializing.');
      return false;
    }
    // Connection test document may not exist, but network reachable
    return true;
  }
}
