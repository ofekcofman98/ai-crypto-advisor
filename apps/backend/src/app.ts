/**
 * app.ts
 * Assembles the Express application: middleware stack, route mounting, and
 * the global error handler.  No `.listen()` call lives here so the app can
 * be imported in tests without binding a port.
 */

import 'dotenv/config';
import express, {
  type Application,
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ZodError } from 'zod';

import authRouter from './modules/auth/auth.router';
import onboardingRouter from './modules/onboarding/onboarding.router';
import dashboardRouter from './modules/dashboard/dashboard.router';
import { AppError } from './shared/errors/AppError';

const app: Application = express();

// ─── Core Middleware ──────────────────────────────────────────────────────────

app.use(
  cors({
    // In production, set CLIENT_ORIGIN to the deployed frontend URL.
    origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
    credentials: true, // Required so browsers send the HttpOnly cookie cross-origin.
  }),
);

app.use(express.json());
app.use(cookieParser()); // Populates req.cookies — required by /refresh and /logout.

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/auth', authRouter);
app.use('/api/onboarding', onboardingRouter);
app.use('/api/dashboard', dashboardRouter);

// ─── 404 Catch-all ────────────────────────────────────────────────────────────

app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(new AppError('The requested route does not exist.', 404));
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// Express identifies a function as an error handler by its arity (4 params).

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ status: 'error', message: err.message });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      status: 'error',
      message: 'Validation failed.',
      issues: err.issues,
    });
    return;
  }

  // Unexpected error — log the full stack and return a generic 500.
  console.error('[Unhandled error]', err);
  res.status(500).json({ status: 'error', message: 'Internal server error.' });
});

export default app;
