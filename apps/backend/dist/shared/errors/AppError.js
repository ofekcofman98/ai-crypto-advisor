"use strict";
/**
 * AppError.ts
 * Domain-aware error class that carries an HTTP status code alongside the
 * human-readable message. Throwing an AppError from any service or utility
 * allows the global error handler to map it directly to the correct HTTP
 * response without additional branching.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
class AppError extends Error {
    /** HTTP status code that should be sent to the client (e.g. 400, 401, 409). */
    statusCode;
    /** Always `true` — lets the error handler distinguish AppErrors from unexpected crashes. */
    isOperational = true;
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'AppError';
        // Restore the prototype chain so `instanceof AppError` works after transpilation.
        Object.setPrototypeOf(this, new.target.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
