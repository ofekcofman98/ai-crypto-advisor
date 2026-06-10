/**
 * server.ts
 * Entry point: creates the HTTP server, starts listening, and handles
 * graceful shutdown on SIGTERM / SIGINT so in-flight requests can finish
 * before the process exits.
 */
import 'dotenv/config';

import pino from 'pino';
import app from './app';

const logger = pino({
  transport:
    process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
});

const PORT = Number(process.env.PORT) || 4000;

const server = app.listen(PORT, () => {
  logger.info({ port: PORT, env: process.env.NODE_ENV ?? 'development' }, 'Server is running');
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

function shutdown(signal: string): void {
  logger.info(`${signal} received — shutting down gracefully`);

  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  // Force-exit if the server hasn't closed within 10 s (e.g. keep-alive connections).
  setTimeout(() => {
    logger.error('Graceful shutdown timed out — forcing exit');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
