import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { Role } from '@prisma/client';
import * as ctrl from '../controllers/medications';

const router = Router();
router.use(authenticate, requireRole(Role.SENIOR));

router.get('/', ctrl.listMedications);
router.post('/', ctrl.createMedication);
router.get('/:id', ctrl.getMedication);
router.put('/:id', ctrl.updateMedication);
router.delete('/:id', ctrl.deleteMedication);
router.get('/:id/doses', ctrl.getDosesForMedication);

export default router;
