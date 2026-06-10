import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../shared/errors/AppError';
import type { AccessTokenPayload } from '../modules/auth/auth.types';

const JWT_SECRET = process.env.JWT_ACCESS_SECRET || 'fallback_secret_key';

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  try {

    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('Authentication token is missing.', 401);
    }

    const token = authHeader.slice(7);

    const payload = jwt.verify(token, JWT_SECRET) as AccessTokenPayload;
    req.user = { id: payload.userId, email: payload.email };
    next();
  }
  catch (error) {
    next(error instanceof AppError ? error : new AppError('Invalid or expired token.', 401));
  }
}
