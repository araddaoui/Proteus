import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { AuthenticatedUser, Capability, MembershipInfo, TenantRole } from '../types/auth';
import { resolveCapabilities, toUiRole } from '../types/auth';
import { RSU_INSTITUTION, RSU_OVERLAY_PACK } from '../sandbox/rsuSeed';

interface AuthContextType {
  user: AuthenticatedUser | null;
  firebaseUser: null;
  memberships: MembershipInfo[];
  activeTenantId: string | null;
  token: string | null;
  isLoggedIn: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isFirebaseConfigured: boolean;
  loginWithGoogle: () => Promise<{ success: boolean }>;
  logout: () => Promise<void>;
  switchTenant: (tenantId: string) => void;
  refreshMe: () => Promise<void>;
  reauthenticate: () => Promise<void>;
  getToken: (forceRefresh?: boolean) => Promise<string>;
  apiFetch: <T>(path: string, init?: RequestInit) => Promise<T>;
  hasCapability: (capability: Capability) => boolean;
  canAcademicSignoff: boolean;
  canAdministrativeSignoff: boolean;
  canManageDecisions: boolean;
  canReviewEvidence: boolean;
  canTriggerJobs: boolean;
  canResetDemo: boolean;
  isStudent: boolean;
}

type StoredUser = Record<string, unknown>;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function isRecord(value: unknown): value is StoredUser {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readSavedUser(): AuthenticatedUser | null {
  if (typeof window === 'undefined') return null;

  for (const key of ['proteus_user', 'user']) {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) continue;
      const parsed: unknown = JSON.parse(stored);
      if (isRecord(parsed)) return normalizeUser(parsed);
    } catch (error) {
      console.warn(`Could not read ${key} from localStorage.`, error);
    }
  }

  return null;
}

function normalizeTenantRole(role: unknown, fallback: TenantRole): TenantRole {
  switch (role) {
    case 'tenant_admin':
    case 'academic_leader':
    case 'faculty':
    case 'consultant':
    case 'student':
    case 'staff':
      return role;
    case 'leadership':
    case 'administrator':
    case 'high_admin':
      return 'tenant_admin';
    case 'program_director':
      return 'academic_leader';
    default:
      return fallback;
  }
}

function normalizeMembership(
  stored: StoredUser,
  fallbackRole: TenantRole,
  fallbackTenantId: string,
): MembershipInfo {
  const tenantId =
    typeof stored.tenantId === 'string' && stored.tenantId ? stored.tenantId : fallbackTenantId;
  const role = normalizeTenantRole(stored.role, fallbackRole);
  const storedCapabilities = Array.isArray(stored.capabilities)
    ? stored.capabilities.filter((capability): capability is string => typeof capability === 'string')
    : undefined;

  return {
    id:
      (typeof stored.membershipId === 'string' && stored.membershipId) ||
      (typeof stored.id === 'string' && stored.id) ||
      `${tenantId}:${role}`,
    tenantId,
    institutionName:
      typeof stored.institutionName === 'string' ? stored.institutionName : 'Ruritania State University',
    institutionShortName:
      typeof stored.institutionShortName === 'string' ? stored.institutionShortName : 'RSU',
    role,
    title: typeof stored.title === 'string' && stored.title ? stored.title : 'Executive',
    governingBodyAffiliation:
      typeof stored.governingBodyAffiliation === 'string' ? stored.governingBodyAffiliation : '',
    capabilities: resolveCapabilities(role, storedCapabilities),
  };
}

function normalizeUser(stored: StoredUser): AuthenticatedUser {
  const storedRole = typeof stored.role === 'string' ? stored.role : '';
  const defaultRole = normalizeTenantRole(storedRole, 'tenant_admin');
  const tenantId = typeof stored.tenantId === 'string' && stored.tenantId ? stored.tenantId : 'inst-1';
  const name =
    (typeof stored.name === 'string' && stored.name) ||
    (typeof stored.displayName === 'string' && stored.displayName) ||
    'User';
  const savedMemberships = Array.isArray(stored.memberships)
    ? stored.memberships.filter(isRecord)
    : [];
  const memberships = savedMemberships.length > 0
    ? savedMemberships.map((membership) => normalizeMembership(membership, defaultRole, tenantId))
    : ['inst-1', 'inst-2', 'inst-3'].map((id) => normalizeMembership(stored, defaultRole, id));
  const membership = memberships.find((item) => item.tenantId === tenantId) || memberships[0];

  return {
    uid:
      (typeof stored.uid === 'string' && stored.uid) ||
      (typeof stored.id === 'string' && stored.id) ||
      'demo-uid',
    email: typeof stored.email === 'string' ? stored.email : 'user@rsu.edu',
    displayName: name,
    ...(typeof stored.avatarUrl === 'string' ? { avatarUrl: stored.avatarUrl } : {}),
    role: toUiRole(membership.role),
    title: membership.title,
    tenantId: membership.tenantId,
    governingBodyAffiliation: membership.governingBodyAffiliation,
    capabilities: membership.capabilities,
    memberships,
    isPlatformAdmin: stored.isPlatformAdmin === true || membership.role === 'tenant_admin',
  };
}

