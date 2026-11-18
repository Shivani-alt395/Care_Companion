import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { Role } from '@prisma/client';
import * as ctrl from '../controllers/reports';

const router = Router();
router.use(authenticate, requireRole(Role.SENIOR));

router.get('/doctor-summary', ctrl.getDoctorSummary);

export default router;
