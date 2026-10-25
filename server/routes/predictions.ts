import { Router } from 'express';
import { toUiRole } from '../../src/types/auth.js';
import { actorFrom, requireAuth, requireCapability, requireTenant } from '../middleware/auth.js';
import { AppError, asyncHandler } from '../middleware/errors.js';
import {
  addPrediction,
  getPredictions,
  getRedFlags,
  resolvePrediction,
} from '../repositories/index.js';
import { predictionSchema, resolvePredictionSchema } from '../schemas.js';

export const predictionRouter = Router();

predictionRouter.use(requireAuth, requireTenant);

predictionRouter.get(
  '/',
  requireCapability('read_predictions'),
  asyncHandler(async (req, res) => {
    res.json({ data: await getPredictions(req.tenantId!) });
  }),
);

predictionRouter.post(
  '/',
  requireCapability('manage_predictions'),
  asyncHandler(async (req, res) => {
    const input = predictionSchema.parse(req.body);
    const role = toUiRole(req.membership!.role);
    const prediction = await addPrediction(
      actorFrom(req),
      req.tenantId!,
      { ...input, resolutionStatus: 'pending' },
      { uid: req.auth!.user.uid, name: req.auth!.user.displayName, role },
    );
    res.status(201).json({ data: prediction });
  }),
);

predictionRouter.patch(
  '/:id/resolve',
  requireCapability('manage_predictions'),
  asyncHandler(async (req, res) => {
    const input = resolvePredictionSchema.parse(req.body);
    const prediction = await getPredictions(req.tenantId!);
    if (!prediction.some((item) => item.id === req.params.id)) {
      throw new AppError(404, 'NOT_FOUND', 'Prediction not found.');
    }
    res.json({
      data: await resolvePrediction(
        actorFrom(req),
        req.tenantId!,
        req.params.id,
        input.resolutionStatus,
        input.actualOutcome,
        input.lessonsLearned,
      ),
    });
  }),
);

export const redFlagRouter = Router();

redFlagRouter.use(requireAuth);
redFlagRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json({ data: await getRedFlags() });
  }),
);
