import { Router } from 'express';
import { analyticsController } from './analytics.controller';

const router = Router();

router.get('/summary', analyticsController.getAnalytics);
router.get('/trends', analyticsController.getScoreTrend);
router.get('/categories', analyticsController.getCategories);
router.get('/streak', analyticsController.getStreakData);
router.get('/wellbeing', analyticsController.getWellbeingStats);

export const analyticsRouter = router;
