import { Request, Response } from 'express';
import { subDays, startOfDay, endOfDay, format, eachDayOfInterval } from 'date-fns';
import { prisma } from '../config/database';
import { DoseStatus } from '@prisma/client';

export async function listSeniors(req: Request, res: Response) {
  const links = await prisma.careLink.findMany({
    where: { caregiverId: req.user!.id, active: true },
    include: {
      senior: {
        include: {
          profile: true,
          medications: { where: { active: true }, select: { id: true, name: true, stockCount: true } },
        },
      },
    },
  });

  const seniors = links.map(l => ({
    linkId: l.id,
    senior: {
      id: l.senior.id,
      email: l.senior.email,
      profile: l.senior.profile,
      medicationCount: l.senior.medications.length,
    },
  }));

  res.json(seniors);
}

export async function getSeniorDashboard(req: Request, res: Response) {
  const seniorId = req.params.seniorId;
  const days = 30;
  const since = subDays(new Date(), days);

  const [profile, medications, doseLogs, vitals, checkIns, sideEffects] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: seniorId } }),
    prisma.medication.findMany({ where: { userId: seniorId, active: true } }),
    prisma.doseLog.findMany({
      where: { userId: seniorId, scheduledAt: { gte: since } },
      include: { medication: { select: { name: true } } },
    }),
    prisma.vital.findMany({
      where: { userId: seniorId, recordedAt: { gte: since } },
      orderBy: { recordedAt: 'desc' },
      take: 60,
    }),
    prisma.checkIn.findMany({
      where: { userId: seniorId, checkedAt: { gte: since } },
      orderBy: { checkedAt: 'desc' },
    }),
    prisma.sideEffect.findMany({
      where: { userId: seniorId, resolved: false },
      include: { medication: { select: { name: true } } },
    }),
  ]);

  // Adherence
  const totalDoses = doseLogs.length;
  const takenDoses = doseLogs.filter(d => d.status === DoseStatus.TAKEN).length;
  const adherencePct = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;

  // 30-day heatmap
  const dateRange = eachDayOfInterval({ start: since, end: new Date() });
  const heatmap = dateRange.map(day => {
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    const dayDoses = doseLogs.filter(
      d => d.scheduledAt >= dayStart && d.scheduledAt <= dayEnd
    );
    const taken = dayDoses.filter(d => d.status === DoseStatus.TAKEN).length;
    const total = dayDoses.length;
    return {
      date: format(day, 'yyyy-MM-dd'),
      adherence: total > 0 ? Math.round((taken / total) * 100) : null,
      taken,
      total,
    };
  });

  // Missed dose timeline (last 7 days)
  const missedTimeline = doseLogs
    .filter(d => d.status === DoseStatus.MISSED)
    .slice(-20)
    .map(d => ({
      medication: d.medication.name,
      scheduledAt: d.scheduledAt,
    }));

  // Low stock alerts
  const lowStock = medications
    .filter(m => m.stockCount <= 7)
    .map(m => ({
      id: m.id,
      name: m.name,
      stockCount: m.stockCount,
      daysLeft: Math.floor(m.stockCount / (m.dailyDoses || 1)),
    }));

  // Last check-in
  const lastCheckIn = checkIns[0] ?? null;

  // Vitals alerts (simple thresholds)
  const vitalsAlerts: string[] = [];
  for (const v of vitals.slice(0, 5)) {
    if (v.type === 'BLOOD_PRESSURE' && v.value > 140) {
      vitalsAlerts.push(`High BP: ${v.value}/${v.value2} mmHg on ${format(v.recordedAt, 'MMM d')}`);
    }
    if (v.type === 'BLOOD_SUGAR' && v.value > 180) {
      vitalsAlerts.push(`High blood sugar: ${v.value} mg/dL on ${format(v.recordedAt, 'MMM d')}`);
    }
  }

  // Weekly insights (plain language)
  const weekDoses = doseLogs.filter(d => d.scheduledAt >= subDays(new Date(), 7));
  const weekTaken = weekDoses.filter(d => d.status === DoseStatus.TAKEN).length;
  const weekAdherence = weekDoses.length > 0 ? Math.round((weekTaken / weekDoses.length) * 100) : 0;
  const checkInStreak = checkIns.filter(c => c.checkedAt >= subDays(new Date(), 7)).length;

  const insights: string[] = [];
  if (weekAdherence >= 90) insights.push(`🌟 Excellent week! ${profile?.firstName} took ${weekAdherence}% of medicines.`);
  else if (weekAdherence >= 70) insights.push(`👍 Good week. Adherence at ${weekAdherence}%. ${weekDoses.length - weekTaken} doses missed.`);
  else insights.push(`⚠️ Adherence dropped to ${weekAdherence}% this week. Consider calling to check in.`);

  if (checkInStreak >= 7) insights.push(`✅ Checked in every day this week!`);
  else if (checkInStreak < 5) insights.push(`📋 Only ${checkInStreak}/7 daily check-ins this week.`);

  if (lowStock.length > 0) {
    insights.push(`💊 ${lowStock.map(m => m.name).join(', ')} running low.`);
  }

  res.json({
    profile,
    adherence: { percentage: adherencePct, taken: takenDoses, total: totalDoses },
    heatmap,
    missedTimeline,
    lowStock,
    lastCheckIn,
    vitalsAlerts,
    activeSideEffects: sideEffects.length,
    insights,
  });
}
