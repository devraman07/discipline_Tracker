import { Router } from 'express';
import { habitsRouter } from '../modules/habits/habits.routes';
import { trackingRouter } from '../modules/tracking/tracking.routes';
import { analyticsRouter } from '../modules/analytics/analytics.routes';
import { ensureDefaultUserMiddleware } from '../middlewares/ensureDefaultUser';

const router = Router();

// Apply default user middleware to ALL routes (single user system)
router.use(ensureDefaultUserMiddleware);

// API v1 routes - all use default user automatically
router.use('/habits', habitsRouter);
router.use('/tracking', trackingRouter);
// Alias /logs to /tracking for frontend compatibility
router.use('/logs', trackingRouter);
router.use('/analytics', analyticsRouter);

export const apiRouter = router;
