import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthenticatedUser, PersonaProfile, SEED_PERSONAS, StakeholderRole } from '../types/auth';
import { signInWithGoogle, logOutFromFirebase, auth } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface AuthContextType {
  user: AuthenticatedUser;
  token: string | null;
  personas: PersonaProfile[];
  activePersona: PersonaProfile | null;
  isLoggedIn: boolean;
  switchPersona: (personaId: string) => Promise<void>;
  loginCustom: (email: string, role: StakeholderRole, displayName: string, title?: string, institutionName?: string) => Promise<void>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  getAuthHeaders: () => Record<string, string>;
  // Role & privilege capability flags
  canAcademicSignoff: boolean;
  canAdministrativeSignoff: boolean;
  canManageDecisions: boolean;
  canReviewEvidence: boolean;
  canTriggerJobs: boolean;
  isStudent: boolean;
}

// Default initial state: Dr. Evelyn Vance (High-Level Administration)
const DEFAULT_PERSONA = SEED_PERSONAS[0];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('proteus_is_logged_in') === 'true';
  });

  const [user, setUser] = useState<AuthenticatedUser>(() => {
    const saved = localStorage.getItem('proteus_auth_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return {
      uid: DEFAULT_PERSONA.id,
      email: DEFAULT_PERSONA.email,
      displayName: DEFAULT_PERSONA.name,
      role: DEFAULT_PERSONA.role,
      title: DEFAULT_PERSONA.title,
      tenantId: DEFAULT_PERSONA.tenantId,
      governingBodyAffiliation: DEFAULT_PERSONA.governingBodyAffiliation,
      isPersona: true,
      token: btoa(JSON.stringify({
        uid: DEFAULT_PERSONA.id,
        email: DEFAULT_PERSONA.email,
        displayName: DEFAULT_PERSONA.name,
        role: DEFAULT_PERSONA.role,
        title: DEFAULT_PERSONA.title,
        tenantId: DEFAULT_PERSONA.tenantId,
        governingBodyAffiliation: DEFAULT_PERSONA.governingBodyAffiliation
      }))
    };
  });

  const [token, setToken] = useState<string | null>(() => {
    return user.token || localStorage.getItem('proteus_auth_token') || null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('proteus_auth_user', JSON.stringify(user));
      if (user.token) {
        localStorage.setItem('proteus_auth_token', user.token);
        setToken(user.token);
      }
    }
  }, [user]);

  // Sync Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser && fbUser.email) {
        setIsLoggedIn(true);
        localStorage.setItem('proteus_is_logged_in', 'true');
        setUser((prev) => ({
          uid: fbUser.uid,
          email: fbUser.email || prev.email,
          displayName: fbUser.displayName || prev.displayName,
          role: prev.role || 'high_admin',
          title: prev.title || 'Institutional Leader',
          tenantId: prev.tenantId || 'inst-1',
          governingBodyAffiliation: prev.governingBodyAffiliation || 'Office of the Provost',
          avatarUrl: fbUser.photoURL || undefined,
          isPersona: false,
          token: btoa(JSON.stringify({
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName,
            role: prev.role || 'high_admin',
            tenantId: prev.tenantId || 'inst-1'
          }))
        }));
      }
    });
    return () => unsubscribe();
  }, []);

  const activePersona = SEED_PERSONAS.find(p => p.email === user.email) || null;

  const switchPersona = async (personaId: string) => {
    setIsLoggedIn(true);
    localStorage.setItem('proteus_is_logged_in', 'true');
    try {
      const res = await fetch('/api/auth/switch-persona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personaId })
      });
      if (res.ok) {
        const data = await res.json();
        const authedUser: AuthenticatedUser = {
          ...data.user,
          token: data.token
        };
        setUser(authedUser);
        setToken(data.token);
        return;
      }
    } catch {
      // Offline fallback
    }

    // Direct offline switch if network issue
    const p = SEED_PERSONAS.find(item => item.id === personaId) || DEFAULT_PERSONA;
    const directUser: AuthenticatedUser = {
      uid: p.id,
      email: p.email,
      displayName: p.name,
      role: p.role,
      title: p.title,
      tenantId: p.tenantId,
      governingBodyAffiliation: p.governingBodyAffiliation,
      isPersona: true,
      token: btoa(JSON.stringify({
        uid: p.id,
        email: p.email,
        displayName: p.name,
        role: p.role,
        title: p.title,
        tenantId: p.tenantId,
        governingBodyAffiliation: p.governingBodyAffiliation
      }))
    };
    setUser(directUser);
    setToken(directUser.token!);
  };

  const loginCustom = async (
    email: string,
    role: StakeholderRole,
    displayName: string,
    title?: string,
    institutionName?: string
  ) => {
    setIsLoggedIn(true);
    localStorage.setItem('proteus_is_logged_in', 'true');
    try {
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          role,
          displayName,
          title,
          tenantId: 'inst-1',
          governingBodyAffiliation: institutionName || 'Institutional Community'
        })
      });
      if (res.ok) {
        const data = await res.json();
        const customUser: AuthenticatedUser = {
          ...data.user,
          token: data.token
        };
        setUser(customUser);
        setToken(data.token);
        return;
      }
    } catch {
      // offline fallback
    }

    const fallbackUser: AuthenticatedUser = {
      uid: `user-${Date.now()}`,
      email: email.trim().toLowerCase(),
      displayName: displayName.trim() || email.split('@')[0],
      role,
      title: title || (role === 'high_admin' ? 'Institutional Administrator' : role === 'program_director' ? 'Academic Director' : 'Student'),
      tenantId: 'inst-1',
      governingBodyAffiliation: institutionName || (role === 'high_admin' ? 'Central Administration' : role === 'program_director' ? 'Faculty Senate' : 'Student Body'),
      isPersona: false,
      token: btoa(JSON.stringify({
        uid: `user-${Date.now()}`,
        email: email.trim().toLowerCase(),
        displayName: displayName.trim(),
        role,
        title,
        tenantId: 'inst-1'
      }))
    };
    setUser(fallbackUser);
    setToken(fallbackUser.token!);
  };

  const loginWithGoogle = async () => {
    const { user: fbUser, error } = await signInWithGoogle();
    if (error || !fbUser) {
      return { success: false, error: error || 'Failed to authenticate with Google' };
    }
    setIsLoggedIn(true);
    localStorage.setItem('proteus_is_logged_in', 'true');
    const authed: AuthenticatedUser = {
      uid: fbUser.uid,
      email: fbUser.email || 'user@institution.edu',
      displayName: fbUser.displayName || 'Institutional Leader',
      role: 'high_admin',
      title: 'Institutional Leader',
      tenantId: 'inst-1',
      governingBodyAffiliation: 'University Administration',
      avatarUrl: fbUser.photoURL || undefined,
      isPersona: false,
      token: btoa(JSON.stringify({
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName,
        role: 'high_admin',
        tenantId: 'inst-1'
      }))
    };
    setUser(authed);
    setToken(authed.token!);
    return { success: true };
  };

  const logout = () => {
    logOutFromFirebase();
    setIsLoggedIn(false);
    localStorage.removeItem('proteus_is_logged_in');
    localStorage.removeItem('proteus_auth_token');
    localStorage.removeItem('proteus_auth_user');
    switchPersona('persona-provost');
  };

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (user) {
      headers['x-proteus-user'] = btoa(JSON.stringify(user));
    }
    return headers;
  };

  const canAcademicSignoff = user.role === 'program_director';
  const canAdministrativeSignoff = user.role === 'high_admin';
  const canManageDecisions = user.role === 'high_admin' || user.role === 'program_director';
  const canReviewEvidence = user.role === 'high_admin' || user.role === 'program_director';
  const canTriggerJobs = user.role === 'high_admin';
  const isStudent = user.role === 'student';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        personas: SEED_PERSONAS,
        activePersona,
        isLoggedIn,
        switchPersona,
        loginCustom,
        loginWithGoogle,
        logout,
        getAuthHeaders,
        canAcademicSignoff,
        canAdministrativeSignoff,
        canManageDecisions,
        canReviewEvidence,
        canTriggerJobs,
        isStudent
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
