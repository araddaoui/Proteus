import { Router } from 'express';
import { config } from '../config.js';
import { actorFrom, requireAuth, requireCapability, requireTenant } from '../middleware/auth.js';
import { AppError, asyncHandler } from '../middleware/errors.js';
import { seedRsuTenant } from '../seed/rsu.js';
import { writeAudit } from '../repositories/index.js';
import { getDb } from '../db/client.js';

export const demoRouter = Router();

demoRouter.use(requireAuth, requireTenant);

demoRouter.post(
  '/reset',
  requireCapability('reset_demo'),
  asyncHandler(async (req, res) => {
    if (!config.demoMode) throw new AppError(404, 'NOT_FOUND', 'Route not found.');
    if (req.tenantId !== 'inst-1') {
      throw new AppError(403, 'DEMO_ONLY', 'Demo reset is limited to the RSU sandbox institution.');
    }
    const result = await seedRsuTenant({ reset: true });
    await writeAudit(getDb(), actorFrom(req), {
      tenantId: req.tenantId,
      action: 'demo.reset',
      targetType: 'institution',
      targetId: req.tenantId,
      after: result,
    });
    res.json({ data: result });
  }),
);
