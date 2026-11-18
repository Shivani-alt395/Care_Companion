import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as ctrl from '../controllers/emergency';

const router = Router();
router.use(authenticate);

router.get('/medical-id', ctrl.getMedicalId);

export default router;
