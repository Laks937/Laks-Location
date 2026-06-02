import type { Request, Response, NextFunction } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env';
import { HttpError } from '../utils/httpError';

export interface AdminClaims extends JwtPayload {
  adminId: number;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  admin?: AdminClaims;
}

export const requireAdminAuth = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw new HttpError('Token manquant.', 401);
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);

    if (typeof decoded === 'string' || !('adminId' in decoded) || !('email' in decoded)) {
      throw new HttpError('Token invalide.', 401);
    }

    req.admin = decoded as AdminClaims;
    next();
  } catch {
    throw new HttpError('Token invalide ou expiré.', 401);
  }
};
