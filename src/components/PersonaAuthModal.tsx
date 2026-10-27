import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SEED_PERSONAS } from '../types/auth';

interface PersonaAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPersonaId?: string;
  onIdentityConfirmed?: () => void;
}

export const PersonaAuthModal: React.FC<PersonaAuthModalProps> = ({
  isOpen,
  onClose,
  targetPersonaId,
  onIdentityConfirmed
}) => {
  const { loginWithGoogle, logout, isLoggedIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePersonaLogin = async (persona: typeof SEED_PERSONAS[0]) => {
    setIsLoading(true);
    setError(null);

    const userPayload = {
      id: persona.id || persona.email,
      email: persona.email,
      name: persona.name,
      role: persona.role,
      title: persona.title,
      tenantId: persona.tenantId || 'inst-1',
      authenticated: true
    };

    try {
      const serializedUser = JSON.stringify(userPayload);
      localStorage.setItem('proteus_user', serializedUser);
      localStorage.setItem('user', serializedUser);
      const result = await loginWithGoogle();
      if (!result.success) throw new Error('Could not restore the selected local persona.');
      onIdentityConfirmed?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const defaultPersona = SEED_PERSONAS.find((p) => p.id === targetPersonaId) || SEED_PERSONAS[0];
      await handlePersonaLogin(defaultPersona);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-200"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-white">Verified Institutional Access</h3>
            <p className="text-xs text-slate-400">Sign in to Proteus Demo Workspace</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mb-4">
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-900 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2 shadow-sm"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.19v3.15C3.17 21.36 7.22 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.19C.43 8.1 0 9.99 0 12s.43 3.9 1.19 5.42l4.09-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.22 0 3.17 2.64 1.19 6.58l4.09 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink mx-4 text-slate-500 text-[10px] uppercase tracking-wider">or select persona</span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        <div className="space-y-3 my-2">
          <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
            {SEED_PERSONAS.map((persona) => (
              <button
                key={persona.id || persona.email}
                onClick={() => void handlePersonaLogin(persona)}
                className="w-full text-left p-3 rounded-lg border border-slate-800 bg-slate-800/50 hover:bg-slate-800 hover:border-emerald-500/50 transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="font-medium text-sm text-slate-200 group-hover:text-emerald-400">
                    {persona.name}
                  </div>
                  <div className="text-xs text-slate-400">{persona.title}</div>
                </div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                  {persona.role}
                </span>
              </button>
            ))}
          </div>
        </div>

        {isLoggedIn && (
          <div className="mt-4 pt-4 border-t border-slate-800">
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="w-full py-2 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-sm font-medium transition-colors border border-rose-500/20"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
};