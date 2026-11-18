import { Request, Response } from 'express';
import { subDays } from 'date-fns';
import { prisma } from '../config/database';
import { DoseStatus } from '@prisma/client';

export async function getDoctorSummary(req: Request, res: Response) {
  const userId = req.user!.id;
  const days = parseInt(req.query.days as string) || 30;
  const since = subDays(new Date(), days);

  const [profile, medications, doseLogs, vitals, sideEffects, appointments] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.medication.findMany({ where: { userId, active: true } }),
    prisma.doseLog.findMany({
      where: { userId, scheduledAt: { gte: since } },
      include: { medication: { select: { name: true } } },
    }),
    prisma.vital.findMany({ where: { userId, recordedAt: { gte: since } }, orderBy: { recordedAt: 'asc' } }),
    prisma.sideEffect.findMany({
      where: { userId, occurredAt: { gte: since } },
      include: { medication: { select: { name: true } } },
    }),
    prisma.appointment.findMany({
      where: { userId, completed: true, appointmentAt: { gte: since } },
    }),
  ]);

  const totalDoses = doseLogs.length;
  const takenDoses = doseLogs.filter(d => d.status === DoseStatus.TAKEN).length;
  const missedDoses = doseLogs.filter(d => d.status === DoseStatus.MISSED);
  const adherencePct = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;

  // Vitals summary
  const vitalsByType: Record<string, { values: number[]; dates: string[] }> = {};
  for (const v of vitals) {
    if (!vitalsByType[v.type]) vitalsByType[v.type] = { values: [], dates: [] };
    vitalsByType[v.type].values.push(v.value);
    vitalsByType[v.type].dates.push(v.recordedAt.toISOString());
  }

  const vitalSummary = Object.entries(vitalsByType).map(([type, data]) => ({
    type,
    latest: data.values[data.values.length - 1],
    min: Math.min(...data.values),
    max: Math.max(...data.values),
    avg: parseFloat((data.values.reduce((a, b) => a + b, 0) / data.values.length).toFixed(1)),
    count: data.values.length,
  }));

  res.json({
    generatedAt: new Date().toISOString(),
    period: { days, since: since.toISOString() },
    patient: {
      name: profile ? `${profile.firstName} ${profile.lastName}` : 'Unknown',
      conditions: profile?.conditions ?? [],
      allergies: profile?.allergies ?? [],
    },
    adherence: { percentage: adherencePct, taken: takenDoses, total: totalDoses },
    missedDoses: missedDoses.map(d => ({
      medication: d.medication.name,
      scheduledAt: d.scheduledAt,
    })),
    medications: medications.map(m => ({ name: m.name, dosage: m.dosage, form: m.form, times: m.scheduleTimes })),
    vitals: vitalSummary,
    sideEffects: sideEffects.map(s => ({
      description: s.description,
      severity: s.severity,
      medication: s.medication?.name,
      occurredAt: s.occurredAt,
      resolved: s.resolved,
    })),
    appointments: appointments.length,
  });
}
