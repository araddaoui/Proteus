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
  RedFlagStagingItem,
  PulseSurveyResponse,
  ShadowAiReport,
  JobExecutionStatus,
  InstitutionalDiagnosticItem,
} from '../types';
import { buildRsuBaseline } from '../sandbox/rsuSeed';

// Deep clone so the live database never shares mutable references with the
// RSU baseline module constants. Mutating a seeded record (e.g. setting a
// disposition) must never corrupt the pristine baseline used by reset.
function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// ---------------------------------------------------------------------------
// Non-RSU seed data. `inst-1` is reserved for the Ruritania State University
// sandbox baseline (see src/sandbox/rsuSeed.ts); the other demo tenants and the
// legacy cross-institution red-flag library remain here.
// ---------------------------------------------------------------------------

const BASE_INSTITUTIONS: Institution[] = [
  {
    id: 'inst-2',
    name: 'Tecnológico de Monterrey (Partner Campus)',
    shortName: 'TecMonterrey',
    missionStatement: 'Educating leaders with entrepreneurial spirit, humanistic outlook, and international competitiveness.',
    governanceType: 'private',
    academicGovernanceType: 'scientific_council',
    academicGovernanceBodyName: 'Faculty Scientific & Academic Council',
    provostOfficeName: 'Vice-Rectorate for Academic Affairs & Faculty',
    accreditors: ['FIMPES', 'SACSCOC International'],
    legalJurisdiction: 'Mexico (Ley General de Educación Superior)',
    budgetTier: 'Tier 1 R1 ($1B+)',
    enrollmentSize: 92000,
    studentDemographics: {
      undergraduatePercent: 80,
      graduatePercent: 20,
      internationalPercent: 8,
      firstGenPercent: 22,
      pellEligiblePercent: 25,
    },
    currentAiPolicyStatus: 'formal',
    primaryLanguages: ['Spanish', 'English'],
    activeOverlayPackId: 'pack-us-ferpa',
    createdAt: '2026-02-01T08:00:00Z',
    updatedAt: '2026-08-02T10:00:00Z',
  },
  {
    id: 'inst-3',
    name: 'Université Internationale de la Méditerranée (UIM)',
    shortName: 'UIM MENA',
    missionStatement: 'Promoting interdisciplinary research, Francophone/Arabophone scholarship, and equitable regional innovation.',
    governanceType: 'hybrid',
    academicGovernanceType: 'scientific_council',
    academicGovernanceBodyName: 'Conseil Scientifique et Pédagogique (Scientific Council)',
    provostOfficeName: 'Direction des Affaires Académiques et de la Recherche',
    accreditors: ['HCRES France', 'Arab League Quality Assurance Network'],
    legalJurisdiction: 'MENA / Francophone Dual Jurisdiction (GDPR-Aligned)',
    budgetTier: 'Medium ($50M-$250M)',
    enrollmentSize: 16400,
    studentDemographics: {
      undergraduatePercent: 68,
      graduatePercent: 32,
      internationalPercent: 29,
      firstGenPercent: 41,
      pellEligiblePercent: 45,
    },
    currentAiPolicyStatus: 'drafting',
    primaryLanguages: ['French', 'Arabic', 'English'],
    activeOverlayPackId: 'pack-mena-francophone',
    createdAt: '2026-03-10T08:00:00Z',
    updatedAt: '2026-08-05T10:00:00Z',
  },
];

