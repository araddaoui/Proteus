import { z } from 'zod';

const id = z.string().trim().min(1).max(200);
const text = (max = 10_000) => z.string().trim().min(1).max(max);
const optionalText = (max = 10_000) => z.string().trim().max(max).optional();
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Expected an ISO date (YYYY-MM-DD).');
const version = z.number().int().positive().optional();

export const domainSchema = z.enum([
  'pedagogy',
  'grading_assessment',
  'enrollment_admissions',
  'workforce',
  'research',
  'governance',
  'infrastructure',
]);

export const decisionStatusSchema = z.enum([
  'proposed',
  'under_review',
  'approved_pending',
  'implemented',
  'shelved',
]);

export const createDecisionSchema = z
  .object({
    title: text(300),
    summary: text(5_000),
    domain: domainSchema,
    touchesEnrollmentOrGrading: z.boolean(),
    isAiDrafted: z.boolean().optional().default(false),
    generationMode: z.enum(['ai', 'deterministic']).optional(),
    kernelSectionIds: z.array(z.string().trim().max(20)).max(100).optional().default([]),
  })
  .strict();

export const dispositionSchema = z
  .object({
    disposition: z.enum(['accepted', 'rejected', 'modified']),
    notes: text(5_000),
    version,
  })
  .strict();

export const recommendedActionSchema = z
  .object({
    recommendedAction: z.enum(['adopt', 'pilot', 'investigate_further', 'do_not_adopt', 'do_not_use_ai']),
    notes: text(5_000),
    version,
  })
  .strict();

export const decisionStatusUpdateSchema = z
  .object({
    status: decisionStatusSchema,
    version,
  })
  .strict();

export const signoffSchema = z
  .object({
    signoffType: z.enum(['academic', 'administrative']),
    status: z.enum(['approved', 'rejected', 'conditional', 'pending']),
    resolutionNotes: text(5_000),
    version,
  })
  .strict();

const nonTechDrivers = z
  .object({
    demographics: z.string().max(2_000),
    economics: z.string().max(2_000),
    policy: z.string().max(2_000),
    geopolitics: z.string().max(2_000),
  })
  .strict();

export const scenarioInput = z
  .object({
    scenarioType: z.enum(['conservative', 'moderate', 'ambitious', 'adverse', 'disruptive']),
    title: text(300),
    description: text(5_000),
    keyAssumptions: z.array(z.string().trim().max(1_000)).max(50),
    nonTechDrivers,
    reversibilityRating: z.number().int().min(1).max(5),
    isAiDrafted: z.boolean().optional().default(false),
    generationMode: z.enum(['ai', 'deterministic']).optional(),
  })
  .strict();

export const createScenariosSchema = z.object({ scenarios: z.array(scenarioInput).min(1).max(20) }).strict();

