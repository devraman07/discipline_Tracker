import type { Request, Response, NextFunction } from 'express';
import { trackingService } from './tracking.service';
import { 
  habitCompletionSchema, 
  dailyReflectionSchema, 
  bulkHabitCompletionSchema,
  dateSchema,
  dateRangeSchema
} from './tracking.validation';

export class TrackingController {
  async getDailyLog(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { date } = dateSchema.parse({ date: req.params.date });
      const log = await trackingService.getDailyLog(req.userId, date);
      
      res.status(200).json({
        success: true,
        data: log,
      });
    } catch (error) {
      next(error);
    }
  }

  async getLogsForRange(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate } = dateRangeSchema.parse(req.query);
      
      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          error: 'Both startDate and endDate are required',
        });
        return;
      }
      
      const logs = await trackingService.getLogsForRange(req.userId, startDate, endDate);
      
      res.status(200).json({
        success: true,
        data: logs,
        count: logs.length,
      });
    } catch (error) {
      next(error);
    }
  }

  async completeHabit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Data is already validated by middleware
      const validated = req.validatedBody as typeof habitCompletionSchema._type;
      const completion = await trackingService.completeHabit(req.userId, validated);
      
      res.status(200).json({
        success: true,
        data: completion,
        message: validated.completed ? 'Habit completed' : 'Habit uncompleted',
      });
    } catch (error) {
      next(error);
    }
  }

  async bulkCompleteHabits(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Data is already validated by middleware
      const validated = req.validatedBody as typeof bulkHabitCompletionSchema._type;
      await trackingService.bulkCompleteHabits(req.userId, validated);
      
      // Get updated daily log
      const log = await trackingService.getDailyLog(req.userId, validated.date);
      
      res.status(200).json({
        success: true,
        data: log,
        message: 'Daily habits updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async saveReflection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Data is already validated by middleware
      const validated = req.validatedBody as typeof dailyReflectionSchema._type;
      const reflection = await trackingService.saveReflection(req.userId, validated);
      
      res.status(200).json({
        success: true,
        data: reflection,
        message: 'Reflection saved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteDailyLog(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { date } = dateSchema.parse({ date: req.params.date });
      await trackingService.deleteDailyLog(req.userId, date);
      
      res.status(200).json({
        success: true,
        message: 'Daily log deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const trackingController = new TrackingController();
