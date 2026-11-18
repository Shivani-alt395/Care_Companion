import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { Role } from '@prisma/client';
import * as ctrl from '../controllers/checkIn';

const router = Router();
router.use(authenticate, requireRole(Role.SENIOR));

router.post('/', ctrl.createCheckIn);
router.get('/today', ctrl.getTodayCheckIn);

export default router;
