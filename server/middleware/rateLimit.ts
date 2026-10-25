import type { Request, Response } from 'express';
import { ipKeyGenerator, rateLimit } from 'express-rate-limit';

const key = (req: { ip?: string; auth?: { user?: { uid?: string } } }) =>
  req.auth?.user?.uid || ipKeyGenerator(req.ip || '0.0.0.0');

const limited = (req: Request, res: Response) => {
  res.status(429).json({
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests. Wait a moment and try again.',
    },
    requestId: req.requestId,
  });
};

export const readLimiter = rateLimit({
  windowMs: 60_000,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (req) => key(req),
  handler: limited,
});

export const writeLimiter = rateLimit({
  windowMs: 60_000,
  limit: 90,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (req) => key(req),
  handler: limited,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 40,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip || '0.0.0.0'),
  handler: limited,
});
