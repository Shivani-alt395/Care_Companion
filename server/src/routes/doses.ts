import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { Role } from '@prisma/client';
import * as ctrl from '../controllers/doses';

const router = Router();
router.use(authenticate, requireRole(Role.SENIOR));

router.get('/today', ctrl.getTodayDoses);
router.post('/:id/take', ctrl.takeDose);
router.post('/:id/skip', ctrl.skipDose);
router.post('/:id/snooze', ctrl.snoozeDose);

export default router;
