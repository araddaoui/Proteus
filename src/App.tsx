import React, { useCallback, useEffect, useRef, useState } from 'react';
import type {
  Capability,
  DecisionRecord,
  EvidenceClaim,
  EvidenceStagingItem,
  Institution,
  JobExecutionStatus,
  OverlayPack,
  PredictionRecord,
  PulseSurveyResponse,
  RedFlagCase,
  ScenarioEntry,
  ShadowAiReport,
  StakeholderImpact,
  UserRole,
} from './types';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { LandingPageView } from './components/LandingPageView';
import { PersonaAuthModal } from './components/PersonaAuthModal';
import { DashboardOverview } from './components/DashboardOverview';
import { InstitutionalProfileView } from './components/InstitutionalProfileView';
import { EvidenceLedgerView } from './components/EvidenceLedgerView';
import { ScenarioEngineView } from './components/ScenarioEngineView';
import { StakeholderLedgerView } from './components/StakeholderLedgerView';
import { PredictionTrackerView } from './components/PredictionTrackerView';
import { RedFlagLibraryView } from './components/RedFlagLibraryView';
import { GrassrootsInputView } from './components/GrassrootsInputView';
import { KernelVersionManager } from './components/KernelVersionManager';
import { JobsAndGovernanceView } from './components/JobsAndGovernanceView';
import { CompassMasterView } from './components/CompassMasterView';
import { AdminManagementView } from './components/AdminManagementView';
import { LegalPage } from './components/LegalPage';
import { getLegalDocForPath } from './legal/legalDocs';
import { ApiError } from './services/api';
import { RSU_INSTITUTION, RSU_OVERLAY_PACK } from './sandbox/rsuSeed';

const FALLBACK_INSTITUTION: Institution = RSU_INSTITUTION;
const FALLBACK_INSTITUTIONS: Institution[] = [FALLBACK_INSTITUTION];

export default function App() {
  return (
    <AuthProvider>
      <ProteusRoot />
    </AuthProvider>
  );
}

function usePathname(): string {
  const [pathname, setPathname] = useState(() => window.location.pathname);
  useEffect(() => {
    const onChange = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onChange);
    return () => window.removeEventListener('popstate', onChange);
  }, []);
  return pathname;
}

