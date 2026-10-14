import {
  Institution,
  OverlayPack,
  EvidenceClaim,
  EvidenceStagingItem,
  DecisionRecord,
  ScenarioEntry,
  StakeholderImpact,
  PredictionRecord,
  RedFlagCase,
  PulseSurveyResponse,
  ShadowAiReport,
  InstitutionalDiagnosticItem,
} from '../types/index.js';
import { PersonaProfile, SEED_PERSONAS } from '../types/auth.js';

// ---------------------------------------------------------------------------
// Ruritania State University (RSU) sandbox baseline.
//
// A land-grant regional public navigating: declining enrollment, a shrinking
// state appropriation, a pre-AI teaching culture, more teaching assistants than
// ever (and no new tenure lines), programs under consideration for termination,
// a no-layoff pledge, and a poor — but improvable — student experience. The
// dataset intentionally includes bright spots as well as the hard problems.
//
// RSU occupies tenant `inst-1` so every existing create-form (which hardcodes
// tenantId 'inst-1') writes to the right place. Other demo tenants are left
// untouched by the reset. This module is the single source of truth for the
// baseline; `db.resetToBaseline()` restores from it.
// ---------------------------------------------------------------------------

const RSU_SENATE = 'RSU University Faculty Senate';
const RSU_PROVOST = 'Office of the Provost & Vice President for Academic Affairs';

export const RSU_INSTITUTION: Institution = {
  id: 'inst-1',
  name: 'Ruritania State University',
  shortName: 'RSU',
  missionStatement:
    "A public land-grant university dedicated to access, practical learning, and the prosperity of Ruritania's communities through teaching, research, and public service.",
  governanceType: 'public',
  academicGovernanceType: 'faculty_senate',
  academicGovernanceBodyName: RSU_SENATE,
  provostOfficeName: RSU_PROVOST,
  accreditors: [
    'HLC - Higher Learning Commission',
    'AACSB International (College of Business)',
    'ABET (College of Engineering)',
    'CAEP (College of Education)',
  ],
  legalJurisdiction:
    'United States - State of Ruritania (FERPA; State Higher Education Code; State Open Records Act)',
  budgetTier: 'Medium ($50M-$250M)',
  enrollmentSize: 11200,
  studentDemographics: {
    undergraduatePercent: 82,
    graduatePercent: 18,
    internationalPercent: 6,
    firstGenPercent: 44,
    pellEligiblePercent: 47,
  },
  currentAiPolicyStatus: 'drafting',
  primaryLanguages: ['English'],
  activeOverlayPackId: 'pack-us-landgrant',
  createdAt: '2026-01-05T08:00:00Z',
  updatedAt: '2026-10-01T10:00:00Z',
};

export const RSU_OVERLAY_PACK: OverlayPack = {
  id: 'pack-us-landgrant',
  name: 'US Land-Grant / State Appropriated (HLC)',
  region: 'North America (United States - State Systems)',
  accreditationFrameworks: [
    'HLC Criteria for Accreditation',
    'State Higher Education Code (Ruritania)',
    'State Auditor Efficiency Standards',
  ],
  dataProtectionRegime: 'FERPA',
  languagesSupported: ['English'],
  regionalCaseStudyFocus:
    'State Appropriation Decline, Program Viability & Shared Governance in Regional Public Universities',
  specialComplianceGates: [
    'Collective-Bargaining Consultation Gate (TA/Adjunct Union)',
    'State Appropriations Reporting Gate',
    'Program-Termination Due-Process Gate (Shared Governance + Student Appeal)',
  ],
  description:
    'Overlay for US land-grant and state-appropriated universities navigating enrollment decline, budget reductions, and AI adoption under HLC accreditation, state oversight, and collective-bargaining obligations.',
};

export const RSU_DIAGNOSTICS: InstitutionalDiagnosticItem[] = [
  { id: 'diag-1', name: 'Mission Statements', category: 'governance_finance', isAvailable: true, notes: 'Board-approved 2024 land-grant mission statement on record.' },
  { id: 'diag-2', name: 'Strategic Plans', category: 'governance_finance', isAvailable: true, notes: 'RSU Forward 2030 plan; enrollment and completion goals currently off-track.' },
  { id: 'diag-3', name: 'Academic Catalogs', category: 'academic', isAvailable: true, notes: '2026-2027 Undergraduate & Graduate Catalogs published.' },
  { id: 'diag-4', name: 'Curricula & Learning Outcomes', category: 'academic', isAvailable: true, notes: 'Departmental syllabus repository; learning-outcome mapping incomplete in 3 colleges.' },
  { id: 'diag-5', name: 'Program Inventories', category: 'academic', isAvailable: true, notes: '128 degree programs; 8 flagged for viability review.' },
  { id: 'diag-6', name: 'Enrollment Data & Trends', category: 'students', isAvailable: true, notes: 'Headcount 11,200 (down from 14,500 five years ago); new-transfer pipeline weakening.' },
  { id: 'diag-7', name: 'Retention & Completion Data', category: 'students', isAvailable: true, notes: 'First-year retention 71%; 6-year graduation 54%.' },
  { id: 'diag-8', name: 'Faculty Profiles & Tenured Ratios', category: 'faculty', isAvailable: true, notes: 'Tenure/tenure-track fell from 62% (2015) to 41%; retirements replaced by fixed-term lecturers.' },
  { id: 'diag-9', name: 'Staffing Structures & Workloads', category: 'faculty', isAvailable: false, notes: 'Comprehensive workload study not completed; TA count rose 260 → 420 with no tenure-line hiring.' },
  { id: 'diag-10', name: 'Research Portfolios & Outputs', category: 'research', isAvailable: true, notes: 'Sponsored research ~$14M; growing ag-tech and water-resources niche.' },
  { id: 'diag-11', name: 'Research Strategies & Priorities', category: 'research', isAvailable: true, notes: 'Regional agriculture, rural health, and advanced manufacturing priorities.' },
  { id: 'diag-12', name: 'Budgets & Financial Constraints', category: 'governance_finance', isAvailable: false, notes: 'Program cost-of-instruction model is opaque; current-fund deficit $9.4M; state appropriation fell 41% → 28%.' },
  { id: 'diag-13', name: 'Facilities & Campus Footprint', category: 'governance_finance', isAvailable: true, notes: 'Aging main campus plus a regional agricultural research station.' },
  { id: 'diag-14', name: 'Infrastructure & Tech Systems', category: 'governance_finance', isAvailable: true, notes: 'Central data center; Canvas LMS; identity management integrated with state system.' },
  { id: 'diag-15', name: 'Technology Architectures & LMS', category: 'governance_finance', isAvailable: false, notes: 'LMS AI plug-in security and data-flow audit pending.' },
  { id: 'diag-16', name: 'Governance Structures & Charters', category: 'governance_finance', isAvailable: true, notes: 'University Senate constitution on record; program-discontinuance procedure exists but untested.' },
  { id: 'diag-17', name: 'Faculty Governance Documents & Senate', category: 'faculty', isAvailable: true, notes: 'Faculty Senate resolutions on academic freedom and evaluation authority.' },
  { id: 'diag-18', name: 'Student-Support Structures', category: 'students', isAvailable: true, notes: 'Student success center; mental-health services with a waitlist.' },
  { id: 'diag-19', name: 'Advising Systems & Workflows', category: 'students', isAvailable: true, notes: 'Advising ratio approximately 1:900; decentralized by college.' },
  { id: 'diag-20', name: 'Accreditation Requirements & Standards', category: 'legal_accreditation', isAvailable: true, notes: 'HLC plus programmatic accreditors (AACSB/ABET/CAEP).' },
  { id: 'diag-21', name: 'Institutional Policies & Handbooks', category: 'legal_accreditation', isAvailable: true, notes: 'Faculty handbook rev. 2025; academic-integrity policy under revision.' },
  { id: 'diag-22', name: 'AI Policies & Guidelines', category: 'legal_accreditation', isAvailable: true, notes: 'No central policy: Business mandates AI, English bans it, Engineering permits with disclosure.' },
  { id: 'diag-23', name: 'Collective Bargaining Agreements', category: 'faculty', isAvailable: false, notes: 'TA/adjunct union renegotiation open; current agreement silent on AI-assisted grading.' },
  { id: 'diag-24', name: 'Assessment & Grading Practices', category: 'academic', isAvailable: true, notes: 'Rubric library; gateway-course DFW rates under scrutiny.' },
  { id: 'diag-25', name: 'Admissions Practices & Criteria', category: 'students', isAvailable: true, notes: 'Holistic review; test-optional; no automated admissions cuts.' },
  { id: 'diag-26', name: 'Student Demographic Breakdown', category: 'students', isAvailable: true, notes: 'Pell 47%, First-Gen 44%, International 6%.' },
  { id: 'diag-27', name: 'Institutional Research Reports', category: 'research', isAvailable: true, notes: 'Annual Factbook 2026; program-vitality dashboards.' },
  { id: 'diag-28', name: 'Board of Trustees / Regents Decisions', category: 'governance_finance', isAvailable: true, notes: 'June 2026 minutes direct a no-layoff program-consolidation path.' },
  { id: 'diag-29', name: 'Prior Strategic Initiatives & Audits', category: 'governance_finance', isAvailable: true, notes: 'State efficiency audit 2025; digital transformation review 2024.' },
  { id: 'diag-30', name: 'Relevant White Papers & Taskforce Reports', category: 'academic', isAvailable: false, notes: 'Provost AI taskforce report delayed; interim findings only.' },
  { id: 'diag-31', name: 'Institutional Histories & Traditions', category: 'academic', isAvailable: true, notes: 'Centennial records (1926-2026); strong agricultural extension tradition.' },
  { id: 'diag-32', name: 'Community Relationships & Civic Compacts', category: 'governance_finance', isAvailable: false, notes: 'Regional workforce compact renewal pending with county partners.' },
];

