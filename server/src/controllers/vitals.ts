import { Request, Response } from 'express';
import { z } from 'zod';
import { subDays } from 'date-fns';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { VitalType } from '@prisma/client';

const vitalSchema = z.object({
  type: z.nativeEnum(VitalType),
  value: z.number(),
  value2: z.number().optional(),
  unit: z.string(),
  notes: z.string().optional(),
  recordedAt: z.string().optional().transform(s => s ? new Date(s) : new Date()),
});

export async function listVitals(req: Request, res: Response) {
  const type = req.query.type as VitalType | undefined;
  const days = parseInt(req.query.days as string) || 7;

  const since = subDays(new Date(), days);
  const vitals = await prisma.vital.findMany({
    where: {
      userId: req.user!.id,
      ...(type && { type }),
      recordedAt: { gte: since },
    },
    orderBy: { recordedAt: 'desc' },
  });
  res.json(vitals);
}

export async function createVital(req: Request, res: Response) {
  const data = vitalSchema.parse(req.body);
  const vital = await prisma.vital.create({
    data: { ...data, userId: req.user!.id },
  });
  res.status(201).json(vital);
}

export async function getTrends(req: Request, res: Response) {
  const days = parseInt(req.query.days as string) || 30;
  const since = subDays(new Date(), days);

  const vitals = await prisma.vital.findMany({
    where: { userId: req.user!.id, recordedAt: { gte: since } },
    orderBy: { recordedAt: 'asc' },
  });

  // Group by type
  const trends: Record<string, { date: string; value: number; value2?: number }[]> = {};
  for (const v of vitals) {
    if (!trends[v.type]) trends[v.type] = [];
    trends[v.type].push({
      date: v.recordedAt.toISOString().split('T')[0],
      value: v.value,
      ...(v.value2 !== null && { value2: v.value2 ?? undefined }),
    });
  }

  res.json(trends);
}

export async function deleteVital(req: Request, res: Response) {
  const vital = await prisma.vital.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (!vital) throw new AppError(404, 'Vital not found', 'NOT_FOUND');

  await prisma.vital.delete({ where: { id: req.params.id } });
  res.json({ message: 'Deleted' });
}
