import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';

const scoreSchema = z.object({
  gameType: z.enum(['memory-match', 'pill-quiz']),
  score: z.number().int().min(0),
  streak: z.number().int().min(0).default(0),
});

export async function getScores(req: Request, res: Response) {
  const scores = await prisma.gameScore.findMany({
    where: { userId: req.user!.id },
    orderBy: { playedAt: 'desc' },
    take: 20,
  });

  const bestByType: Record<string, number> = {};
  const streakByType: Record<string, number> = {};
  for (const s of scores) {
    if (!bestByType[s.gameType] || s.score > bestByType[s.gameType]) {
      bestByType[s.gameType] = s.score;
    }
    if (!streakByType[s.gameType] || s.streak > streakByType[s.gameType]) {
      streakByType[s.gameType] = s.streak;
    }
  }

  res.json({ scores, bestByType, streakByType });
}

export async function saveScore(req: Request, res: Response) {
  const data = scoreSchema.parse(req.body);
  const score = await prisma.gameScore.create({
    data: { ...data, userId: req.user!.id },
  });
  res.status(201).json(score);
}