function ProteusRoot() {
  const pathname = usePathname();
  const legalDoc = getLegalDocForPath(pathname);
  const { user, isLoggedIn, isLoading, memberships, logout } = useAuth();
  const [view, setView] = useState<'landing' | 'workspace'>('landing');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && isLoggedIn && memberships.length > 0) setView('workspace');
    if (!isLoading && !isLoggedIn) setView('landing');
  }, [isLoading, isLoggedIn, memberships.length]);

  const handleIdentityConfirmed = () => {
    setView('workspace');
  };

  if (legalDoc) {
    return <LegalPage doc={legalDoc} />;
  }

  return (
    <>
      {view === 'landing' && (
        <LandingPageView
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onReturnToWorkspace={() => setView('workspace')}
          onExit={logout}
          isLoggedIn={isLoggedIn}
          currentUser={user}
        />
      )}

      {view === 'workspace' &&
        (user ? (
          <Workspace
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            onReturnToLanding={() => setView('landing')}
            onExit={logout}
          />
        ) : (
          <div className="flex min-h-screen items-center justify-center bg-slate-900 p-6 text-slate-100">
            <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-800 p-8 text-center">
              <h1 className="text-xl font-bold text-white">Institutional access required</h1>
              <p className="mt-2 text-sm text-slate-400">
                {isLoggedIn
                  ? 'Your account is signed in, but no institution has invited this email yet.'
                  : 'Sign in with your verified institutional Google account to continue.'}
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                >
                  Sign in
                </button>
                {isLoggedIn && (
                  <button
                    onClick={logout}
                    className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-700"
                  >
                    Sign out
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

      <PersonaAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onIdentityConfirmed={handleIdentityConfirmed}
      />
    </>
  );
}

async function optional<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}

function Workspace({
  onOpenAuthModal,
  onReturnToLanding,
  onExit,
}: {
  onOpenAuthModal: () => void;
  onReturnToLanding: () => void;
  onExit: () => void;
}) {
  const {
    user,
    apiFetch,
    switchTenant,
    hasCapability,
    canResetDemo,
    reauthenticate,
  } = useAuth();
  const currentTenantId = user!.tenantId;
  const currentRole: UserRole = user!.role;

  const [activeTab, setActiveTab] = useState<string>('overview');
  const [profile, setProfile] = useState<Institution>(FALLBACK_INSTITUTION);
  const [activeOverlayPack, setActiveOverlayPack] = useState<OverlayPack>(RSU_OVERLAY_PACK);
  const [allInstitutions, setAllInstitutions] = useState<Institution[]>(FALLBACK_INSTITUTIONS);
  const [allOverlayPacks, setAllOverlayPacks] = useState<OverlayPack[]>([RSU_OVERLAY_PACK]);

  const [claims, setClaims] = useState<EvidenceClaim[]>([]);
  const [staging, setStaging] = useState<EvidenceStagingItem[]>([]);
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [scenarios, setScenarios] = useState<ScenarioEntry[]>([]);
  const [stakeholderImpacts, setStakeholderImpacts] = useState<StakeholderImpact[]>([]);
  const [predictions, setPredictions] = useState<PredictionRecord[]>([]);
  const [redFlags, setRedFlags] = useState<RedFlagCase[]>([]);
  const [pulseSurveys, setPulseSurveys] = useState<PulseSurveyResponse[]>([]);
  const [shadowReports, setShadowReports] = useState<ShadowAiReport[]>([]);
  const [jobs, setJobs] = useState<JobExecutionStatus[]>([]);

  const [kernelVersion, setKernelVersion] = useState('1.0');
  const [isLoading, setIsLoading] = useState(true);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadRequestId = useRef(0);

  const loadData = useCallback(async () => {
    const requestId = ++loadRequestId.current;
    setIsLoading(true);
    setError(null);
    try {
      const [institutionResponse, packResponse, kernel, appConfig] = await Promise.all([
        optional(
          apiFetch<Institution[] | { data?: Institution[]; items?: Institution[] }>('/institutions'),
          [RSU_INSTITUTION],
        ),
        optional(
          apiFetch<OverlayPack[] | { data?: OverlayPack[]; items?: OverlayPack[] }>('/overlay-packs'),
          [RSU_OVERLAY_PACK],
        ),
        optional(apiFetch<{ kernel: { version: string } }>('/kernel'), { kernel: { version: '1.0' } }),
        optional(apiFetch<{ aiEnabled: boolean }>('/config'), { aiEnabled: false }),
      ]);
      if (requestId !== loadRequestId.current) return;
      const fetchedInstitutions = Array.isArray(institutionResponse)
        ? institutionResponse
        : institutionResponse.data || institutionResponse.items || [];
      const fetchedPacks = Array.isArray(packResponse)
        ? packResponse
        : packResponse.data || packResponse.items || [];
      const institutions = fetchedInstitutions.length > 0
        ? fetchedInstitutions
        : FALLBACK_INSTITUTIONS;
      const packs = fetchedPacks.length > 0 ? fetchedPacks : [RSU_OVERLAY_PACK];
      const availableInstitutions = institutions.some(
        (institution) => institution.id === currentTenantId,
      )
        ? institutions
        : currentTenantId === FALLBACK_INSTITUTION.id
          ? [FALLBACK_INSTITUTION, ...institutions]
          : institutions;
      setAllInstitutions(availableInstitutions);
      setAllOverlayPacks(packs);
      setKernelVersion(kernel.kernel.version);
      setAiEnabled(appConfig.aiEnabled);

      const tenantInstitution =
        availableInstitutions.find((institution) => institution.id === currentTenantId) ||
        FALLBACK_INSTITUTION;
      const availablePacks = packs.some(
        (pack) => pack.id === tenantInstitution.activeOverlayPackId,
      )
        ? packs
        : [RSU_OVERLAY_PACK, ...packs];
      setProfile(tenantInstitution);
      setActiveOverlayPack(
        availablePacks.find((pack) => pack.id === tenantInstitution.activeOverlayPackId) ||
          RSU_OVERLAY_PACK,
      );
      setAllOverlayPacks(availablePacks);

      const [
        claimsData,
        stagingData,
        decisionsData,
        scenariosData,
        stakeholderData,
        predictionsData,
        redFlagsData,
        pulseData,
        shadowData,
        jobsData,
      ] = await Promise.all([
        hasCapability('read_evidence') ? apiFetch<EvidenceClaim[]>('/evidence') : Promise.resolve([]),
        hasCapability('approve_staging')
          ? apiFetch<EvidenceStagingItem[]>('/evidence/staging')
          : Promise.resolve([]),
        hasCapability('read_decisions') ? apiFetch<DecisionRecord[]>('/decisions') : Promise.resolve([]),
        hasCapability('read_decisions')
          ? apiFetch<ScenarioEntry[]>('/decisions/scenarios')
          : Promise.resolve([]),
        hasCapability('read_decisions')
          ? apiFetch<StakeholderImpact[]>('/decisions/stakeholders')
          : Promise.resolve([]),
        hasCapability('read_predictions')
          ? apiFetch<PredictionRecord[]>('/predictions')
          : Promise.resolve([]),
        optional(apiFetch<RedFlagCase[]>('/red-flags'), []),
        hasCapability('read_all_inputs')
          ? apiFetch<PulseSurveyResponse[]>('/inputs/pulse')
          : Promise.resolve([]),
        hasCapability('read_all_inputs')
          ? apiFetch<ShadowAiReport[]>('/inputs/shadow-ai')
          : Promise.resolve([]),
        hasCapability('read_diagnostics') ? apiFetch<JobExecutionStatus[]>('/jobs') : Promise.resolve([]),
      ]);

      if (requestId !== loadRequestId.current) return;
      setClaims(claimsData);
      setStaging(stagingData);
      setDecisions(decisionsData);
      setScenarios(scenariosData);
      setStakeholderImpacts(stakeholderData);
      setPredictions(predictionsData);
      setRedFlags(redFlagsData);
      setPulseSurveys(pulseData);
      setShadowReports(shadowData);
      setJobs(jobsData);
    } catch (err) {
      if (requestId !== loadRequestId.current) return;
      setProfile(FALLBACK_INSTITUTION);
      setActiveOverlayPack(RSU_OVERLAY_PACK);
      setAllInstitutions(FALLBACK_INSTITUTIONS);
      setAllOverlayPacks([RSU_OVERLAY_PACK]);
      setError(err instanceof Error ? err.message : 'Could not load institutional data.');
    } finally {
      if (requestId === loadRequestId.current) setIsLoading(false);
    }
  }, [apiFetch, currentTenantId, hasCapability]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const requiredCapabilities: Record<string, Capability> = {
      compass_master: 'read_diagnostics',
      evidence: 'read_evidence',
      scenarios: 'read_decisions',
      stakeholders: 'read_decisions',
      predictions: 'read_predictions',
      input: 'submit_input',
      jobs: 'read_diagnostics',
      admin: 'manage_members',
    };
    const required = requiredCapabilities[activeTab];
    if (required && !hasCapability(required)) setActiveTab('overview');
  }, [activeTab, hasCapability]);

  const showError = (err: unknown) => {
    setError(err instanceof Error ? err.message : 'The request could not be completed.');
  };

  const handleUpdateProfile = async (updated: Institution) => {
    try {
      const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...input } = updated;
      const saved = await apiFetch<Institution>(`/institutions/${currentTenantId}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      });
      setProfile(saved);
      setAllInstitutions((prev) => prev.map((item) => (item.id === saved.id ? saved : item)));
    } catch (err) {
      showError(err);
      throw err;
    }
  };

  const handleAddClaim = async (claim: Omit<EvidenceClaim, 'id' | 'dateAdded' | 'tenantId'>) => {
    try {
      const created = await apiFetch<EvidenceClaim>('/evidence', {
        method: 'POST',
        body: JSON.stringify(claim),
      });
      setClaims((prev) => [created, ...prev]);
    } catch (err) {
      showError(err);
      throw err;
    }
  };

  const handleApproveStaging = async (stagingId: string) => {
    try {
      const claim = await apiFetch<EvidenceClaim>(`/evidence/staging/${stagingId}/approve`, {
        method: 'POST',
      });
      setClaims((prev) => [claim, ...prev]);
      setStaging((prev) => prev.map((item) => (item.id === stagingId ? { ...item, status: 'approved' } : item)));
    } catch (err) {
      showError(err);
    }
  };

  const handleRejectStaging = async (stagingId: string, reason: string) => {
    try {
      await apiFetch(`/evidence/staging/${stagingId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      setStaging((prev) => prev.map((item) => (item.id === stagingId ? { ...item, status: 'rejected' } : item)));
    } catch (err) {
      showError(err);
    }
  };

  const handleUpdateDisposition = async (
    id: string,
    disposition: DecisionRecord['humanDisposition'],
    notes: string,
  ) => {
    const decision = decisions.find((item) => item.id === id);
    if (!disposition || disposition === 'pending') {
      throw new Error('Choose accepted, rejected, or modified before saving a disposition.');
    }
    try {
      const updated = await apiFetch<DecisionRecord>(`/decisions/${id}/disposition`, {
        method: 'PATCH',
        body: JSON.stringify({ disposition, notes, version: decision?.version }),
      });
      setDecisions((prev) => prev.map((item) => (item.id === id ? updated : item)));
    } catch (err) {
      showError(err);
      throw err;
    }
  };

  const handleUpdateRecommendedAction = async (
    id: string,
    recommendedAction: DecisionRecord['recommendedAction'],
    notes: string,
  ) => {
    const decision = decisions.find((item) => item.id === id);
    if (!recommendedAction) {
      throw new Error('Choose a recommended action before saving.');
    }
    try {
      const updated = await apiFetch<DecisionRecord>(`/decisions/${id}/recommended-action`, {
        method: 'PATCH',
        body: JSON.stringify({ recommendedAction, notes, version: decision?.version }),
      });
      setDecisions((prev) => prev.map((item) => (item.id === id ? updated : item)));
    } catch (err) {
      showError(err);
      throw err;
    }
  };

  const handleUpdateStatus = async (id: string, status: DecisionRecord['implementationStatus']) => {
    const decision = decisions.find((item) => item.id === id);
    try {
      const updated = await apiFetch<DecisionRecord>(`/decisions/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, version: decision?.version }),
      });
      setDecisions((prev) => prev.map((item) => (item.id === id ? updated : item)));
    } catch (err) {
      showError(err);
      throw err;
    }
  };

  const handleUpdateGovernanceSignoff = async (
    id: string,
    signoffType: 'academic' | 'administrative',
    status: 'approved' | 'rejected' | 'pending' | 'conditional',
    notes: string,
    _signedBy: string,
    version?: number,
  ) => {
    const decision = decisions.find((item) => item.id === id);
    try {
      const updated = await apiFetch<DecisionRecord>(`/decisions/${id}/signoff`, {
        method: 'POST',
        body: JSON.stringify({
          signoffType,
          status,
          resolutionNotes: notes,
          version: version ?? decision?.version,
        }),
      });
      setDecisions((prev) => prev.map((item) => (item.id === id ? updated : item)));
    } catch (err) {
      if (err instanceof ApiError && err.code === 'REAUTH_REQUIRED') {
        await reauthenticate();
        throw new Error('Reauthentication complete. Submit the signoff again to record it.');
      }
      showError(err);
      throw err;
    }
  };

  const handleAddDecision = async (
    decision: Pick<
      DecisionRecord,
      | 'title'
      | 'summary'
      | 'domain'
      | 'touchesEnrollmentOrGrading'
      | 'isAiDrafted'
      | 'generationMode'
      | 'kernelSectionIds'
    >,
  ) => {
    try {
      const created = await apiFetch<DecisionRecord>('/decisions', {
        method: 'POST',
        body: JSON.stringify(decision),
      });
      setDecisions((prev) => [created, ...prev]);
    } catch (err) {
      showError(err);
      throw err;
    }
  };

  const handleGenerateAiScenarios = async (decision: DecisionRecord) => {
    try {
      const draft = await apiFetch<{ scenarios: Omit<ScenarioEntry, 'id' | 'decisionId'>[] }>(
        '/ai/draft-scenarios',
        {
          method: 'POST',
          body: JSON.stringify({
            decisionTitle: decision.title,
            decisionSummary: decision.summary,
            domain: decision.domain,
            institutionName: profile?.name || '',
          }),
        },
      );
      const added = await apiFetch<ScenarioEntry[]>(`/decisions/${decision.id}/scenarios`, {
        method: 'POST',
        body: JSON.stringify({
          scenarios: draft.scenarios.map((scenario) => ({
            scenarioType: scenario.scenarioType,
            title: scenario.title,
            description: scenario.description,
            keyAssumptions: scenario.keyAssumptions,
            nonTechDrivers: scenario.nonTechDrivers,
            reversibilityRating: scenario.reversibilityRating,
            isAiDrafted: scenario.isAiDrafted,
            generationMode: scenario.generationMode,
          })),
        }),
      });
      setScenarios((prev) => [...prev, ...added]);
    } catch (err) {
      showError(err);
      throw err;
    }
  };

  const handleAddPrediction = async (
    prediction: Pick<PredictionRecord, 'predictionText' | 'targetDate' | 'scopeLevel'>,
  ) => {
    try {
      const created = await apiFetch<PredictionRecord>('/predictions', {
        method: 'POST',
        body: JSON.stringify(prediction),
      });
      setPredictions((prev) => [created, ...prev]);
    } catch (err) {
      showError(err);
      throw err;
    }
  };

  const handleResolvePrediction = async (
    id: string,
    resolutionStatus: PredictionRecord['resolutionStatus'],
    actualOutcome: string,
    lessonsLearned: string,
  ) => {
    try {
      const updated = await apiFetch<PredictionRecord>(`/predictions/${id}/resolve`, {
        method: 'PATCH',
        body: JSON.stringify({ resolutionStatus, actualOutcome, lessonsLearned }),
      });
      setPredictions((prev) => prev.map((item) => (item.id === id ? updated : item)));
    } catch (err) {
      showError(err);
      throw err;
    }
  };

  const handleAddPulse = async (
    pulse: Pick<
      PulseSurveyResponse,
      | 'role'
      | 'disciplineOrProgram'
      | 'aiUsageFrequency'
      | 'primaryToolsUsed'
      | 'perceivedAcademicValue'
      | 'perceivedIntegrityRisk'
      | 'comments'
    >,
  ) => {
    try {
      const created = await apiFetch<PulseSurveyResponse>('/inputs/pulse', {
        method: 'POST',
        body: JSON.stringify(pulse),
      });
      setPulseSurveys((prev) => [created, ...prev]);
    } catch (err) {
      showError(err);
      throw err;
    }
  };

  const handleAddShadowReport = async (
    report: Pick<
      ShadowAiReport,
      'reportedByRole' | 'departmentOrCourse' | 'toolOrUseName' | 'description' | 'perceivedRiskType'
    >,
  ) => {
    try {
      const created = await apiFetch<ShadowAiReport>('/inputs/shadow-ai', {
        method: 'POST',
        body: JSON.stringify(report),
      });
      setShadowReports((prev) => [created, ...prev]);
    } catch (err) {
      showError(err);
      throw err;
    }
  };

  const handleRunJob = async (jobId: JobExecutionStatus['jobId']) => {
    try {
      const updated = await apiFetch<JobExecutionStatus>('/jobs/run', {
        method: 'POST',
        body: JSON.stringify({ jobId }),
      });
      setJobs((prev) => prev.map((item) => (item.jobId === jobId ? updated : item)));
      if (jobId === 'evidence_refresh' && hasCapability('approve_staging')) {
        setStaging(await apiFetch<EvidenceStagingItem[]>('/evidence/staging'));
      }
    } catch (err) {
      showError(err);
      throw err;
    }
  };

  if (isLoading && !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 p-6 font-sans text-slate-100">
        <div className="animate-pulse space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 font-serif text-xl font-bold text-white shadow-lg shadow-indigo-500/30">
            P
          </div>
          <h2 className="font-serif text-lg font-bold text-white">Loading Proteus Compass OS…</h2>
          <p className="text-xs text-slate-400">Loading institutional data, kernel rules, and overlay packs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-16 font-sans text-slate-900 selection:bg-indigo-500 selection:text-white">
      <Header
        currentRole={currentRole}
        onOpenAuthModal={onOpenAuthModal}
        onReturnToLanding={onReturnToLanding}
        onExit={onExit}
        currentTenantId={currentTenantId}
        setCurrentTenantId={switchTenant}
        institutions={allInstitutions}
        activeOverlayPack={activeOverlayPack}
        kernelVersion={kernelVersion}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        canResetDemo={canResetDemo}
        canManageMembers={hasCapability('manage_members')}
        capabilities={user!.capabilities}
        onResetDemo={async () => {
          await apiFetch('/demo/reset', { method: 'POST' });
          await loadData();
        }}
      />

      {error && (
        <div className="mx-auto mt-4 max-w-7xl px-4 sm:px-6">
          <div className="flex items-start justify-between gap-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="font-bold text-rose-600">
              Dismiss
            </button>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {activeTab === 'overview' && (
          <DashboardOverview
            institution={profile}
            activeOverlayPack={activeOverlayPack}
            decisions={decisions}
            claims={claims}
            shadowReports={shadowReports}
            predictions={predictions}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'compass_master' && (
          <CompassMasterView
            userRole={currentRole}
            currentTenantId={currentTenantId}
            institution={profile}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'profile' && (
          <InstitutionalProfileView
            institution={profile}
            activeOverlayPack={activeOverlayPack}
            allOverlayPacks={allOverlayPacks}
            userRole={currentRole}
            onUpdateProfile={handleUpdateProfile}
          />
        )}

        {activeTab === 'evidence' && (
          <EvidenceLedgerView
            claims={claims}
            staging={staging}
            userRole={currentRole}
            onAddClaim={handleAddClaim}
            onApproveStaging={handleApproveStaging}
            onRejectStaging={handleRejectStaging}
          />
        )}

        {activeTab === 'scenarios' && (
          <ScenarioEngineView
            decisions={decisions}
            scenarios={scenarios}
            userRole={currentRole}
            institution={profile}
            onUpdateDisposition={handleUpdateDisposition}
            onUpdateRecommendedAction={handleUpdateRecommendedAction}
            onUpdateStatus={handleUpdateStatus}
            onGenerateAiScenarios={handleGenerateAiScenarios}
            onAddDecision={handleAddDecision}
            onUpdateGovernanceSignoff={handleUpdateGovernanceSignoff}
            aiEnabled={aiEnabled}
            canSignAcademic={hasCapability('sign_academic')}
            canSignAdministrative={hasCapability('sign_administrative')}
          />
        )}

        {activeTab === 'stakeholders' && (
          <StakeholderLedgerView
            decisions={decisions}
            stakeholderImpacts={stakeholderImpacts}
            userRole={currentRole}
          />
        )}

        {activeTab === 'predictions' && (
          <PredictionTrackerView
            predictions={predictions}
            onAddPrediction={handleAddPrediction}
            onResolvePrediction={handleResolvePrediction}
          />
        )}

        {activeTab === 'redflags' && <RedFlagLibraryView redFlags={redFlags} />}

        {activeTab === 'input' && (
          <GrassrootsInputView
            pulseSurveys={pulseSurveys}
            shadowReports={shadowReports}
            userRole={currentRole}
            onAddPulse={handleAddPulse}
            onAddShadowReport={handleAddShadowReport}
          />
        )}

        {activeTab === 'jobs' && (
          <div className="space-y-8">
            <JobsAndGovernanceView jobs={jobs} userRole={currentRole} onRunJob={handleRunJob} />
            <KernelVersionManager />
          </div>
        )}

        {activeTab === 'admin' && hasCapability('manage_members') && <AdminManagementView />}
      </main>
    </div>
  );
}
