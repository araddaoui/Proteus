import type { NextFunction, Request, Response } from 'express';
import type { Capability } from '../../src/types/auth.js';
import { config } from '../config.js';
import { verifyFirebaseToken } from '../auth/firebase.js';
import {
  claimInvites,
  getMembershipForTenant,
  getUser,
  touchUser,
  upsertUser,
} from '../repositories/index.js';
import type { AuditActor } from '../repositories/index.js';
import { AppError, asyncHandler } from './errors.js';

const SYNC_INTERVAL_MS = 60_000;
const lastSyncedAt = new Map<string, number>();

function bearer(req: Request): string | null {
  const header = req.header('authorization') || '';
  const [scheme, token] = header.split(' ');
  if (!token || scheme?.toLowerCase() !== 'bearer') return null;
  return token;
}

export const requireAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const token = bearer(req);
  if (!token) throw new AppError(401, 'UNAUTHENTICATED', 'A Firebase ID token is required.');
  let decoded;
  try {
    decoded = await verifyFirebaseToken(token);
  } catch {
    throw new AppError(401, 'INVALID_TOKEN', 'The Firebase ID token is invalid or expired.');
  }
  if (!decoded.email) throw new AppError(403, 'EMAIL_REQUIRED', 'An email address is required.');
  if (!decoded.email_verified && !config.allowUnverifiedEmail) {
    throw new AppError(403, 'EMAIL_NOT_VERIFIED', 'Verify your email address before accessing Proteus.');
  }

  const syncUser = async () => {
    const user = await upsertUser({
      uid: decoded.uid,
      email: decoded.email!,
      displayName: decoded.name || decoded.email!.split('@')[0],
      avatarUrl: decoded.picture || null,
    });
    if (!user) throw new AppError(500, 'USER_UPSERT_FAILED', 'Could not establish the user account.');
    await touchUser(decoded.uid);
    await claimInvites(decoded.uid, decoded.email!);
    lastSyncedAt.set(decoded.uid, Date.now());
    return user;
  };

  const lastSync = lastSyncedAt.get(decoded.uid) || 0;
  let user = Date.now() - lastSync < SYNC_INTERVAL_MS ? await getUser(decoded.uid) : null;
  if (!user) {
    user = await syncUser();
  } else {
    await claimInvites(decoded.uid, decoded.email!);
  }

  req.auth = {
    user: {
      uid: decoded.uid,
      email: decoded.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl || undefined,
    },
    firebase: decoded,
    isPlatformAdmin: user.isPlatformAdmin,
  };
  next();
});

export const requireTenant = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  if (!req.auth) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication is required.');
  const tenantId = req.header('x-tenant-id') || req.query.tenantId;
  if (!tenantId || typeof tenantId !== 'string') {
    throw new AppError(400, 'TENANT_REQUIRED', 'The X-Tenant-Id header is required.');
  }
  const membership = await getMembershipForTenant(req.auth.user.uid, tenantId);
  if (!membership) {
    throw new AppError(403, 'TENANT_FORBIDDEN', 'You do not have access to this institution.');
  }
  req.tenantId = tenantId;
  req.membership = membership;
  next();
});

export function requireTenantParam(param = 'id') {
  return asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication is required.');
    const tenantId = req.params[param];
    if (!tenantId) throw new AppError(400, 'TENANT_REQUIRED', 'A tenant id is required.');
    const membership = await getMembershipForTenant(req.auth.user.uid, tenantId);
    if (!membership) {
      throw new AppError(403, 'TENANT_FORBIDDEN', 'You do not have access to this institution.');
    }
    req.tenantId = tenantId;
    req.membership = membership;
    next();
  });
}

export function requireCapability(capability: Capability) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.membership) throw new AppError(403, 'TENANT_REQUIRED', 'Select an institution first.');
    if (!req.membership.capabilities.includes(capability)) {
      throw new AppError(403, 'CAPABILITY_DENIED', `Your role does not allow ${capability}.`);
    }
    next();
  };
}

export function requireAnyCapability(...capabilities: Capability[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.membership) throw new AppError(403, 'TENANT_REQUIRED', 'Select an institution first.');
    if (!capabilities.some((capability) => req.membership!.capabilities.includes(capability))) {
      throw new AppError(403, 'CAPABILITY_DENIED', 'Your role does not allow this action.');
    }
    next();
  };
}

export function requireRecentAuth(req: Request, _res: Response, next: NextFunction) {
  const authTime = req.auth?.firebase.auth_time;
  if (!authTime || Date.now() / 1000 - authTime > config.recentAuthSeconds) {
    throw new AppError(
      401,
      'REAUTH_REQUIRED',
      'Sign in again before performing a governance signoff or sensitive administrative action.',
      { maxAgeSeconds: config.recentAuthSeconds },
    );
  }
  if (config.requireMfaClaim) {
    const firebase = req.auth?.firebase.firebase as { sign_in_second_factor?: string } | undefined;
    if (!firebase?.sign_in_second_factor) {
      throw new AppError(403, 'MFA_REQUIRED', 'Multi-factor authentication is required for this action.');
    }
  }
  next();
}

export function requirePlatformAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.auth?.isPlatformAdmin) {
    throw new AppError(403, 'PLATFORM_ADMIN_REQUIRED', 'Platform administrator access is required.');
  }
  next();
}

export function actorFrom(req: Request): AuditActor {
  return {
    uid: req.auth?.user.uid || 'anonymous',
    membershipId: req.membership?.id,
    role: req.membership?.role || 'anonymous',
    requestId: req.requestId,
    ip: req.ip,
    userAgent: req.header('user-agent') || undefined,
  };
}
