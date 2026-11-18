import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

const appointmentSchema = z.object({
  doctorName: z.string().min(1),
  specialty: z.string().optional(),
  location: z.string().optional(),
  appointmentAt: z.string().transform(s => new Date(s)),
  questions: z.array(z.string()).default([]),
  notes: z.string().optional(),
  completed: z.boolean().default(false),
});

export async function listAppointments(req: Request, res: Response) {
  const appointments = await prisma.appointment.findMany({
    where: { userId: req.user!.id },
    orderBy: { appointmentAt: 'asc' },
  });
  res.json(appointments);
}

export async function createAppointment(req: Request, res: Response) {
  const data = appointmentSchema.parse(req.body);
  const appointment = await prisma.appointment.create({
    data: { ...data, userId: req.user!.id },
  });
  res.status(201).json(appointment);
}

export async function updateAppointment(req: Request, res: Response) {
  const existing = await prisma.appointment.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (!existing) throw new AppError(404, 'Appointment not found', 'NOT_FOUND');

  const data = appointmentSchema.partial().parse(req.body);
  const updated = await prisma.appointment.update({
    where: { id: req.params.id },
    data,
  });
  res.json(updated);
}

export async function deleteAppointment(req: Request, res: Response) {
  const existing = await prisma.appointment.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (!existing) throw new AppError(404, 'Appointment not found', 'NOT_FOUND');

  await prisma.appointment.delete({ where: { id: req.params.id } });
  res.json({ message: 'Deleted' });
}
