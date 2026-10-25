import type { UserRole } from './index.js';

export type StakeholderRole = 'high_admin' | 'program_director' | 'student' | 'consultant';

export type TenantRole =
  | 'tenant_admin'
  | 'academic_leader'
  | 'faculty'
  | 'consultant'
  | 'student'
  | 'staff';

export const TENANT_ROLES: TenantRole[] = [
  'tenant_admin',
  'academic_leader',
  'faculty',
  'consultant',
  'student',
  'staff',
];

export type Capability =
  | 'read_tenant'
  | 'read_confidential'
  | 'edit_profile'
  | 'manage_members'
  | 'read_decisions'
  | 'create_decisions'
  | 'edit_decisions'
  | 'set_disposition'
  | 'sign_academic'
  | 'sign_administrative'
  | 'transition_implemented'
  | 'read_evidence'
  | 'manage_evidence'
  | 'approve_staging'
  | 'read_predictions'
  | 'manage_predictions'
  | 'submit_input'
  | 'read_all_inputs'
  | 'read_diagnostics'
  | 'edit_diagnostics'
  | 'run_jobs'
  | 'read_audit'
  | 'manage_institution'
  | 'reset_demo';

export const ROLE_CAPABILITIES: Record<TenantRole, Capability[]> = {
  tenant_admin: [
    'read_tenant',
    'read_confidential',
    'edit_profile',
    'manage_members',
    'read_decisions',
    'create_decisions',
    'edit_decisions',
    'set_disposition',
    'sign_administrative',
    'transition_implemented',
    'read_evidence',
    'manage_evidence',
    'approve_staging',
    'read_predictions',
    'manage_predictions',
    'submit_input',
    'read_all_inputs',
    'read_diagnostics',
    'edit_diagnostics',
    'run_jobs',
    'read_audit',
    'manage_institution',
    'reset_demo',
  ],
  academic_leader: [
    'read_tenant',
    'read_confidential',
    'read_decisions',
    'create_decisions',
    'edit_decisions',
    'set_disposition',
    'sign_academic',
    'read_evidence',
    'manage_evidence',
    'approve_staging',
    'read_predictions',
    'manage_predictions',
    'submit_input',
    'read_all_inputs',
    'read_diagnostics',
    'read_audit',
  ],
  faculty: [
    'read_tenant',
    'read_confidential',
    'read_decisions',
    'read_evidence',
    'manage_evidence',
    'approve_staging',
    'read_predictions',
    'manage_predictions',
    'submit_input',
    'read_all_inputs',
    'read_diagnostics',
  ],
  consultant: [
    'read_tenant',
    'read_decisions',
    'read_evidence',
    'manage_evidence',
    'approve_staging',
    'read_predictions',
    'read_diagnostics',
    'submit_input',
    'read_all_inputs',
  ],
  student: ['read_tenant', 'read_decisions', 'submit_input'],
  staff: [
    'read_tenant',
    'read_decisions',
    'read_evidence',
    'read_predictions',
    'submit_input',
    'read_all_inputs',
    'read_diagnostics',
    'run_jobs',
  ],
};

export function resolveCapabilities(role: TenantRole, overrides?: string[] | null): Capability[] {
  const base = ROLE_CAPABILITIES[role] || [];
  if (!overrides?.length) return [...base];
  return Array.from(new Set([...base, ...(overrides as Capability[])]));
}

export function toUiRole(role: TenantRole): UserRole {
  switch (role) {
    case 'tenant_admin':
    case 'staff':
      return 'leadership';
    case 'academic_leader':
    case 'faculty':
      return 'faculty';
    case 'consultant':
      return 'consultant';
    case 'student':
      return 'student';
    default:
      return 'student';
  }
}

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
}

export interface MembershipInfo {
  id: string;
  tenantId: string;
  institutionName: string;
  institutionShortName: string;
  role: TenantRole;
  title: string;
  governingBodyAffiliation: string;
  capabilities: Capability[];
}

export interface MeResponse {
  user: AuthUser;
  memberships: MembershipInfo[];
  isPlatformAdmin: boolean;
}

export interface AuthenticatedUser extends AuthUser {
  role: UserRole;
  title: string;
  tenantId: string;
  governingBodyAffiliation: string;
  capabilities: Capability[];
  memberships: MembershipInfo[];
  isPlatformAdmin: boolean;
}

export interface PersonaProfile {
  id: string;
  name: string;
  email: string;
  role: StakeholderRole;
  title: string;
  tenantId: string;
  governingBodyAffiliation: string;
  description: string;
  avatarColor: string;
  allowedPrivileges: string[];
  restrictedPrivileges: string[];
}

