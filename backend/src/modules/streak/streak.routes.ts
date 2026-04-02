import { Router } from 'express';
import { streakController } from './streak.controller';

const router = Router();

router.get('/', streakController.getStreak);

export const streakRouter = router;