import { db } from '../services/db';

function localFallback(path: string, method: string, init?: RequestInit): unknown {
  const pathname = path.split('?')[0].replace(/\/+$/, '') || '/';
  
  if (method === 'GET') {
    if (pathname === '/kernel') return { kernel: { version: '1.0' } };
    if (pathname === '/config') return { aiEnabled: false };
    if (pathname === '/institutions') return db.institutions;
    if (pathname.startsWith('/institutions/')) return db.institutions.find(i => i.id === pathname.split('/')[2]);
    if (pathname === '/overlay-packs') return db.overlayPacks;
    if (pathname.startsWith('/overlay-packs/')) return db.overlayPacks.find(p => p.id === pathname.split('/')[2]);

    if (pathname === '/evidence') return db.evidenceClaims;
    if (pathname === '/evidence/staging') return db.evidenceStaging;
    if (pathname === '/decisions') return db.decisions;
    if (pathname === '/decisions/scenarios') return db.scenarios;
    if (pathname === '/decisions/stakeholders') return db.stakeholderImpacts;
    if (pathname === '/predictions') return db.predictions;
    if (pathname === '/red-flags') return db.redFlags;
    if (pathname === '/inputs/pulse') return db.pulseSurveys;
    if (pathname === '/inputs/shadow-ai') return db.shadowAiReports;
    if (pathname === '/jobs') return db.jobStatuses;
    if (pathname === '/admin/invites') return [];
    if (pathname === '/admin/memberships') return [];
    if (pathname === '/admin/audit') return [];
  }
  
  if (method === 'POST') {
    if (pathname === '/demo/reset') {
      db.resetToBaseline();
      return { success: true };
    }
    if (pathname === '/decisions') {
      return db.addDecision(JSON.parse(init?.body as string));
    }
    if (pathname.startsWith('/decisions/') && pathname.endsWith('/signoff')) {
      const id = pathname.split('/')[2];
      const body = JSON.parse(init?.body as string);
      return db.addGovernanceSignoff(id, body.role, body.status || 'approved', body.notes || 'signed', body.signerName);
    }
    if (pathname.startsWith('/decisions/') && pathname.endsWith('/scenarios')) {
      const body = JSON.parse(init?.body as string);
      return db.addScenarios(body.scenarios);
    }
    if (pathname === '/ai/draft-scenarios') {
      return { scenarios: [] };
    }
    if (pathname === '/predictions') {
      return db.addPrediction(JSON.parse(init?.body as string));
    }
    if (pathname === '/inputs/pulse') {
      return db.addPulseSurvey(JSON.parse(init?.body as string));
    }
    if (pathname === '/inputs/shadow-ai') {
      return db.addShadowAiReport(JSON.parse(init?.body as string));
    }
    if (pathname === '/jobs/run') {
      const body = JSON.parse(init?.body as string);
      return db.runJob(body.jobId);
    }
    if (pathname === '/evidence') {
      const claim = JSON.parse(init?.body as string);
      return db.addClaim(claim);
    }
    if (pathname.startsWith('/evidence/staging/') && pathname.endsWith('/approve')) {
      const parts = pathname.split('/');
      return db.approveStagingEvidence(parts[3], 'AdminUser');
    }
    if (pathname.startsWith('/evidence/staging/') && pathname.endsWith('/reject')) {
      const parts = pathname.split('/');
      const body = JSON.parse(init?.body as string);
      db.rejectStagingEvidence(parts[3], body.reason || 'Rejected', 'AdminUser');
      return { success: true };
    }
  }

  if (method === 'PATCH') {
    if (pathname.startsWith('/institutions/')) {
      const id = pathname.split('/')[2];
      const updates = JSON.parse(init?.body as string);
      const inst = db.institutions.find(i => i.id === id);
      if (inst) {
        Object.assign(inst, updates);
        return inst;
      }
    }
    if (pathname.startsWith('/decisions/') && pathname.endsWith('/disposition')) {
      const id = pathname.split('/')[2];
      const updates = JSON.parse(init?.body as string);
      return db.updateDecisionDisposition(id, updates.disposition, updates.notes, 'AdminUser');
    }
    if (pathname.startsWith('/decisions/') && pathname.endsWith('/recommended-action')) {
      const id = pathname.split('/')[2];
      const updates = JSON.parse(init?.body as string);
      return db.updateDecisionRecommendedAction(id, updates.recommendedAction, updates.notes, 'AdminUser');
    }
    if (pathname.startsWith('/decisions/') && pathname.endsWith('/status')) {
      const id = pathname.split('/')[2];
      const updates = JSON.parse(init?.body as string);
      return db.updateDecisionStatus(id, updates.status);
    }
    if (pathname.startsWith('/predictions/') && pathname.endsWith('/resolve')) {
      const id = pathname.split('/')[2];
      const updates = JSON.parse(init?.body as string);
      return db.resolvePrediction(id, updates.resolutionStatus, updates.actualOutcome, updates.lessonsLearned);
    }
    // More could be added as needed
  }

  return { success: true, data: [], items: [] };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthenticatedUser | null>(readSavedUser);

  const loginWithGoogle = useCallback(async () => {
    const savedUser = readSavedUser();
    setUser(savedUser);
    return { success: savedUser !== null };
  }, []);

  const logout = useCallback(async () => {
    localStorage.removeItem('proteus_user');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const switchTenant = useCallback((tenantId: string) => {
    if (!user || !tenantId) return;
    const membership = user.memberships.find((item) => item.tenantId === tenantId);
    if (!membership) {
      console.warn(`Cannot switch to tenant ${tenantId}: no local membership exists.`);
      return;
    }
    const nextUser = normalizeUser({
      ...user,
      tenantId,
      role: membership.role,
      title: membership.title,
      capabilities: membership.capabilities,
      membershipId: membership.id,
    });
    setUser(nextUser);
    localStorage.setItem('proteus_user', JSON.stringify(nextUser));
  }, [user]);

  const getToken = useCallback(async () => user ? 'mock-token' : '', [user]);

  const apiFetch = useCallback(async <T,>(path: string, init?: RequestInit): Promise<T> => {
    const token = await getToken();
    const headers = new Headers(init?.headers);
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    if (init?.method && init.method !== 'GET' && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    
    const response = await fetch(path, { ...init, headers });
    const body = await response.text();
    const contentType = response.headers.get('content-type') || '';
    if (/text\/html/i.test(contentType) || /^\s*<!doctype\s+html/i.test(body)) {
      console.warn(`API request ${init?.method || 'GET'} ${path} returned HTML; using a local development fallback.`);
      return localFallback(path, (init?.method || 'GET').toUpperCase(), init) as T;
    }
    
    const parsed = JSON.parse(body);
    return (parsed && parsed.data !== undefined ? parsed.data : parsed) as T;
  }, [getToken]);

  const hasCapability = useCallback(
    (capability: Capability) => user?.capabilities.includes(capability) ?? false,
    [user],
  );

  const value = useMemo<AuthContextType>(() => ({
    user,
    firebaseUser: null,
    memberships: user?.memberships ?? [],
    activeTenantId: user?.tenantId ?? null,
    token: user ? 'mock-token' : null,
    isLoggedIn: user !== null,
    isAuthenticated: user !== null,
    isLoading: false,
    error: null,
    isFirebaseConfigured: false,
    loginWithGoogle,
    logout,
    switchTenant,
    refreshMe: async () => {
      const savedUser = readSavedUser();
      setUser(savedUser);
    },
    reauthenticate: async () => {
      await logout();
    },
    getToken,
    apiFetch,
    hasCapability,
    canAcademicSignoff: hasCapability('sign_academic'),
    canAdministrativeSignoff: hasCapability('sign_administrative'),
    canManageDecisions: hasCapability('edit_decisions'),
    canReviewEvidence: hasCapability('read_evidence'),
    canTriggerJobs: hasCapability('run_jobs'),
    canResetDemo: hasCapability('reset_demo'),
    isStudent: user?.role === 'student',
  }), [apiFetch, hasCapability, loginWithGoogle, logout, switchTenant, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
