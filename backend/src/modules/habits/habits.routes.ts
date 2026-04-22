import { Router } from 'express';
import { habitsController } from './habits.controller';
import { validateRequest } from '../../middlewares/validation';
import { createHabitSchema, updateHabitSchema } from './habits.validation';

const router = Router();

router.get('/', habitsController.getHabits);
router.get('/with-completions', habitsController.getHabitsWithCompletions);
router.get('/:id', habitsController.getHabitById);
router.post('/', validateRequest(createHabitSchema), habitsController.createHabit);
router.patch('/:id', validateRequest(updateHabitSchema), habitsController.updateHabit);
router.delete('/:id', habitsController.deleteHabit);

export const habitsRouter = router;
