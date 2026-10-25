import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import type {
  DecisionRecord,
  EvidenceClaim,
  EvidenceStagingItem,
  GovernanceSignoff,
  HumanDisposition,
  PredictionRecord,
  PulseSurveyResponse,
  RecommendedAction,
  ScenarioEntry,
  ShadowAiReport,
  StakeholderImpact,
} from '../../src/types/index.js';
import type { Capability, TenantRole } from '../../src/types/auth.js';

export const tenantRoleEnum = pgEnum('tenant_role', [
  'tenant_admin',
  'academic_leader',
  'faculty',
  'consultant',
  'student',
  'staff',
]);

export const membershipStatusEnum = pgEnum('membership_status', ['active', 'suspended', 'revoked']);
export const signoffTypeEnum = pgEnum('signoff_type', ['academic', 'administrative']);
export const signoffStatusEnum = pgEnum('signoff_status', ['pending', 'approved', 'rejected', 'conditional']);
export const decisionStatusEnum = pgEnum('decision_status', [
  'proposed',
  'under_review',
  'approved_pending',
  'implemented',
  'shelved',
]);
export const stagingStatusEnum = pgEnum('staging_status', ['pending_review', 'approved', 'rejected']);
export const predictionStatusEnum = pgEnum('prediction_status', [
  'pending',
  'correct',
  'incorrect',
  'partially_correct',
]);
export const jobStatusEnum = pgEnum('job_status', ['idle', 'running', 'completed', 'failed']);

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
};

export const institutions = pgTable('institutions', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  shortName: text('short_name').notNull(),
  missionStatement: text('mission_statement').notNull(),
  governanceType: text('governance_type').notNull(),
  academicGovernanceType: text('academic_governance_type').notNull(),
  academicGovernanceBodyName: text('academic_governance_body_name').notNull(),
  provostOfficeName: text('provost_office_name').notNull(),
  accreditors: jsonb('accreditors').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  legalJurisdiction: text('legal_jurisdiction').notNull(),
  budgetTier: text('budget_tier').notNull(),
  enrollmentSize: integer('enrollment_size').notNull(),
  studentDemographics: jsonb('student_demographics')
    .$type<Record<string, number>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  currentAiPolicyStatus: text('current_ai_policy_status').notNull(),
  primaryLanguages: jsonb('primary_languages').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  activeOverlayPackId: text('active_overlay_pack_id').notNull(),
  ...timestamps,
});

export const overlayPacks = pgTable('overlay_packs', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  region: text('region').notNull(),
  accreditationFrameworks: jsonb('accreditation_frameworks')
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  dataProtectionRegime: text('data_protection_regime').notNull(),
  languagesSupported: jsonb('languages_supported').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  regionalCaseStudyFocus: text('regional_case_study_focus').notNull(),
  specialComplianceGates: jsonb('special_compliance_gates')
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  description: text('description').notNull(),
  ...timestamps,
});

export const users = pgTable(
  'users',
  {
    uid: text('uid').primaryKey(),
    email: text('email').notNull(),
    displayName: text('display_name').notNull(),
    avatarUrl: text('avatar_url'),
    status: text('status').notNull().default('active'),
    isPlatformAdmin: boolean('is_platform_admin').notNull().default(false),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true, mode: 'date' }),
    ...timestamps,
  },
  (table) => [uniqueIndex('users_email_unique').on(sql`lower(${table.email})`)],
);

export const memberships = pgTable(
  'memberships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    uid: text('uid')
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => institutions.id, { onDelete: 'cascade' }),
    role: tenantRoleEnum('role').notNull(),
    title: text('title').notNull(),
    governingBodyAffiliation: text('governing_body_affiliation').notNull(),
    capabilities: jsonb('capabilities').$type<Capability[]>().notNull().default(sql`'[]'::jsonb`),
    status: membershipStatusEnum('status').notNull().default('active'),
    validFrom: timestamp('valid_from', { withTimezone: true, mode: 'date' }),
    validUntil: timestamp('valid_until', { withTimezone: true, mode: 'date' }),
    isEvaluator: boolean('is_evaluator').notNull().default(false),
    convertedAt: timestamp('converted_at', { withTimezone: true, mode: 'date' }),
    convertedFromTenantId: text('converted_from_tenant_id'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('memberships_uid_tenant_unique').on(table.uid, table.tenantId),
    index('memberships_tenant_idx').on(table.tenantId),
    index('memberships_uid_idx').on(table.uid),
  ],
);