export const RSU_CLAIMS: EvidenceClaim[] = [
  {
    id: 'claim-r1',
    tenantId: 'inst-1',
    claimText:
      'HLC 2025 guidance clarifies that institutions remain responsible for demonstrating regular and substantive interaction and for the integrity of assessment when AI tools participate in instruction or grading.',
    sourceUrl: 'https://www.hlcommission.org/',
    sourceName: 'Higher Learning Commission Guidance',
    confidenceTier: 'peer_reviewed',
    datePublished: '2025-09-01',
    dateAdded: '2026-01-10',
    retractionStatus: 'active',
    tags: ['accreditation', 'substantive_interaction', 'ai_governance'],
    discipline: 'Institutional Strategy',
    program: 'Institution-wide',
  },
  {
    id: 'claim-r2',
    tenantId: 'inst-1',
    claimText:
      'A peer-reviewed meta-analysis found that teaching-assistant-led standalone sections produce higher DFW rates than instructor-led sections unless TAs receive structured pedagogical training and grading support.',
    sourceUrl: 'https://link.springer.com/journal/11162',
    sourceName: 'Higher Education Research & Development synthesis',
    confidenceTier: 'peer_reviewed',
    datePublished: '2024-06-12',
    dateAdded: '2026-02-01',
    retractionStatus: 'active',
    tags: ['teaching_assistants', 'dfw', 'faculty_development'],
    discipline: 'Higher Education Pedagogy',
    program: 'Gateway Instruction',
  },
  {
    id: 'claim-r3',
    tenantId: 'inst-1',
    claimText:
      'RSU internal study: a peer-mentoring pilot raised first-year retention 6 percentage points in the College of Arts & Sciences and the College of Education over one year.',
    sourceUrl: 'https://ir.rsu.edu/reports/peer-mentoring-retention-2025',
    sourceName: 'RSU Office of Institutional Research',
    confidenceTier: 'peer_reviewed',
    datePublished: '2025-08-15',
    dateAdded: '2026-02-10',
    retractionStatus: 'active',
    tags: ['bright_spot', 'retention', 'peer_mentoring'],
    discipline: 'Student Success',
    program: 'First-Year Experience',
  },
  {
    id: 'claim-r4',
    tenantId: 'inst-1',
    claimText:
      'RSU College of Nursing reports a 100% first-time NCLEX pass rate for two consecutive cohorts, with applicant demand exceeding seats in allied-health programs.',
    sourceUrl: 'https://rsu.edu/news/nursing-licensure-2026',
    sourceName: 'RSU Newsroom',
    confidenceTier: 'journalistic',
    datePublished: '2026-05-20',
    dateAdded: '2026-06-01',
    retractionStatus: 'active',
    tags: ['bright_spot', 'workforce', 'nursing'],
    discipline: 'Health Sciences',
    program: 'BSN',
  },
  {
    id: 'claim-r5',
    tenantId: 'inst-1',
    claimText:
      'A synthesis of studies found AI detection tools exhibit false-positive rates exceeding 18% on non-native English writing, posing serious academic-integrity and equity risks.',
    sourceUrl: 'https://arxiv.org/abs/2304.02819',
    sourceName: 'Stanford University Computer Science report',
    confidenceTier: 'peer_reviewed',
    datePublished: '2023-04-15',
    dateAdded: '2026-01-20',
    retractionStatus: 'active',
    tags: ['ai_detectors', 'academic_integrity', 'bias'],
    discipline: 'Computer Science & Applied Linguistics',
  },
  {
    id: 'claim-r6',
    tenantId: 'inst-1',
    claimText:
      'UNESCO 2024 global survey found only 19% of higher education institutions have formal AI governance frameworks, 42% are drafting policies, and 39% have no guidelines.',
    sourceUrl: 'https://www.unesco.org/en/articles/guidance-generative-ai-education-and-research',
    sourceName: 'UNESCO Global AI Survey in Higher Education',
    confidenceTier: 'peer_reviewed',
    datePublished: '2024-03-10',
    dateAdded: '2026-02-01',
    retractionStatus: 'active',
    tags: ['global_adoption', 'governance', 'policy_gap'],
    discipline: 'Institutional Strategy',
  },
  {
    id: 'claim-r7',
    tenantId: 'inst-1',
    claimText:
      'A high-profile study claiming a 40% improvement in student writing from GAI assistance was retracted for flawed sample selection and undisclosed vendor co-authorship.',
    sourceUrl: 'https://retractionwatch.com/category/by-subject/education-retractions/',
    sourceName: 'Retraction Watch Education Archives',
    confidenceTier: 'peer_reviewed',
    datePublished: '2025-11-12',
    dateAdded: '2026-02-15',
    retractionStatus: 'retracted',
    tags: ['retraction', 'writing_instruction', 'vendor_bias'],
    discipline: 'Higher Education Pedagogy',
  },
  {
    id: 'claim-r8',
    tenantId: 'inst-1',
    claimText:
      'An adaptive-learning vendor claims a 40% improvement in gateway-course pass rates; the study was vendor-authored and has not been independently replicated.',
    sourceUrl: 'https://example-vendor-report.org/adaptive-gateway-2025',
    sourceName: 'Vendor Marketing Whitepaper',
    confidenceTier: 'vendor_reported',
    datePublished: '2025-10-05',
    dateAdded: '2026-03-10',
    retractionStatus: 'disputed',
    tags: ['adaptive_learning', 'vendor_claim', 'gateway_courses'],
    discipline: 'Learning Technology',
  },
  {
    id: 'claim-r9',
    tenantId: 'inst-1',
    claimText:
      'RSU internal data: MATH 1010 (College Algebra) carries a 38% DFW rate and is the single largest bottleneck to first-year persistence.',
    sourceUrl: 'https://ir.rsu.edu/dashboards/gateway-dfw-2026',
    sourceName: 'RSU Institutional Research Gateway Dashboard',
    confidenceTier: 'peer_reviewed',
    datePublished: '2026-03-01',
    dateAdded: '2026-03-05',
    retractionStatus: 'active',
    tags: ['gateway_courses', 'dfw', 'retention'],
    discipline: 'Mathematics',
    program: 'MATH 1010',
  },
  {
    id: 'claim-r10',
    tenantId: 'inst-1',
    claimText:
      'A national analysis found that state appropriations to regional public universities declined as a share of operating revenue over the last decade, intensifying pressure to consolidate programs.',
    sourceUrl: 'https://www.insidehighered.com/news/government/state-appropriations',
    sourceName: 'Inside Higher Ed',
    confidenceTier: 'journalistic',
    datePublished: '2026-01-14',
    dateAdded: '2026-01-18',
    retractionStatus: 'active',
    tags: ['state_appropriation', 'financial_sustainability'],
    discipline: 'Public Policy',
  },
];

