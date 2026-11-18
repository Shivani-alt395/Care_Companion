import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { env } from '../config/env';

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

export function getVapidKey(_req: Request, res: Response) {
  if (!env.VAPID_PUBLIC_KEY) {
    res.status(503).json({ error: { message: 'Push not configured' } });
    return;
  }
  res.json({ publicKey: env.VAPID_PUBLIC_KEY });
}

export async function subscribe(req: Request, res: Response) {
  const data = subscriptionSchema.parse(req.body);

  await prisma.pushSubscription.upsert({
    where: { endpoint: data.endpoint },
    update: { p256dh: data.keys.p256dh, auth: data.keys.auth },
    create: {
      userId: req.user!.id,
      endpoint: data.endpoint,
      p256dh: data.keys.p256dh,
      auth: data.keys.auth,
    },
  });

  res.status(201).json({ message: 'Subscribed' });
}

export async function unsubscribe(req: Request, res: Response) {
  const { endpoint } = z.object({ endpoint: z.string() }).parse(req.body);

  await prisma.pushSubscription.deleteMany({
    where: { endpoint, userId: req.user!.id },
  });

  res.json({ message: 'Unsubscribed' });
}
