"use strict";
/**
 * app.ts
 * Assembles the Express application: middleware stack, route mounting, and
 * the global error handler.  No `.listen()` call lives here so the app can
 * be imported in tests without binding a port.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const zod_1 = require("zod");
const auth_router_1 = __importDefault(require("./modules/auth/auth.router"));
const onboarding_router_1 = __importDefault(require("./modules/onboarding/onboarding.router"));
const dashboard_router_1 = __importDefault(require("./modules/dashboard/dashboard.router"));
const feedback_router_1 = __importDefault(require("./modules/feedback/feedback.router"));
const AppError_1 = require("./shared/errors/AppError");
const app = (0, express_1.default)();
// ─── Core Middleware ──────────────────────────────────────────────────────────
app.use((0, cors_1.default)({
    // In production, set CLIENT_ORIGIN to the deployed frontend URL.
    origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
    credentials: true, // Required so browsers send the HttpOnly cookie cross-origin.
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)()); // Populates req.cookies — required by /refresh and /logout.
// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', auth_router_1.default);
app.use('/api/onboarding', onboarding_router_1.default);
app.use('/api/dashboard', dashboard_router_1.default);
app.use('/api/feedback', feedback_router_1.default);
// ─── 404 Catch-all ────────────────────────────────────────────────────────────
app.use((_req, _res, next) => {
    next(new AppError_1.AppError('The requested route does not exist.', 404));
});
// ─── Global Error Handler ─────────────────────────────────────────────────────
// Express identifies a function as an error handler by its arity (4 params).
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err, _req, res, _next) => {
    if (err instanceof AppError_1.AppError) {
        res.status(err.statusCode).json({ status: 'error', message: err.message });
        return;
    }
    if (err instanceof zod_1.ZodError) {
        res.status(400).json({
            status: 'error',
            message: 'Validation failed.',
            issues: err.issues,
        });
        return;
    }
    console.error('[Unhandled error]', err);
    res.status(500).json({ status: 'error', message: 'Internal server error.' });
});
exports.default = app;
