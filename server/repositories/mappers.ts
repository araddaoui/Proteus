import type {
  DecisionRecord,
  EvidenceClaim,
  EvidenceStagingItem,
  GovernanceSignoff,
  Institution,
  InstitutionalDiagnosticItem,
  JobExecutionStatus,
  OverlayPack,
  PredictionRecord,
  PulseSurveyResponse,
  ScenarioEntry,
  ShadowAiReport,
  StakeholderImpact,
  UserRole,
} from '../../src/types/index.js';
import type { MembershipInfo, TenantRole } from '../../src/types/auth.js';
import { resolveCapabilities, toUiRole } from '../../src/types/auth.js';
import type {
  DecisionRow,
  DiagnosticRow,
  EvidenceClaimRow,
  InstitutionRow,
  JobRow,
  MembershipRow,
  OverlayPackRow,
  PredictionRow,
  PulseRow,
  ScenarioRow,
  ShadowRow,
  SignoffRow,
  StagingRow,
  StakeholderRow,
} from '../db/schema.js';

function iso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

function isoRequired(value: Date): string {
  return value.toISOString();
}

export function toInstitution(row: InstitutionRow): Institution {
  return {
    id: row.id,
    name: row.name,
    shortName: row.shortName,
    missionStatement: row.missionStatement,
    governanceType: row.governanceType as Institution['governanceType'],
    academicGovernanceType: row.academicGovernanceType as Institution['academicGovernanceType'],
    academicGovernanceBodyName: row.academicGovernanceBodyName,
    provostOfficeName: row.provostOfficeName,
    accreditors: row.accreditors,
    legalJurisdiction: row.legalJurisdiction,
    budgetTier: row.budgetTier as Institution['budgetTier'],
    enrollmentSize: row.enrollmentSize,
    studentDemographics: row.studentDemographics as unknown as Institution['studentDemographics'],
    currentAiPolicyStatus: row.currentAiPolicyStatus as Institution['currentAiPolicyStatus'],
    primaryLanguages: row.primaryLanguages,
    activeOverlayPackId: row.activeOverlayPackId,
    createdAt: isoRequired(row.createdAt),
    updatedAt: isoRequired(row.updatedAt),
  };
}

export function toOverlayPack(row: OverlayPackRow): OverlayPack {
  return {
    id: row.id,
    name: row.name,
    region: row.region,
    accreditationFrameworks: row.accreditationFrameworks,
    dataProtectionRegime: row.dataProtectionRegime as OverlayPack['dataProtectionRegime'],
    languagesSupported: row.languagesSupported,
    regionalCaseStudyFocus: row.regionalCaseStudyFocus,
    specialComplianceGates: row.specialComplianceGates,
    description: row.description,
  };
}

export function toSignoff(row: SignoffRow): GovernanceSignoff {
  return {
    signoffType: row.signoffType,
    bodyName: row.bodyName,
    signedBy: row.signedByName,
    signedByUid: row.signerUid,
    signedAt: iso(row.signedAt),
    status: row.status,
    resolutionNotes: row.resolutionNotes,
  };
}

export function toDecision(row: DecisionRow, signoffs: SignoffRow[] = []): DecisionRecord {
  const academic = signoffs.find((item) => item.signoffType === 'academic');
  const administrative = signoffs.find((item) => item.signoffType === 'administrative');
  return {
    id: row.id,
    tenantId: row.tenantId,
    title: row.title,
    summary: row.summary,
    domain: row.domain as DecisionRecord['domain'],
    touchesEnrollmentOrGrading: row.touchesEnrollmentOrGrading,
    humanApprovalGatePassed: row.humanApprovalGatePassed,
    humanDisposition: row.humanDisposition,
    dispositionNotes: row.dispositionNotes || undefined,
    dispositionSetBy: row.dispositionSetBy || undefined,
    dispositionSetAt: iso(row.dispositionSetAt) || undefined,
    recommendedAction: row.recommendedAction,
    recommendedActionNotes: row.recommendedActionNotes || undefined,
    implementationStatus: row.implementationStatus as DecisionRecord['implementationStatus'],
    isAiDrafted: row.isAiDrafted,
    generationMode: (row.generationMode as DecisionRecord['generationMode']) || undefined,
    kernelSectionIds: row.kernelSectionIds,
    version: row.version,
    academicSignoff: academic ? toSignoff(academic) : undefined,
    administrativeSignoff: administrative ? toSignoff(administrative) : undefined,
    createdAt: isoRequired(row.createdAt),
    updatedAt: isoRequired(row.updatedAt),
  };
}

export function toScenario(row: ScenarioRow): ScenarioEntry {
  return {
    id: row.id,
    decisionId: row.decisionId,
    scenarioType: row.scenarioType as ScenarioEntry['scenarioType'],
    title: row.title,
    description: row.description,
    keyAssumptions: row.keyAssumptions,
    nonTechDrivers: row.nonTechDrivers as ScenarioEntry['nonTechDrivers'],
    reversibilityRating: row.reversibilityRating,
    isAiDrafted: row.isAiDrafted,
    generationMode: (row.generationMode as ScenarioEntry['generationMode']) || undefined,
  };
}

