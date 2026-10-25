import React, { useEffect, useState } from 'react';
import { AlertTriangle, Copy, History, KeyRound, Mail, ShieldCheck, Trash2, UserPlus, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { MembershipInfo, TenantRole } from '../types/auth';

interface InviteRecord {
  id: string;
  email: string | null;
  code: string | null;
  role: TenantRole;
  title: string;
  governingBodyAffiliation: string;
  status: string;
  createdAt: string;
  acceptedAt: string | null;
  expiresAt: string | null;
  maxUses: number | null;
  usedCount: number;
  isEvaluator: boolean;
}

interface MemberRecord {
  uid: string;
  email: string;
  displayName: string;
  membership: MembershipInfo;
}

interface AuditRecord {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  createdAt: string;
}

const ROLE_OPTIONS: Array<{ value: TenantRole; label: string }> = [
  { value: 'tenant_admin', label: 'Institution administrator (Provost/Admin)' },
  { value: 'academic_leader', label: 'Academic governance leader (Dept Head/Faculty Senate)' },
  { value: 'faculty', label: 'Faculty' },
  { value: 'consultant', label: 'External consultant/Evaluator' },
  { value: 'student', label: 'Student/Student Senate' },
  { value: 'staff', label: 'Professional staff' },
];

export const AdminManagementView: React.FC = () => {
  const { apiFetch, hasCapability, user } = useAuth();
  const [invites, setInvites] = useState<InviteRecord[]>([]);
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [audit, setAudit] = useState<AuditRecord[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TenantRole>('faculty');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [maxUses, setMaxUses] = useState(1);
  const [isEvaluator, setIsEvaluator] = useState(true);

  const load = async () => {
    try {
      const [inviteData, memberData, auditData] = await Promise.all([
        apiFetch<InviteRecord[]>('/admin/invites'),
        apiFetch<MemberRecord[]>('/admin/memberships'),
        hasCapability('read_audit')
          ? apiFetch<AuditRecord[]>('/admin/audit?limit=50')
          : Promise.resolve([]),
      ]);
      setInvites(inviteData);
      setMembers(memberData);
      setAudit(auditData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load administration data.');
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setGeneratedCode(null);
    try {
      await apiFetch('/admin/invites', {
        method: 'POST',
        body: JSON.stringify({
          email,
          role,
          title: title || 'Institutional member',
          governingBodyAffiliation: body || 'Institution',
        }),
      });
      setEmail('');
      setTitle('');
      setBody('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the invite.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsGeneratingCode(true);
    setGeneratedCode(null);
    try {
      const result = await apiFetch<{ code: string }>('/admin/invites/codes', {
        method: 'POST',
        body: JSON.stringify({
          tenantId: user?.tenantId,
          role,
          title: title || 'Institutional member',
          governingBodyAffiliation: body || 'Institution',
          maxUses,
          isEvaluator,
        }),
      });
      setGeneratedCode(result.code);
      setTitle('');
      setBody('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate invite code.');
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const copyCode = async () => {
    if (!generatedCode) return;
    try {
      await navigator.clipboard.writeText(generatedCode);
    } catch {
      setError('Could not copy code to clipboard.');
    }
  };

  const handleRevokeInvite = async (id: string) => {
    try {
      await apiFetch(`/admin/invites/${id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not revoke the invite.');
    }
  };

  const handleRevokeMembership = async (uid: string) => {
    if (!window.confirm('Revoke this member’s access to the institution?')) return;
    try {
      await apiFetch(`/admin/memberships/${uid}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not revoke the membership.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 font-serif text-xl font-bold text-slate-900">
          <ShieldCheck className="h-5 w-5 text-indigo-600" /> Institution Administration
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Invite verified emails, review members, and inspect governance audit activity. Roles and capabilities are
          enforced by the server.
        </p>
      </div>

      {error && (
        <div className="flex gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleInvite} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="flex items-center gap-2 font-bold text-slate-900">
            <UserPlus className="h-4 w-4 text-indigo-600" /> Invite a member by email
          </h3>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-600">Verified email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@institution.edu"
              className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">Role</label>
              <select
                value={role}
                onChange={(event) => setRole(event.target.value as TenantRole)}
                className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">Title</label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Faculty Senate Chair"
                className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-600">Governing body affiliation</label>
            <input
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="e.g. University Faculty Senate"
              className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {isSaving ? 'Creating invite…' : 'Create invite'}
          </button>
          <p className="text-[11px] text-slate-500">
            The invite is claimed automatically when that account signs in with a verified email.
          </p>
        </form>

        <form onSubmit={handleGenerateCode} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="flex items-center gap-2 font-bold text-slate-900">
            <KeyRound className="h-4 w-4 text-indigo-600" /> Generate shareable access code
          </h3>
          <p className="text-xs text-slate-500">
            Create a tenant-scoped access code for evaluators from any institution. Codes are redeemed after sign-in.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">Role</label>
              <select
                value={role}
                onChange={(event) => setRole(event.target.value as TenantRole)}
                className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">Max uses</label>
              <input
                type="number"
                min={1}
                max={100}
                value={maxUses}
                onChange={(event) => setMaxUses(Number(event.target.value))}
                className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-600">Title</label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Provost / Faculty Senate Chair / Department Head"
              className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-600">Governing body affiliation</label>
            <input
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="e.g. Office of the Provost"
              className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <input type="checkbox" checked={isEvaluator} onChange={(event) => setIsEvaluator(event.target.checked)} />
            Mark as evaluator (sandbox/review access)
          </label>
          <button
            type="submit"
            disabled={isGeneratingCode}
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {isGeneratingCode ? 'Generating…' : 'Generate access code'}
          </button>
          {generatedCode && (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
              <code className="font-mono text-emerald-800">{generatedCode}</code>
              <button type="button" onClick={copyCode} className="flex items-center gap-1 text-xs font-bold text-emerald-700">
                <Copy className="h-3.5 w-3.5" /> Copy
              </button>
            </div>
          )}
        </form>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="flex items-center gap-2 font-bold text-slate-900">
            <Mail className="h-4 w-4 text-indigo-600" /> Pending invites & codes
          </h3>
          <div className="mt-3 space-y-2">
            {invites.filter((invite) => invite.status === 'pending').length === 0 && (
              <p className="text-sm text-slate-500">No pending invites or codes.</p>
            )}
            {invites
              .filter((invite) => invite.status === 'pending')
              .map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
                >
                  <div>
                    <div className="text-sm font-semibold text-slate-800">
                      {invite.email || invite.code}
                    </div>
                    <div className="text-xs text-slate-500">
                      {invite.role.replaceAll('_', ' ')} · {invite.title}
                      {invite.code ? ` · uses ${invite.usedCount}/${invite.maxUses || 1}` : ''}
                      {invite.isEvaluator ? ' · evaluator' : ''}
                    </div>
                  </div>
                  <button
                    onClick={() => void handleRevokeInvite(invite.id)}
                    className="rounded p-1.5 text-rose-600 hover:bg-rose-100"
                    title="Revoke invite"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="flex items-center gap-2 font-bold text-slate-900">
          <Users className="h-4 w-4 text-indigo-600" /> Active members
        </h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="py-2 pr-4">Member</th>
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">Title</th>
                <th className="py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.uid} className="border-b border-slate-100">
                  <td className="py-3 pr-4">
                    <div className="font-semibold text-slate-800">{member.displayName}</div>
                    <div className="text-xs text-slate-500">{member.email}</div>
                  </td>
                  <td className="py-3 pr-4 capitalize text-slate-700">{member.membership.role.replaceAll('_', ' ')}</td>
                  <td className="py-3 pr-4 text-slate-600">{member.membership.title}</td>
                  <td className="py-3">
                    {member.uid !== user?.uid && (
                      <button
                        onClick={() => void handleRevokeMembership(member.uid)}
                        className="text-xs font-semibold text-rose-600 hover:underline"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {hasCapability('read_audit') && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="flex items-center gap-2 font-bold text-slate-900">
            <History className="h-4 w-4 text-indigo-600" /> Recent audit activity
          </h3>
          <div className="mt-3 space-y-2">
            {audit.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs"
              >
                <span className="font-mono font-semibold text-slate-700">{entry.action}</span>
                <span className="text-slate-500">
                  {entry.targetType}:{entry.targetId} · {new Date(entry.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
