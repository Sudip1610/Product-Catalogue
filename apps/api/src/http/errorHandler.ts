import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import {
  NotFoundError,
  ValidationError,
  UpstreamError,
  EmailDeliveryError,
} from '../domain/errors.js';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ValidationError) {
    res.status(400).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.issues,
      },
    });
    return;
  }

  if (err instanceof NotFoundError) {
    res.status(404).json({
      error: { code: err.code, message: err.message },
    });
    return;
  }

  if (err instanceof UpstreamError) {
    res.status(502).json({
      error: { code: err.code, message: err.message },
    });
    return;
  }

  if (err instanceof EmailDeliveryError) {
    res.status(502).json({
      error: { code: err.code, message: err.message },
    });
    return;
  }

  // Unknown – never leak internals
  console.error('[errorHandler] Unhandled error:', err);
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
  });
}
