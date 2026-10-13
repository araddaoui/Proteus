import { UserRole } from './index';

export type StakeholderRole = 'high_admin' | 'program_director' | 'student' | 'consultant';

export interface AuthenticatedUser {
  uid: string;
  email: string;
  displayName: string;
  role: StakeholderRole;
  title: string;
  tenantId: string;
  governingBodyAffiliation: string;
  avatarUrl?: string;
  isPersona?: boolean;
  token?: string;
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
