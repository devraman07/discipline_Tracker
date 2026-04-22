import type { Request, Response, NextFunction } from 'express';
import { analyticsService } from './analytics.service';

export class AnalyticsController {
  async getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const analytics = await analyticsService.getAnalytics(req.userId);
      
      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }

  async getScoreTrend(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const trend = await analyticsService.getScoreTrend(req.userId, days);
      
      res.status(200).json({
        success: true,
        data: trend,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await analyticsService.getCategoryBreakdown(req.userId);
      
      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }

  async getStreakData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const streakData = await analyticsService.getStreakData(req.userId);
      
      res.status(200).json({
        success: true,
        data: streakData,
      });
    } catch (error) {
      next(error);
    }
  }

  async getWellbeingStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await analyticsService.getWellbeingStats(req.userId);
      
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const analyticsController = new AnalyticsController();
