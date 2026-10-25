import { applicationDefault, cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';
import { config } from '../config.js';

let app: App | null = null;

function credential() {
  if (config.firebase.serviceAccountJson) {
    const parsed = JSON.parse(config.firebase.serviceAccountJson) as {
      project_id: string;
      client_email: string;
      private_key: string;
    };
    return cert({
      projectId: parsed.project_id,
      clientEmail: parsed.client_email,
      privateKey: parsed.private_key,
    });
  }
  if (config.firebase.projectId && config.firebase.clientEmail && config.firebase.privateKey) {
    return cert({
      projectId: config.firebase.projectId,
      clientEmail: config.firebase.clientEmail,
      privateKey: config.firebase.privateKey,
    });
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return applicationDefault();
  throw new Error('Firebase Admin credentials are not configured.');
}

export function firebaseApp(): App {
  if (app) return app;
  const existing = getApps()[0];
  app = existing || initializeApp({ credential: credential() });
  return app;
}

export async function verifyFirebaseToken(token: string): Promise<DecodedIdToken> {
  return getAuth(firebaseApp()).verifyIdToken(token, true);
}