export const RSU_STAGING: EvidenceStagingItem[] = [
  {
    id: 'stage-r1',
    tenantId: 'inst-1',
    claimText:
      'State Auditor preliminary memo questions the cost-per-credit of eight low-enrollment RSU programs and recommends a data-driven viability review before the next appropriation cycle.',
    sourceUrl: 'https://auditor.ruritania.gov/reports/higher-ed-2026',
    sourceName: 'Ruritania State Auditor',
    confidenceTier: 'journalistic',
    datePublished: '2026-09-12',
    discoveredAt: '2026-10-01T04:00:00Z',
    status: 'pending_review',
  },
  {
    id: 'stage-r2',
    tenantId: 'inst-1',
    claimText:
      'TA/adjunct union has filed a grievance asserting that any AI-assisted grading of TA-managed sections must be bargained, not unilaterally deployed.',
    sourceUrl: 'https://rsu-union.org/updates/grievance-ai-grading',
    sourceName: 'RSU United Employees Union',
    confidenceTier: 'anecdotal',
    datePublished: '2026-09-25',
    discoveredAt: '2026-10-02T04:00:00Z',
    status: 'pending_review',
  },
  {
    id: 'stage-r3',
    tenantId: 'inst-1',
    claimText:
      'HLC has updated its AI governance inquiry template for substantive-change reviews, requesting evidence of human oversight in any automated assessment or advising system.',
    sourceUrl: 'https://www.hlcommission.org/ai-inquiry-template',
    sourceName: 'Higher Learning Commission',
    confidenceTier: 'journalistic',
    datePublished: '2026-08-30',
    discoveredAt: '2026-09-05T04:00:00Z',
    status: 'pending_review',
  },
];