export const invites = pgTable(
  'invites',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => institutions.id, { onDelete: 'cascade' }),
    email: text('email'),
    code: text('code').unique(),
    role: tenantRoleEnum('role').notNull(),
    title: text('title').notNull(),
    governingBodyAffiliation: text('governing_body_affiliation').notNull(),
    capabilities: jsonb('capabilities').$type<Capability[]>().notNull().default(sql`'[]'::jsonb`),
    status: text('status').notNull().default('pending'),
    invitedByUid: text('invited_by_uid'),
    acceptedByUid: text('accepted_by_uid'),
    acceptedAt: timestamp('accepted_at', { withTimezone: true, mode: 'date' }),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }),
    maxUses: integer('max_uses').default(1),
    usedCount: integer('used_count').notNull().default(0),
    isEvaluator: boolean('is_evaluator').notNull().default(false),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('invites_email_tenant_unique').on(table.email, table.tenantId),
    index('invites_email_idx').on(table.email),
    index('invites_code_idx').on(table.code),
    index('invites_tenant_idx').on(table.tenantId),
  ],
);

export const decisions = pgTable(
  'decisions',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => institutions.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    summary: text('summary').notNull(),
    domain: text('domain').notNull(),
    touchesEnrollmentOrGrading: boolean('touches_enrollment_or_grading').notNull().default(false),
    humanApprovalGatePassed: boolean('human_approval_gate_passed').notNull().default(false),
    humanDisposition: text('human_disposition').$type<HumanDisposition>(),
    dispositionNotes: text('disposition_notes'),
    dispositionSetBy: text('disposition_set_by'),
    dispositionSetAt: timestamp('disposition_set_at', { withTimezone: true, mode: 'date' }),
    recommendedAction: text('recommended_action').$type<RecommendedAction>(),
    recommendedActionNotes: text('recommended_action_notes'),
    implementationStatus: decisionStatusEnum('implementation_status').notNull().default('proposed'),
    isAiDrafted: boolean('is_ai_drafted').notNull().default(false),
    generationMode: text('generation_mode'),
    kernelSectionIds: jsonb('kernel_section_ids').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    version: integer('version').notNull().default(1),
    ...timestamps,
  },
  (table) => [index('decisions_tenant_idx').on(table.tenantId)],
);

export const governanceSignoffs = pgTable(
  'governance_signoffs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    decisionId: text('decision_id')
      .notNull()
      .references(() => decisions.id, { onDelete: 'cascade' }),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => institutions.id, { onDelete: 'cascade' }),
    signoffType: signoffTypeEnum('signoff_type').notNull(),
    bodyName: text('body_name').notNull(),
    signerUid: text('signer_uid').references(() => users.uid),
    signerMembershipId: uuid('signer_membership_id').references(() => memberships.id),
    signedByName: text('signed_by_name'),
    status: signoffStatusEnum('status').notNull(),
    resolutionNotes: text('resolution_notes').notNull().default(''),
    signedAt: timestamp('signed_at', { withTimezone: true, mode: 'date' }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('governance_signoffs_decision_type_unique').on(table.decisionId, table.signoffType),
    index('governance_signoffs_tenant_idx').on(table.tenantId),
  ],
);

export const scenarios = pgTable(
  'scenarios',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => institutions.id, { onDelete: 'cascade' }),
    decisionId: text('decision_id')
      .notNull()
      .references(() => decisions.id, { onDelete: 'cascade' }),
    scenarioType: text('scenario_type').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    keyAssumptions: jsonb('key_assumptions').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    nonTechDrivers: jsonb('non_tech_drivers')
      .$type<ScenarioEntry['nonTechDrivers']>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    reversibilityRating: integer('reversibility_rating').notNull(),
    isAiDrafted: boolean('is_ai_drafted').notNull().default(false),
    generationMode: text('generation_mode'),
    ...timestamps,
  },
  (table) => [index('scenarios_decision_idx').on(table.decisionId)],
);

