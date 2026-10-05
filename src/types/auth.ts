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

export const SEED_PERSONAS: PersonaProfile[] = [
  {
    id: 'persona-provost',
    name: 'Dr. Evelyn Vance',
    email: 'provost.vance@atlas.edu',
    role: 'high_admin',
    title: 'Provost & Executive Vice Chancellor',
    tenantId: 'inst-1',
    governingBodyAffiliation: 'Office of the Provost & Executive Vice Chancellor',
    description: 'High-Level Administration responsible for institutional strategy, resource allocation, and Administrative Sign-offs.',
    avatarColor: 'bg-emerald-600',
    allowedPrivileges: [
      'Issue official Administrative Sign-offs',
      'Set institutional AI policy overlays and accreditation packs',
      'Authorize final implementation transitions (subject to Senate concurrence)',
      'View campus-wide risk indices and cross-departmental operations'
    ],
    restrictedPrivileges: [
      'CANNOT unilaterally override Academic Senate veto on grading/curriculum',
      'CANNOT issue Academic Sign-offs (reserved for Faculty Senate/Council)'
    ]
  },
  {
    id: 'persona-senate-chair',
    name: 'Prof. Marcus Thorne',
    email: 'senate.chair@atlas.edu',
    role: 'program_director',
    title: 'Faculty Senate Chair & CS Curriculum Director',
    tenantId: 'inst-1',
    governingBodyAffiliation: 'University Faculty Senate',
    description: 'Program Director and Academic Governance Chair representing faculty oversight, pedagogical integrity, and grading autonomy.',
    avatarColor: 'bg-indigo-600',
    allowedPrivileges: [
      'Issue official Academic Sign-offs on behalf of Faculty Senate',
      'Draft course and program-level AI scenarios',
      'Review and approve evidence claims in the Evidence Ledger',
      'Exercise faculty veto over automated grading and student classification'
    ],
    restrictedPrivileges: [
      'CANNOT issue Administrative or Financial Sign-offs',
      'CANNOT unilaterally implement institutional policy without Provost concurrence',
      'CANNOT modify legal accreditation frameworks'
    ]
  },
  {
    id: 'persona-student-pres',
    name: 'Maya Lin',
    email: 'maya.lin@student.org',
    role: 'student',
    title: 'Student Body President & Senate Liaison',
    tenantId: 'inst-1',
    governingBodyAffiliation: 'Associated Students Governance Council',
    description: 'Student leader and stakeholder representative advocating for transparency, equity, algorithmic fairness, and human rights.',
    avatarColor: 'bg-amber-600',
    allowedPrivileges: [
      'Inspect board-approved, implemented AI decisions and transparency dossiers',
      'Submit lived-experience pulse surveys and classroom feedback',
      'Report unapproved Shadow AI tools directly to governance committees',
      'View human-in-the-loop protection guarantees and appeals processes'
    ],
    restrictedPrivileges: [
      'STRICTLY FORBIDDEN from mutating decisions, sign-offs, or gate statuses',
      'BLOCKED from viewing confidential internal faculty deliberations and draft proposals',
      'CANNOT view sensitive vendor contract negotiation margins'
    ]
  }
];
