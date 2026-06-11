"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const AppError_1 = require("../shared/errors/AppError");
const JWT_SECRET = process.env.JWT_ACCESS_SECRET || 'fallback_secret_key';
function authMiddleware(req, _res, next) {
    const authHeader = req.headers.authorization;
    try {
        if (!authHeader?.startsWith('Bearer ')) {
            throw new AppError_1.AppError('Authentication token is missing.', 401);
        }
        const token = authHeader.slice(7);
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = { id: payload.userId, email: payload.email };
        next();
    }
    catch (error) {
        next(error instanceof AppError_1.AppError ? error : new AppError_1.AppError('Invalid or expired token.', 401));
    }
}
