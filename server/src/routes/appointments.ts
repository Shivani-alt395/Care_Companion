import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { Role } from '@prisma/client';
import * as ctrl from '../controllers/appointments';

const router = Router();
router.use(authenticate, requireRole(Role.SENIOR));

router.get('/', ctrl.listAppointments);
router.post('/', ctrl.createAppointment);
router.put('/:id', ctrl.updateAppointment);
router.delete('/:id', ctrl.deleteAppointment);

export default router;