const BASE_OVERLAY_PACKS: OverlayPack[] = [
  {
    id: 'pack-us-ferpa',
    name: 'US Higher Ed (FERPA & SACSCOC / WASC)',
    region: 'North America (United States)',
    accreditationFrameworks: ['SACSCOC Substantive Change Guidance', 'NWCCU Standard 1.C', 'DEAC Distance Ed Rules'],
    dataProtectionRegime: 'FERPA',
    languagesSupported: ['English', 'Spanish'],
    regionalCaseStudyFocus: 'US Public Universities & Community College Financial Sustainability',
    specialComplianceGates: [
      'Mandatory Human Review for Financial Aid Eligibility & Course Withdrawal',
      'FERPA Student Directory Data Prohibition in External Model Training',
      'Faculty Governance Consultation on Syllabus AI Restrictions',
    ],
    description: 'Standard US higher education overlay ensuring compliance with FERPA student privacy rules, US regional accreditor substantive change rules, and ADA Title II accessibility.',
  },
  {
    id: 'pack-mena-francophone',
    name: 'MENA & Francophone Cross-Border Pack',
    region: 'Middle East, North Africa & Francophone Sphere',
    accreditationFrameworks: ['HCRES (High Council for Evaluation of Research)', 'Arab Network for Quality Assurance in HE (ANQAHE)'],
    dataProtectionRegime: 'MENA_PDPL',
    languagesSupported: ['French', 'Arabic', 'English'],
    regionalCaseStudyFocus: 'Trilingual AI Literacy, Cross-Border Student Mobility & Sovereignty',
    specialComplianceGates: [
      'Local Data Sovereignty Gate for Research Repositories',
      'Trilingual AI Curriculum Audit (French / Arabic / English)',
      'Council of Europe AI & Human Rights Framework Checklist',
    ],
    description: 'Designed specifically for MENA and Francophone universities requiring multilingual support, Arab League/French accreditation alignment, and national data sovereignty safeguards.',
  },
  {
    id: 'pack-eu-gdpr',
    name: 'EU AI Act & European Higher Education Area (EHEA)',
    region: 'European Union & EHEA',
    accreditationFrameworks: ['ESG (Standards and Guidelines for QA in EHEA)', 'EU AI Act High-Risk Educational Systems Standard'],
    dataProtectionRegime: 'GDPR',
    languagesSupported: ['English', 'French', 'German', 'Spanish'],
    regionalCaseStudyFocus: 'EU AI Act Compliance for Automated Assessment & Access Systems',
    specialComplianceGates: [
      'Article 6 EU AI Act High-Risk Impact Assessment for Exam Monitoring',
      'GDPR Right to Explanation for Algorithmic Student Profiling',
      'Works Council & Academic Senate Co-Determination Requirement',
    ],
    description: 'Strict European overlay enforcing the EU AI Act’s high-risk educational classification (August 2024), GDPR data minimization, and EHEA student participation.',
  },
];

