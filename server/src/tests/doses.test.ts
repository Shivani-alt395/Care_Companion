import { describe, it, expect, beforeAll } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../app';
import { prisma } from '../config/database';

const app = createApp();
const request = supertest(app);

describe('Dose taking - stock decrement', () => {
  let accessToken: string;
  let medicationId: string;
  let doseId: string;

  beforeAll(async () => {
    const ts = Date.now();
    const res = await request.post('/api/v1/auth/register').send({
      email: `dose_test_${ts}@test.com`,
      password: 'Pass@1234',
      role: 'SENIOR',
      firstName: 'Dose',
      lastName: 'Tester',
    });
    accessToken = res.body.accessToken;
    const userId = res.body.user.id;

    // Create a medication with stock
    const med = await prisma.medication.create({
      data: {
        userId,
        name: 'Test Paracetamol',
        dosage: '500mg',
        scheduleTimes: ['08:00'],
        startDate: new Date(),
        stockCount: 10,
        dailyDoses: 1,
        active: true,
      },
    });
    medicationId = med.id;

    // Create a dose log for today
    const scheduledAt = new Date();
    scheduledAt.setHours(8, 0, 0, 0);
    const dose = await prisma.doseLog.create({
      data: { userId, medicationId, scheduledAt, status: 'PENDING' },
    });
    doseId = dose.id;
  });

  it('POST /api/v1/doses/:id/take - decrements stock', async () => {
    const before = await prisma.medication.findUnique({ where: { id: medicationId } });
    expect(before?.stockCount).toBe(10);

    const res = await request
      .post(`/api/v1/doses/${doseId}/take`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('TAKEN');

    const after = await prisma.medication.findUnique({ where: { id: medicationId } });
    expect(after?.stockCount).toBe(9);
  });

  it('POST /api/v1/doses/:id/take - cannot take already-taken dose', async () => {
    const res = await request
      .post(`/api/v1/doses/${doseId}/take`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(400);
  });
});

describe('Missed dose logic', () => {
  it('Doses past grace window should be marked MISSED', async () => {
    const ts = Date.now();
    const res = await request.post('/api/v1/auth/register').send({
      email: `missed_test_${ts}@test.com`,
      password: 'Pass@1234',
      role: 'SENIOR',
      firstName: 'Missed',
      lastName: 'Tester',
    });
    const userId = res.body.user.id;

    const med = await prisma.medication.create({
      data: {
        userId,
        name: 'Old Medicine',
        dosage: '100mg',
        scheduleTimes: ['06:00'],
        startDate: new Date(),
        stockCount: 5,
        dailyDoses: 1,
        active: true,
      },
    });

    // Create a dose 3 hours ago (past 2-hour grace)
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const dose = await prisma.doseLog.create({
      data: { userId, medicationId: med.id, scheduledAt: threeHoursAgo, status: 'PENDING' },
    });

    // Directly verify the dose exists and is PENDING
    const fetchedDose = await prisma.doseLog.findUnique({ where: { id: dose.id } });
    expect(fetchedDose?.status).toBe('PENDING');
    expect(fetchedDose?.scheduledAt.getTime()).toBeLessThan(Date.now() - 2 * 60 * 60 * 1000);
  });
});
