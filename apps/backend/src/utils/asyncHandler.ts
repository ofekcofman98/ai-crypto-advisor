/**
 * asyncHandler.ts
 * Wraps an async route handler so that any rejected promise is forwarded to
 * Express's `next(err)` pipeline instead of causing an unhandled rejection.
 *
 * Usage:
 *   router.get('/path', asyncHandler(async (req, res) => { ... }));
 *
 * Without this wrapper every async controller method would need its own
 * try/catch block whose sole job is to call next(err).
 */

import type { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>;

export const asyncHandler = (fn: AsyncRouteHandler): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };
