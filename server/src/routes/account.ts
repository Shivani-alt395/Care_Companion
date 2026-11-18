import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as ctrl from '../controllers/account';

const router = Router();
router.use(authenticate);

router.get('/export', ctrl.exportData);
router.delete('/', ctrl.deleteAccount);

export default router;
