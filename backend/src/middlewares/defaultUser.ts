import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

// For personal use - auto-assign default user without authentication
export const defaultUserMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  // Use environment variable or fallback to a default UUID
  req.userId = env.DEFAULT_USER_ID || '00000000-0000-0000-0000-000000000001';
  next();
};

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}
