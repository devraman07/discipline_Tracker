import { Router } from 'express';
import { trackingController } from './tracking.controller';
import { validateRequest } from '../../middlewares/validation';
import { 
  habitCompletionSchema, 
  dailyReflectionSchema, 
  bulkHabitCompletionSchema 
} from './tracking.validation';

const router = Router();

router.get('/range', trackingController.getLogsForRange);
router.get('/:date', trackingController.getDailyLog);
router.post('/complete', validateRequest(habitCompletionSchema), trackingController.completeHabit);
router.post('/bulk-complete', validateRequest(bulkHabitCompletionSchema), trackingController.bulkCompleteHabits);
router.post('/reflection', validateRequest(dailyReflectionSchema), trackingController.saveReflection);
router.delete('/:date', trackingController.deleteDailyLog);

export const trackingRouter = router;
