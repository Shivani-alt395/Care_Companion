import { Request, Response } from 'express';
import { z } from 'zod';
import { addMinutes, startOfDay, endOfDay } from 'date-fns';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { DoseStatus, AuditAction } from '@prisma/client';

export async function getTodayDoses(req: Request, res: Response) {
  // Use UTC day boundaries (simple, works for most users; profile timezone handled client-side)
  const now = new Date();
  const start = startOfDay(now);
  const end = endOfDay(now);

  const doses = await prisma.doseLog.findMany({
    where: {
      userId: req.user!.id,
      scheduledAt: { gte: start, lte: end },
    },
    include: { medication: true },
    orderBy: { scheduledAt: 'asc' },
  });

  res.json(doses);
}

const skipSchema = z.object({
  reason: z.string().optional(),
});

const snoozeSchema = z.object({
  minutes: z.number().int().min(5).max(60).default(10),
});

export async function takeDose(req: Request, res: Response) {
  const dose = await prisma.doseLog.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
    include: { medication: true },
  });

  if (!dose) throw new AppError(404, 'Dose not found', 'NOT_FOUND');
  if (dose.status === DoseStatus.TAKEN) throw new AppError(400, 'Dose already taken', 'ALREADY_TAKEN');

  // Decrement stock in a transaction
  const [updatedDose] = await prisma.$transaction([
    prisma.doseLog.update({
      where: { id: dose.id },
      data: { status: DoseStatus.TAKEN, takenAt: new Date() },
      include: { medication: true },
    }),
    ...(dose.medication.stockCount > 0
      ? [
          prisma.medication.update({
            where: { id: dose.medicationId },
            data: { stockCount: { decrement: 1 } },
          }),
        ]
      : []),
  ]);

  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: AuditAction.DOSE_TAKEN,
      metadata: { doseId: dose.id, medicationId: dose.medicationId },
    },
  });

  res.json(updatedDose);
}

export async function skipDose(req: Request, res: Response) {
  const dose = await prisma.doseLog.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (!dose) throw new AppError(404, 'Dose not found', 'NOT_FOUND');

  const { reason } = skipSchema.parse(req.body);

  const updated = await prisma.doseLog.update({
    where: { id: dose.id },
    data: { status: DoseStatus.SKIPPED, skipReason: reason },
    include: { medication: true },
  });

  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: AuditAction.DOSE_SKIPPED,
      metadata: { doseId: dose.id, reason },
    },
  });

  res.json(updated);
}

export async function snoozeDose(req: Request, res: Response) {
  const dose = await prisma.doseLog.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (!dose) throw new AppError(404, 'Dose not found', 'NOT_FOUND');

  const { minutes } = snoozeSchema.parse(req.body);
  const snoozeUntil = addMinutes(new Date(), minutes);

  const updated = await prisma.doseLog.update({
    where: { id: dose.id },
    data: { status: DoseStatus.SNOOZED, snoozeUntil },
    include: { medication: true },
  });

  res.json(updated);
}
