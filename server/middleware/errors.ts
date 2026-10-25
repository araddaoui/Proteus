import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { logger } from '../lib/logger.js';

export class AppError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };
}

export function notFound(req: Request, res: Response) {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: `Route not found: ${req.method} ${req.path}` },
    requestId: req.requestId,
  });
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const known = err instanceof AppError;
  const validation = err instanceof ZodError;
  const invalidJson = err instanceof SyntaxError && 'body' in err;
  const status = known
    ? err.status
    : validation || invalidJson
      ? 400
      : typeof (err as { status?: number })?.status === 'number'
        ? (err as { status: number }).status
        : 500;
  const code = known
    ? err.code
    : validation
      ? 'VALIDATION_ERROR'
      : invalidJson
        ? 'INVALID_JSON'
        : typeof (err as { code?: string })?.code === 'string'
          ? (err as { code: string }).code
          : 'INTERNAL_ERROR';
  const message =
    status >= 500
      ? 'An unexpected error occurred.'
      : validation
        ? 'The request did not match the expected schema.'
        : (err as Error)?.message || 'Request failed.';

  if (status >= 500) {
    logger.error({ err, requestId: req.requestId, path: req.path, method: req.method }, 'request failed');
  } else {
    logger.warn({ code, requestId: req.requestId, path: req.path, method: req.method }, message);
  }

  res.status(status).json({
    error: {
      code,
      message,
      details: validation ? err.issues : known ? err.details : undefined,
    },
    requestId: req.requestId,
  });
}
