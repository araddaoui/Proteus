import { eq } from 'drizzle-orm';
import { config } from '../config.js';
import { getDb } from '../db/client.js';
import {
  decisions,
  diagnosticItems,
  evidenceClaims,
  evidenceStaging,
  governanceSignoffs,
  institutions,
  invites,
  jobs,
  overlayPacks,
  predictions,
  pulseSurveys,
  redFlags,
  scenarios,
  shadowAiReports,
  stakeholderImpacts,
} from '../db/schema.js';
import { buildRsuBaseline } from '../../src/sandbox/rsuSeed.js';
import type { RedFlagCase } from '../../src/types/index.js';
import type { TenantRole } from '../../src/types/auth.js';

const RSU_TENANT_ID = 'inst-1';

const LEGACY_RED_FLAGS: RedFlagCase[] = [
  {
    id: 'rf-01',
    title: 'Texas A&M Senior Diploma Hold False Alarm',
    category: 'integrity_collapse',
    institutionOrContext: 'US Public University (Texas A&M)',
    caseSummary:
      'A professor ran senior capstone essays through a popular GAI chatbot, asking if it wrote them. The chatbot falsely claimed authorship, leading to temporary diploma holds for graduating seniors until university leadership intervened to manually review and exonerate the students.',
    sourceUrl:
      'https://www.rollingstone.com/culture/culture-news/texas-am-chatgpt-ai-professor-flunk-graduates-1234737233/',
    patternDescription:
      'Using generative AI tools as authoritative plagiarism detectors despite known hallucination tendencies.',
    warningSigns: [
      'Faculty reliance on GAI prompt "did you write this?" as evidence',
      'Absence of clear institutional appeal protocol before punitive action',
      'Direct threat to student graduation and degree issuance',
    ],
    mitigations: [
      'Explicit prohibition of using LLMs as plagiarism detectors',
      'Mandatory multi-tier human review before withholding grades or diplomas',
      'Faculty education on LLM output limitations',
    ],
    dateReported: '2023-05-18',
  },
  {
    id: 'rf-02',
    title: 'For-Profit College Instructor Substitution with Unmonitored Bot',
    category: 'accreditation_gap',
    institutionOrContext: 'For-Profit Online College Network',
    caseSummary:
      'An online institution replaced core course instructors with an automated chatbot. Students had no contact with human faculty, and the bot autonomously processed course withdrawals, grading, and enrollment status changes. Accreditors subsequently sanctioned the institution for failing to provide regular and substantive faculty-student interaction.',
    sourceUrl: 'https://www.chronicle.com/article/when-ai-replaces-the-professor',
    patternDescription:
      'Complete automation of instruction and enrollment decisions, eliminating human-in-the-loop oversight.',
    warningSigns: [
      'Zero human faculty touchpoints in course delivery',
      'Automated processing of student course drops and financial aid triggers',
      'Marketing cost reduction as educational innovation',
    ],
    mitigations: [
      'Enforce a hardcoded, non-negotiable human-approval gate for all grading, withdrawal, and degree status actions',
      'Regular accreditor substantive interaction audits',
    ],
    dateReported: '2024-02-10',
  },
  {
    id: 'rf-03',
    title: 'Rapid Rollback of Commercial Assignment-Completer EdTech Tool',
    category: 'rollback_after_launch',
    institutionOrContext: 'Commercial EdTech Startup Launch',
    caseSummary:
      'A commercial startup launched an AI assistant marketed to "watch lectures and complete coursework." Within 72 hours of viral adoption, the tool was pulled offline following massive backlash from universities, data protection regulators, and cheating concerns.',
    sourceUrl: 'https://www.wired.com/story/ai-homework-tool-pulled-backlash/',
    patternDescription:
      'Fast-launched AI products with short half-lives that promise complete homework automation without pedagogical grounding.',
    warningSigns: [
      'Tool promises to complete assignments on behalf of students',
      'Lack of transparent data privacy architecture',
      'Vendor marketing targeted directly at bypassing faculty assessment',
    ],
    mitigations: [
      'Vetting tools against the Red-Flag library prior to institutional procurement',
      'Assessment redesign focusing on authentic, multi-modal human performance',
    ],
    dateReported: '2025-03-22',
  },
  {
    id: 'rf-04',
    title: 'Systemic Overreliance & Writing Skill Erosion Study',
    category: 'overreliance',
    institutionOrContext: 'Multi-Institutional Pedagogical Research',
    caseSummary:
      'Research tracking students who used unguided GAI tools for all writing assignments showed measurable decline in original synthesis skills, critical reasoning, and heightened anxiety when required to perform in unassisted environments.',
    sourceUrl: 'https://link.springer.com/article/10.1007/s10639-024-12800-x',
    patternDescription:
      'Substituting fundamental cognitive practice with GAI output, producing performance without underlying competence.',
    warningSigns: [
      'Student inability to explain rationale behind GAI-generated text',
      'Absence of scaffolded AI literacy in introductory courses',
      'Over-reliance on automated summaries over primary source reading',
    ],
    mitigations: [
      'Mandated "human-only responsibility" zones in foundational courses',
      'Explicit instruction in epistemic judgment and source verification',
    ],
    dateReported: '2024-11-05',
  },
  {
    id: 'rf-05',
    title: 'Vendor Lock-In & Unsanctioned Student Data Mining',
    category: 'vendor_lock_in',
    institutionOrContext: 'Mid-Sized Private University Procurement',
    caseSummary:
      'A university signed an exclusive contract with a GAI vendor, only to discover later that the contract granted the vendor perpetual rights to train proprietary models on student research papers and thesis submissions without explicit opt-in consent.',
    sourceUrl: 'https://www.eff.org/deeplinks/student-privacy-ai-contracts',
    patternDescription:
      'Opaque vendor terms that turn institutional and student intellectual property into training data.',
    warningSigns: [
      'Contract lacks explicit data prohibition clauses for AI model training',
      'No exit strategy or data portability protocol',
      'Vendor refuses third-party security and privacy audits',
    ],
    mitigations: [
      'Enforce Overlay Pack data sovereignty requirements during procurement',
      'Require institutional legal review against Compass Principle XXVI',
    ],
    dateReported: '2025-06-18',
  },
];

