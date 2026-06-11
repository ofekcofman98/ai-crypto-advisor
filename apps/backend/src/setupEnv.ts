/**
 * Jest setup: pin deterministic env vars BEFORE any test module is loaded.
 * dotenv (loaded via `import 'dotenv/config'` in app.ts) will NOT override
 * variables that are already present in process.env, so these values win.
 */
process.env.JWT_ACCESS_SECRET = 'fallback_secret_key';
process.env.NODE_ENV = 'test';
