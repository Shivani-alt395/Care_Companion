import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as ctrl from '../controllers/games';

const router = Router();
router.use(authenticate);

router.get('/scores', ctrl.getScores);
router.post('/scores', ctrl.saveScore);

export default router;
