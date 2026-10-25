import { Router } from 'express';
import type { Capability } from '../../src/types/auth.js';
import {
  actorFrom,
  requireAuth,
  requireCapability,
  requireRecentAuth,
  requireTenant,
} from '../middleware/auth.js';
import { AppError, asyncHandler } from '../middleware/errors.js';
import {
  addScenarios,
  createDecision,
  getDecision,
  getDecisionsForTenant,
  getEvidence,
  getInstitution,
  getRedFlags,
  getScenariosForDecision,
  getScenariosForTenant,
  getStakeholdersForDecision,
  getStakeholdersForTenant,
  recordGovernanceSignoff,
  updateDecisionDisposition,
  updateDecisionStatus,
  updateRecommendedAction,
} from '../repositories/index.js';
import { evaluateProposalAgainstKernel } from '../../src/kernel/kernelModule.js';
import {
  createDecisionSchema,
  createScenariosSchema,
  decisionStatusUpdateSchema,
  dispositionSchema,
  recommendedActionSchema,
  signoffSchema,
} from '../schemas.js';

export const decisionRouter = Router();

decisionRouter.use(requireAuth, requireTenant);

async function decisionForTenant(id: string, tenantId: string) {
  const decision = await getDecision(id);
  if (!decision || decision.tenantId !== tenantId) {
    throw new AppError(404, 'NOT_FOUND', 'Decision not found.');
  }
  return decision;
}

decisionRouter.get(
  '/',
  requireCapability('read_decisions'),
  asyncHandler(async (req, res) => {
    res.json({ data: await getDecisionsForTenant(req.tenantId!) });
  }),
);

decisionRouter.post(
  '/',
  requireCapability('create_decisions'),
  asyncHandler(async (req, res) => {
    const input = createDecisionSchema.parse(req.body);
    const decision = await createDecision(req.tenantId!, {
      ...input,
      humanDisposition: 'pending',
      recommendedAction: null,
      implementationStatus: 'proposed',
    });
    res.status(201).json({ data: decision });
  }),
);

decisionRouter.get(
  '/scenarios',
  requireCapability('read_decisions'),
  asyncHandler(async (req, res) => {
    res.json({ data: await getScenariosForTenant(req.tenantId!) });
  }),
);

decisionRouter.get(
  '/stakeholders',
  requireCapability('read_decisions'),
  asyncHandler(async (req, res) => {
    res.json({ data: await getStakeholdersForTenant(req.tenantId!) });
  }),
);

decisionRouter.get(
  '/:id',
  requireCapability('read_decisions'),
  asyncHandler(async (req, res) => {
    res.json({ data: await decisionForTenant(req.params.id, req.tenantId!) });
  }),
);

decisionRouter.get(
  '/:id/scenarios',
  requireCapability('read_decisions'),
  asyncHandler(async (req, res) => {
    await decisionForTenant(req.params.id, req.tenantId!);
    res.json({ data: await getScenariosForDecision(req.params.id) });
  }),
);

decisionRouter.post(
  '/:id/scenarios',
  requireCapability('edit_decisions'),
  asyncHandler(async (req, res) => {
    await decisionForTenant(req.params.id, req.tenantId!);
    const input = createScenariosSchema.parse(req.body);
    res.status(201).json({
      data: await addScenarios(actorFrom(req), req.tenantId!, req.params.id, input.scenarios),
    });
  }),
);

decisionRouter.get(
  '/:id/stakeholders',
  requireCapability('read_decisions'),
  asyncHandler(async (req, res) => {
    await decisionForTenant(req.params.id, req.tenantId!);
    res.json({ data: await getStakeholdersForDecision(req.params.id) });
  }),
);

