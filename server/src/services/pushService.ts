import webpush from 'web-push';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { logger } from '../config/logger';

if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    env.VAPID_SUBJECT,
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY
  );
}

export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  if (!env.VAPID_PUBLIC_KEY) return;

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title, body, data, icon: '/icon-192.png' })
      );
    } catch (err) {
      logger.warn({ err, endpoint: sub.endpoint }, 'Push notification failed');
      // Remove invalid subscriptions
      if ((err as { statusCode?: number }).statusCode === 410) {
        await prisma.pushSubscription.deleteMany({ where: { endpoint: sub.endpoint } });
      }
    }
  }

  // Store notification in DB
  await prisma.notification.create({
    data: {
      userId,
      type: (data?.type as string) ?? 'GENERAL',
      title,
      body,
      data: data ? (data as Prisma.InputJsonValue) : Prisma.JsonNull,
    },
  });
}