export const RSU_DECISIONS: DecisionRecord[] = [
  {
    id: 'dec-r1',
    tenantId: 'inst-1',
    title: 'Program Portfolio Review & AI-Assisted Consolidation Analytics',
    summary:
      'Use an analytics suite to score 128 programs on demand, cost-per-credit, and completion, to inform shared-governance decisions about consolidation or termination of eight flagged programs without layoffs.',
    domain: 'governance',
    touchesEnrollmentOrGrading: true,
    humanApprovalGatePassed: false,
    humanDisposition: 'pending',
    dispositionNotes: 'Pending Faculty Senate and Board review. Program discontinuance is a degree-progress action and cannot proceed without human sign-off.',
    recommendedAction: 'investigate_further',
    recommendedActionNotes: 'Board directs a no-layoff, data-informed consolidation path; final decisions reserved to shared governance.',
    implementationStatus: 'under_review',
    isAiDrafted: false,
    generationMode: 'deterministic',
    kernelSectionIds: ['II', 'VI', 'VIII', 'XII', 'XIV', 'XIX', 'XXX'],
    academicSignoff: {
      signoffType: 'academic',
      bodyName: RSU_SENATE,
      signedBy: null,
      signedAt: null,
      status: 'pending',
      resolutionNotes: 'Referred to Senate Committee on Academic Programs; plenary review pending.',
    },
    administrativeSignoff: {
      signoffType: 'administrative',
      bodyName: RSU_PROVOST,
      signedBy: null,
      signedAt: null,
      status: 'pending',
      resolutionNotes: 'Provost awaiting Senate recommendation before forwarding to the Board.',
    },
    createdAt: '2026-07-01T10:00:00Z',
    updatedAt: '2026-09-15T12:00:00Z',
  },
  {
    id: 'dec-r2',
    tenantId: 'inst-1',
    title: 'Adaptive Learning for Gateway Mathematics (MATH 1010)',
    summary:
      'Adopt an adaptive learning platform with faculty-owned grading to attack the 38% DFW rate in College Algebra and improve first-year persistence.',
    domain: 'pedagogy',
    touchesEnrollmentOrGrading: true,
    humanApprovalGatePassed: false,
    humanDisposition: 'pending',
    dispositionNotes: 'Conditional administrative support for a bounded pilot; Senate concurrence pending.',
    recommendedAction: 'pilot',
    recommendedActionNotes: 'Recommend a two-semester pilot in 8 sections with independent evaluation before scaling.',
    implementationStatus: 'under_review',
    isAiDrafted: false,
    generationMode: 'deterministic',
    kernelSectionIds: ['II', 'IV', 'VIII', 'IX', 'XVIII', 'XXX'],
    academicSignoff: {
      signoffType: 'academic',
      bodyName: RSU_SENATE,
      signedBy: null,
      signedAt: null,
      status: 'pending',
      resolutionNotes: 'Math Department supports a pilot; Senate plenary exercising caution on embedded assessment.',
    },
    administrativeSignoff: {
      signoffType: 'administrative',
      bodyName: RSU_PROVOST,
      signedBy: 'Dr. Alina Okafor, President',
      signedAt: '2026-08-20T10:00:00Z',
      status: 'conditional',
      resolutionNotes: 'Conditional approval for a sandboxed pilot only; subject to Senate concurrence and retention evaluation.',
    },
    createdAt: '2026-06-20T09:00:00Z',
    updatedAt: '2026-08-20T10:00:00Z',
  },
  {
    id: 'dec-r3',
    tenantId: 'inst-1',
    title: 'Predictive Early-Alert & AI Advising Assistant',
    summary:
      'Deploy predictive risk scoring plus an AI advising assistant to triage students at risk of stopping out, given a 1:900 advising ratio.',
    domain: 'enrollment_admissions',
    touchesEnrollmentOrGrading: true,
    humanApprovalGatePassed: false,
    humanDisposition: 'rejected',
    dispositionNotes:
      'REJECTED. Risk-scoring without a human advisor in the loop risks deficit-framing students and surveilling vulnerable populations; advisors must remain the decision-makers.',
    dispositionSetBy: 'Dr. Alina Okafor (President)',
    dispositionSetAt: '2026-08-05T14:30:00Z',
    recommendedAction: 'do_not_adopt',
    recommendedActionNotes: 'Autonomous risk triage rejected; a human-in-the-loop advising improvement effort is preferred.',
    implementationStatus: 'shelved',
    isAiDrafted: false,
    generationMode: 'deterministic',
    kernelSectionIds: ['II', 'IV', 'XIV', 'XIX', 'XXI', 'XXVII'],
    academicSignoff: {
      signoffType: 'academic',
      bodyName: RSU_SENATE,
      signedBy: 'Prof. Dario Marchetti, Senate Chair',
      signedAt: '2026-07-30T16:00:00Z',
      status: 'rejected',
      resolutionNotes: 'Senate voted down 38-6. Algorithmic risk labeling must not replace advisor judgment.',
    },
    administrativeSignoff: {
      signoffType: 'administrative',
      bodyName: RSU_PROVOST,
      signedBy: 'Dr. Alina Okafor, President',
      signedAt: '2026-08-05T14:30:00Z',
      status: 'rejected',
      resolutionNotes: 'Concur with Senate. Project shelved; reinvest in human advising capacity.',
    },
    createdAt: '2026-05-15T09:00:00Z',
    updatedAt: '2026-08-05T14:30:00Z',
  },
  {
    id: 'dec-r4',
    tenantId: 'inst-1',
    title: 'AI Grading Co-Pilot + TA Redeployment for Large Sections',
    summary:
      'Introduce an AI grading co-pilot that drafts rubric-based feedback for faculty and trained TAs to review and approve, redeploying TA hours from grading to direct student support.',
    domain: 'grading_assessment',
    touchesEnrollmentOrGrading: true,
    humanApprovalGatePassed: false,
    humanDisposition: 'pending',
    dispositionNotes: 'Faculty retain final grading authority. Union consultation required before deployment.',
    recommendedAction: 'pilot',
    recommendedActionNotes: 'Pilot in three high-enrollment courses with mandatory human review of every posted grade.',
    implementationStatus: 'under_review',
    isAiDrafted: false,
    generationMode: 'deterministic',
    kernelSectionIds: ['II', 'IV', 'XIX', 'XX', 'XXI', 'XXV', 'XXVII'],
    academicSignoff: {
      signoffType: 'academic',
      bodyName: RSU_SENATE,
      signedBy: 'Prof. Dario Marchetti, Senate Chair',
      signedAt: '2026-09-10T15:00:00Z',
      status: 'conditional',
      resolutionNotes: 'Faculty Senate conditionally supports a pilot ONLY with mandatory per-item human review and workload protections for TAs.',
    },
    administrativeSignoff: {
      signoffType: 'administrative',
      bodyName: RSU_PROVOST,
      signedBy: null,
      signedAt: null,
      status: 'pending',
      resolutionNotes: 'Provost awaiting collective-bargaining consultation and pilot design.',
    },
    createdAt: '2026-08-01T09:00:00Z',
    updatedAt: '2026-09-10T15:00:00Z',
  },
  {
    id: 'dec-r5',
    tenantId: 'inst-1',
    title: 'Central Generative-AI Acceptable-Use Policy',
    summary:
      'Adopt a single institution-wide generative-AI policy to replace the current patchwork in which Business mandates AI, English bans it, and Engineering permits it with disclosure.',
    domain: 'governance',
    touchesEnrollmentOrGrading: false,
    humanApprovalGatePassed: true,
    humanDisposition: 'accepted',
    dispositionNotes: 'Unanimously accepted; establishes disclosure norms, human accountability, and a review cycle.',
    dispositionSetBy: 'RSU Faculty Senate & President',
    dispositionSetAt: '2026-06-15T11:00:00Z',
    recommendedAction: 'adopt',
    recommendedActionNotes: 'Adopted with an annual review and a standing AI governance committee.',
    implementationStatus: 'implemented',
    isAiDrafted: false,
    generationMode: 'deterministic',
    kernelSectionIds: ['I', 'XIII', 'XIV', 'XXII', 'XXIX'],
    academicSignoff: {
      signoffType: 'academic',
      bodyName: RSU_SENATE,
      signedBy: 'Prof. Dario Marchetti, Senate Chair',
      signedAt: '2026-06-10T14:00:00Z',
      status: 'approved',
      resolutionNotes: 'Approved by Senate resolution 2026-22.',
    },
    administrativeSignoff: {
      signoffType: 'administrative',
      bodyName: RSU_PROVOST,
      signedBy: 'Dr. Alina Okafor, President',
      signedAt: '2026-06-15T11:00:00Z',
      status: 'approved',
      resolutionNotes: 'Administrative authorization confirmed; standing committee chartered.',
    },
    createdAt: '2026-04-10T08:00:00Z',
    updatedAt: '2026-06-15T11:00:00Z',
  },
  {
    id: 'dec-r6',
    tenantId: 'inst-1',
    title: 'First-Year AI Tutoring Chatbot (Co-Curricular Support)',
    summary:
      'Offer an opt-in AI tutoring chatbot for first-year general-education courses to expand after-hours academic support, with clear disclosure that it is not a substitute for instructors or advisors.',
    domain: 'pedagogy',
    touchesEnrollmentOrGrading: false,
    humanApprovalGatePassed: false,
    humanDisposition: 'pending',
    recommendedAction: 'pilot',
    recommendedActionNotes: 'Proposed bounded pilot in the First-Year Experience program.',
    implementationStatus: 'proposed',
    isAiDrafted: false,
    generationMode: 'deterministic',
    kernelSectionIds: ['IV', 'XXI', 'XXIII', 'XXVII'],
    academicSignoff: {
      signoffType: 'academic',
      bodyName: RSU_SENATE,
      signedBy: null,
      signedAt: null,
      status: 'pending',
      resolutionNotes: 'Not yet scheduled for plenary.',
    },
    administrativeSignoff: {
      signoffType: 'administrative',
      bodyName: RSU_PROVOST,
      signedBy: null,
      signedAt: null,
      status: 'pending',
      resolutionNotes: 'Awaiting evaluation design and data-flow review.',
    },
    createdAt: '2026-09-01T09:00:00Z',
    updatedAt: '2026-09-01T09:00:00Z',
  },
  {
    id: 'dec-r7',
    tenantId: 'inst-1',
    title: 'Enterprise Retention & Program-Costing Vendor Suite',
    summary:
      'Procure a single vendor platform bundling retention analytics and program cost-of-instruction modeling, which would also feed the portfolio review.',
    domain: 'infrastructure',
    touchesEnrollmentOrGrading: false,
    humanApprovalGatePassed: false,
    humanDisposition: 'pending',
    recommendedAction: 'investigate_further',
    recommendedActionNotes: 'Legal and procurement review required; vendor lock-in risk flagged.',
    implementationStatus: 'under_review',
    isAiDrafted: false,
    generationMode: 'deterministic',
    kernelSectionIds: ['XV', 'XVI', 'XXVI', 'XXVII'],
    academicSignoff: {
      signoffType: 'academic',
      bodyName: RSU_SENATE,
      signedBy: null,
      signedAt: null,
      status: 'pending',
      resolutionNotes: 'Senate requested data-sovereignty and exit-strategy terms before review.',
    },
    administrativeSignoff: {
      signoffType: 'administrative',
      bodyName: RSU_PROVOST,
      signedBy: null,
      signedAt: null,
      status: 'pending',
      resolutionNotes: 'General counsel reviewing contract terms for training-data prohibitions.',
    },
    createdAt: '2026-08-15T09:00:00Z',
    updatedAt: '2026-09-20T09:00:00Z',
  },
  {
    id: 'dec-r8',
    tenantId: 'inst-1',
    title: 'No-New-Tenure-Lines Capacity Strategy (AI-Augmented Instruction)',
    summary:
      'Respond to the hiring freeze by expanding AI-augmented instruction and redeploying lecturers and trained TAs, without layoffs, while protecting tenure-track roles where they exist.',
    domain: 'workforce',
    touchesEnrollmentOrGrading: false,
    humanApprovalGatePassed: false,
    humanDisposition: 'pending',
    recommendedAction: 'investigate_further',
    recommendedActionNotes: 'Requires union consultation and a workload/dignity impact analysis first.',
    implementationStatus: 'under_review',
    isAiDrafted: false,
    generationMode: 'deterministic',
    kernelSectionIds: ['IV', 'XX', 'XXI', 'XXV', 'XXVII'],
    academicSignoff: {
      signoffType: 'academic',
      bodyName: RSU_SENATE,
      signedBy: null,
      signedAt: null,
      status: 'pending',
      resolutionNotes: 'Faculty concerned about workload creep and the erosion of the tenure-track pipeline.',
    },
    administrativeSignoff: {
      signoffType: 'administrative',
      bodyName: RSU_PROVOST,
      signedBy: null,
      signedAt: null,
      status: 'pending',
      resolutionNotes: 'President insists on a no-layoff path with transparent workload accounting.',
    },
    createdAt: '2026-08-25T09:00:00Z',
    updatedAt: '2026-09-25T09:00:00Z',
  },
];

