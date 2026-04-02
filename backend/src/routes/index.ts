import { Router } from 'express';
import { logsRouter } from '../modules/logs/logs.routes';
import { analyticsRouter } from '../modules/analytics/analytics.routes';
import { streakRouter } from '../modules/streak/streak.routes';

const router = Router();

router.use('/logs', logsRouter);
router.use('/analytics', analyticsRouter);
router.use('/streak', streakRouter);

export const apiRouter = router;
