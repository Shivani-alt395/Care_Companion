import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as ctrl from '../controllers/push';

const router = Router();

router.get('/vapid-public-key', ctrl.getVapidKey);
router.post('/subscribe', authenticate, ctrl.subscribe);
router.post('/unsubscribe', authenticate, ctrl.unsubscribe);

export default router;
