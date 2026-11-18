import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { Role } from '@prisma/client';
import * as ctrl from '../controllers/careLinks';

const router = Router();
router.use(authenticate);

router.post('/invite', requireRole(Role.SENIOR), ctrl.createInvite);
router.post('/redeem', requireRole(Role.CAREGIVER), ctrl.redeemInvite);
router.get('/', ctrl.listLinks);
router.delete('/:id', ctrl.revokeLink);

export default router;
