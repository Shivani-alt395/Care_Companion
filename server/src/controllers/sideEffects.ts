import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

const sideEffectSchema = z.object({
  medicationId: z.string().optional(),
  description: z.string().min(1),
  severity: z.number().int().min(1).max(5).default(1),
  occurredAt: z.string().optional().transform(s => s ? new Date(s) : new Date()),
  resolved: z.boolean().default(false),
  resolvedAt: z.string().optional().transform(s => s ? new Date(s) : undefined),
});

export async function listSideEffects(req: Request, res: Response) {
  const effects = await prisma.sideEffect.findMany({
    where: { userId: req.user!.id },
    include: { medication: { select: { name: true, dosage: true } } },
    orderBy: { occurredAt: 'desc' },
  });
  res.json(effects);
}

export async function createSideEffect(req: Request, res: Response) {
  const data = sideEffectSchema.parse(req.body);
  const effect = await prisma.sideEffect.create({
    data: { ...data, userId: req.user!.id },
  });
  res.status(201).json(effect);
}

export async function updateSideEffect(req: Request, res: Response) {
  const existing = await prisma.sideEffect.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (!existing) throw new AppError(404, 'Side effect not found', 'NOT_FOUND');

  const data = sideEffectSchema.partial().parse(req.body);
  const updated = await prisma.sideEffect.update({
    where: { id: req.params.id },
    data,
  });
  res.json(updated);
}

export async function deleteSideEffect(req: Request, res: Response) {
  const existing = await prisma.sideEffect.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (!existing) throw new AppError(404, 'Side effect not found', 'NOT_FOUND');

  await prisma.sideEffect.delete({ where: { id: req.params.id } });
  res.json({ message: 'Deleted' });
}