function nonTech(demographics: string, economics: string, policy: string, geopolitics: string) {
  return { demographics, economics, policy, geopolitics };
}

export const RSU_SCENARIOS: ScenarioEntry[] = [
  // --- dec-r1: Program portfolio review ---
  {
    id: 'scen-r1-1',
    decisionId: 'dec-r1',
    scenarioType: 'conservative',
    title: 'Shared-Governance Review, No Closures',
    description:
      'Analytics inform a redesign/merger conversation but no program is terminated; marginal programs receive 24-month improvement plans.',
    keyAssumptions: ['No program is cut this cycle', 'Board accepts slower savings'],
    nonTechDrivers: nonTech('Stable regional demand for traditional degrees', 'Savings achieved through attrition only', 'Shared-governance procedures honored', 'Little external pressure'),
    reversibilityRating: 5,
    isAiDrafted: false,
    generationMode: 'deterministic',
  },
  {
    id: 'scen-r1-2',
    decisionId: 'dec-r1',
    scenarioType: 'moderate',
    title: 'Consolidate Without Layoffs',
    description:
      'Three programs are merged into interdisciplinary units; affected faculty are redeployed to service teaching and new credentials, honoring the no-layoff pledge.',
    keyAssumptions: ['Faculty accept redeployment', 'New credentials attract students'],
    nonTechDrivers: nonTech('Shift toward adult and transfer learners', 'Deficit reduced by ~$4M', 'Union and Senate consultation succeeds', 'Moderate legislative scrutiny'),
    reversibilityRating: 3,
    isAiDrafted: false,
    generationMode: 'deterministic',
  },
  {
    id: 'scen-r1-3',
    decisionId: 'dec-r1',
    scenarioType: 'ambitious',
    title: 'Portfolio Reinvention Around Regional Need',
    description:
      'RSU closes or folds several legacy programs and launches stackable credentials in rural health, ag-tech, and advanced manufacturing aligned to state workforce needs.',
    keyAssumptions: ['State invests in workforce credentials', 'Employer partnerships materialize'],
    nonTechDrivers: nonTech('Explosive demand for short credentials', '$9M reallocated to growth areas', 'New state workforce grant program', 'Favorable regional economic outlook'),
    reversibilityRating: 2,
    isAiDrafted: false,
    generationMode: 'deterministic',
  },
  {
    id: 'scen-r1-4',
    decisionId: 'dec-r1',
    scenarioType: 'adverse',
    title: 'Analytics-Driven Cuts and Governance Backlash',
    description:
      'The analytics are perceived as a fait accompli; an opaque cost model triggers Senate censure, union grievances, and community protest, delaying decisions and damaging trust.',
    keyAssumptions: ['Cost model is not transparent', 'Constituents see the tool as deciding, not informing'],
    nonTechDrivers: nonTech('First-gen students lose local-program access', 'Legal and reputational costs mount', 'State open-records requests expose methodology', 'Local press amplifies program-loss stories'),
    reversibilityRating: 2,
    isAiDrafted: false,
    generationMode: 'deterministic',
  },
  {
    id: 'scen-r1-5',
    decisionId: 'dec-r1',
    scenarioType: 'disruptive',
    title: 'Enrollment Cliff Forces Emergency Restructuring',
    description:
      'A sudden further enrollment drop plus a mid-year appropriation recision forces emergency consolidation far beyond the eight flagged programs, with no-layoff pledge untenable.',
    keyAssumptions: ['Enrollment falls >12%', 'State cuts mid-year'],
    nonTechDrivers: nonTech('Regional population decline accelerates', 'Emergency budget shortfall', 'Legislature mandates rapid restructuring', 'Political instability in state budget'),
    reversibilityRating: 1,
    isAiDrafted: false,
    generationMode: 'deterministic',
  },

  // --- dec-r2: Adaptive gateway math ---
  {
    id: 'scen-r2-1',
    decisionId: 'dec-r2',
    scenarioType: 'conservative',
    title: 'Human-Led Redesign (Corequisite Support)',
    description:
      'MATH 1010 is restructured with a corequisite support lab; AI provides only optional practice problems. Instructors and TAs keep full grading control.',
    keyAssumptions: ['No assessment automation', 'Faculty autonomy preserved'],
    nonTechDrivers: nonTech('Commuters and first-gen need flexible support', 'Little new spend; reuses existing lab time', 'Senate evaluation authority upheld', 'Low sensitivity'),
    reversibilityRating: 5,
    isAiDrafted: false,
    generationMode: 'deterministic',
  },
  {
    id: 'scen-r2-2',
    decisionId: 'dec-r2',
    scenarioType: 'moderate',
    title: 'Adaptive Co-Pilot Within Faculty Guardrails',
    description:
      'An adaptive homework platform personalizes practice and surfaces alerts to instructors, who own all assessments and grades; TA hours shift to tutoring.',
    keyAssumptions: ['Faculty review platform alerts', 'Six TA lines reallocated to tutoring'],
    nonTechDrivers: nonTech('Gateway DFW concentrated among first-gen students', 'Reallocates ~$420k from grading hours', 'Registrar data-sharing agreement required', 'Standard vendor SLA'),
    reversibilityRating: 4,
    isAiDrafted: false,
    generationMode: 'deterministic',
  },
  {
    id: 'scen-r2-3',
    decisionId: 'dec-r2',
    scenarioType: 'ambitious',
    title: 'Full Adaptive Corequisite at Scale',
    description:
      'Every MATH 1010 section runs adaptive mastery pathways with embedded diagnostics; DFW drops sharply and persistence improves institution-wide.',
    keyAssumptions: ['High faculty and TA adoption', 'Integrates cleanly with Canvas'],
    nonTechDrivers: nonTech('Enrollment recovery depends on retention', 'Requires $1.2M investment', 'New assessment-integrity policy needed', 'Vendor stability assumed'),
    reversibilityRating: 3,
    isAiDrafted: false,
    generationMode: 'deterministic',
  },
  {
    id: 'scen-r2-4',
    decisionId: 'dec-r2',
    scenarioType: 'adverse',
    title: 'Algorithmic Deficit-Framing and Equity Backlash',
    description:
      'The adaptive model under-serves rural, ESL, and first-gen students; DFW gaps widen, TAs are blamed, and a union grievance plus HLC question stall the pilot.',
    keyAssumptions: ['Model misreads non-standard problem approaches', 'Advisors distrust automated flags'],
    nonTechDrivers: nonTech('Rural broadband limits at-home use', 'Appeal and remediation costs rise', 'State equity audit triggered', 'Vendor support lag during term'),
    reversibilityRating: 2,
    isAiDrafted: false,
    generationMode: 'deterministic',
  },
  {
    id: 'scen-r2-5',
    decisionId: 'dec-r2',
    scenarioType: 'disruptive',
    title: 'Freshman Math Disintermediation',
    description:
      'Free external AI tutors make a standalone algebra sequence obsolete; students bypass it with transfer credit and alternative credentials, forcing a redefinition of the math requirement.',
    keyAssumptions: ['External AI tutoring matures rapidly', 'Transfer pathways widen'],
    nonTechDrivers: nonTech('Learners prefer just-in-time skill modules', 'Tuition from MATH 1010 evaporates', 'Transfer and credit-by-exam policy shifts', 'Global credentialing becomes modular'),
    reversibilityRating: 1,
    isAiDrafted: false,
    generationMode: 'deterministic',
  },

  // --- dec-r4: Grading co-pilot + TA redeployment ---
  {
    id: 'scen-r4-1',
    decisionId: 'dec-r4',
    scenarioType: 'conservative',
    title: 'Limited Grammar-and-Rubric Assist',
    description:
      'Faculty and TAs use AI only for pre-submission grammar checks and rubric reminders; all scoring remains manual.',
    keyAssumptions: ['No automated score suggestion', 'Full human evaluation retained'],
    nonTechDrivers: nonTech('Faculty prize evaluation autonomy', 'Negligible licensing cost', 'Senate grading-resolution applies', 'Low sensitivity'),
    reversibilityRating: 5,
    isAiDrafted: false,
    generationMode: 'deterministic',
  },
  {
    id: 'scen-r4-2',
    decisionId: 'dec-r4',
    scenarioType: 'moderate',
    title: 'Co-Pilot Drafts, Humans Approve Every Grade',
    description:
      'AI drafts rubric-based feedback; faculty/trained TAs review and approve every posted grade. TA hours shift from grading to office hours and recitation support.',
    keyAssumptions: ['Every grade human-reviewed', 'Union consultation succeeds'],
    nonTechDrivers: nonTech('Overloaded TAs need relief', 'Redirects TA hours to student support', 'Collective-bargaining consultation required', 'Standard vendor terms'),
    reversibilityRating: 4,
    isAiDrafted: false,
    generationMode: 'deterministic',
  },
  {
    id: 'scen-r4-3',
    decisionId: 'dec-r4',
    scenarioType: 'ambitious',
    title: 'Institution-Wide Co-Pilot with Workload Protections',
    description:
      'Co-pilot deployed across high-enrollment courses with contractual TA workload protections and transparent audit logs, improving consistency and freeing faculty time.',
    keyAssumptions: ['Strong adoption', 'Workload accounting is transparent'],
    nonTechDrivers: nonTech('Consistency matters to first-gen students', 'Efficiency gains reinvested, not banked', 'Senate and union co-governance', 'Regional peer institutions watching'),
    reversibilityRating: 3,
    isAiDrafted: false,
    generationMode: 'deterministic',
  },
  {
    id: 'scen-r4-4',
    decisionId: 'dec-r4',
    scenarioType: 'adverse',
    title: 'Grade-Appeal Backlog and Grievance',
    description:
      'The co-pilot misreads dialect and complex arguments; a wave of appeals overwhelms staff, the union grievance proceeds, and TAs are blamed for errors they did not make.',
    keyAssumptions: ['Model lacks disciplinary nuance', 'Review step is rushed under load'],
    nonTechDrivers: nonTech('Bias falls on ESL/first-gen writers', 'Appeal-handling costs spike', 'Public integrity crisis and accreditor query', 'API outage during finals'),
    reversibilityRating: 2,
    isAiDrafted: false,
    generationMode: 'deterministic',
  },
  {
    id: 'scen-r4-5',
    decisionId: 'dec-r4',
    scenarioType: 'disruptive',
    title: 'Automated-Feedback Arms Race and Devalued Assessment',
    description:
      'Students use generative tools to produce work that the co-pilot grades, dissolving authentic assessment and forcing a wholesale shift to proctored, oral, and portfolio evaluation.',
    keyAssumptions: ['Students bypass learning', 'Automation and generation escalate'],
    nonTechDrivers: nonTech('Credential trust erodes', 'Alumni and employer confidence falls', 'Emergency assessment-mode switch', 'Global degree-recognition scrutiny'),
    reversibilityRating: 1,
    isAiDrafted: false,
    generationMode: 'deterministic',
  },
];

