import type { Request, Response, NextFunction } from 'express';
import { streakService } from './streak.service';

export class StreakController {
  async getStreak(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const streakData = await streakService.getStreakData();
      const stats = await streakService.getStreakStats();
      
      res.status(200).json({
        success: true,
        data: {
          streak: streakData,
          stats,
          threshold: 6,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const streakController = new StreakController();
