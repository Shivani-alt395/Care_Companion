import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export async function getMedicalId(req: Request, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { profile: true, medications: { where: { active: true } } },
  });

  if (!user || !user.profile) throw new AppError(404, 'Profile not found', 'NOT_FOUND');

  res.json({
    name: `${user.profile.firstName} ${user.profile.lastName}`,
    dateOfBirth: user.profile.dateOfBirth,
    bloodGroup: user.profile.bloodGroup,
    allergies: user.profile.allergies,
    conditions: user.profile.conditions,
    medications: user.medications.map(m => ({
      name: m.name,
      dosage: m.dosage,
      form: m.form,
      times: m.scheduleTimes,
    })),
    emergencyContacts: user.profile.emergencyContacts,
    generatedAt: new Date().toISOString(),
  });
}