export const RSU_STAKEHOLDER_IMPACTS: StakeholderImpact[] = [
  // dec-r1
  { id: 'stk-r1-1', decisionId: 'dec-r1', stakeholderGroup: 'Students (Low Income / Pell)', benefitDescription: 'Potential reinvestment in support if savings are redirected to student services.', costDescription: 'Loss of accessible local programs; longer commutes or transfers.', powerShift: 'loses' },
  { id: 'stk-r1-2', decisionId: 'dec-r1', stakeholderGroup: 'First-Gen Students', benefitDescription: 'Possible clearer program pathways tailored to regional jobs.', costDescription: 'Disproportionately affected by program closures and lost faculty mentors.', powerShift: 'loses' },
  { id: 'stk-r1-3', decisionId: 'dec-r1', stakeholderGroup: 'Tenure-Track Faculty', benefitDescription: 'Focus on viable, growing programs.', costDescription: 'Threat to programs and academic identity; morale cost.', powerShift: 'neutral' },
  { id: 'stk-r1-4', decisionId: 'dec-r1', stakeholderGroup: 'Adjunct / Contingent Faculty', benefitDescription: 'Redeployment into growing service teaching.', costDescription: 'Precarity intensifies during consolidation.', powerShift: 'loses' },
  { id: 'stk-r1-5', decisionId: 'dec-r1', stakeholderGroup: 'Local Community', benefitDescription: 'Possible new workforce-aligned programs.', costDescription: 'Loss of cultural and civic programs; regional identity.', powerShift: 'loses' },
  { id: 'stk-r1-6', decisionId: 'dec-r1', stakeholderGroup: 'Professional / Support Staff', benefitDescription: 'Stabilized budget may protect staff roles.', costDescription: 'Redeployment and retraining burden.', powerShift: 'neutral' },

  // dec-r2
  { id: 'stk-r2-1', decisionId: 'dec-r2', stakeholderGroup: 'First-Gen Students', benefitDescription: 'Personalized practice and early support where DFW is highest.', costDescription: 'Risk of algorithmic deficit-framing if alerts are misread.', powerShift: 'gains' },
  { id: 'stk-r2-2', decisionId: 'dec-r2', stakeholderGroup: 'Students (Low Income / Pell)', benefitDescription: 'Better pass rates reduce cost and time to degree.', costDescription: 'Home broadband limits adaptive use.', powerShift: 'gains' },
  { id: 'stk-r2-3', decisionId: 'dec-r2', stakeholderGroup: 'Adjunct / Contingent Faculty', benefitDescription: 'Reduced grading load and better-prepared students.', costDescription: 'Fear of role substitution by platform.', powerShift: 'neutral' },
  { id: 'stk-r2-4', decisionId: 'dec-r2', stakeholderGroup: 'Tenure-Track Faculty', benefitDescription: 'Better student preparation; data to improve instruction.', costDescription: 'Concern over evolving role and platform dependency.', powerShift: 'neutral' },
  { id: 'stk-r2-5', decisionId: 'dec-r2', stakeholderGroup: 'Students with Disabilities', benefitDescription: 'Personalized pacing and accessibility options.', costDescription: 'Accessibility gaps if platform is not fully compliant.', powerShift: 'gains' },
  { id: 'stk-r2-6', decisionId: 'dec-r2', stakeholderGroup: 'International Students', benefitDescription: 'Extra language-neutral practice.', costDescription: 'Potential misreading of non-native problem approaches.', powerShift: 'loses' },

  // dec-r4
  { id: 'stk-r4-1', decisionId: 'dec-r4', stakeholderGroup: 'Adjunct / Contingent Faculty', benefitDescription: 'Grading relief reinvested into student support hours.', costDescription: 'Workload creep and displacement risk if protections absent.', powerShift: 'neutral' },
  { id: 'stk-r4-2', decisionId: 'dec-r4', stakeholderGroup: 'International Students', benefitDescription: 'Faster feedback in large courses.', costDescription: 'Highest exposure to AI misreadings of writing.', powerShift: 'loses' },
  { id: 'stk-r4-3', decisionId: 'dec-r4', stakeholderGroup: 'First-Gen Students', benefitDescription: 'More consistent, timely rubric feedback.', costDescription: 'Appeal burden if errors go uncorrected.', powerShift: 'gains' },
  { id: 'stk-r4-4', decisionId: 'dec-r4', stakeholderGroup: 'Tenure-Track Faculty', benefitDescription: 'Time returned to research and mentoring.', costDescription: 'Erosion of evaluation sovereignty if oversight slips.', powerShift: 'gains' },
  { id: 'stk-r4-5', decisionId: 'dec-r4', stakeholderGroup: 'Professional / Support Staff', benefitDescription: 'Fewer routine disputes if reviews are careful.', costDescription: 'Surge in appeal handling if the pilot goes wrong.', powerShift: 'loses' },
  { id: 'stk-r4-6', decisionId: 'dec-r4', stakeholderGroup: 'Students (Low Income / Pell)', benefitDescription: 'Consistent feedback regardless of section.', costDescription: 'Disproportionate harm if bias is uncorrected.', powerShift: 'neutral' },
];

