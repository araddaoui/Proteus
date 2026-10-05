import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { StakeholderRole } from '../types/auth';
import { ShieldCheck, UserCheck, AlertOctagon, CheckCircle2, Lock, Globe, Sparkles, X } from 'lucide-react';

interface PersonaAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Fired only when the user actually completes a persona switch or custom
  // demo login — distinct from onClose, which also fires on a plain dismiss
  // (the X button). This lets the parent tell "picked an identity" apart
  // from "closed without choosing," so closing the modal can never silently
  // drop someone into the workspace with a stale/default identity.
  onIdentityConfirmed?: () => void;
}

export const PersonaAuthModal: React.FC<PersonaAuthModalProps> = ({ isOpen, onClose, onIdentityConfirmed }) => {
  const { user, personas, activePersona, switchPersona, loginCustom } = useAuth();
  const [activeTab, setActiveTab] = useState<'personas' | 'custom'>('personas');

  // Custom login state
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customRole, setCustomRole] = useState<StakeholderRole>('program_director');
  const [customInstitution, setCustomInstitution] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectPersona = async (personaId: string) => {
    setIsSubmitting(true);
    try {
      await switchPersona(personaId);
      setFeedbackMsg(`Previewing the workspace as this persona.`);
      setTimeout(() => {
        setFeedbackMsg(null);
        onIdentityConfirmed?.();
        onClose();
      }, 500);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail || !customName) return;
    setIsSubmitting(true);
    try {
      await loginCustom(customEmail, customRole, customName, customTitle, customInstitution);
      setFeedbackMsg(`Demo session started for ${customName}.`);
      setTimeout(() => {
        setFeedbackMsg(null);
        onIdentityConfirmed?.();
        onClose();
      }, 600);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden text-slate-100 my-8">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg border border-indigo-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-serif tracking-wide">
                Preview a Role in Proteus
              </h2>
              <p className="text-xs text-slate-400">
                Switch between demo stakeholder personas, or start a custom demo session under your own name and role
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 text-xs font-semibold px-6 pt-3">
          <button
            onClick={() => setActiveTab('personas')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'personas'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Verified Test Personas (RBAC Demo)
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'custom'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            Custom Demo Identity
          </button>
        </div>

        {/* Honest status notice — this is what actually governs identity today. */}
        <div className="mx-6 mt-4 p-3 bg-amber-950/40 border border-amber-800/60 rounded-lg text-amber-200 text-[11px] flex items-start gap-2">
          <AlertOctagon className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            <strong className="font-semibold">Preview mode:</strong> this selector demonstrates Proteus's role-based views. It is not a secured production login — anyone can pick any role here. Institutional single sign-on is on the roadmap.
          </span>
        </div>

        {feedbackMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-950/60 border border-emerald-700/50 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {feedbackMsg}
          </div>
        )}

        <div className="p-6">
          {activeTab === 'personas' ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Try the three core governance perspectives. Selecting a persona switches the active demo identity for this session so you can see what each role sees.
              </p>

              <div className="grid gap-3">
                {personas.map((persona) => {
                  const isCurrent = user.email === persona.email;
                  return (
                    <div
                      key={persona.id}
                      onClick={() => !isSubmitting && handleSelectPersona(persona.id)}
                      className={`p-4 rounded-lg border transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500/50 shadow-md'
                          : 'bg-slate-800/60 border-slate-700 hover:border-slate-500 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-10 h-10 rounded-full ${persona.avatarColor} text-white font-bold flex items-center justify-center text-sm shadow-md shrink-0`}
                          >
                            {persona.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-sm text-white">{persona.name}</h3>
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                                  persona.role === 'high_admin'
                                    ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/60'
                                    : persona.role === 'program_director'
                                    ? 'bg-indigo-900/60 text-indigo-300 border border-indigo-700/60'
                                    : 'bg-amber-900/60 text-amber-300 border border-amber-700/60'
                                }`}
                              >
                                {persona.role === 'high_admin'
                                  ? 'High-Level Administration'
                                  : persona.role === 'program_director'
                                  ? 'Program Director / Academic'
                                  : 'Student Representative'}
                              </span>
                              {isCurrent && (
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.2 rounded border border-emerald-500/40">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-300 font-medium">{persona.title}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{persona.governingBodyAffiliation} • {persona.email}</p>
                            <p className="text-xs text-slate-300 mt-2 bg-slate-900/70 p-2 rounded border border-slate-700/60">
                              {persona.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Explicit Privileges Breakdown */}
                      <div className="mt-3 pt-3 border-t border-slate-700/60 grid sm:grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-emerald-400 font-semibold flex items-center gap-1 mb-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Allowed Privileges:
                          </span>
                          <ul className="space-y-0.5 text-slate-300 list-disc list-inside">
                            {persona.allowedPrivileges.slice(0, 2).map((p, idx) => (
                              <li key={idx} className="truncate">{p}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <span className="text-rose-400 font-semibold flex items-center gap-1 mb-1">
                            <Lock className="w-3.5 h-3.5" /> Enforced Restrictions:
                          </span>
                          <ul className="space-y-0.5 text-slate-400 list-disc list-inside">
                            {persona.restrictedPrivileges.slice(0, 2).map((p, idx) => (
                              <li key={idx} className="truncate">{p}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <form onSubmit={handleCustomSubmit} className="space-y-4">
              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
                <Globe className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-200">Any Name, Any Domain — For This Preview</p>
                  <p className="text-slate-400 mt-0.5">
                    Proteus is built to work with any institution's email domain, not just .edu addresses. Right now this form starts a demo session scoped to whatever role you pick below — it does not verify that the email or institution is real.
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Email Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="e.g. director.adams@university.org.za"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Dr. Kwame Mensah"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Governance Role <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value as StakeholderRole)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="high_admin">High-Level Administration (Provost / Vice-Chancellor)</option>
                    <option value="program_director">Program Director / Academic Governance / Faculty Senate</option>
                    <option value="student">Student Body Representative / Learner</option>
                    <option value="consultant">Accreditation / External Governance Consultant</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Official Title
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="e.g. Dean of Informatics"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Institution or Governing Body
                </label>
                <input
                  type="text"
                  value={customInstitution}
                  onChange={(e) => setCustomInstitution(e.target.value)}
                  placeholder="e.g. Global Polytechnic Consortium"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !customEmail || !customName}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg shadow-md transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Start Demo Session
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1 text-slate-400">
            <Lock className="w-3 h-3 text-indigo-400" /> Demo session active — not a secured login
          </span>
          <button
            onClick={onClose}
            className="text-indigo-400 hover:text-indigo-300 font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
