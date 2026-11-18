import { PrismaClient, Role, MedForm, VitalType, DoseStatus } from '@prisma/client';
import argon2 from 'argon2';
import { addDays, subDays, setHours, setMinutes, startOfDay } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clean existing demo data
  await prisma.doseLog.deleteMany({});
  await prisma.vital.deleteMany({});
  await prisma.checkIn.deleteMany({});
  await prisma.sideEffect.deleteMany({});
  await prisma.medication.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.gameScore.deleteMany({});
  await prisma.careLink.deleteMany({});
  await prisma.inviteCode.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.profile.deleteMany({});
  await prisma.user.deleteMany({ where: { email: { in: ['demo.senior@carecompanion.app', 'demo.caregiver@carecompanion.app'] } } });

  const passwordHash = await argon2.hash('Demo@1234', { type: argon2.argon2id });

  // Create demo senior (Amma - 72-year-old with diabetes + hypertension)
  const senior = await prisma.user.create({
    data: {
      email: 'demo.senior@carecompanion.app',
      passwordHash,
      role: Role.SENIOR,
      profile: {
        create: {
          firstName: 'Kamala',
          lastName: 'Devi',
          dateOfBirth: new Date('1952-03-15'),
          bloodGroup: 'B+',
          allergies: ['Penicillin', 'Sulfa drugs'],
          conditions: ['Type 2 Diabetes', 'Hypertension', 'Mild Arthritis'],
          emergencyContacts: JSON.parse('[{"name":"Priya Devi","relation":"Daughter","phone":"9876543210"},{"name":"Dr. Suresh Kumar","relation":"Family Doctor","phone":"9845123456"}]'),
          language: 'en',
          timezone: 'Asia/Kolkata',
          checkInTime: '09:00',
        }
      }
    }
  });

  // Create demo caregiver (Priya - daughter)
  const caregiver = await prisma.user.create({
    data: {
      email: 'demo.caregiver@carecompanion.app',
      passwordHash,
      role: Role.CAREGIVER,
      profile: {
        create: {
          firstName: 'Priya',
          lastName: 'Devi',
          language: 'en',
          timezone: 'Asia/Kolkata',
        }
      }
    }
  });

  // Link them
  await prisma.careLink.create({
    data: { seniorId: senior.id, caregiverId: caregiver.id, active: true }
  });

  // Create 6 medications
  const now = new Date();
  const meds = await Promise.all([
    prisma.medication.create({
      data: {
        userId: senior.id,
        name: 'Metformin',
        genericName: 'Metformin Hydrochloride',
        dosage: '500mg',
        form: MedForm.TABLET,
        pillColor: 'white',
        pillShape: 'round',
        scheduleTimes: ['08:00', '14:00', '20:00'],
        withFood: true,
        startDate: subDays(now, 90),
        stockCount: 24,
        dailyDoses: 3,
        notes: 'Take with meals. For Type 2 Diabetes.',
        active: true,
      }
    }),
    prisma.medication.create({
      data: {
        userId: senior.id,
        name: 'Amlodipine',
        genericName: 'Amlodipine Besylate',
        dosage: '5mg',
        form: MedForm.TABLET,
        pillColor: 'white',
        pillShape: 'oval',
        scheduleTimes: ['08:00'],
        withFood: false,
        startDate: subDays(now, 180),
        stockCount: 12,
        dailyDoses: 1,
        notes: 'For high blood pressure. Take at the same time each day.',
        active: true,
      }
    }),
    prisma.medication.create({
      data: {
        userId: senior.id,
        name: 'Atorvastatin',
        genericName: 'Atorvastatin Calcium',
        dosage: '10mg',
        form: MedForm.TABLET,
        pillColor: 'orange',
        pillShape: 'round',
        scheduleTimes: ['21:00'],
        withFood: false,
        startDate: subDays(now, 120),
        stockCount: 8,
        dailyDoses: 1,
        notes: 'Take at night. Cholesterol medication.',
        active: true,
      }
    }),
    prisma.medication.create({
      data: {
        userId: senior.id,
        name: 'Aspirin',
        genericName: 'Acetylsalicylic Acid',
        dosage: '75mg',
        form: MedForm.TABLET,
        pillColor: 'yellow',
        pillShape: 'round',
        scheduleTimes: ['08:00'],
        withFood: true,
        startDate: subDays(now, 365),
        stockCount: 30,
        dailyDoses: 1,
        notes: 'Blood thinner. Take with food.',
        active: true,
      }
    }),
    prisma.medication.create({
      data: {
        userId: senior.id,
        name: 'Pantoprazole',
        genericName: 'Pantoprazole Sodium',
        dosage: '40mg',
        form: MedForm.TABLET,
        pillColor: 'yellow',
        pillShape: 'oval',
        scheduleTimes: ['07:30'],
        withoutFood: true,
        startDate: subDays(now, 60),
        stockCount: 5,
        dailyDoses: 1,
        notes: 'Take 30 min before breakfast. Acidity control.',
        active: true,
      }
    }),
    prisma.medication.create({
      data: {
        userId: senior.id,
        name: 'Vitamin D3',
        genericName: 'Cholecalciferol',
        dosage: '60000 IU',
        form: MedForm.TABLET,
        pillColor: 'brown',
        pillShape: 'round',
        scheduleTimes: ['10:00'],
        withFood: true,
        startDate: subDays(now, 30),
        endDate: addDays(now, 60),
        stockCount: 2,
        dailyDoses: 1,
        notes: 'Weekly dose. Take with milk or fatty food.',
        active: true,
      }
    }),
  ]);

  // Generate 30 days of dose logs with ~82% adherence
  const doseLogs = [];
  for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
    const date = subDays(now, dayOffset);
    for (const med of meds) {
      for (const time of med.scheduleTimes) {
        const [hours, minutes] = time.split(':').map(Number);
        const scheduledAt = setMinutes(setHours(startOfDay(date), hours), minutes);
        
        // 82% adherence
        const rand = Math.random();
        let status: DoseStatus;
        let takenAt = null;
        let skipReason = null;

        if (dayOffset === 0) {
          // Today's doses stay PENDING
          status = DoseStatus.PENDING;
        } else if (rand < 0.82) {
          status = DoseStatus.TAKEN;
          takenAt = new Date(scheduledAt.getTime() + Math.random() * 1800000);
        } else if (rand < 0.90) {
          status = DoseStatus.MISSED;
        } else if (rand < 0.96) {
          status = DoseStatus.SKIPPED;
          skipReason = 'Feeling nauseous';
        } else {
          status = DoseStatus.SNOOZED;
        }

        doseLogs.push({
          userId: senior.id,
          medicationId: med.id,
          scheduledAt,
          status,
          takenAt,
          skipReason,
        });
      }
    }
  }

  await prisma.doseLog.createMany({ data: doseLogs });

  // Create 30 days of vitals
  const vitals = [];
  for (let i = 29; i >= 0; i--) {
    const date = subDays(now, i);
    const recordedAt = setHours(startOfDay(date), 8);
    
    // Blood pressure
    vitals.push({ userId: senior.id, type: VitalType.BLOOD_PRESSURE, value: 125 + Math.random() * 20 - 5, value2: 82 + Math.random() * 10 - 3, unit: 'mmHg', recordedAt });
    // Blood sugar (fasting)
    vitals.push({ userId: senior.id, type: VitalType.BLOOD_SUGAR, value: 110 + Math.random() * 40 - 10, unit: 'mg/dL', recordedAt });
    // Weight (every 3 days)
    if (i % 3 === 0) {
      vitals.push({ userId: senior.id, type: VitalType.WEIGHT, value: 65.5 + Math.random() * 1 - 0.5, unit: 'kg', recordedAt });
    }
    // Sleep
    vitals.push({ userId: senior.id, type: VitalType.SLEEP, value: 6 + Math.random() * 2 - 0.5, unit: 'hours', recordedAt });
    // Mood (1-5)
    vitals.push({ userId: senior.id, type: VitalType.MOOD, value: 3 + Math.round(Math.random() * 2 - 0.5), unit: 'scale', recordedAt });
    // Pain (0-10)
    vitals.push({ userId: senior.id, type: VitalType.PAIN, value: Math.round(Math.random() * 3), unit: 'scale', recordedAt });
  }

  await prisma.vital.createMany({ data: vitals });

  // Create check-ins (last 25 days, missing 3)
  const checkInDays = Array.from({ length: 30 }, (_, i) => i).filter(i => ![2, 7, 15].includes(i));
  for (const dayOffset of checkInDays) {
    await prisma.checkIn.create({
      data: {
        userId: senior.id,
        checkedAt: setHours(subDays(now, dayOffset), 9),
        note: dayOffset === 0 ? 'Good morning! Feeling well today.' : undefined,
      }
    });
  }

  // Create appointments
  await prisma.appointment.createMany({
    data: [
      {
        userId: senior.id,
        doctorName: 'Dr. Suresh Kumar',
        specialty: 'General Physician',
        location: 'Manipal Hospital, Bangalore',
        appointmentAt: addDays(now, 7),
        questions: ['Why is my blood pressure still high?', 'Can I reduce Metformin dose?', 'What foods should I avoid?'],
        notes: 'Regular monthly check-up',
        completed: false,
      },
      {
        userId: senior.id,
        doctorName: 'Dr. Anitha Rao',
        specialty: 'Endocrinologist',
        location: 'Apollo Hospital, Bangalore',
        appointmentAt: addDays(now, 21),
        questions: ['HbA1c results', 'Should I start insulin?', 'Diet plan for monsoon'],
        notes: 'Diabetes specialist follow-up',
        completed: false,
      },
      {
        userId: senior.id,
        doctorName: 'Dr. Suresh Kumar',
        specialty: 'General Physician',
        location: 'Manipal Hospital, Bangalore',
        appointmentAt: subDays(now, 7),
        questions: ['Blood pressure management', 'Vitamin D deficiency'],
        notes: 'Prescribed Vitamin D3 60000 IU weekly',
        completed: true,
      }
    ]
  });

  // Create side effects
  await prisma.sideEffect.createMany({
    data: [
      {
        userId: senior.id,
        medicationId: meds[0].id,
        description: 'Mild nausea after taking Metformin',
        severity: 2,
        occurredAt: subDays(now, 5),
        resolved: true,
        resolvedAt: subDays(now, 3),
      },
      {
        userId: senior.id,
        medicationId: meds[2].id,
        description: 'Muscle pain in legs',
        severity: 3,
        occurredAt: subDays(now, 10),
        resolved: false,
      }
    ]
  });

  // Create game scores
  await prisma.gameScore.createMany({
    data: [
      { userId: senior.id, gameType: 'memory-match', score: 850, streak: 5, playedAt: subDays(now, 1) },
      { userId: senior.id, gameType: 'memory-match', score: 920, streak: 6, playedAt: now },
      { userId: senior.id, gameType: 'pill-quiz', score: 700, streak: 3, playedAt: subDays(now, 2) },
    ]
  });

  console.log(`✅ Demo Senior: demo.senior@carecompanion.app / Demo@1234`);
  console.log(`✅ Demo Caregiver: demo.caregiver@carecompanion.app / Demo@1234`);
  console.log(`✅ Seed complete! Created ${meds.length} medications, ${doseLogs.length} dose logs, ${vitals.length} vitals`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
