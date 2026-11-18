import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { MedForm, AuditAction } from '@prisma/client';

const medicationSchema = z.object({
  name: z.string().min(1),
  genericName: z.string().optional(),
  dosage: z.string().min(1),
  form: z.nativeEnum(MedForm).default(MedForm.TABLET),
  pillColor: z.string().optional(),
  pillShape: z.string().optional(),
  scheduleTimes: z.array(z.string().regex(/^\d{2}:\d{2}$/)).min(1),
  withFood: z.boolean().default(false),
  withoutFood: z.boolean().default(false),
  startDate: z.string().transform(s => new Date(s)),
  endDate: z.string().optional().transform(s => s ? new Date(s) : undefined),
  stockCount: z.number().int().min(0).default(0),
  stockUnit: z.string().default('tablets'),
  dailyDoses: z.number().int().min(1).default(1),
  notes: z.string().optional(),
});

export async function listMedications(req: Request, res: Response) {
  const meds = await prisma.medication.findMany({
    where: { userId: req.user!.id, active: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(meds);
}

export async function getMedication(req: Request, res: Response) {
  const med = await prisma.medication.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (!med) throw new AppError(404, 'Medication not found', 'NOT_FOUND');
  res.json(med);
}

export async function createMedication(req: Request, res: Response) {
  const data = medicationSchema.parse(req.body);
  const med = await prisma.medication.create({
    data: { ...data, userId: req.user!.id },
  });
  res.status(201).json(med);
}

export async function updateMedication(req: Request, res: Response) {
  const existing = await prisma.medication.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (!existing) throw new AppError(404, 'Medication not found', 'NOT_FOUND');

  const data = medicationSchema.partial().parse(req.body);
  const med = await prisma.medication.update({
    where: { id: req.params.id },
    data,
  });
  res.json(med);
}

export async function deleteMedication(req: Request, res: Response) {
  const existing = await prisma.medication.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (!existing) throw new AppError(404, 'Medication not found', 'NOT_FOUND');

  await prisma.medication.update({
    where: { id: req.params.id },
    data: { active: false },
  });

  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: AuditAction.MEDICATION_DELETED,
      metadata: { medicationId: req.params.id, name: existing.name },
    },
  });

  res.json({ message: 'Medication deleted' });
}

export async function getDosesForMedication(req: Request, res: Response) {
  const med = await prisma.medication.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (!med) throw new AppError(404, 'Medication not found', 'NOT_FOUND');

  const doses = await prisma.doseLog.findMany({
    where: { medicationId: req.params.id },
    orderBy: { scheduledAt: 'desc' },
    take: 100,
  });
  res.json(doses);
}
