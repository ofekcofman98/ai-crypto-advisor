"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * server.ts
 * Entry point: creates the HTTP server, starts listening, and handles
 * graceful shutdown on SIGTERM / SIGINT so in-flight requests can finish
 * before the process exits.
 */
require("dotenv/config");
const pino_1 = __importDefault(require("pino"));
const app_1 = __importDefault(require("./app"));
const logger = (0, pino_1.default)({
    transport: process.env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
});
const PORT = Number(process.env.PORT) || 4000;
const server = app_1.default.listen(PORT, () => {
    logger.info({ port: PORT, env: process.env.NODE_ENV ?? 'development' }, 'Server is running');
});
// ─── Graceful Shutdown ────────────────────────────────────────────────────────
function shutdown(signal) {
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