export const RSU_PREDICTIONS: PredictionRecord[] = [
  {
    id: 'pred-r1',
    tenantId: 'inst-1',
    predictionText: 'By FY2028, state appropriations will fall below 25% of RSU operating revenue.',
    madeByUserId: 'user-pres',
    madeByUserName: 'Dr. Alina Okafor',
    madeByRole: 'leadership',
    dateMade: '2026-02-01',
    targetDate: '2028-06-30',
    resolutionStatus: 'pending',
    scopeLevel: 'institution',
  },
  {
    id: 'pred-r2',
    tenantId: 'inst-1',
    predictionText: 'At least three of the eight flagged programs will be saved through redesign or merger rather than terminated.',
    madeByUserId: 'user-senate',
    madeByUserName: 'Prof. Dario Marchetti',
    madeByRole: 'faculty',
    dateMade: '2026-07-05',
    targetDate: '2027-05-01',
    resolutionStatus: 'pending',
    scopeLevel: 'program',
  },
  {
    id: 'pred-r3',
    tenantId: 'inst-1',
    predictionText: 'A single central AI policy will reduce cross-college policy conflicts within one year.',
    madeByUserId: 'user-chair',
    madeByUserName: 'Prof. Lena Fischer',
    madeByRole: 'faculty',
    dateMade: '2025-06-01',
    targetDate: '2026-06-01',
    actualOutcome: 'Partially confirmed: two colleges adopted the central policy, but English and Engineering still operate under local variances.',
    resolutionStatus: 'partially_correct',
    lessonsLearned: 'Central policy needs explicit college-level adoption steps and enforcement to fully converge.',
    scopeLevel: 'institution',
  },
  {
    id: 'pred-r4',
    tenantId: 'inst-1',
    predictionText: 'AI tutoring in the First-Year Experience will raise first-gen persistence by at least 4 points.',
    madeByUserId: 'user-student',
    madeByUserName: 'Samir Haddad',
    madeByRole: 'student',
    dateMade: '2026-09-01',
    targetDate: '2027-09-01',
    resolutionStatus: 'pending',
    scopeLevel: 'program',
  },
  {
    id: 'pred-r5',
    tenantId: 'inst-1',
    predictionText: 'The enterprise analytics contract will include a data-training prohibition after legal review.',
    madeByUserId: 'user-cio',
    madeByUserName: 'Karen Whitfield',
    madeByRole: 'leadership',
    dateMade: '2026-08-20',
    targetDate: '2026-12-31',
    resolutionStatus: 'pending',
    scopeLevel: 'institution',
  },
  {
    id: 'pred-r6',
    tenantId: 'inst-1',
    predictionText: 'HLC will request an AI governance narrative from RSU by 2027.',
    madeByUserId: 'user-consultant',
    madeByUserName: 'Dr. Priya Raman',
    madeByRole: 'consultant',
    dateMade: '2026-09-15',
    targetDate: '2027-06-30',
    resolutionStatus: 'pending',
    scopeLevel: 'institution',
  },
];

export const RSU_EXTRA_RED_FLAGS: RedFlagCase[] = [
  {
    id: 'rf-r1',
    title: 'Analytics-Driven Program Cuts and Governance Backlash',
    category: 'financial_exposure',
    institutionOrContext: 'Regional Public University Portfolio Review',
    caseSummary:
      'An opaque cost-per-credit model was used to justify rapid program closures. Faculty governance and the community perceived the tool as the decision-maker rather than an input, triggering censure votes, open-records requests, and legal challenges that delayed savings.',
    sourceUrl: 'https://www.insidehighered.com/news/governance/program-closure-analytics',
    patternDescription: 'Treating a proprietary analytics score as authoritative for irreversible academic decisions.',
    warningSigns: [
      'Cost model methodology is not disclosed to shared governance',
      'Closure timelines precede governance review',
      'No published student-appeal or teach-out process',
    ],
    mitigations: [
      'Keep analytics strictly advisory and open to shared-governance scrutiny',
      'Require due-process teach-out and appeal plans before any termination',
      'Publish methodology and assumptions for verification',
    ],
    dateReported: '2025-11-02',
  },
  {
    id: 'rf-r2',
    title: 'Surveillance Advising and Mental-Health Harm',
    category: 'mental_health_harm',
    institutionOrContext: 'Public University Predictive Advising Pilot',
    caseSummary:
      'A predictive risk-scoring system labeled students as likely to stop out. Labels leaked into advising notes and eroded trust; students reported stigma and anxiety, and advisors spent more time managing alerts than meeting students.',
    sourceUrl: 'https://www.chronicle.com/article/predictive-advising-harm',
    patternDescription: 'Automated risk labeling of students without human interpretation or consent safeguards.',
    warningSigns: [
      'Risk scores visible beyond trained advisors',
      'No student opt-out or explanation pathway',
      'Advisor time redirected from direct contact to alert triage',
    ],
    mitigations: [
      'Keep a human advisor as the sole decision-maker',
      'Restrict score visibility and provide explanation and opt-out',
      'Measure trust and wellbeing, not just retention metrics',
    ],
    dateReported: '2025-04-18',
  },
  {
    id: 'rf-r3',
    title: 'TA and Adjunct Displacement Under AI Grading',
    category: 'overreliance',
    institutionOrContext: 'Large-Enrollment Public Sections',
    caseSummary:
      'AI grading deployment in high-enrollment courses was used to justify reducing teaching-assistant hours, shifting costs to contingent staff while error-correction and appeal work flowed back to them unpaid, prompting grievances.',
    sourceUrl: 'https://www.insidehighered.com/news/faculty-issues/contingent-labor-ai-grading',
    patternDescription: 'Using efficiency gains from automation to cut contingent labor without bargaining or oversight.',
    warningSigns: [
      'Efficiency framed as headcount reduction before consultation',
      'No workload protections or appeal support for TAs',
      'Grading errors corrected off-the-clock',
    ],
    mitigations: [
      'Bargain with the union before deployment',
      'Reinvest efficiency into student support, not just savings',
      'Guarantee human review and paid appeal handling',
    ],
    dateReported: '2026-02-27',
  },
];

