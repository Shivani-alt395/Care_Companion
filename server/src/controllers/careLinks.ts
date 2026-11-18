import { Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { z } from 'zod';
import { addHours } from 'date-fns';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import { AuditAction, Role } from '@prisma/client';

export async function createInvite(req: Request, res: Response) {
  const seniorId = req.user!.id;
  const code = randomBytes(3).toString('hex').toUpperCase(); // 6-char hex
  const expiresAt = addHours(new Date(), env.INVITE_CODE_EXPIRY_HOURS);

  const invite = await prisma.inviteCode.create({
    data: { code, seniorId, expiresAt },
  });

  await prisma.auditLog.create({
    data: { userId: seniorId, action: AuditAction.INVITE_CREATED, metadata: { code } },
  });

  res.status(201).json({ code: invite.code, expiresAt: invite.expiresAt });
}

const redeemSchema = z.object({ code: z.string().length(6) });

export async function redeemInvite(req: Request, res: Response) {
  const { code } = redeemSchema.parse(req.body);
  const caregiverId = req.user!.id;

  const invite = await prisma.inviteCode.findUnique({ where: { code } });
  if (!invite || invite.redeemed || invite.expiresAt < new Date()) {
    throw new AppError(400, 'Invalid or expired invite code', 'INVALID_INVITE');
  }

  // Check not already linked
  const existing = await prisma.careLink.findFirst({
    where: { seniorId: invite.seniorId, caregiverId, active: true },
  });
  if (existing) throw new AppError(409, 'Already linked to this senior', 'ALREADY_LINKED');

  const [link] = await prisma.$transaction([
    prisma.careLink.create({
      data: { seniorId: invite.seniorId, caregiverId, active: true },
      include: { senior: { include: { profile: true } } },
    }),
    prisma.inviteCode.update({ where: { id: invite.id }, data: { redeemed: true } }),
  ]);

  await prisma.auditLog.create({
    data: {
      userId: caregiverId,
      action: AuditAction.INVITE_REDEEMED,
      metadata: { seniorId: invite.seniorId },
    },
  });

  res.status(201).json(link);
}

export async function listLinks(req: Request, res: Response) {
  const user = req.user!;

  if (user.role === Role.SENIOR) {
    const links = await prisma.careLink.findMany({
      where: { seniorId: user.id, active: true },
      include: { caregiver: { include: { profile: true } } },
    });
    res.json(links);
  } else {
    const links = await prisma.careLink.findMany({
      where: { caregiverId: user.id, active: true },
      include: { senior: { include: { profile: true } } },
    });
    res.json(links);
  }
}

export async function revokeLink(req: Request, res: Response) {
  const { id } = req.params;
  const user = req.user!;

  const link = await prisma.careLink.findUnique({ where: { id } });
  if (!link) throw new AppError(404, 'Link not found', 'NOT_FOUND');

  // Senior can revoke any link on them; caregiver can revoke their own link
  if (user.role === Role.SENIOR && link.seniorId !== user.id) {
    throw new AppError(403, 'Forbidden', 'FORBIDDEN');
  }
  if (user.role === Role.CAREGIVER && link.caregiverId !== user.id) {
    throw new AppError(403, 'Forbidden', 'FORBIDDEN');
  }

  await prisma.careLink.update({ where: { id }, data: { active: false } });

  await prisma.auditLog.create({
    data: { userId: user.id, action: AuditAction.LINK_REVOKED, metadata: { linkId: id } },
  });

  res.json({ message: 'Link revoked' });
}