const BASE_JOBS = [
  {
    jobId: 'evidence_refresh' as const,
    jobName: 'Evidence Ledger Watchlist Refresh',
    autonomyLevel: 'semi_automated',
    lastRunAt: '2026-08-07T04:00:00Z',
    nextRunDueAt: '2026-08-14T04:00:00Z',
    itemsProcessed: 12,
    status: 'idle' as const,
    lastResultSummary:
      'Processed 12 source feeds (EDUCAUSE, UNESCO, THE, Retraction Watch). Created 2 candidates in Evidence Staging for human review.',
  },
  {
    jobId: 'prediction_reconciliation' as const,
    jobName: 'Prediction Tracker Daily Reconciliation',
    autonomyLevel: 'fully_automated',
    lastRunAt: '2026-08-08T02:00:00Z',
    nextRunDueAt: '2026-08-09T02:00:00Z',
    itemsProcessed: 5,
    status: 'idle' as const,
    lastResultSummary:
      'Checked 5 active predictions. 1 prediction (pred-101) past target date; notification dispatched to author for resolution entry.',
  },
  {
    jobId: 'red_flag_scan' as const,
    jobName: 'Red-Flag Library Candidate Scan',
    autonomyLevel: 'semi_automated',
    lastRunAt: '2026-08-01T00:00:00Z',
    nextRunDueAt: '2026-09-01T00:00:00Z',
    itemsProcessed: 8,
    status: 'idle' as const,
    lastResultSummary:
      'Scanned legal/educational failure report feeds. 0 new red-flag candidates drafted.',
  },
];

export interface SeedInvite {
  email: string;
  role: TenantRole;
  title: string;
  governingBodyAffiliation: string;
}

