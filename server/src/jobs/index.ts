import cron from 'node-cron';
import { subMinutes, addMinutes, startOfDay, endOfDay, format } from 'date-fns';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { sendPushToUser } from '../services/pushService';
import { DoseStatus } from '@prisma/client';

// DB advisory lock to prevent duplicate job runs
async function withAdvisoryLock<T>(lockId: number, fn: () => Promise<T>): Promise<T | null> {
  try {
    const result = await prisma.$queryRaw<[{ acquired: boolean }]>`
      SELECT pg_try_advisory_lock(${lockId}::bigint) as acquired
    `;
    if (!result[0].acquired) return null;
    try {
      return await fn();
    } finally {
      await prisma.$queryRaw`SELECT pg_advisory_unlock(${lockId}::bigint)`;
    }
  } catch (err) {
    logger.error({ err }, 'Advisory lock error');
    return null;
  }
}

// Every minute: notify due doses
async function notifyDueDoses() {
  await withAdvisoryLock(1001, async () => {
    const now = new Date();
    const windowStart = subMinutes(now, 1);
    const windowEnd = addMinutes(now, 1);

    const dueDoses = await prisma.doseLog.findMany({
      where: {
        status: DoseStatus.PENDING,
        scheduledAt: { gte: windowStart, lte: windowEnd },
        notified: false,
      },
      include: { medication: true, user: { include: { profile: true } } },
    });

    for (const dose of dueDoses) {
      const firstName = dose.user.profile?.firstName ?? 'there';
      const time = format(dose.scheduledAt, 'h:mm a');
      const med = dose.medication;
      const withFoodText = med.withFood ? 'after food' : med.withoutFood ? 'before food' : '';
      const body = `${firstName}, time to take ${med.dosage} ${med.name} ${withFoodText}`.trim();

      await sendPushToUser(dose.userId, `💊 Medication Reminder`, body, {
        type: 'DOSE_REMINDER',
        doseId: dose.id,
        time,
      });

      await prisma.doseLog.update({
        where: { id: dose.id },
        data: { notified: true },
      });
    }

    if (dueDoses.length > 0) {
      logger.info(`Notified ${dueDoses.length} due doses`);
    }
  });
}

// Every 15 minutes: mark MISSED doses
async function markMissedDoses() {
  await withAdvisoryLock(1002, async () => {
    const graceEnd = subMinutes(new Date(), env.MISSED_DOSE_GRACE_MINUTES);

    const missed = await prisma.doseLog.findMany({
      where: {
        status: { in: [DoseStatus.PENDING, DoseStatus.SNOOZED] },
        scheduledAt: { lt: graceEnd },
      },
      include: { medication: true, user: { include: { profile: true } } },
    });

    if (missed.length === 0) return;

    await prisma.doseLog.updateMany({
      where: { id: { in: missed.map(d => d.id) } },
      data: { status: DoseStatus.MISSED },
    });

    // Notify caregivers
    const userIds = [...new Set(missed.map(d => d.userId))];
    for (const userId of userIds) {
      const userDoses = missed.filter(d => d.userId === userId);
      const links = await prisma.careLink.findMany({
        where: { seniorId: userId, active: true },
      });

      const profile = userDoses[0].user.profile;
      const name = profile?.firstName ?? 'Your senior';

      for (const link of links) {
        await sendPushToUser(
          link.caregiverId,
          `⚠️ Missed Doses`,
          `${name} missed ${userDoses.length} dose(s): ${userDoses.map(d => d.medication.name).join(', ')}`,
          { type: 'MISSED_DOSE', seniorId: userId }
        );
      }
    }

    logger.info(`Marked ${missed.length} doses as MISSED`);
  });
}

// Daily: low stock alerts
async function lowStockAlerts() {
  await withAdvisoryLock(1003, async () => {
    const lowStockMeds = await prisma.medication.findMany({
      where: { active: true, stockCount: { lte: 7 } },
      include: { user: { include: { profile: true } } },
    });

    for (const med of lowStockMeds) {
      const daysLeft = Math.floor(med.stockCount / (med.dailyDoses || 1));
      await sendPushToUser(
        med.userId,
        '💊 Refill Reminder',
        `${med.name} runs out in ${daysLeft} day(s). Current stock: ${med.stockCount} ${med.stockUnit}.`,
        { type: 'LOW_STOCK', medicationId: med.id }
      );
    }

    if (lowStockMeds.length > 0) {
      logger.info(`Sent ${lowStockMeds.length} low-stock alerts`);
    }
  });
}

// Inactivity alert: if no check-in by configured time
async function inactivityAlerts() {
  await withAdvisoryLock(1004, async () => {
    const now = new Date();
    const hour = now.getHours();

    // Only run between 10am and 10pm
    if (hour < 10 || hour > 22) return;

    const seniors = await prisma.user.findMany({
      where: { role: 'SENIOR' },
      include: { profile: true },
    });

    for (const senior of seniors) {
      const checkInHour = parseInt((senior.profile?.checkInTime ?? '09:00').split(':')[0]);
      if (hour < checkInHour + 1) continue; // Not yet overdue

      const todayCheckIn = await prisma.checkIn.findFirst({
        where: {
          userId: senior.id,
          checkedAt: { gte: startOfDay(now), lte: endOfDay(now) },
        },
      });

      if (!todayCheckIn) {
        const links = await prisma.careLink.findMany({
          where: { seniorId: senior.id, active: true },
        });

        const name = senior.profile?.firstName ?? 'Your senior';
        for (const link of links) {
          // Don't spam - check if we already sent this today
          const alreadySent = await prisma.notification.findFirst({
            where: {
              userId: link.caregiverId,
              type: 'INACTIVITY_ALERT',
              sentAt: { gte: startOfDay(now) },
            },
          });
          if (!alreadySent) {
            await sendPushToUser(
              link.caregiverId,
              `🔔 No Check-in`,
              `${name} hasn't checked in today (expected by ${senior.profile?.checkInTime}).`,
              { type: 'INACTIVITY_ALERT', seniorId: senior.id }
            );
          }
        }
      }
    }
  });
}

export function startJobs() {
  // Every minute: dose reminders
  cron.schedule('* * * * *', () => {
    notifyDueDoses().catch(err => logger.error({ err }, 'notifyDueDoses failed'));
  });

  // Every 15 minutes: missed dose check
  cron.schedule('*/15 * * * *', () => {
    markMissedDoses().catch(err => logger.error({ err }, 'markMissedDoses failed'));
  });

  // Daily at 8am: low stock alerts
  cron.schedule('0 8 * * *', () => {
    lowStockAlerts().catch(err => logger.error({ err }, 'lowStockAlerts failed'));
  });

  // Every hour: inactivity alerts
  cron.schedule('0 * * * *', () => {
    inactivityAlerts().catch(err => logger.error({ err }, 'inactivityAlerts failed'));
  });
}
