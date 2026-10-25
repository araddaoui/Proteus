import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireCapability, requireTenant, actorFrom } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errors.js';
import { getDiagnostics, toggleDiagnostic } from '../repositories/index.js';
import { diagnosticUpdateSchema } from '../schemas.js';
import { evaluateProposalAgainstKernel, getActiveKernel, getKernelVersionHistory } from '../../src/kernel/kernelModule.js';

export const compassRouter = Router();

compassRouter.get(
  '/principles',
  asyncHandler(async (_req, res) => {
    res.json({ data: getActiveKernel() });
  }),
);

compassRouter.get(
  '/kernel/history',
  asyncHandler(async (_req, res) => {
    res.json({ data: getKernelVersionHistory() });
  }),
);

const finalTestSchema = z.object({ proposalText: z.string().trim().min(1).max(50_000) }).strict();

compassRouter.post(
  '/final-test-audit',
  requireAuth,
  asyncHandler(async (req, res) => {
    const input = finalTestSchema.parse(req.body);
    res.json({ data: evaluateProposalAgainstKernel(input.proposalText) });
  }),
);

compassRouter.use(requireAuth, requireTenant);

compassRouter.get(
  '/diagnostic',
  requireCapability('read_diagnostics'),
  asyncHandler(async (req, res) => {
    const items = await getDiagnostics(req.tenantId!);
    const total = items.length;
    const availableCount = items.filter((item) => item.isAvailable).length;
    const missingItems = items.filter((item) => !item.isAvailable);
    res.json({
      data: {
        tenantId: req.tenantId,
        total,
        availableCount,
        completionPercentage: total ? Math.round((availableCount / total) * 100) : 0,
        missingItems,
        items,
        mandatoryGapStatement:
          missingItems.length > 0
            ? `A reliable recommendation cannot yet be made because the following ${missingItems.length} essential institutional datasets are missing: ${missingItems.slice(0, 5).map((item) => item.name).join(', ')}${missingItems.length > 5 ? ` and ${missingItems.length - 5} more.` : '.'}`
            : 'All foundational institutional baseline datasets verified. Institutional diagnostic criteria satisfied.',
      },
    });
  }),
);

compassRouter.patch(
  '/diagnostic/:id',
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
