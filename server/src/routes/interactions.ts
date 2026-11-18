import { Router } from 'express';
import * as ctrl from '../controllers/interactions';

const router = Router();

router.get('/check', ctrl.checkInteractions);

export default router;