export const RSU_PULSE_SURVEYS: PulseSurveyResponse[] = [
  { id: 'pulse-r1', tenantId: 'inst-1', role: 'faculty', disciplineOrProgram: 'Department of English', aiUsageFrequency: 'weekly', primaryToolsUsed: ['ChatGPT', 'Claude'], perceivedAcademicValue: 3, perceivedIntegrityRisk: 5, comments: 'Take-home essays are broken. Students submit flawless, voiceless prose. We banned AI in the department, but the university is inconsistent.', createdAt: '2026-09-02T14:00:00Z' },
  { id: 'pulse-r2', tenantId: 'inst-1', role: 'faculty', disciplineOrProgram: 'College of Business', aiUsageFrequency: 'daily', primaryToolsUsed: ['Copilot', 'ChatGPT'], perceivedAcademicValue: 5, perceivedIntegrityRisk: 2, comments: 'We require AI use for case analysis. It is a professional skill. Other colleges banning it makes us look inconsistent to students.', createdAt: '2026-09-03T10:00:00Z' },
  { id: 'pulse-r3', tenantId: 'inst-1', role: 'faculty', disciplineOrProgram: 'Department of Mathematics', aiUsageFrequency: 'occasional', primaryToolsUsed: ['Wolfram', 'Copilot'], perceivedAcademicValue: 3, perceivedIntegrityRisk: 3, comments: 'MATH 1010 DFW is crushing us. I would try adaptive practice, but I will not let a platform grade my students.', createdAt: '2026-09-05T09:00:00Z' },
  { id: 'pulse-r4', tenantId: 'inst-1', role: 'faculty', disciplineOrProgram: 'College of Nursing', aiUsageFrequency: 'occasional', primaryToolsUsed: ['Simulation software'], perceivedAcademicValue: 4, perceivedIntegrityRisk: 2, comments: 'Our proctored simulation labs work and licensure pass rates prove it. AI is a supplement here, not the story.', createdAt: '2026-09-06T11:00:00Z' },
  { id: 'pulse-r5', tenantId: 'inst-1', role: 'student', disciplineOrProgram: 'First-Year, Undeclared', aiUsageFrequency: 'weekly', primaryToolsUsed: ['ChatGPT'], perceivedAcademicValue: 4, perceivedIntegrityRisk: 4, comments: 'Every professor has a different rule. I never know what is allowed. I need one clear policy.', createdAt: '2026-09-08T16:20:00Z' },
  { id: 'pulse-r6', tenantId: 'inst-1', role: 'student', disciplineOrProgram: 'Computer Science', aiUsageFrequency: 'daily', primaryToolsUsed: ['Copilot', 'Perplexity'], perceivedAcademicValue: 5, perceivedIntegrityRisk: 2, comments: 'AI explains concepts fast. But I could pass without understanding if I wanted to. I want to actually learn.', createdAt: '2026-09-09T13:00:00Z' },
  { id: 'pulse-r7', tenantId: 'inst-1', role: 'faculty', disciplineOrProgram: 'RSU Online (RN-to-BSN)', aiUsageFrequency: 'weekly', primaryToolsUsed: ['LMS analytics'], perceivedAcademicValue: 4, perceivedIntegrityRisk: 2, comments: 'Our online completion program is growing. Working nurses need flexible, respectful AI support, not surveillance.', createdAt: '2026-09-10T08:00:00Z' },
  { id: 'pulse-r8', tenantId: 'inst-1', role: 'student', disciplineOrProgram: 'Psychology, First-Gen', aiUsageFrequency: 'occasional', primaryToolsUsed: ['Grammarly'], perceivedAcademicValue: 3, perceivedIntegrityRisk: 3, comments: 'I need a real advisor. I got an automated nudge once and it felt like a machine was deciding my future.', createdAt: '2026-09-11T15:00:00Z' },
  { id: 'pulse-r9', tenantId: 'inst-1', role: 'faculty', disciplineOrProgram: 'Department of History', aiUsageFrequency: 'never', primaryToolsUsed: [], perceivedAcademicValue: 1, perceivedIntegrityRisk: 5, comments: 'I teach primary-source reading. AI summaries and essay generators undermine the core skill I exist to teach.', createdAt: '2026-09-12T12:00:00Z' },
];

export const RSU_SHADOW_REPORTS: ShadowAiReport[] = [
  { id: 'sh-r1', tenantId: 'inst-1', reportedByRole: 'faculty', departmentOrCourse: 'BIOL 101 - Introductory Life Sciences', toolOrUseName: 'Unapproved AI Grading Browser Extension', description: 'A teaching assistant auto-generated lab-report grades and comments with a browser extension, without reading submissions.', perceivedRiskType: 'unapproved_grading', status: 'flagged', actionTaken: 'Escalated to department chair; human-in-the-loop review initiated.', createdAt: '2026-09-04T11:15:00Z' },
  { id: 'sh-r2', tenantId: 'inst-1', reportedByRole: 'student', departmentOrCourse: 'Computer Science Department', toolOrUseName: 'Public AI Flashcard Generator', description: 'Exam questions and quiz submissions were uploaded to a public flashcard bot that indexed proprietary course materials.', perceivedRiskType: 'student_data_leak', status: 'under_review', actionTaken: 'ITS evaluating domain block and a student warning bulletin.', createdAt: '2026-09-06T09:30:00Z' },
  { id: 'sh-r3', tenantId: 'inst-1', reportedByRole: 'faculty', departmentOrCourse: 'College of Education (Program Review)', toolOrUseName: 'Unauthorized Program-Viability Spreadsheet', description: 'A college generated program-termination scores from a vendor trial account without IR review, using incomplete cost data.', perceivedRiskType: 'accreditation_bypass', status: 'under_review', actionTaken: 'Referred to Institutional Research and shared governance.', createdAt: '2026-09-15T14:00:00Z' },
  { id: 'sh-r4', tenantId: 'inst-1', reportedByRole: 'student', departmentOrCourse: 'Advising Center', toolOrUseName: 'Third-Party Advising Chatbot', description: 'An advising unit trialed a chatbot that collected student ID numbers and course histories in a public interface.', perceivedRiskType: 'student_data_leak', status: 'mitigated', actionTaken: 'Trial halted; FERPA review completed; vendor removed.', createdAt: '2026-08-28T10:00:00Z' },
  { id: 'sh-r5', tenantId: 'inst-1', reportedByRole: 'faculty', departmentOrCourse: 'Graduate Research Methods Lab', toolOrUseName: 'Unvetted "AI TA" Assistant', description: 'A graduate lab used an unvetted AI assistant to answer student methodology questions and suggest citations, several of which were fabricated.', perceivedRiskType: 'misinformation', status: 'flagged', actionTaken: 'Corrective guidance issued; citation-verification policy reinforced.', createdAt: '2026-09-20T13:30:00Z' },
  { id: 'sh-r6', tenantId: 'inst-1', reportedByRole: 'faculty', departmentOrCourse: 'Enrollment Management', toolOrUseName: 'Shadow Predictive-Scoring Script', description: 'A staff member ran an ad-hoc dropout-risk script over registrar data outside the approved analytics process.', perceivedRiskType: 'accreditation_bypass', status: 'under_review', actionTaken: 'Investigated by the AI governance committee; awaiting disposition.', createdAt: '2026-09-25T08:45:00Z' },
];

// The RSU persona cast lives in src/types/auth.ts (SEED_PERSONAS) so the
// identity layer and the sandbox baseline can never drift apart. Re-exported
// here for callers that import the sandbox module directly.
export { SEED_PERSONAS as RSU_PERSONAS };

export interface RsuBaseline {
  institution: Institution;
  overlayPack: OverlayPack;
  diagnostics: InstitutionalDiagnosticItem[];
  claims: EvidenceClaim[];
  staging: EvidenceStagingItem[];
  decisions: DecisionRecord[];
  scenarios: ScenarioEntry[];
  stakeholderImpacts: StakeholderImpact[];
  predictions: PredictionRecord[];
  extraRedFlags: RedFlagCase[];
  pulseSurveys: PulseSurveyResponse[];
  shadowReports: ShadowAiReport[];
  personas: PersonaProfile[];
}

// Deep clone helper so callers never mutate the module-level constants.
function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function buildRsuBaseline(): RsuBaseline {
  return {
    institution: clone(RSU_INSTITUTION),
    overlayPack: clone(RSU_OVERLAY_PACK),
    diagnostics: clone(RSU_DIAGNOSTICS),
    claims: clone(RSU_CLAIMS),
    staging: clone(RSU_STAGING),
    decisions: clone(RSU_DECISIONS),
    scenarios: clone(RSU_SCENARIOS),
    stakeholderImpacts: clone(RSU_STAKEHOLDER_IMPACTS),
    predictions: clone(RSU_PREDICTIONS),
    extraRedFlags: clone(RSU_EXTRA_RED_FLAGS),
    pulseSurveys: clone(RSU_PULSE_SURVEYS),
    shadowReports: clone(RSU_SHADOW_REPORTS),
    personas: clone(SEED_PERSONAS),
  };
}
