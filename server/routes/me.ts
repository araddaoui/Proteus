import { Router } from 'express';
import type { MeResponse } from '../../src/types/auth.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errors.js';
import { getMembershipsForUid } from '../repositories/index.js';

export const meRouter = Router();

meRouter.use(requireAuth);

meRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    if (!req.auth) return;
    const memberships = await getMembershipsForUid(req.auth.user.uid);
    const payload: MeResponse = {
      user: req.auth.user,
      memberships,
      isPlatformAdmin: req.auth.isPlatformAdmin,
    };
    res.json({ data: payload });
  }),
);
