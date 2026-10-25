function int(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function bool(name: string, fallback = false): boolean {
  const value = process.env[name];
  if (value === undefined) return fallback;
  return value === 'true' || value === '1';
}

function list(name: string): string[] {
  return (process.env[name] || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: int('PORT', 3000),
  databaseUrl: process.env.DATABASE_URL || '',
  databaseSsl: process.env.DATABASE_SSL,
  databasePoolMax: int('DATABASE_POOL_MAX', 10),
  corsOrigins: list('CORS_ORIGINS'),
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    serviceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '',
  },
  allowUnverifiedEmail: bool('ALLOW_UNVERIFIED_EMAIL'),
  requireMfaClaim: bool('REQUIRE_MFA_CLAIM'),
  recentAuthSeconds: int('RECENT_AUTH_SECONDS', 600),
  demoMode: bool('DEMO_MODE'),
  aiEnabled: bool('ENABLE_AI') && !!process.env.GEMINI_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  logLevel: process.env.LOG_LEVEL || 'info',
  trustProxy: bool('TRUST_PROXY', true),
};

export function assertRuntimeConfig(): void {
  const missing: string[] = [];
  if (!config.databaseUrl) missing.push('DATABASE_URL');
  const hasFirebase =
    !!config.firebase.serviceAccountJson || (!!config.firebase.projectId && !!config.firebase.clientEmail && !!config.firebase.privateKey);
  if (!hasFirebase) {
    missing.push('FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY');
  }
  if (missing.length) {
    throw new Error(`Missing required production configuration: ${missing.join(', ')}`);
  }
}
