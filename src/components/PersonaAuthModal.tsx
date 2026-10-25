import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, KeyRound, Lock, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface PersonaAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIdentityConfirmed?: () => void;
}

export const PersonaAuthModal: React.FC<PersonaAuthModalProps> = ({
  isOpen,
  onClose,
  onIdentityConfirmed,
}) => {
  const {
    loginWithGoogle,
    logout,
    user,
    memberships,
    error,
    isFirebaseConfigured,
    isLoggedIn,
    isLoading,
    apiFetch,
  } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setFeedback(null);
      setLocalError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setLocalError(null);
    try {
      const result = await loginWithGoogle();
      if (!result.success) {
        setLocalError(result.error || 'Sign-in failed.');
        return;
      }
      if (!result.membershipCount) {
        setFeedback('Signed in. Waiting for an institutional invite to be claimed.');
        return;
      }
      onIdentityConfirmed?.();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setFeedback(null);
    setInviteCode('');
  };

  const handleRedeemCode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!inviteCode.trim()) return;
    setIsRedeeming(true);
    setLocalError(null);
    setFeedback(null);
    try {
      await apiFetch('/invites/redeem', {
        method: 'POST',
        body: JSON.stringify({ code: inviteCode.trim() }),
      });
      setFeedback('Access code redeemed. Loading your memberships...');
      setInviteCode('');
      window.location.reload();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Could not redeem access code.');
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 p-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-widest">
              <ShieldCheck className="h-4 w-4" /> Verified institutional access
            </div>
            <h2 className="mt-2 text-xl font-bold font-serif text-white">Sign in to Proteus</h2>
            <p className="mt-1 text-sm text-slate-400">
              Use your Google Workspace or verified Google account. Access is limited to invited institution members.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Close sign-in"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          {!isFirebaseConfigured && (
            <div className="flex gap-3 rounded-lg border border-amber-700/60 bg-amber-950/40 p-3 text-sm text-amber-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              Firebase client configuration is missing. Set the VITE_FIREBASE_* variables before signing in.
            </div>
          )}

          {isLoggedIn && user && (
            <div className="rounded-lg border border-emerald-800/60 bg-emerald-950/30 p-3 text-sm">
              <div className="flex items-center gap-2 font-semibold text-emerald-300">
                <CheckCircle2 className="h-4 w-4" /> Signed in as {user.email}
              </div>
              <p className="mt-1 text-slate-400">
                Active membership: {user.title} at {user.memberships.find((m) => m.tenantId === user.tenantId)?.institutionName}
              </p>
            </div>
          )}

          {isLoggedIn && !memberships.length && (
            <div className="space-y-3 rounded-lg border border-amber-800/60 bg-amber-950/30 p-3 text-sm text-amber-200">
              <div>
                No active institutional membership was found for this account. Redeem an access code below, or ask an
                institution administrator to invite your verified email.
              </div>
              <form onSubmit={handleRedeemCode} className="flex gap-2">
                <input
                  value={inviteCode}
                  onChange={(event) => setInviteCode(event.target.value)}
                  placeholder="Enter access code"
                  className="flex-1 rounded-lg border border-amber-700/60 bg-slate-950/60 px-3 py-2 text-sm text-amber-100 placeholder:text-amber-400/60 focus:border-amber-400 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isRedeeming || !inviteCode.trim()}
                  className="flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-60"
                >
                  <KeyRound className="h-4 w-4" /> {isRedeeming ? 'Redeeming…' : 'Redeem'}
                </button>
              </form>
            </div>
          )}

          {(localError || error) && (
            <div className="flex gap-3 rounded-lg border border-rose-800/60 bg-rose-950/30 p-3 text-sm text-rose-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {localError || error}
            </div>
          )}

          {feedback && (
            <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-3 text-sm text-slate-300">
              {feedback}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isSubmitting || isLoading || !isFirebaseConfigured}
            className="flex w-full items-center justify-center gap-3 rounded-lg bg-white px-4 py-3 font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-xs font-bold">
              G
            </span>
            {isSubmitting ? 'Signing in…' : 'Continue with Google'}
          </button>

          {isLoggedIn && (
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800"
            >
              Use a different account
            </button>
          )}

          <div className="flex items-start gap-2 text-xs text-slate-500">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Governance signoffs require a recent reauthentication. Access is scoped by tenant and role/capabilities.
          </div>
        </div>
      </div>
    </div>
  );
};