// Ruritania State University sandbox cast. `inst-1` is the RSU sandbox tenant —
// see src/sandbox/rsuSeed.ts. This is the single source of truth for the demo
// identities; rsuSeed derives its baseline personas from this array.
export const SEED_PERSONAS: PersonaProfile[] = [
  {
    id: 'persona-president',
    name: 'Dr. Alina Okafor',
    email: 'president.okafor@rsu.edu',
    role: 'high_admin',
    title: 'President, Ruritania State University',
    tenantId: 'inst-1',
    governingBodyAffiliation: 'Office of the Provost & Vice President for Academic Affairs',
    description:
      'Institutional executive balancing a declining state appropriation, a no-layoff pledge, program viability, and administrative sign-offs.',
    avatarColor: 'bg-emerald-600',
    allowedPrivileges: [
      'Issue official Administrative Sign-offs',
      'Set institutional AI policy overlays and accreditation packs',
      'Authorize final implementation transitions (subject to Senate concurrence)',
      'View campus-wide risk indices and cross-departmental operations',
    ],
    restrictedPrivileges: [
      'CANNOT unilaterally override Academic Senate veto on grading/curriculum',
      'CANNOT issue Academic Sign-offs (reserved for the Faculty Senate)',
    ],
  },
  {
    id: 'persona-senate-chair',
    name: 'Prof. Dario Marchetti',
    email: 'senate.chair@rsu.edu',
    role: 'program_director',
    title: 'Faculty Senate Chair, RSU',
    tenantId: 'inst-1',
    governingBodyAffiliation: 'RSU University Faculty Senate',
    description:
      'Faculty governance leader defending evaluation authority, academic freedom, and program integrity during consolidation.',
    avatarColor: 'bg-indigo-600',
    allowedPrivileges: [
      'Issue official Academic Sign-offs on behalf of the Faculty Senate',
      'Draft course and program-level AI scenarios',
      'Review and approve evidence claims in the Evidence Ledger',
      'Exercise faculty veto over automated grading and student classification',
    ],
    restrictedPrivileges: [
      'CANNOT issue Administrative or Financial Sign-offs',
      'CANNOT unilaterally implement institutional policy without presidential concurrence',
      'CANNOT modify legal accreditation frameworks',
    ],
  },
  {
    id: 'persona-student-pres',
    name: 'Samir Haddad',
    email: 'studentpres@rsu.edu',
    role: 'student',
    title: 'Student Body President, RSU',
    tenantId: 'inst-1',
    governingBodyAffiliation: 'RSU Student Government Association',
    description:
      'Student advocate focused on advising, equity, transparency, and the classroom experience amid inconsistent AI rules.',
    avatarColor: 'bg-amber-600',
    allowedPrivileges: [
      'Inspect approved, implemented AI decisions and transparency dossiers',
      'Submit lived-experience pulse surveys and classroom feedback',
      'Report unapproved Shadow AI tools directly to governance committees',
      'View human-in-the-loop protection guarantees and appeals processes',
    ],
    restrictedPrivileges: [
      'STRICTLY FORBIDDEN from mutating decisions, sign-offs, or gate statuses',
      'BLOCKED from viewing confidential internal faculty deliberations and draft proposals',
      'CANNOT view sensitive vendor contract negotiation margins',
    ],
  },
  {
    id: 'persona-consultant',
    name: 'Dr. Priya Raman',
    email: 'accreditation.consultant@rsu.edu',
    role: 'consultant',
    title: 'External Accreditation & Governance Consultant',
    tenantId: 'inst-1',
    governingBodyAffiliation: 'HLC Peer Review Corps',
    description:
      'External reviewer advising RSU on substantive-change compliance and AI governance for accreditation.',
    avatarColor: 'bg-cyan-700',
    allowedPrivileges: [
      'Review institutional profile, evidence, and governance records',
      'Submit evidence claims and run Final Test assessments',
      'Advise on overlay compliance and accreditation readiness',
    ],
    restrictedPrivileges: [
      'CANNOT issue binding sign-offs of any kind',
      'CANNOT alter institutional policy or accreditation frameworks',
    ],
  },
  {
    id: 'persona-registrar',
    name: 'Karen Whitfield',
    email: 'registrar@rsu.edu',
    role: 'high_admin',
    title: 'Registrar & Chief Information Officer',
    tenantId: 'inst-1',
    governingBodyAffiliation: 'Office of Enrollment & Information Services',
    description:
      'Data and technology lead accountable for LMS, identity, shadow-AI detection, and vendor/data-sovereignty risk.',
    avatarColor: 'bg-fuchsia-700',
    allowedPrivileges: [
      'Issue administrative attestations for data and technology controls',
      'Manage technology and procurement risk reviews',
      'Run governance jobs and inspect system-level activity',
    ],
    restrictedPrivileges: [
      'CANNOT issue Academic Sign-offs',
      'CANNOT unilaterally approve academic program changes',
    ],
  },
  {
    id: 'persona-union-rep',
    name: 'Luis Ortega',
    email: 'union.rep@rsu.edu',
    role: 'program_director',
    title: 'TA & Adjunct Union Representative',
    tenantId: 'inst-1',
    governingBodyAffiliation: 'RSU United Employees Union',
    description:
      'Contingent-labor representative protecting workload, pay, and displacement interests as AI reshapes instruction.',
    avatarColor: 'bg-rose-700',
    allowedPrivileges: [
      'Participate in shared governance on workload and staffing',
      'Submit pulse surveys and shadow-AI reports for contingent staff',
      'Review decisions affecting teaching-assistant and adjunct work',
    ],
    restrictedPrivileges: [
      'CANNOT issue Academic or Administrative Sign-offs',
      'CANNOT approve or implement institutional decisions',
    ],
  },
];
