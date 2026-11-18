import { Router } from 'express';
import { authRateLimit } from '../middleware/rateLimiter';
import { authenticate } from '../middleware/auth';
import * as ctrl from '../controllers/auth';

const router = Router();

router.post('/register', authRateLimit, ctrl.register);
router.post('/login', authRateLimit, ctrl.login);
router.post('/refresh', ctrl.refresh);
router.post('/logout', authenticate, ctrl.logout);
router.get('/me', authenticate, ctrl.me);

export default router;