const httpUrl = z
  .string()
  .trim()
  .max(2_000)
  .refine((value) => /^https?:\/\//i.test(value), 'A valid http(s) source URL is required.');

export const evidenceSchema = z
  .object({
    claimText: text(10_000),
    sourceUrl: httpUrl,
    sourceName: text(300),
    confidenceTier: z.enum(['peer_reviewed', 'vendor_reported', 'journalistic', 'anecdotal', 'unverified']),
    datePublished: dateString,
    retractionStatus: z.enum(['active', 'retracted', 'disputed']).optional(),
    tags: z.array(z.string().trim().max(100)).max(50).optional(),
    discipline: optionalText(300),
    program: optionalText(300),
  })
  .strict();

export const rejectStagingSchema = z.object({ reason: text(2_000) }).strict();

export const predictionSchema = z
  .object({
    predictionText: text(5_000),
    targetDate: dateString,
    scopeLevel: z.enum(['institution', 'program', 'course']),
  })
  .strict();

export const resolvePredictionSchema = z
  .object({
    resolutionStatus: z.enum(['correct', 'incorrect', 'partially_correct']),
    actualOutcome: text(5_000),
    lessonsLearned: text(5_000),
  })
  .strict();

export const pulseSchema = z
  .object({
    role: z.enum(['faculty', 'student']),
    disciplineOrProgram: text(300),
    aiUsageFrequency: z.enum(['daily', 'weekly', 'occasional', 'never']),
    primaryToolsUsed: z.array(z.string().trim().max(100)).max(30),
    perceivedAcademicValue: z.number().int().min(1).max(5),
    perceivedIntegrityRisk: z.number().int().min(1).max(5),
    comments: z.string().trim().max(5_000).optional().default(''),
  })
  .strict();

export const shadowReportSchema = z
  .object({
    reportedByRole: z.enum(['leadership', 'faculty', 'student', 'consultant']),
    departmentOrCourse: text(300),
    toolOrUseName: text(300),
    description: text(5_000),
    perceivedRiskType: z.enum([
      'unapproved_grading',
      'student_data_leak',
      'misinformation',
      'accreditation_bypass',
      'shadow_vendor',
    ]),
  })
  .strict();

export const diagnosticUpdateSchema = z
  .object({
    isAvailable: z.boolean(),
    notes: optionalText(2_000),
  })
  .strict();

export const jobRunSchema = z
  .object({ jobId: z.enum(['evidence_refresh', 'prediction_reconciliation', 'red_flag_scan']) })
  .strict();

export const inviteSchema = z
  .object({
    email: z.string().trim().email().max(320).optional(),
    code: z.string().trim().min(6).max(64).optional(),
    role: z.enum(['tenant_admin', 'academic_leader', 'faculty', 'consultant', 'student', 'staff']),
    title: text(300),
    governingBodyAffiliation: text(300),
    capabilities: z
      .array(
        z.enum([
          'read_tenant',
          'read_confidential',
          'edit_profile',
          'manage_members',
          'read_decisions',
          'create_decisions',
          'edit_decisions',
          'set_disposition',
          'sign_academic',
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
        ]),
      )
      .optional(),
    expiresAt: z.string().datetime().optional(),
    maxUses: z.number().int().min(1).max(1000).optional(),
    isEvaluator: z.boolean().optional(),
  })
  .strict()
  .refine((data) => data.email || data.code, {
    message: 'Either email or code is required.',
  });

export const inviteCodeCreateSchema = z
  .object({
    tenantId: z.string().min(1),
    role: z.enum(['tenant_admin', 'academic_leader', 'faculty', 'consultant', 'student', 'staff']),
    title: text(300),
    governingBodyAffiliation: text(300),
    capabilities: z
      .array(
        z.enum([
          'read_tenant',
          'read_confidential',
          'edit_profile',
          'manage_members',
          'read_decisions',
          'create_decisions',
          'edit_decisions',
          'set_disposition',
          'sign_academic',
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
        ]),
      )
      .optional(),
    expiresAt: z.string().datetime().optional(),
    maxUses: z.number().int().min(1).max(1000).optional(),
    isEvaluator: z.boolean().optional(),
  })
  .strict();

export const inviteRedeemSchema = z
  .object({
    code: z.string().trim().min(6).max(64),
  })
  .strict();

export const institutionSchema = z
  .object({
    name: text(300),
    shortName: text(100),
    missionStatement: text(10_000),
    governanceType: z.enum(['public', 'private', 'hybrid']),
    academicGovernanceType: z.enum(['faculty_senate', 'scientific_council', 'academic_council', 'none']),
    academicGovernanceBodyName: text(300),
    provostOfficeName: text(300),
    accreditors: z.array(z.string().trim().max(300)).max(50),
    legalJurisdiction: text(1_000),
    budgetTier: z.enum([
      'Small (<$50M)',
      'Medium ($50M-$250M)',
      'Large ($250M-$1B)',
      'Tier 1 R1 ($1B+)',
    ]),
    enrollmentSize: z.number().int().min(0).max(10_000_000),
    studentDemographics: z
      .object({
        undergraduatePercent: z.number().min(0).max(100),
        graduatePercent: z.number().min(0).max(100),
        internationalPercent: z.number().min(0).max(100),
        firstGenPercent: z.number().min(0).max(100),
        pellEligiblePercent: z.number().min(0).max(100),
      })
      .strict(),
    currentAiPolicyStatus: z.enum(['none', 'drafting', 'formal']),
    primaryLanguages: z.array(z.string().trim().max(100)).max(50),
    activeOverlayPackId: text(200),
  })
  .strict();

export const auditQuerySchema = z.object({ limit: z.coerce.number().int().min(1).max(500).optional() });

export const idParamSchema = z.object({ id });
export const stagingParamSchema = z.object({ id });
