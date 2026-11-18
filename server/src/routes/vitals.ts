import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { Role } from '@prisma/client';
import * as ctrl from '../controllers/vitals';

const router = Router();
router.use(authenticate, requireRole(Role.SENIOR));

router.get('/', ctrl.listVitals);
router.post('/', ctrl.createVital);
router.get('/trends', ctrl.getTrends);
router.delete('/:id', ctrl.deleteVital);

export default router;