function parseInvites(): SeedInvite[] {
  if (!process.env.SEED_INVITES) return [];
  const parsed = JSON.parse(process.env.SEED_INVITES) as SeedInvite[];
  if (!Array.isArray(parsed)) throw new Error('SEED_INVITES must be a JSON array.');
  return parsed;
}

function date(value: string | null | undefined): Date | null {
  return value ? new Date(value) : null;
}

export async function seedRsuTenant(options: { reset?: boolean; invites?: SeedInvite[] } = {}) {
  const baseline = buildRsuBaseline();
  const db = getDb();
  const tenantId = baseline.institution.id || RSU_TENANT_ID;

  await db.transaction(async (tx) => {
    if (options.reset) {
      await tx.delete(decisions).where(eq(decisions.tenantId, tenantId));
      await tx.delete(evidenceClaims).where(eq(evidenceClaims.tenantId, tenantId));
      await tx.delete(evidenceStaging).where(eq(evidenceStaging.tenantId, tenantId));
      await tx.delete(predictions).where(eq(predictions.tenantId, tenantId));
      await tx.delete(pulseSurveys).where(eq(pulseSurveys.tenantId, tenantId));
      await tx.delete(shadowAiReports).where(eq(shadowAiReports.tenantId, tenantId));
      await tx.delete(diagnosticItems).where(eq(diagnosticItems.tenantId, tenantId));
    }

    await tx
      .insert(overlayPacks)
      .values({
        ...baseline.overlayPack,
      })
      .onConflictDoUpdate({
        target: overlayPacks.id,
        set: {
          name: baseline.overlayPack.name,
          region: baseline.overlayPack.region,
          accreditationFrameworks: baseline.overlayPack.accreditationFrameworks,
          dataProtectionRegime: baseline.overlayPack.dataProtectionRegime,
          languagesSupported: baseline.overlayPack.languagesSupported,
          regionalCaseStudyFocus: baseline.overlayPack.regionalCaseStudyFocus,
          specialComplianceGates: baseline.overlayPack.specialComplianceGates,
          description: baseline.overlayPack.description,
          updatedAt: new Date(),
        },
      });

    const institution = baseline.institution;
    await tx
      .insert(institutions)
      .values({
        id: tenantId,
        name: institution.name,
        shortName: institution.shortName,
        missionStatement: institution.missionStatement,
        governanceType: institution.governanceType,
        academicGovernanceType: institution.academicGovernanceType,
        academicGovernanceBodyName: institution.academicGovernanceBodyName,
        provostOfficeName: institution.provostOfficeName,
        accreditors: institution.accreditors,
        legalJurisdiction: institution.legalJurisdiction,
        budgetTier: institution.budgetTier,
        enrollmentSize: institution.enrollmentSize,
        studentDemographics: institution.studentDemographics as unknown as Record<string, number>,
        currentAiPolicyStatus: institution.currentAiPolicyStatus,
        primaryLanguages: institution.primaryLanguages,
        activeOverlayPackId: institution.activeOverlayPackId,
        createdAt: date(institution.createdAt) || new Date(),
        updatedAt: date(institution.updatedAt) || new Date(),
      })
      .onConflictDoUpdate({
        target: institutions.id,
        set: {
          name: institution.name,
          shortName: institution.shortName,
          missionStatement: institution.missionStatement,
          governanceType: institution.governanceType,
          academicGovernanceType: institution.academicGovernanceType,
          academicGovernanceBodyName: institution.academicGovernanceBodyName,
          provostOfficeName: institution.provostOfficeName,
          accreditors: institution.accreditors,
          legalJurisdiction: institution.legalJurisdiction,
          budgetTier: institution.budgetTier,
          enrollmentSize: institution.enrollmentSize,
          studentDemographics: institution.studentDemographics as unknown as Record<string, number>,
          currentAiPolicyStatus: institution.currentAiPolicyStatus,
          primaryLanguages: institution.primaryLanguages,
          activeOverlayPackId: institution.activeOverlayPackId,
          updatedAt: new Date(),
        },
      });

    await tx.insert(diagnosticItems).values(
      baseline.diagnostics.map((item) => ({
        id: item.id,
        tenantId,
        name: item.name,
        category: item.category,
        isAvailable: item.isAvailable,
        notes: item.notes || null,
        dataReference: item.dataReference || null,
      })),
    );

    await tx.insert(evidenceClaims).values(
      baseline.claims.map((claim) => ({
        id: claim.id,
        tenantId,
        claimText: claim.claimText,
        sourceUrl: claim.sourceUrl,
        sourceName: claim.sourceName,
        confidenceTier: claim.confidenceTier,
        datePublished: claim.datePublished,
        dateAdded: claim.dateAdded,
        retractionStatus: claim.retractionStatus,
        tags: claim.tags,
        discipline: claim.discipline || null,
        program: claim.program || null,
      })),
    );

    await tx.insert(evidenceStaging).values(
      baseline.staging.map((item) => ({
        id: item.id,
        tenantId,
        claimText: item.claimText,
        sourceUrl: item.sourceUrl,
        sourceName: item.sourceName,
        confidenceTier: item.confidenceTier,
        datePublished: item.datePublished,
        discoveredAt: item.discoveredAt,
        status: item.status,
        rejectionReason: item.rejectionReason || null,
        reviewedBy: item.reviewedBy || null,
        reviewedAt: date(item.reviewedAt),
      })),
    );

    await tx.insert(decisions).values(
      baseline.decisions.map((item) => ({
        id: item.id,
        tenantId,
        title: item.title,
        summary: item.summary,
        domain: item.domain,
        touchesEnrollmentOrGrading: item.touchesEnrollmentOrGrading,
        humanApprovalGatePassed: item.humanApprovalGatePassed,
        humanDisposition: item.humanDisposition,
        dispositionNotes: item.dispositionNotes || null,
        dispositionSetBy: item.dispositionSetBy || null,
        dispositionSetAt: date(item.dispositionSetAt),
        recommendedAction: item.recommendedAction,
        recommendedActionNotes: item.recommendedActionNotes || null,
        implementationStatus: item.implementationStatus,
        isAiDrafted: item.isAiDrafted,
        generationMode: item.generationMode || null,
        kernelSectionIds: item.kernelSectionIds,
        createdAt: date(item.createdAt) || new Date(),
        updatedAt: date(item.updatedAt) || new Date(),
      })),
    );

    const signoffs = baseline.decisions.flatMap((item) =>
      [item.academicSignoff, item.administrativeSignoff]
        .filter((signoff): signoff is NonNullable<typeof signoff> => !!signoff)
        .map((signoff) => ({
          decisionId: item.id,
          tenantId,
          signoffType: signoff.signoffType,
          bodyName: signoff.bodyName,
          signerUid: null,
          signerMembershipId: null,
          signedByName: signoff.signedBy,
          status: signoff.status,
          resolutionNotes: signoff.resolutionNotes,
          signedAt: date(signoff.signedAt),
        })),
    );
    if (signoffs.length) await tx.insert(governanceSignoffs).values(signoffs);

    if (baseline.scenarios.length) {
      await tx.insert(scenarios).values(
        baseline.scenarios.map((item) => ({
          id: item.id,
          tenantId,
          decisionId: item.decisionId,
          scenarioType: item.scenarioType,
          title: item.title,
          description: item.description,
          keyAssumptions: item.keyAssumptions,
          nonTechDrivers: item.nonTechDrivers,
          reversibilityRating: item.reversibilityRating,
          isAiDrafted: item.isAiDrafted,
          generationMode: item.generationMode || null,
        })),
      );
    }

    if (baseline.stakeholderImpacts.length) {
      await tx.insert(stakeholderImpacts).values(
        baseline.stakeholderImpacts.map((item) => ({
          id: item.id,
          tenantId,
          decisionId: item.decisionId,
          stakeholderGroup: item.stakeholderGroup,
          benefitDescription: item.benefitDescription,
          costDescription: item.costDescription,
          powerShift: item.powerShift,
        })),
      );
    }

    if (baseline.predictions.length) {
      await tx.insert(predictions).values(
        baseline.predictions.map((item) => ({
          id: item.id,
          tenantId,
          predictionText: item.predictionText,
          madeByUserId: item.madeByUserId,
          madeByUserName: item.madeByUserName,
          madeByRole: item.madeByRole,
          dateMade: item.dateMade,
          targetDate: item.targetDate,
          actualOutcome: item.actualOutcome || null,
          resolutionStatus: item.resolutionStatus,
          lessonsLearned: item.lessonsLearned || null,
          scopeLevel: item.scopeLevel,
        })),
      );
    }

    if (baseline.pulseSurveys.length) {
      await tx.insert(pulseSurveys).values(
        baseline.pulseSurveys.map((item) => ({
          id: item.id,
          tenantId,
          role: item.role,
          disciplineOrProgram: item.disciplineOrProgram,
          aiUsageFrequency: item.aiUsageFrequency,
          primaryToolsUsed: item.primaryToolsUsed,
          perceivedAcademicValue: item.perceivedAcademicValue,
          perceivedIntegrityRisk: item.perceivedIntegrityRisk,
          comments: item.comments,
          createdAt: date(item.createdAt) || new Date(),
        })),
      );
    }

    if (baseline.shadowReports.length) {
      await tx.insert(shadowAiReports).values(
        baseline.shadowReports.map((item) => ({
          id: item.id,
          tenantId,
          reportedByRole: item.reportedByRole,
          departmentOrCourse: item.departmentOrCourse,
          toolOrUseName: item.toolOrUseName,
          description: item.description,
          perceivedRiskType: item.perceivedRiskType,
          status: item.status,
          actionTaken: item.actionTaken || null,
          createdAt: date(item.createdAt) || new Date(),
        })),
      );
    }

    await tx.delete(redFlags);
    await tx.insert(redFlags).values(
      [...LEGACY_RED_FLAGS, ...baseline.extraRedFlags].map((item) => ({
        id: item.id,
        title: item.title,
        category: item.category,
        institutionOrContext: item.institutionOrContext,
        caseSummary: item.caseSummary,
        sourceUrl: item.sourceUrl,
        patternDescription: item.patternDescription,
        warningSigns: item.warningSigns,
        mitigations: item.mitigations,
        dateReported: item.dateReported,
      })),
    );

    for (const job of BASE_JOBS) {
      await tx
        .insert(jobs)
        .values(job)
        .onConflictDoUpdate({
          target: jobs.jobId,
          set: {
            jobName: job.jobName,
            autonomyLevel: job.autonomyLevel,
            lastRunAt: job.lastRunAt,
            nextRunDueAt: job.nextRunDueAt,
            itemsProcessed: job.itemsProcessed,
            status: job.status,
            lastResultSummary: job.lastResultSummary,
            updatedAt: new Date(),
          },
        });
    }

    for (const invite of options.invites || []) {
      await tx
        .insert(invites)
        .values({
          tenantId,
          email: invite.email.trim().toLowerCase(),
          role: invite.role,
          title: invite.title,
          governingBodyAffiliation: invite.governingBodyAffiliation,
          status: 'pending',
        })
        .onConflictDoUpdate({
          target: [invites.email, invites.tenantId],
          set: {
            role: invite.role,
            title: invite.title,
            governingBodyAffiliation: invite.governingBodyAffiliation,
            status: 'pending',
            acceptedAt: null,
            acceptedByUid: null,
            updatedAt: new Date(),
          },
        });
    }
  });

  return {
    tenantId,
    decisions: baseline.decisions.length,
    claims: baseline.claims.length,
    scenarios: baseline.scenarios.length,
    diagnostics: baseline.diagnostics.length,
  };
}

export async function seedFromEnvironment() {
  if (!config.demoMode) {
    throw new Error('Set DEMO_MODE=true before seeding the resettable RSU demo tenant.');
  }
  const invites = parseInvites();
  return seedRsuTenant({ reset: true, invites });
}
