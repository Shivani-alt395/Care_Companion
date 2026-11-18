import { Request, Response } from 'express';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'crypto';
import { z } from 'zod';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import { Role, AuditAction } from '@prisma/client';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
};

function signAccessToken(userId: string, email: string, role: Role): string {
  return jwt.sign({ sub: userId, email, role }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY as string,
  });
}

function signRefreshToken(): string {
  return randomBytes(64).toString('hex');
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['SENIOR', 'CAREGIVER']),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

export async function register(req: Request, res: Response) {
  const data = registerSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new AppError(409, 'Email already registered', 'EMAIL_EXISTS');

  const passwordHash = await argon2.hash(data.password, { type: argon2.argon2id });

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      role: data.role as Role,
      profile: {
        create: { firstName: data.firstName, lastName: data.lastName },
      },
    },
    include: { profile: true },
  });

  await prisma.auditLog.create({
    data: { userId: user.id, action: AuditAction.REGISTER, ipAddress: req.ip },
  });

  const accessToken = signAccessToken(user.id, user.email, user.role);
  const refreshToken = signRefreshToken();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash: hashToken(refreshToken), expiresAt },
  });

  res.cookie('refreshToken', refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(201).json({
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      profile: user.profile,
    },
  });
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function login(req: Request, res: Response) {
  const data = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email: data.email },
    include: { profile: true },
  });

  if (!user) throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');

  const valid = await argon2.verify(user.passwordHash, data.password);
  if (!valid) throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');

  await prisma.auditLog.create({
    data: { userId: user.id, action: AuditAction.LOGIN, ipAddress: req.ip },
  });

  const accessToken = signAccessToken(user.id, user.email, user.role);
  const refreshToken = signRefreshToken();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash: hashToken(refreshToken), expiresAt },
  });

  res.cookie('refreshToken', refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      profile: user.profile,
    },
  });
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies.refreshToken as string | undefined;
  if (!token) throw new AppError(401, 'No refresh token', 'UNAUTHORIZED');

  const tokenHash = hashToken(token);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    throw new AppError(401, 'Invalid or expired refresh token', 'TOKEN_EXPIRED');
  }

  const user = await prisma.user.findUnique({
    where: { id: stored.userId },
    include: { profile: true },
  });
  if (!user) throw new AppError(401, 'User not found', 'UNAUTHORIZED');

  // Rotate refresh token
  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });

  const newRefreshToken = signRefreshToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash: hashToken(newRefreshToken), expiresAt },
  });

  res.cookie('refreshToken', newRefreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  const accessToken = signAccessToken(user.id, user.email, user.role);
  res.json({ accessToken, user: { id: user.id, email: user.email, role: user.role, profile: user.profile } });
}

export async function logout(req: Request, res: Response) {
  const token = req.cookies.refreshToken as string | undefined;

  if (token) {
    const tokenHash = hashToken(token);
    await prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revoked: true },
    });
  }

  if (req.user) {
    await prisma.auditLog.create({
      data: { userId: req.user.id, action: AuditAction.LOGOUT, ipAddress: req.ip },
    });
  }

  res.clearCookie('refreshToken', COOKIE_OPTIONS);
  res.json({ message: 'Logged out' });
}

export async function me(req: Request, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { profile: true },
  });
  if (!user) throw new AppError(404, 'User not found', 'NOT_FOUND');

  res.json({ id: user.id, email: user.email, role: user.role, profile: user.profile });
}
