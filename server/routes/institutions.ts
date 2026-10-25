import { Router } from 'express';
import { getDb } from '../db/client.js';
import { requireAuth, requireCapability, requireTenantParam } from '../middleware/auth.js';
import { AppError, asyncHandler } from '../middleware/errors.js';
import {
  getInstitution,
  getMembershipsForUid,
  getOverlayPacks,
  updateInstitution,
  writeAudit,
} from '../repositories/index.js';
import { actorFrom } from '../middleware/auth.js';
import { institutionSchema } from '../schemas.js';

export const institutionRouter = Router();

institutionRouter.use(requireAuth);

institutionRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const memberships = await getMembershipsForUid(req.auth!.user.uid);
    const institutions = await Promise.all(
      memberships.map((membership) => getInstitution(membership.tenantId)),
    );
    res.json({ data: institutions.filter(Boolean) });
  }),
);

institutionRouter.get(
  '/:id',
  requireTenantParam(),
  asyncHandler(async (req, res) => {
    const institution = await getInstitution(req.tenantId!);
    if (!institution) throw new AppError(404, 'NOT_FOUND', 'Institution not found.');
    res.json({ data: institution });
  }),
);

institutionRouter.patch(
  '/:id',
  requireTenantParam(),
  requireCapability('manage_institution'),
  asyncHandler(async (req, res) => {
    const input = institutionSchema.parse(req.body);
    const before = await getInstitution(req.tenantId!);
    if (!before) throw new AppError(404, 'NOT_FOUND', 'Institution not found.');
    const updated = await updateInstitution(req.tenantId!, {
      ...before,
      ...input,
    });
    await writeAudit(getDb(), actorFrom(req), {
        tenantId: req.tenantId,
        action: 'institution.update',
        targetType: 'institution',
        targetId: req.tenantId,
        before,
        after: input,
      },
    );
    res.json({ data: updated });
  }),
);

export const overlayRouter = Router();

overlayRouter.use(requireAuth);
overlayRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json({ data: await getOverlayPacks() });
  }),
);