export function toStakeholder(row: StakeholderRow): StakeholderImpact {
  return {
    id: row.id,
    decisionId: row.decisionId,
    stakeholderGroup: row.stakeholderGroup as StakeholderImpact['stakeholderGroup'],
    benefitDescription: row.benefitDescription,
    costDescription: row.costDescription,
    powerShift: row.powerShift as StakeholderImpact['powerShift'],
  };
}

export function toEvidenceClaim(row: EvidenceClaimRow): EvidenceClaim {
  return {
    id: row.id,
    tenantId: row.tenantId,
    claimText: row.claimText,
    sourceUrl: row.sourceUrl,
    sourceName: row.sourceName,
    confidenceTier: row.confidenceTier as EvidenceClaim['confidenceTier'],
    datePublished: row.datePublished,
    dateAdded: row.dateAdded,
    retractionStatus: row.retractionStatus as EvidenceClaim['retractionStatus'],
    tags: row.tags,
    discipline: row.discipline || undefined,
    program: row.program || undefined,
  };
}

export function toStaging(row: StagingRow): EvidenceStagingItem {
  return {
    id: row.id,
    tenantId: row.tenantId,
    claimText: row.claimText,
    sourceUrl: row.sourceUrl,
    sourceName: row.sourceName,
    confidenceTier: row.confidenceTier as EvidenceStagingItem['confidenceTier'],
    datePublished: row.datePublished,
    discoveredAt: row.discoveredAt,
    status: row.status,
    rejectionReason: row.rejectionReason || undefined,
    reviewedBy: row.reviewedBy || undefined,
    reviewedAt: iso(row.reviewedAt) || undefined,
  };
}

export function toPrediction(row: PredictionRow): PredictionRecord {
  return {
    id: row.id,
    tenantId: row.tenantId,
    predictionText: row.predictionText,
    madeByUserId: row.madeByUserId,
    madeByUserName: row.madeByUserName,
    madeByRole: row.madeByRole as UserRole,
    dateMade: row.dateMade,
    targetDate: row.targetDate,
    actualOutcome: row.actualOutcome || undefined,
    resolutionStatus: row.resolutionStatus,
    lessonsLearned: row.lessonsLearned || undefined,
    scopeLevel: row.scopeLevel as PredictionRecord['scopeLevel'],
  };
}

export function toPulse(row: PulseRow): PulseSurveyResponse {
  return {
    id: row.id,
    tenantId: row.tenantId,
    role: row.role as PulseSurveyResponse['role'],
    disciplineOrProgram: row.disciplineOrProgram,
    aiUsageFrequency: row.aiUsageFrequency as PulseSurveyResponse['aiUsageFrequency'],
    primaryToolsUsed: row.primaryToolsUsed,
    perceivedAcademicValue: row.perceivedAcademicValue,
    perceivedIntegrityRisk: row.perceivedIntegrityRisk,
    comments: row.comments,
    createdAt: isoRequired(row.createdAt),
  };
}

export function toShadow(row: ShadowRow): ShadowAiReport {
  return {
    id: row.id,
    tenantId: row.tenantId,
    reportedByRole: row.reportedByRole as UserRole,
    departmentOrCourse: row.departmentOrCourse,
    toolOrUseName: row.toolOrUseName,
    description: row.description,
    perceivedRiskType: row.perceivedRiskType as ShadowAiReport['perceivedRiskType'],
    status: row.status as ShadowAiReport['status'],
    actionTaken: row.actionTaken || undefined,
    createdAt: isoRequired(row.createdAt),
  };
}

export function toDiagnostic(row: DiagnosticRow): InstitutionalDiagnosticItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category as InstitutionalDiagnosticItem['category'],
    isAvailable: row.isAvailable,
    notes: row.notes || undefined,
    dataReference: row.dataReference || undefined,
  };
}

export function toJob(row: JobRow): JobExecutionStatus {
  return {
    jobId: row.jobId as JobExecutionStatus['jobId'],
    jobName: row.jobName,
    autonomyLevel: row.autonomyLevel as JobExecutionStatus['autonomyLevel'],
    lastRunAt: row.lastRunAt,
    nextRunDueAt: row.nextRunDueAt,
    itemsProcessed: row.itemsProcessed,
    status: row.status,
    lastResultSummary: row.lastResultSummary,
  };
}

export function toMembershipInfo(
  row: MembershipRow,
  institutionName: string,
  institutionShortName: string,
): MembershipInfo {
  return {
    id: row.id,
    tenantId: row.tenantId,
    institutionName,
    institutionShortName,
    role: row.role as TenantRole,
    title: row.title,
    governingBodyAffiliation: row.governingBodyAffiliation,
    capabilities: resolveCapabilities(row.role as TenantRole, row.capabilities),
  };
}

export function membershipUiRole(row: MembershipRow): UserRole {
  return toUiRole(row.role as TenantRole);
}
