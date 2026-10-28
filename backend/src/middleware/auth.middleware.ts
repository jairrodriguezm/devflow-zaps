import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthUser {
  id: string; // Mongo User._id string
  githubId: string;
  username: string;
}

export interface JwtUserPayload {
  userId: string;
  githubId: string;
  username: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    let token: string | undefined;

    // 1. Check HTTP-only cookie
    if (req.cookies && typeof req.cookies.token === 'string') {
      token = req.cookies.token;
    }

    // 2. Check Authorization header (Bearer <token>)
    const authHeader = req.headers.authorization;
    if (!token && authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }

    if (!token) {
      res.status(401).json({ error: 'Unauthorized: No authentication token provided' });
      return;
    }

    const secret = process.env.JWT_SECRET || 'devflow_jwt_secret_production_ready_key_12345';
    const decoded = jwt.verify(token, secret) as JwtUserPayload;

    req.user = {
      id: decoded.userId,
      githubId: decoded.githubId,
      username: decoded.username,
    };

    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}
