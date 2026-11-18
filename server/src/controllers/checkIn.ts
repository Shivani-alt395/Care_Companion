import { Request, Response } from 'express';
import { z } from 'zod';
import { startOfDay, endOfDay } from 'date-fns';
import { prisma } from '../config/database';

const checkInSchema = z.object({
  note: z.string().optional(),
});

export async function createCheckIn(req: Request, res: Response) {
  const { note } = checkInSchema.parse(req.body);

  const checkIn = await prisma.checkIn.create({
    data: { userId: req.user!.id, note },
  });

  res.status(201).json(checkIn);
}

export async function getTodayCheckIn(req: Request, res: Response) {
  const now = new Date();
  const checkIn = await prisma.checkIn.findFirst({
    where: {
      userId: req.user!.id,
      checkedAt: { gte: startOfDay(now), lte: endOfDay(now) },
    },
    orderBy: { checkedAt: 'desc' },
  });

  res.json(checkIn);
}
