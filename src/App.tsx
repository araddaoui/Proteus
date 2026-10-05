import React, { useState, useEffect } from 'react';
import { UserRole, Institution, OverlayPack, EvidenceClaim, EvidenceStagingItem, DecisionRecord, ScenarioEntry, StakeholderImpact, PredictionRecord, RedFlagCase, PulseSurveyResponse, ShadowAiReport, JobExecutionStatus } from './types';
import { StakeholderRole } from './types/auth';
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
import { db } from './services/db';
import { getActiveKernel } from './kernel/kernelModule';

// AuthContext uses a different role-naming scheme (StakeholderRole) than the
// rest of the app (UserRole) — this maps between the two rather than forcing
// every existing component to learn a second role vocabulary.
function toUserRole(role: StakeholderRole): UserRole {
  switch (role) {
    case 'high_admin':
      return 'leadership';
    case 'program_director':
      return 'faculty';
    case 'student':
      return 'student';
    case 'consultant':
      return 'consultant';
  }
}

export default function App() {
  return (
    <AuthProvider>
      <ProteusRoot />
    </AuthProvider>
  );
}

// Decides landing page vs. workspace, and owns the single shared identity
// modal instance so there is exactly one way to change identity in the app
// (the landing page's CTAs and the in-app Header's "Change Identity" button
// both open this same modal — no separate bypass path either place).
function ProteusRoot() {
  const [view, setView] = useState<'landing' | 'workspace'>('landing');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Entering the workspace happens ONLY when the modal reports an actual
  // identity was confirmed (persona switch or custom demo login) — not
  // merely when the modal is closed. Dismissing the modal with the X keeps
  // you on the landing page; it never silently drops you into a default
  // role's workspace view.
  const handleIdentityConfirmed = () => {
    setView('workspace');
  };

  return (
    <>
      {view === 'landing' && (
        <LandingPageView onOpenAuthModal={() => setIsAuthModalOpen(true)} />
      )}

      {view === 'workspace' && (
        <Workspace onOpenAuthModal={() => setIsAuthModalOpen(true)} />
      )}

      <PersonaAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onIdentityConfirmed={handleIdentityConfirmed}
      />
    </>
  );
}

