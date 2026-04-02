import { Router } from 'express';
import { analyticsController } from './analytics.controller';

const router = Router();

router.get('/', analyticsController.getAnalytics);
router.get('/trend', analyticsController.getScoreTrend);
router.get('/categories', analyticsController.getCategories);

export const analyticsRouter = router;
