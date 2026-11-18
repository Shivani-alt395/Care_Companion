import { Router } from 'express';
import { authenticate, requireRole, requireCaregiverLink } from '../middleware/auth';
import { Role } from '@prisma/client';
import * as ctrl from '../controllers/caregiver';

const router = Router();
router.use(authenticate, requireRole(Role.CAREGIVER));

router.get('/seniors', ctrl.listSeniors);
router.get('/seniors/:seniorId/dashboard', requireCaregiverLink('seniorId'), ctrl.getSeniorDashboard);

export default router;
