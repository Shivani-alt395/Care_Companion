import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/database';
import { AppError } from './errorHandler';
import { Role } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  iat: number;
  exp: number;
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError(401, 'No access token provided', 'UNAUTHORIZED');
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch {
    throw new AppError(401, 'Invalid or expired access token', 'TOKEN_EXPIRED');
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new AppError(401, 'Not authenticated', 'UNAUTHORIZED');
    if (!roles.includes(req.user.role)) {
      throw new AppError(403, 'Insufficient permissions', 'FORBIDDEN');
    }
    next();
  };
}

export async function verifyCareLink(
  caregiverId: string,
  seniorId: string
): Promise<boolean> {
  const link = await prisma.careLink.findFirst({
    where: { caregiverId, seniorId, active: true },
  });
  return !!link;
}

export function requireCaregiverLink(seniorParamName = 'seniorId') {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new AppError(401, 'Not authenticated', 'UNAUTHORIZED');
    if (req.user.role !== Role.CAREGIVER) {
      throw new AppError(403, 'Only caregivers can access this endpoint', 'FORBIDDEN');
    }
    const seniorId = req.params[seniorParamName];
    const linked = await verifyCareLink(req.user.id, seniorId);
    if (!linked) {
      throw new AppError(403, 'You are not linked to this senior', 'NOT_LINKED');
    }
    next();
  };
}