function Workspace({ onOpenAuthModal }: { onOpenAuthModal: () => void }) {
  const { user } = useAuth();

  const [currentTenantId, setCurrentTenantId] = useState<string>(user.tenantId || 'inst-1');
  const [activeTab, setActiveTab] = useState<string>('overview');

  // The dashboard's role always reflects the active demo identity. If the
  // identity changes (via the Header's "Change Identity" button, which opens
  // the same shared modal), this follows it rather than going stale.
  const currentRole: UserRole = toUserRole(user.role);
  useEffect(() => {
    if (user.tenantId && user.tenantId !== currentTenantId) {
      setCurrentTenantId(user.tenantId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.tenantId]);

  const defaultInst = db.getInstitution('inst-1') || db.institutions[0];
  const defaultPack = db.overlayPacks.find((p) => p.id === defaultInst.activeOverlayPackId) || db.overlayPacks[0];

  const [profile, setProfile] = useState<Institution>(defaultInst);
  const [activeOverlayPack, setActiveOverlayPack] = useState<OverlayPack>(defaultPack);
  const [allInstitutions, setAllInstitutions] = useState<Institution[]>(db.institutions);
  const [allOverlayPacks, setAllOverlayPacks] = useState<OverlayPack[]>(db.overlayPacks);

  const [claims, setClaims] = useState<EvidenceClaim[]>(db.getClaims('inst-1'));
  const [staging, setStaging] = useState<EvidenceStagingItem[]>(db.evidenceStaging.filter((s) => s.tenantId === 'inst-1'));
  const [decisions, setDecisions] = useState<DecisionRecord[]>(db.getDecisions('inst-1'));
  const [scenarios, setScenarios] = useState<ScenarioEntry[]>(db.scenarios);
  const [stakeholderImpacts, setStakeholderImpacts] = useState<StakeholderImpact[]>(db.stakeholderImpacts);
  const [predictions, setPredictions] = useState<PredictionRecord[]>(db.getPredictions('inst-1'));
  const [redFlags, setRedFlags] = useState<RedFlagCase[]>(db.getRedFlags());
  const [pulseSurveys, setPulseSurveys] = useState<PulseSurveyResponse[]>(db.pulseSurveys.filter((p) => p.tenantId === 'inst-1'));
  const [shadowReports, setShadowReports] = useState<ShadowAiReport[]>(db.shadowAiReports.filter((r) => r.tenantId === 'inst-1'));
  const [jobs, setJobs] = useState<JobExecutionStatus[]>(db.jobStatuses);

  const [kernelVersion, setKernelVersion] = useState(getActiveKernel().version);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    try {
      const tenantInst = db.getInstitution(currentTenantId) || db.institutions[0];
      const tenantPack = db.overlayPacks.find((p) => p.id === tenantInst.activeOverlayPackId) || db.overlayPacks[0];
      setProfile(tenantInst);
      setActiveOverlayPack(tenantPack);
      setClaims(db.getClaims(currentTenantId));
      setStaging(db.evidenceStaging.filter((s) => s.tenantId === currentTenantId));
      setDecisions(db.getDecisions(currentTenantId));
      setPredictions(db.getPredictions(currentTenantId));
      setPulseSurveys(db.pulseSurveys.filter((p) => p.tenantId === currentTenantId));
      setShadowReports(db.shadowAiReports.filter((r) => r.tenantId === currentTenantId));

      const [
        profileRes,
        overlayRes,
        evidenceRes,
        decisionsRes,
        predRes,
        redRes,
        inputRes,
        jobsRes,
        kernelRes,
      ] = await Promise.all([
        fetch(`/api/profile/${currentTenantId}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/overlay-packs').then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch(`/api/evidence/${currentTenantId}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch(`/api/decisions/${currentTenantId}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch(`/api/predictions/${currentTenantId}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/red-flags').then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch(`/api/input-instruments/${currentTenantId}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/jobs').then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/kernel').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);

      if (profileRes?.profile) setProfile(profileRes.profile);
      if (profileRes?.activeOverlayPack) setActiveOverlayPack(profileRes.activeOverlayPack);
      if (profileRes?.allInstitutions) setAllInstitutions(profileRes.allInstitutions);
      if (overlayRes) setAllOverlayPacks(overlayRes);

      if (evidenceRes?.claims) setClaims(evidenceRes.claims);
      if (evidenceRes?.staging) setStaging(evidenceRes.staging);
      if (decisionsRes) setDecisions(decisionsRes);
      if (predRes) setPredictions(predRes);
      if (redRes) setRedFlags(redRes);
      if (inputRes?.pulseSurveys) setPulseSurveys(inputRes.pulseSurveys);
      if (inputRes?.shadowAiReports) setShadowReports(inputRes.shadowAiReports);
      if (jobsRes) setJobs(jobsRes);
      if (kernelRes?.kernel?.version) setKernelVersion(kernelRes.kernel.version);

      if (decisionsRes && decisionsRes.length > 0) {
        const firstDecId = decisionsRes[0].id;
        const [scenRes, stkRes] = await Promise.all([
          fetch(`/api/scenarios/${firstDecId}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch(`/api/stakeholders/${firstDecId}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        ]);
        if (scenRes) setScenarios(scenRes);
        if (stkRes) setStakeholderImpacts(stkRes);
      }
    } catch (err) {
      console.warn('API sync deferred; active dataset loaded from database cache:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTenantId]);

  const handleUpdateProfile = async (updated: Institution) => {
    const res = await fetch(`/api/profile/${currentTenantId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    }).then((r) => r.json());

    setProfile(res);
  };

  const handleAddClaim = async (claim: Omit<EvidenceClaim, 'id' | 'dateAdded'>) => {
    const newClaim = await fetch('/api/evidence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(claim),
    }).then((r) => r.json());

    setClaims((prev) => [newClaim, ...prev]);
  };

  const handleApproveStaging = async (stagingId: string) => {
    const res = await fetch(`/api/evidence/staging/${stagingId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewer: `${currentRole} User` }),
    }).then((r) => r.json());

    if (res.claim) {
      setClaims((prev) => [res.claim, ...prev]);
      setStaging((prev) => prev.map((s) => (s.id === stagingId ? { ...s, status: 'approved' } : s)));
    }
  };

  const handleRejectStaging = async (stagingId: string, reason: string) => {
    await fetch(`/api/evidence/staging/${stagingId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, reviewer: `${currentRole} User` }),
    });

    setStaging((prev) => prev.map((s) => (s.id === stagingId ? { ...s, status: 'rejected' } : s)));
  };

  const handleUpdateDisposition = async (id: string, disposition: any, notes: string, setBy: string) => {
    const res = await fetch(`/api/decisions/${id}/disposition`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disposition, notes, setBy }),
    }).then((r) => r.json());

    setDecisions((prev) => prev.map((d) => (d.id === id ? res : d)));
  };

  const handleUpdateRecommendedAction = async (id: string, recommendedAction: any, notes: string) => {
    const res = await fetch(`/api/decisions/${id}/recommended-action`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recommendedAction, notes }),
    }).then((r) => r.json());

    setDecisions((prev) => prev.map((d) => (d.id === id ? res : d)));
  };

  const handleUpdateStatus = async (id: string, status: DecisionRecord['implementationStatus']) => {
    const res = await fetch(`/api/decisions/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update status');
    }

    setDecisions((prev) => prev.map((d) => (d.id === id ? data : d)));
  };

  const handleToggleGate = async (id: string, passed: boolean) => {
    const res = await fetch(`/api/decisions/${id}/gate`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passed }),
    }).then((r) => r.json());

    setDecisions((prev) => prev.map((d) => (d.id === id ? res : d)));
  };

  const handleAddDecision = (decision: Omit<DecisionRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    fetch('/api/decisions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(decision),
    })
      .then((r) => r.json())
      .then((newDec) => {
        setDecisions((prev) => [newDec, ...prev]);
      });
  };

  const handleGenerateAiScenarios = async (decision: DecisionRecord) => {
    const res = await fetch('/api/ai/draft-scenarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decisionTitle: decision.title,
        decisionSummary: decision.summary,
        domain: decision.domain,
        institutionName: profile?.name || 'Atlas Global University',
      }),
    }).then((r) => r.json());

    if (res.scenarios) {
      const formatted = res.scenarios.map((s: any) => ({
        ...s,
        decisionId: decision.id,
      }));

      const added = await fetch('/api/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formatted),
      }).then((r) => r.json());

      setScenarios((prev) => [...prev, ...added]);
    }
  };

  const handleAddPrediction = async (pred: Omit<PredictionRecord, 'id' | 'dateMade'>) => {
    const res = await fetch('/api/predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pred),
    }).then((r) => r.json());

    setPredictions((prev) => [res, ...prev]);
  };

  const handleResolvePrediction = async (
    id: string,
    resolutionStatus: PredictionRecord['resolutionStatus'],
    actualOutcome: string,
    lessonsLearned: string
  ) => {
    const res = await fetch(`/api/predictions/${id}/resolve`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolutionStatus, actualOutcome, lessonsLearned }),
    }).then((r) => r.json());

    setPredictions((prev) => prev.map((p) => (p.id === id ? res : p)));
  };

  const handleAddPulse = async (pulse: Omit<PulseSurveyResponse, 'id' | 'createdAt'>) => {
    const res = await fetch('/api/input-instruments/pulse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pulse),
    }).then((r) => r.json());

    setPulseSurveys((prev) => [res, ...prev]);
  };

  const handleAddShadowReport = async (report: Omit<ShadowAiReport, 'id' | 'createdAt' | 'status'>) => {
    const res = await fetch('/api/input-instruments/shadow-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    }).then((r) => r.json());

    setShadowReports((prev) => [res, ...prev]);
  };

  const handleRunJob = async (jobId: JobExecutionStatus['jobId']) => {
    const res = await fetch(`/api/jobs/${jobId}/run`, {
      method: 'POST',
    }).then((r) => r.json());

    setJobs((prev) => prev.map((j) => (j.jobId === jobId ? res : j)));
    if (jobId === 'evidence_refresh') {
      const ev = await fetch(`/api/evidence/${currentTenantId}`).then((r) => r.json());
      setStaging(ev.staging || []);
    }
  };

  if (isLoading && !profile) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6 font-sans">
        <div className="text-center space-y-3 animate-pulse">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-white font-bold text-xl font-serif shadow-lg shadow-indigo-500/30">
            P
          </div>
          <h2 className="text-lg font-bold text-white font-serif">Booting Proteus Compass OS...</h2>
          <p className="text-xs text-slate-400">Loading multi-tenant data, kernel rules, and overlay packs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-indigo-500 selection:text-white pb-16">
      <Header
        currentRole={currentRole}
        onOpenAuthModal={onOpenAuthModal}
        currentTenantId={currentTenantId}
        setCurrentTenantId={setCurrentTenantId}
        institutions={allInstitutions}
        activeOverlayPack={activeOverlayPack}
        kernelVersion={kernelVersion}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
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
            onUpdateDisposition={handleUpdateDisposition}
            onUpdateRecommendedAction={handleUpdateRecommendedAction}
            onUpdateStatus={handleUpdateStatus}
            onToggleGate={handleToggleGate}
            onGenerateAiScenarios={handleGenerateAiScenarios}
            onAddDecision={handleAddDecision}
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
            userRole={currentRole}
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
      </main>
    </div>
  );
}