decisionRouter.get(
  '/:id/dossier',
  requireCapability('read_decisions'),
  asyncHandler(async (req, res) => {
    const decision = await decisionForTenant(req.params.id, req.tenantId!);
    const [institution, claims, scenarios, redFlags] = await Promise.all([
      getInstitution(req.tenantId!),
      getEvidence(req.tenantId!),
      getScenariosForDecision(decision.id),
      getRedFlags(),
    ]);
    if (!institution) throw new AppError(404, 'NOT_FOUND', 'Institution not found.');
    const audit = evaluateProposalAgainstKernel(`${decision.title}. ${decision.summary}`);
    const pendingSignoff = (signoffType: 'academic' | 'administrative') => ({
      signoffType,
      bodyName:
        signoffType === 'academic'
          ? institution.academicGovernanceBodyName
          : institution.provostOfficeName,
      signedBy: null,
      signedAt: null,
      status: 'pending' as const,
      resolutionNotes:
        signoffType === 'academic'
          ? 'Awaiting formal faculty committee submission.'
          : 'Awaiting executive academic affairs review.',
    });
    res.json({
      data: {
        dossierId: `DOSSIER-${new Date().getFullYear()}-${institution.shortName}-${decision.id.toUpperCase()}`,
        generatedAt: new Date().toISOString(),
        institution,
        decision,
        finalTestResults: audit.finalTestResults,
        evidenceArchitecture: {
          claimedAssumptions: scenarios.flatMap((scenario) => scenario.keyAssumptions).slice(0, 5),
          verifiedEvidence: claims
            .slice(0, 5)
            .map((claim) => `[${claim.confidenceTier.toUpperCase()}] ${claim.claimText} (${claim.sourceName})`),
          counterEvidence: redFlags
            .slice(0, 2)
            .map((flag) => `[${flag.category.toUpperCase()}] ${flag.title}: ${flag.caseSummary}`),
          epistemicStatus: decision.touchesEnrollmentOrGrading
            ? 'High Epistemic Sensitivity (Mandatory Empirical Validation)'
            : 'Standard Strategic Projection',
        },
        governanceCertification: {
          academicBody: decision.academicSignoff || pendingSignoff('academic'),
          administrativeBody: decision.administrativeSignoff || pendingSignoff('administrative'),
          quorumSatisfied:
            decision.academicSignoff?.status === 'approved' &&
            decision.administrativeSignoff?.status === 'approved',
          finalDisposition: decision.humanDisposition,
        },
      },
    });
  }),
);

decisionRouter.patch(
  '/:id/disposition',
  requireCapability('set_disposition'),
  asyncHandler(async (req, res) => {
    const input = dispositionSchema.parse(req.body);
    const decision = await decisionForTenant(req.params.id, req.tenantId!);
    const updated = await updateDecisionDisposition(
      actorFrom(req),
      decision,
      input.disposition,
      input.notes,
      input.version,
    );
    res.json({ data: updated });
  }),
);

decisionRouter.patch(
  '/:id/recommended-action',
  requireCapability('edit_decisions'),
  asyncHandler(async (req, res) => {
    const input = recommendedActionSchema.parse(req.body);
    const decision = await decisionForTenant(req.params.id, req.tenantId!);
    const updated = await updateRecommendedAction(
      actorFrom(req),
      decision,
      input.recommendedAction,
      input.notes,
      input.version,
    );
    res.json({ data: updated });
  }),
);

decisionRouter.patch(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const input = decisionStatusUpdateSchema.parse(req.body);
    const capability: Capability =
      input.status === 'implemented' ? 'transition_implemented' : 'edit_decisions';
    if (!req.membership!.capabilities.includes(capability)) {
      throw new AppError(403, 'CAPABILITY_DENIED', `Your role does not allow ${capability}.`);
    }
    const decision = await decisionForTenant(req.params.id, req.tenantId!);
    if (input.status === 'implemented') {
      if (!req.membership!.capabilities.includes('transition_implemented')) {
        throw new AppError(403, 'CAPABILITY_DENIED', 'Only an institutional administrator can implement.');
      }
    }
    const updated = await updateDecisionStatus(actorFrom(req), decision, input.status, input.version);
    res.json({ data: updated });
  }),
);

decisionRouter.post(
  '/:id/signoff',
  requireRecentAuth,
  asyncHandler(async (req, res) => {
    const input = signoffSchema.parse(req.body);
    const capability: Capability =
      input.signoffType === 'academic' ? 'sign_academic' : 'sign_administrative';
    if (!req.membership!.capabilities.includes(capability)) {
      throw new AppError(
        403,
        'CAPABILITY_DENIED',
        input.signoffType === 'academic'
          ? 'Only an academic governance leader can issue an academic signoff.'
          : 'Only an institutional administrator can issue an administrative signoff.',
      );
    }
    const decision = await decisionForTenant(req.params.id, req.tenantId!);
    const updated = await recordGovernanceSignoff({
      actor: actorFrom(req),
      decision,
      signoffType: input.signoffType,
      status: input.status,
      resolutionNotes: input.resolutionNotes,
      membershipId: req.membership!.id,
      signerUid: req.auth!.user.uid,
      signerName: req.auth!.user.displayName,
      bodyName: req.membership!.governingBodyAffiliation,
      expectedVersion: input.version,
    });
    res.json({ data: updated });
  }),
);