export const stakeholderImpacts = pgTable(
  'stakeholder_impacts',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => institutions.id, { onDelete: 'cascade' }),
    decisionId: text('decision_id')
      .notNull()
      .references(() => decisions.id, { onDelete: 'cascade' }),
    stakeholderGroup: text('stakeholder_group').notNull(),
    benefitDescription: text('benefit_description').notNull(),
    costDescription: text('cost_description').notNull(),
    powerShift: text('power_shift').notNull(),
    ...timestamps,
  },
  (table) => [index('stakeholder_impacts_decision_idx').on(table.decisionId)],
);

export const evidenceClaims = pgTable(
  'evidence_claims',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => institutions.id, { onDelete: 'cascade' }),
    claimText: text('claim_text').notNull(),
    sourceUrl: text('source_url').notNull(),
    sourceName: text('source_name').notNull(),
    confidenceTier: text('confidence_tier').notNull(),
    datePublished: text('date_published').notNull(),
    dateAdded: text('date_added').notNull(),
    retractionStatus: text('retraction_status').notNull().default('active'),
    tags: jsonb('tags').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    discipline: text('discipline'),
    program: text('program'),
    createdByUid: text('created_by_uid').references(() => users.uid),
    ...timestamps,
  },
  (table) => [index('evidence_claims_tenant_idx').on(table.tenantId)],
);

export const evidenceStaging = pgTable(
  'evidence_staging',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => institutions.id, { onDelete: 'cascade' }),
    claimText: text('claim_text').notNull(),
    sourceUrl: text('source_url').notNull(),
    sourceName: text('source_name').notNull(),
    confidenceTier: text('confidence_tier').notNull(),
    datePublished: text('date_published').notNull(),
    discoveredAt: text('discovered_at').notNull(),
    status: stagingStatusEnum('status').notNull().default('pending_review'),
    rejectionReason: text('rejection_reason'),
    reviewedBy: text('reviewed_by'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true, mode: 'date' }),
    ...timestamps,
  },
  (table) => [index('evidence_staging_tenant_idx').on(table.tenantId)],
);

export const predictions = pgTable(
  'predictions',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => institutions.id, { onDelete: 'cascade' }),
    predictionText: text('prediction_text').notNull(),
    madeByUserId: text('made_by_user_id').notNull(),
    madeByUserName: text('made_by_user_name').notNull(),
    madeByRole: text('made_by_role').notNull(),
    dateMade: text('date_made').notNull(),
    targetDate: text('target_date').notNull(),
    actualOutcome: text('actual_outcome'),
    resolutionStatus: predictionStatusEnum('resolution_status').notNull().default('pending'),
    lessonsLearned: text('lessons_learned'),
    scopeLevel: text('scope_level').notNull(),
    ...timestamps,
  },
  (table) => [index('predictions_tenant_idx').on(table.tenantId)],
);

export const redFlags = pgTable('red_flags', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  institutionOrContext: text('institution_or_context').notNull(),
  caseSummary: text('case_summary').notNull(),
  sourceUrl: text('source_url').notNull(),
  patternDescription: text('pattern_description').notNull(),
  warningSigns: jsonb('warning_signs').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  mitigations: jsonb('mitigations').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  dateReported: text('date_reported').notNull(),
  ...timestamps,
});

export const pulseSurveys = pgTable(
  'pulse_surveys',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => institutions.id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
    disciplineOrProgram: text('discipline_or_program').notNull(),
    aiUsageFrequency: text('ai_usage_frequency').notNull(),
    primaryToolsUsed: jsonb('primary_tools_used').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    perceivedAcademicValue: integer('perceived_academic_value').notNull(),
    perceivedIntegrityRisk: integer('perceived_integrity_risk').notNull(),
    comments: text('comments').notNull().default(''),
    createdByUid: text('created_by_uid').references(() => users.uid),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [index('pulse_surveys_tenant_idx').on(table.tenantId)],
);

export const shadowAiReports = pgTable(
  'shadow_ai_reports',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => institutions.id, { onDelete: 'cascade' }),
    reportedByRole: text('reported_by_role').notNull(),
    departmentOrCourse: text('department_or_course').notNull(),
    toolOrUseName: text('tool_or_use_name').notNull(),
    description: text('description').notNull(),
    perceivedRiskType: text('perceived_risk_type').notNull(),
    status: text('status').notNull().default('flagged'),
    actionTaken: text('action_taken'),
    createdByUid: text('created_by_uid').references(() => users.uid),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [index('shadow_ai_reports_tenant_idx').on(table.tenantId)],
);

