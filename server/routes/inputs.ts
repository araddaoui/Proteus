import { Router } from 'express';
import { actorFrom, requireAuth, requireCapability, requireTenant } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errors.js';
import {
  addPulseSurvey,
  addShadowReport,
  getPulseSurveys,
  getShadowReports,
} from '../repositories/index.js';
import { pulseSchema, shadowReportSchema } from '../schemas.js';

export const inputRouter = Router();

inputRouter.use(requireAuth, requireTenant);

inputRouter.get(
  '/pulse',
  requireCapability('read_all_inputs'),
  asyncHandler(async (req, res) => {
    res.json({ data: await getPulseSurveys(req.tenantId!) });
  }),
);

inputRouter.post(
  '/pulse',
  requireCapability('submit_input'),
  asyncHandler(async (req, res) => {
    const input = pulseSchema.parse(req.body);
    res.status(201).json({ data: await addPulseSurvey(actorFrom(req), req.tenantId!, input) });
  }),
);

inputRouter.get(
  '/shadow-ai',
  requireCapability('read_all_inputs'),
  asyncHandler(async (req, res) => {
    res.json({ data: await getShadowReports(req.tenantId!) });
  }),
);

inputRouter.post(
  '/shadow-ai',
  requireCapability('submit_input'),
  asyncHandler(async (req, res) => {
    const input = shadowReportSchema.parse(req.body);
    res.status(201).json({ data: await addShadowReport(actorFrom(req), req.tenantId!, input) });
  }),
);
