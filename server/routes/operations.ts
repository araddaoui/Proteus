import { Router } from 'express';
import { actorFrom, requireAuth, requireCapability, requireTenant } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errors.js';
import { getDiagnostics, getJobs, runJob, toggleDiagnostic } from '../repositories/index.js';
import { diagnosticUpdateSchema, jobRunSchema } from '../schemas.js';

export const diagnosticRouter = Router();

diagnosticRouter.use(requireAuth, requireTenant);

diagnosticRouter.get(
  '/',
  requireCapability('read_diagnostics'),
  asyncHandler(async (req, res) => {
    res.json({ data: await getDiagnostics(req.tenantId!) });
  }),
);

diagnosticRouter.patch(
  '/:id',
  requireCapability('edit_diagnostics'),
  asyncHandler(async (req, res) => {
    const input = diagnosticUpdateSchema.parse(req.body);
    res.json({
      data: await toggleDiagnostic(
        actorFrom(req),
        req.tenantId!,
        req.params.id,
        input.isAvailable,
        input.notes,
      ),
    });
  }),
);

export const jobRouter = Router();

jobRouter.use(requireAuth, requireTenant);

jobRouter.get(
  '/',
  requireCapability('read_diagnostics'),
  asyncHandler(async (_req, res) => {
    res.json({ data: await getJobs() });
  }),
);

jobRouter.post(
  '/run',
  requireCapability('run_jobs'),
  asyncHandler(async (req, res) => {
    const input = jobRunSchema.parse(req.body);
    res.json({ data: await runJob(actorFrom(req), req.tenantId!, input.jobId) });
  }),
);