export const diagnosticItems = pgTable(
  'diagnostic_items',
  {
    id: text('id').notNull(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => institutions.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    category: text('category').notNull(),
    isAvailable: boolean('is_available').notNull().default(false),
    notes: text('notes'),
    dataReference: text('data_reference'),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.tenantId, table.id] })],
);

export const jobs = pgTable('jobs', {
  jobId: text('job_id').primaryKey(),
  jobName: text('job_name').notNull(),
  autonomyLevel: text('autonomy_level').notNull(),
  lastRunAt: text('last_run_at').notNull(),
  nextRunDueAt: text('next_run_due_at').notNull(),
  itemsProcessed: integer('items_processed').notNull().default(0),
  status: jobStatusEnum('status').notNull().default('idle'),
  lastResultSummary: text('last_result_summary').notNull().default(''),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

export const inviteRedemptions = pgTable(
  'invite_redemptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    inviteId: uuid('invite_id').references(() => invites.id, { onDelete: 'set null' }),
    code: text('code').notNull(),
    uid: text('uid').notNull(),
    tenantId: text('tenant_id').references(() => institutions.id, { onDelete: 'set null' }),
    ip: text('ip'),
    userAgent: text('user_agent'),
    redeemedAt: timestamp('redeemed_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('invite_redemptions_code_idx').on(table.code),
    index('invite_redemptions_uid_idx').on(table.uid),
    index('invite_redemptions_tenant_idx').on(table.tenantId),
  ],
);

export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: text('tenant_id').references(() => institutions.id, { onDelete: 'set null' }),
    actorUid: text('actor_uid'),
    actorMembershipId: uuid('actor_membership_id'),
    actorRole: text('actor_role'),
    action: text('action').notNull(),
    targetType: text('target_type').notNull(),
    targetId: text('target_id'),
    before: jsonb('before'),
    after: jsonb('after'),
    metadata: jsonb('metadata'),
    requestId: text('request_id'),
    ip: text('ip'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('audit_log_tenant_idx').on(table.tenantId),
    index('audit_log_action_idx').on(table.action),
    index('audit_log_created_at_idx').on(table.createdAt),
  ],
);

export const idempotencyKeys = pgTable(
  'idempotency_keys',
  {
    key: text('key').primaryKey(),
    uid: text('uid').notNull(),
    endpoint: text('endpoint').notNull(),
    requestHash: text('request_hash').notNull(),
    response: jsonb('response').$type<unknown>(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [index('idempotency_expires_idx').on(table.expiresAt)],
);

export type InstitutionRow = typeof institutions.$inferSelect;
export type OverlayPackRow = typeof overlayPacks.$inferSelect;
export type MembershipRow = typeof memberships.$inferSelect;
export type DecisionRow = typeof decisions.$inferSelect;
export type SignoffRow = typeof governanceSignoffs.$inferSelect;
export type EvidenceClaimRow = typeof evidenceClaims.$inferSelect;
export type StagingRow = typeof evidenceStaging.$inferSelect;
export type ScenarioRow = typeof scenarios.$inferSelect;
export type StakeholderRow = typeof stakeholderImpacts.$inferSelect;
export type PredictionRow = typeof predictions.$inferSelect;
export type PulseRow = typeof pulseSurveys.$inferSelect;
export type ShadowRow = typeof shadowAiReports.$inferSelect;
export type DiagnosticRow = typeof diagnosticItems.$inferSelect;
export type JobRow = typeof jobs.$inferSelect;

export const schema = {
  institutions,
  overlayPacks,
  users,
  invites,
  memberships,
  decisions,
  governanceSignoffs,
  scenarios,
  stakeholderImpacts,
  evidenceClaims,
  evidenceStaging,
  predictions,
  redFlags,
  pulseSurveys,
  shadowAiReports,
  diagnosticItems,
  jobs,
  auditLog,
  idempotencyKeys,
};

export type DecisionSignoff = GovernanceSignoff;
export type DecisionEntity = DecisionRecord;
export type EvidenceEntity = EvidenceClaim;
export type StagingEntity = EvidenceStagingItem;
export type ScenarioEntity = ScenarioEntry;
export type StakeholderEntity = StakeholderImpact;
export type PredictionEntity = PredictionRecord;
export type PulseEntity = PulseSurveyResponse;
export type ShadowEntity = ShadowAiReport;
export type TenantRoleType = TenantRole;
