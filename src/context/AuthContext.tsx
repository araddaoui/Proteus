import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { onIdTokenChanged, type User as FirebaseUser } from 'firebase/auth';
import type {
  AuthenticatedUser,
  Capability,
  MeResponse,
  MembershipInfo,
  TenantRole,
} from '../types/auth';
import { toUiRole } from '../types/auth';
import {
  auth,
  isFirebaseConfigured,
  logOutFromFirebase,
  reauthenticateWithGoogle,
  signInWithGoogle,
} from '../services/firebase';
import { ApiError, parseApiResponse } from '../services/api';

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) || '/api/v1';
const ACTIVE_TENANT_KEY = 'proteus_active_tenant';

interface AuthContextType {
  user: AuthenticatedUser | null;
  firebaseUser: FirebaseUser | null;
  memberships: MembershipInfo[];
  activeTenantId: string | null;
  token: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  error: string | null;
  isFirebaseConfigured: boolean;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string; membershipCount?: number }>;
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function chooseTenant(memberships: MembershipInfo[], current: string | null): string | null {
  const saved = localStorage.getItem(ACTIVE_TENANT_KEY);
  const candidates = [current, saved].filter(Boolean) as string[];
  for (const candidate of candidates) {
    if (memberships.some((membership) => membership.tenantId === candidate)) return candidate;
  }
  return memberships[0]?.tenantId || null;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [memberships, setMemberships] = useState<MembershipInfo[]>([]);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [activeTenantId, setActiveTenantId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMe = useCallback(async (fbUser: FirebaseUser): Promise<MeResponse> => {
    const idToken = await fbUser.getIdToken();
    const response = await fetch(`${API_BASE}/me`, {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    return parseApiResponse<MeResponse>(response);
  }, []);

  const loadMe = useCallback(
    async (fbUser: FirebaseUser) => {
      const me = await fetchMe(fbUser);
      setMemberships(me.memberships);
      setIsPlatformAdmin(me.isPlatformAdmin);
      setActiveTenantId((current) => {
        const next = chooseTenant(me.memberships, current);
        if (next) localStorage.setItem(ACTIVE_TENANT_KEY, next);
        return next;
      });
      setError(null);
      return me;
    },
    [fetchMe],
  );

  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      setError('Firebase authentication is not configured.');
      return;
    }
    const unsubscribe = onIdTokenChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (!fbUser) {
        setMemberships([]);
        setIsPlatformAdmin(false);
        setActiveTenantId(null);
        setToken(null);
        setIsLoading(false);
        return;
      }
      try {
        setToken(await fbUser.getIdToken());
        await loadMe(fbUser);
      } catch (err) {
        setMemberships([]);
        setIsPlatformAdmin(false);
        setActiveTenantId(null);
        setError(err instanceof Error ? err.message : 'Could not load your account.');
      } finally {
        setIsLoading(false);
      }
    });
    return unsubscribe;
  }, [loadMe]);

  const getToken = useCallback(
    async (forceRefresh = false) => {
      if (!firebaseUser) throw new ApiError(401, 'UNAUTHENTICATED', 'Sign in to continue.');
      const idToken = await firebaseUser.getIdToken(forceRefresh);
      setToken(idToken);
      return idToken;
    },
    [firebaseUser],
  );

  const refreshMe = useCallback(async () => {
    if (!firebaseUser) return;
    await loadMe(firebaseUser);
  }, [firebaseUser, loadMe]);

  const apiFetch = useCallback(
    async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
      const idToken = await getToken();
      const headers = new Headers(init.headers);
      headers.set('Authorization', `Bearer ${idToken}`);
      if (activeTenantId) headers.set('X-Tenant-Id', activeTenantId);
      if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      const response = await fetch(`${API_BASE}${path}`, { ...init, headers });
      return parseApiResponse<T>(response);
    },
    [activeTenantId, getToken],
  );

  const loginWithGoogle = useCallback(async () => {
    setError(null);
    const { user: fbUser, error: loginError } = await signInWithGoogle();
    if (loginError || !fbUser) {
      const message = loginError || 'Google sign-in failed.';
      setError(message);
      return { success: false, error: message };
    }
    try {
      setFirebaseUser(fbUser);
      setToken(await fbUser.getIdToken());
      const me = await loadMe(fbUser);
      return { success: true, membershipCount: me.memberships.length };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signed in, but account setup failed.';
      setError(message);
      return { success: false, error: message };
    }
  }, [loadMe]);

  const logout = useCallback(async () => {
    await logOutFromFirebase();
    localStorage.removeItem(ACTIVE_TENANT_KEY);
    setFirebaseUser(null);
    setMemberships([]);
    setActiveTenantId(null);
    setToken(null);
    setError(null);
  }, []);

  const switchTenant = useCallback(
    (tenantId: string) => {
      if (!memberships.some((membership) => membership.tenantId === tenantId)) return;
      localStorage.setItem(ACTIVE_TENANT_KEY, tenantId);
      setActiveTenantId(tenantId);
    },
    [memberships],
  );

  const reauthenticate = useCallback(async () => {
    const idToken = await reauthenticateWithGoogle();
    setToken(idToken);
    if (firebaseUser) await loadMe(firebaseUser);
  }, [firebaseUser, loadMe]);

  const activeMembership = useMemo(
    () => memberships.find((membership) => membership.tenantId === activeTenantId) || null,
    [memberships, activeTenantId],
  );

  const user = useMemo<AuthenticatedUser | null>(() => {
    if (!firebaseUser?.email || !activeMembership) return null;
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
      avatarUrl: firebaseUser.photoURL || undefined,
      role: toUiRole(activeMembership.role as TenantRole),
      title: activeMembership.title,
      tenantId: activeMembership.tenantId,
      governingBodyAffiliation: activeMembership.governingBodyAffiliation,
      capabilities: activeMembership.capabilities,
      memberships,
      isPlatformAdmin,
    };
  }, [firebaseUser, activeMembership, memberships, isPlatformAdmin]);

  const hasCapability = useCallback(
    (capability: Capability) => !!activeMembership?.capabilities.includes(capability),
    [activeMembership],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        memberships,
        activeTenantId,
        token,
        isLoggedIn: !!firebaseUser,
        isLoading,
        error,
        isFirebaseConfigured,
        loginWithGoogle,
        logout,
        switchTenant,
        refreshMe,
        reauthenticate,
        getToken,
        apiFetch,
        hasCapability,
        canAcademicSignoff: hasCapability('sign_academic'),
        canAdministrativeSignoff: hasCapability('sign_administrative'),
        canManageDecisions: hasCapability('edit_decisions'),
        canReviewEvidence: hasCapability('approve_staging'),
        canTriggerJobs: hasCapability('run_jobs'),
        canResetDemo: hasCapability('reset_demo'),
        isStudent: activeMembership?.role === 'student',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