const LEGACY_RED_FLAGS: RedFlagCase[] = [
  {
    id: 'rf-01',
    title: 'Texas A&M Senior Diploma Hold False Alarm',
    category: 'integrity_collapse',
    institutionOrContext: 'US Public University (Texas A&M)',
    caseSummary: 'A professor ran senior capstone essays through a popular GAI chatbot, asking if it wrote them. The chatbot falsely claimed authorship, leading to temporary diploma holds for graduating seniors until university leadership intervened to manually review and exonerate the students.',
    sourceUrl: 'https://www.rollingstone.com/culture/culture-news/texas-am-chatgpt-ai-professor-flunk-graduates-1234737233/',
    patternDescription: 'Using generative AI tools as authoritative plagiarism detectors despite known hallucination tendencies.',
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
    caseSummary: 'An online institution replaced core course instructors with an automated chatbot. Students had no contact with human faculty, and the bot autonomously processed course withdrawals, grading, and enrollment status changes. Accreditors subsequently sanctioned the institution for failing to provide regular and substantive faculty-student interaction.',
    sourceUrl: 'https://www.chronicle.com/article/when-ai-replaces-the-professor',
    patternDescription: 'Complete automation of instruction and enrollment decisions, eliminating human-in-the-loop oversight.',
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
    caseSummary: 'A commercial startup launched an AI assistant marketed to "watch lectures and complete coursework." Within 72 hours of viral adoption, the tool was pulled offline following massive backlash from universities, data protection regulators, and cheating concerns.',
    sourceUrl: 'https://www.wired.com/story/ai-homework-tool-pulled-backlash/',
    patternDescription: 'Fast-launched AI products with short half-lives that promise complete homework automation without pedagogical grounding.',
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
    caseSummary: 'Research tracking students who used unguided GAI tools for all writing assignments showed measurable decline in original synthesis skills, critical reasoning, and heightened anxiety when required to perform in unassisted environments.',
    sourceUrl: 'https://link.springer.com/article/10.1007/s10639-024-12800-x',
    patternDescription: 'Substituting fundamental cognitive practice with GAI output, producing performance without underlying competence.',
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
    caseSummary: 'A university signed an exclusive contract with an GAI vendor, only to discover later that the contract granted the vendor perpetual rights to train proprietary models on student research papers and thesis submissions without explicit opt-in consent.',
    sourceUrl: 'https://www.eff.org/deeplinks/student-privacy-ai-contracts',
    patternDescription: 'Opaque vendor terms that turn institutional and student intellectual property into training data.',
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

const BASE_JOB_STATUSES: JobExecutionStatus[] = [
  {
    jobId: 'evidence_refresh',
    jobName: 'Evidence Ledger Watchlist Refresh',
    autonomyLevel: 'semi_automated',
    lastRunAt: '2026-08-07T04:00:00Z',
    nextRunDueAt: '2026-08-14T04:00:00Z',
    itemsProcessed: 12,
    status: 'idle',
    lastResultSummary: 'Processed 12 source feeds (EDUCAUSE, UNESCO, THE, Retraction Watch). Created 2 candidates in Evidence Staging for human review.',
  },
  {
    jobId: 'prediction_reconciliation',
    jobName: 'Prediction Tracker Daily Reconciliation',
    autonomyLevel: 'fully_automated',
    lastRunAt: '2026-08-08T02:00:00Z',
    nextRunDueAt: '2026-08-09T02:00:00Z',
    itemsProcessed: 5,
    status: 'idle',
    lastResultSummary: 'Checked 5 active predictions. 1 prediction (pred-101) past target date; notification dispatched to author for resolution entry.',
  },
  {
    jobId: 'red_flag_scan',
    jobName: 'Red-Flag Library Candidate Scan',
    autonomyLevel: 'semi_automated',
    lastRunAt: '2026-08-01T00:00:00Z',
    nextRunDueAt: '2026-09-01T00:00:00Z',
    itemsProcessed: 8,
    status: 'idle',
    lastResultSummary: 'Scanned legal/educational failure report feeds. 0 new red-flag candidates drafted.',
  },
];

interface SeedSnapshot {
  institutions: Institution[];
  overlayPacks: OverlayPack[];
  evidenceClaims: EvidenceClaim[];
  evidenceStaging: EvidenceStagingItem[];
  decisions: DecisionRecord[];
  scenarios: ScenarioEntry[];
  stakeholderImpacts: StakeholderImpact[];
  predictions: PredictionRecord[];
  redFlags: RedFlagCase[];
  pulseSurveys: PulseSurveyResponse[];
  shadowAiReports: ShadowAiReport[];
  diagnosticItems: Record<string, InstitutionalDiagnosticItem[]>;
  jobStatuses: JobExecutionStatus[];
}

export class RelationalDatabase {
  institutions: Institution[] = [];
  overlayPacks: OverlayPack[] = [];
  evidenceClaims: EvidenceClaim[] = [];
  evidenceStaging: EvidenceStagingItem[] = [];
  decisions: DecisionRecord[] = [];
  scenarios: ScenarioEntry[] = [];
  stakeholderImpacts: StakeholderImpact[] = [];
  predictions: PredictionRecord[] = [];
  redFlags: RedFlagCase[] = [];
  pulseSurveys: PulseSurveyResponse[] = [];
  shadowAiReports: ShadowAiReport[] = [];
  jobStatuses: JobExecutionStatus[] = [];
  // 32-Item Institutional Diagnostic Checklist (Section VI), per tenant.
  diagnosticItems: Record<string, InstitutionalDiagnosticItem[]> = {};

  private baseline!: SeedSnapshot;

  constructor() {
    this.applyBaseline();
    this.captureBaseline();
    this.loadPersistence();
  }

  // Seeds the live database from the pristine RSU sandbox baseline plus the
  // shared non-RSU demo tenants, overlay packs, legacy red flags and jobs.
  private applyBaseline() {
    const rsu = buildRsuBaseline();
    this.institutions = [rsu.institution, ...clone(BASE_INSTITUTIONS)];
    this.overlayPacks = [rsu.overlayPack, ...clone(BASE_OVERLAY_PACKS)];
    this.evidenceClaims = rsu.claims;
    this.evidenceStaging = rsu.staging;
    this.decisions = rsu.decisions;
    this.scenarios = rsu.scenarios;
    this.stakeholderImpacts = rsu.stakeholderImpacts;
    this.predictions = rsu.predictions;
    this.redFlags = [...clone(LEGACY_RED_FLAGS), ...rsu.extraRedFlags];
    this.pulseSurveys = rsu.pulseSurveys;
    this.shadowAiReports = rsu.shadowReports;
    this.diagnosticItems = { 'inst-1': rsu.diagnostics };
    this.jobStatuses = clone(BASE_JOB_STATUSES);
  }

  // Freezes the seeded state as the reset point. Captured BEFORE any local
  // persistence is loaded so a reset always restores the true baseline.
  private captureBaseline() {
    this.baseline = clone({
      institutions: this.institutions,
      overlayPacks: this.overlayPacks,
      evidenceClaims: this.evidenceClaims,
      evidenceStaging: this.evidenceStaging,
      decisions: this.decisions,
      scenarios: this.scenarios,
      stakeholderImpacts: this.stakeholderImpacts,
      predictions: this.predictions,
      redFlags: this.redFlags,
      pulseSurveys: this.pulseSurveys,
      shadowAiReports: this.shadowAiReports,
      diagnosticItems: this.diagnosticItems,
      jobStatuses: this.jobStatuses,
    });
  }

  // Restores every collection to the RSU sandbox baseline. Used by the local
  // dev sandbox reset control (POST /api/sandbox/reset).
  public resetToBaseline(): { ok: true; counts: Record<string, number> } {
    const b = this.baseline;
    this.institutions = clone(b.institutions);
    this.overlayPacks = clone(b.overlayPacks);
    this.evidenceClaims = clone(b.evidenceClaims);
    this.evidenceStaging = clone(b.evidenceStaging);
    this.decisions = clone(b.decisions);
    this.scenarios = clone(b.scenarios);
    this.stakeholderImpacts = clone(b.stakeholderImpacts);
    this.predictions = clone(b.predictions);
    this.redFlags = clone(b.redFlags);
    this.pulseSurveys = clone(b.pulseSurveys);
    this.shadowAiReports = clone(b.shadowAiReports);
    this.diagnosticItems = clone(b.diagnosticItems);
    this.jobStatuses = clone(b.jobStatuses);
    this.persist();
    return {
      ok: true,
      counts: {
        institutions: this.institutions.length,
        overlayPacks: this.overlayPacks.length,
        evidenceClaims: this.evidenceClaims.length,
        evidenceStaging: this.evidenceStaging.length,
        decisions: this.decisions.length,
        scenarios: this.scenarios.length,
        stakeholderImpacts: this.stakeholderImpacts.length,
        predictions: this.predictions.length,
        redFlags: this.redFlags.length,
        pulseSurveys: this.pulseSurveys.length,
        shadowAiReports: this.shadowAiReports.length,
        jobStatuses: this.jobStatuses.length,
      },
    };
  }

  private loadPersistence() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem('proteus_store');
        if (raw) {
          const data = JSON.parse(raw);
          if (data.institutions && Array.isArray(data.institutions)) this.institutions = data.institutions;
          if (data.overlayPacks && Array.isArray(data.overlayPacks)) this.overlayPacks = data.overlayPacks;
          if (data.evidenceClaims && Array.isArray(data.evidenceClaims)) this.evidenceClaims = data.evidenceClaims;
          if (data.evidenceStaging && Array.isArray(data.evidenceStaging)) this.evidenceStaging = data.evidenceStaging;
          if (data.decisions && Array.isArray(data.decisions)) this.decisions = data.decisions;
          if (data.scenarios && Array.isArray(data.scenarios)) this.scenarios = data.scenarios;
          if (data.stakeholderImpacts && Array.isArray(data.stakeholderImpacts)) this.stakeholderImpacts = data.stakeholderImpacts;
          if (data.predictions && Array.isArray(data.predictions)) this.predictions = data.predictions;
          if (data.pulseSurveys && Array.isArray(data.pulseSurveys)) this.pulseSurveys = data.pulseSurveys;
          if (data.shadowAiReports && Array.isArray(data.shadowAiReports)) this.shadowAiReports = data.shadowAiReports;
          if (data.diagnosticItems && typeof data.diagnosticItems === 'object') this.diagnosticItems = data.diagnosticItems;
        }
      }
    } catch (err) {
      console.warn('Failed to load DB from local storage, continuing with in-memory seed:', err);
    }
  }

  public persist() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const data = {
          institutions: this.institutions,
          overlayPacks: this.overlayPacks,
          evidenceClaims: this.evidenceClaims,
          evidenceStaging: this.evidenceStaging,
          decisions: this.decisions,
          scenarios: this.scenarios,
          stakeholderImpacts: this.stakeholderImpacts,
          predictions: this.predictions,
          pulseSurveys: this.pulseSurveys,
          shadowAiReports: this.shadowAiReports,
          diagnosticItems: this.diagnosticItems,
        };
        window.localStorage.setItem('proteus_store', JSON.stringify(data));
      }
    } catch (err) {
      console.warn('Failed to persist DB to storage:', err);
    }
  }

  // Helper getters and mutation methods with strict business rules
  getInstitution(id: string): Institution | undefined {
    return this.institutions.find(i => i.id === id);
  }

  updateInstitution(updated: Institution): Institution {
    const idx = this.institutions.findIndex(i => i.id === updated.id);
    if (idx >= 0) {
      this.institutions[idx] = { ...updated, updatedAt: new Date().toISOString() };
      this.persist();
      return this.institutions[idx];
    }
    this.institutions.push(updated);
    this.persist();
    return updated;
  }

  getClaims(tenantId: string): EvidenceClaim[] {
    return this.evidenceClaims.filter(c => c.tenantId === tenantId);
  }

  addClaim(claim: Omit<EvidenceClaim, 'id' | 'dateAdded'>): EvidenceClaim {
    if (!claim.sourceUrl || claim.sourceUrl.trim() === '') {
      throw new Error('EVIDENCE_LEDGER_CONSTRAINT_VIOLATION: Factual claims require a valid source_url.');
    }
    const newClaim: EvidenceClaim = {
      ...claim,
      id: `claim-${Date.now()}`,
      dateAdded: new Date().toISOString().split('T')[0]
    };
    this.evidenceClaims.unshift(newClaim);
    this.persist();
    return newClaim;
  }

  getDecisions(tenantId: string): DecisionRecord[] {
    return this.decisions.filter(d => d.tenantId === tenantId);
  }

  addDecision(decision: Omit<DecisionRecord, 'id' | 'createdAt' | 'updatedAt'>): DecisionRecord {
    const newDec: DecisionRecord = {
      ...decision,
      id: `dec-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.decisions.unshift(newDec);
    this.persist();
    return newDec;
  }

  updateDecisionDisposition(
    id: string,
    disposition: 'pending' | 'accepted' | 'rejected' | 'modified',
    notes: string,
    setBy: string
  ): DecisionRecord {
    const dec = this.decisions.find(d => d.id === id);
    if (!dec) throw new Error('Decision not found');

    dec.humanDisposition = disposition;
    dec.dispositionNotes = notes;
    dec.dispositionSetBy = setBy;
    dec.dispositionSetAt = new Date().toISOString();
    dec.updatedAt = new Date().toISOString();
    this.persist();

    return dec;
  }

  updateRecommendedAction(
    id: string,
    recommendedAction: DecisionRecord['recommendedAction'],
    notes: string
  ): DecisionRecord {
    const dec = this.decisions.find(d => d.id === id);
    if (!dec) throw new Error('Decision not found');

    dec.recommendedAction = recommendedAction;
    dec.recommendedActionNotes = notes;
    dec.updatedAt = new Date().toISOString();
    this.persist();

    return dec;
  }

  updateDecisionStatus(id: string, newStatus: DecisionRecord['implementationStatus']): DecisionRecord {
    const dec = this.decisions.find(d => d.id === id);
    if (!dec) throw new Error('Decision not found');

    // Rule 1: Cannot mark implemented if human_disposition is null or pending
    if (newStatus === 'implemented' && (!dec.humanDisposition || dec.humanDisposition === 'pending')) {
      throw new Error('GOVERNANCE_GUARDRAIL_VIOLATION: Every recommendation requires an explicit human disposition (accepted/rejected/modified) set by a human user before implementation.');
    }

    // Rule 1b: Cannot mark implemented without an explicit recommendedAction.
    if (newStatus === 'implemented' && !dec.recommendedAction) {
      throw new Error('RECOMMENDED_ACTION_REQUIRED: Every decision must reach an explicit recommended action (adopt/pilot/investigate_further/do_not_adopt/do_not_use_ai) before implementation. "Do not adopt" is a legitimate, equally valid outcome — it must still be explicitly set, not left blank.');
    }

    // Rule 2: Dual Academic + Administrative Governance Signoff requirement
    if (newStatus === 'implemented' && dec.touchesEnrollmentOrGrading) {
      const academicApproved = dec.academicSignoff?.status === 'approved';
      const adminApproved = dec.administrativeSignoff?.status === 'approved';

      if (!academicApproved || !adminApproved) {
        const academicBody = dec.academicSignoff?.bodyName || 'Faculty Senate / Scientific Council';
        const adminBody = dec.administrativeSignoff?.bodyName || 'Office of the Provost';
        throw new Error(`DUAL_GOVERNANCE_VIOLATION: Section II & XIV mandate dual-signature approval. Implementation blocked until affirmative authorization is signed by BOTH the Academic Body (${academicBody}) and Administrative Leadership (${adminBody}). Current status: Academic: ${dec.academicSignoff?.status || 'unsubmitted'}, Admin: ${dec.administrativeSignoff?.status || 'unsubmitted'}.`);
      }
    }

    // Rule 3: Hardcoded human approval gate for grading/enrollment decisions
    if (newStatus === 'implemented' && dec.touchesEnrollmentOrGrading && !dec.humanApprovalGatePassed) {
      throw new Error('CRITICAL_SAFETY_GATE_VIOLATION: Any workflow touching enrollment status, grading, or degree progress has a hard-coded human-approval gate that cannot be bypassed.');
    }

    dec.implementationStatus = newStatus;
    dec.updatedAt = new Date().toISOString();
    this.persist();
    return dec;
  }

  recordGovernanceSignoff(
    decisionId: string,
    signoffType: 'academic' | 'administrative',
    status: 'approved' | 'rejected' | 'pending' | 'conditional',
    resolutionNotes: string,
    signedBy: string
  ): DecisionRecord {
    const dec = this.decisions.find(d => d.id === decisionId);
    if (!dec) throw new Error('Decision not found');
    const inst = this.getInstitution(dec.tenantId) || this.institutions[0];

    const bodyName = signoffType === 'academic'
      ? inst.academicGovernanceBodyName
      : inst.provostOfficeName;

    const signoffRecord = {
      signoffType,
      bodyName,
      signedBy: signedBy || (signoffType === 'academic' ? 'Faculty Governance Presiding Officer' : 'Chief Academic Officer'),
      signedAt: new Date().toISOString(),
      status,
      resolutionNotes
    };

    if (signoffType === 'academic') {
      dec.academicSignoff = signoffRecord;
    } else {
      dec.administrativeSignoff = signoffRecord;
    }

    // Auto-update humanApprovalGatePassed if both approved
    if (dec.academicSignoff?.status === 'approved' && dec.administrativeSignoff?.status === 'approved') {
      dec.humanApprovalGatePassed = true;
    } else {
      dec.humanApprovalGatePassed = false;
    }

    dec.updatedAt = new Date().toISOString();
    this.persist();
    return dec;
  }

  setHumanApprovalGate(id: string, passed: boolean): DecisionRecord {
    const dec = this.decisions.find(d => d.id === id);
    if (!dec) throw new Error('Decision not found');
    dec.humanApprovalGatePassed = passed;
    dec.updatedAt = new Date().toISOString();
    this.persist();
    return dec;
  }

  getScenariosForDecision(decisionId: string): ScenarioEntry[] {
    return this.scenarios.filter(s => s.decisionId === decisionId);
  }

  addScenarios(newScenarios: Omit<ScenarioEntry, 'id'>[]): ScenarioEntry[] {
    const added: ScenarioEntry[] = newScenarios.map((s, idx) => ({
      ...s,
      id: `scen-${Date.now()}-${idx}`
    }));
    this.scenarios.push(...added);
    this.persist();
    return added;
  }

  getStakeholdersForDecision(decisionId: string): StakeholderImpact[] {
    return this.stakeholderImpacts.filter(s => s.decisionId === decisionId);
  }

  getPredictions(tenantId: string): PredictionRecord[] {
    return this.predictions.filter(p => p.tenantId === tenantId);
  }

  addPrediction(pred: Omit<PredictionRecord, 'id' | 'dateMade'>): PredictionRecord {
    const newPred: PredictionRecord = {
      ...pred,
      id: `pred-${Date.now()}`,
      dateMade: new Date().toISOString().split('T')[0]
    };
    this.predictions.unshift(newPred);
    this.persist();
    return newPred;
  }

  resolvePrediction(id: string, resolutionStatus: PredictionRecord['resolutionStatus'], actualOutcome: string, lessonsLearned: string): PredictionRecord {
    const pred = this.predictions.find(p => p.id === id);
    if (!pred) throw new Error('Prediction not found');
    pred.resolutionStatus = resolutionStatus;
    pred.actualOutcome = actualOutcome;
    pred.lessonsLearned = lessonsLearned;
    this.persist();
    return pred;
  }

  getRedFlags(): RedFlagCase[] {
    return this.redFlags;
  }

  addPulseSurvey(pulse: Omit<PulseSurveyResponse, 'id' | 'createdAt'>): PulseSurveyResponse {
    const newPulse: PulseSurveyResponse = {
      ...pulse,
      id: `pulse-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    this.pulseSurveys.unshift(newPulse);
    this.persist();
    return newPulse;
  }

  addShadowAiReport(report: Omit<ShadowAiReport, 'id' | 'createdAt' | 'status'>): ShadowAiReport {
    const newRep: ShadowAiReport = {
      ...report,
      id: `sh-${Date.now()}`,
      status: 'flagged',
      createdAt: new Date().toISOString()
    };
    this.shadowAiReports.unshift(newRep);
    this.persist();
    return newRep;
  }

  approveStagingEvidence(stagingId: string, reviewer: string): EvidenceClaim {
    const item = this.evidenceStaging.find(s => s.id === stagingId);
    if (!item) throw new Error('Staging item not found');
    item.status = 'approved';
    item.reviewedBy = reviewer;
    item.reviewedAt = new Date().toISOString();

    const claim = this.addClaim({
      tenantId: item.tenantId,
      claimText: item.claimText,
      sourceUrl: item.sourceUrl,
      sourceName: item.sourceName,
      confidenceTier: item.confidenceTier,
      datePublished: item.datePublished,
      retractionStatus: 'active',
      tags: ['staging_approved', 'automated_refresh']
    });
    this.persist();
    return claim;
  }

  rejectStagingEvidence(stagingId: string, reason: string, reviewer: string) {
    const item = this.evidenceStaging.find(s => s.id === stagingId);
    if (!item) throw new Error('Staging item not found');
    item.status = 'rejected';
    item.rejectionReason = reason;
    item.reviewedBy = reviewer;
    item.reviewedAt = new Date().toISOString();
    this.persist();
  }

  getDiagnosticsForTenant(tenantId: string) {
    if (!this.diagnosticItems[tenantId]) {
      // Default to cloned inst-1 checklist
      this.diagnosticItems[tenantId] = this.diagnosticItems['inst-1'].map(item => ({ ...item }));
    }
    return this.diagnosticItems[tenantId];
  }

  toggleDiagnosticAvailability(tenantId: string, diagId: string, isAvailable: boolean, notes?: string) {
    const list = this.getDiagnosticsForTenant(tenantId);
    const item = list.find(d => d.id === diagId);
    if (!item) throw new Error('Diagnostic item not found');
    item.isAvailable = isAvailable;
    if (notes !== undefined) item.notes = notes;
    this.persist();
    return item;
  }

  runJob(jobId: 'evidence_refresh' | 'prediction_reconciliation' | 'red_flag_scan'): JobExecutionStatus {
    const job = this.jobStatuses.find(j => j.jobId === jobId);
    if (!job) throw new Error('Job not found');

    job.status = 'running';
    const now = new Date();

    if (jobId === 'evidence_refresh') {
      const newStaging: EvidenceStagingItem = {
        id: `stage-${Date.now()}`,
        tenantId: 'inst-1',
        claimText: `Automated Scan (${now.toLocaleDateString()}): New EDUCAUSE briefing notes 76% of CIOs prioritizing AI ethics reviews over automated Proctoring tools.`,
        sourceUrl: 'https://library.educause.edu/resources/2026/1/ai-horizon-report',
        sourceName: 'EDUCAUSE Horizon Watch 2026',
        confidenceTier: 'journalistic',
        datePublished: now.toISOString().split('T')[0],
        discoveredAt: now.toISOString(),
        status: 'pending_review'
      };
      this.evidenceStaging.unshift(newStaging);
      job.itemsProcessed += 1;
      job.lastResultSummary = `Scanned watchlist domains. Inserted 1 candidate entry into Evidence Staging. Human approval required before live ledger entry.`;
    } else if (jobId === 'prediction_reconciliation') {
      const pastDue = this.predictions.filter(p => p.resolutionStatus === 'pending' && new Date(p.targetDate) <= now);
      job.itemsProcessed = pastDue.length;
      job.lastResultSummary = `Reconciliation completed. Found ${pastDue.length} past-due predictions requiring user resolution. Dispatched notification logs.`;
    } else if (jobId === 'red_flag_scan') {
      job.itemsProcessed = 1;
      job.lastResultSummary = `Scanned international academic governance feeds. Zero critical red-flag breaches found in past 30 days.`;
    }

    job.lastRunAt = now.toISOString();
    job.nextRunDueAt = new Date(now.getTime() + 86400000 * 7).toISOString();
    job.status = 'idle';
    this.persist();

    return job;
  }
}

export const db = new RelationalDatabase();
