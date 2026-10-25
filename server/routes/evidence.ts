import { Router } from 'express';
import { actorFrom, requireAuth, requireCapability, requireTenant } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errors.js';
import {
  addClaim,
  approveStaging,
  getEvidence,
  getStaging,
  rejectStaging,
} from '../repositories/index.js';
import { evidenceSchema, rejectStagingSchema } from '../schemas.js';

export const evidenceRouter = Router();

evidenceRouter.use(requireAuth, requireTenant);

evidenceRouter.get(
  '/',
  requireCapability('read_evidence'),
  asyncHandler(async (req, res) => {
    res.json({ data: await getEvidence(req.tenantId!) });
  }),
);

evidenceRouter.post(
  '/',
  requireCapability('manage_evidence'),
  asyncHandler(async (req, res) => {
    const input = evidenceSchema.parse(req.body);
    res.status(201).json({
      data: await addClaim(actorFrom(req), req.tenantId!, {
        ...input,
        retractionStatus: input.retractionStatus || 'active',
        tags: input.tags || [],
      }),
    });
  }),
);

evidenceRouter.get(
  '/staging',
  requireCapability('approve_staging'),
  asyncHandler(async (req, res) => {
    res.json({ data: await getStaging(req.tenantId!) });
  }),
);

evidenceRouter.post(
  '/staging/:id/approve',
  requireCapability('approve_staging'),
  asyncHandler(async (req, res) => {
    const claim = await approveStaging(
      actorFrom(req),
      req.tenantId!,
      req.params.id,
      req.auth!.user.displayName,
    );
    res.status(201).json({ data: claim });
  }),
);

evidenceRouter.post(
  '/staging/:id/reject',
  requireCapability('approve_staging'),
  asyncHandler(async (req, res) => {
    const input = rejectStagingSchema.parse(req.body);
    await rejectStaging(
      actorFrom(req),
      req.tenantId!,
      req.params.id,
      input.reason,
      req.auth!.user.displayName,
    );
    res.json({ data: { id: req.params.id, status: 'rejected' } });
  }),
);
