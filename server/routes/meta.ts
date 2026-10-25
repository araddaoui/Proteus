import { Router } from 'express';
import { config } from '../config.js';
import { asyncHandler } from '../middleware/errors.js';
import { getActiveKernel, getKernelVersionHistory } from '../../src/kernel/kernelModule.js';

export const metaRouter = Router();

metaRouter.get(
  '/config',
  asyncHandler(async (_req, res) => {
    res.json({ data: { aiEnabled: config.aiEnabled, demoMode: config.demoMode } });
  }),
);

metaRouter.get(
  '/kernel',
  asyncHandler(async (_req, res) => {
    res.json({
      data: {
        kernel: getActiveKernel(),
        history: getKernelVersionHistory(),
      },
    });
  }),
);
