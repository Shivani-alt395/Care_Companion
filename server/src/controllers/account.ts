import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { AuditAction } from '@prisma/client';

export async function exportData(req: Request, res: Response) {
  const userId = req.user!.id;

  const [user, medications, doseLogs, vitals, checkIns, appointments, sideEffects] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, include: { profile: true } }),
    prisma.medication.findMany({ where: { userId } }),
    prisma.doseLog.findMany({ where: { userId } }),
    prisma.vital.findMany({ where: { userId } }),
    prisma.checkIn.findMany({ where: { userId } }),
    prisma.appointment.findMany({ where: { userId } }),
    prisma.sideEffect.findMany({ where: { userId } }),
  ]);

  await prisma.auditLog.create({
    data: { userId, action: AuditAction.DATA_EXPORTED },
  });

  const exportData = {
    exportedAt: new Date().toISOString(),
    user: { id: user?.id, email: user?.email, role: user?.role, profile: user?.profile },
    medications,
    doseLogs,
    vitals,
    checkIns,
    appointments,
    sideEffects,
  };

  res.setHeader('Content-Disposition', 'attachment; filename="carecompanion-export.json"');
  res.json(exportData);
}

export async function deleteAccount(req: Request, res: Response) {
  const userId = req.user!.id;

  await prisma.auditLog.create({
    data: { userId, action: AuditAction.ACCOUNT_DELETED },
  });

  // Cascading deletes via Prisma schema
  await prisma.user.delete({ where: { id: userId } });

  res.clearCookie('refreshToken');
  res.json({ message: 'Account deleted successfully' });
}
