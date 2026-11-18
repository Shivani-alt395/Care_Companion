import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { Role } from '@prisma/client';
import * as ctrl from '../controllers/sideEffects';

const router = Router();
router.use(authenticate, requireRole(Role.SENIOR));

router.get('/', ctrl.listSideEffects);
router.post('/', ctrl.createSideEffect);
router.put('/:id', ctrl.updateSideEffect);
router.delete('/:id', ctrl.deleteSideEffect);

export default router;
