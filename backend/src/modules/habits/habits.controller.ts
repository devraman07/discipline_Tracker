import type { Request, Response, NextFunction } from 'express';
import { habitsService } from './habits.service';
import { createHabitSchema, updateHabitSchema, habitIdSchema, habitCategorySchema } from './habits.validation';
import { NotFoundError } from '../../utils/errors';

export class HabitsController {
  async getHabits(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category } = req.query;
      
      // Validate category if provided
      let validatedCategory: typeof habitCategorySchema._type | undefined;
      if (category && typeof category === 'string') {
        const parsed = habitCategorySchema.safeParse(category);
        if (!parsed.success) {
          res.status(400).json({
            success: false,
            error: 'Invalid category. Must be one of: anchor, deep_work, detox, wellbeing, custom',
          });
          return;
        }
        validatedCategory = parsed.data;
      }
      
      const habits = await habitsService.getHabits(req.userId, validatedCategory);
      
      res.status(200).json({
        success: true,
        data: habits,
        count: habits.length,
      });
    } catch (error) {
      next(error);
    }
  }

  async getHabitById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = habitIdSchema.parse({ id: req.params.id });
      const habit = await habitsService.getHabitById(req.userId, id);
      
      res.status(200).json({
        success: true,
        data: habit,
      });
    } catch (error) {
      next(error);
    }
  }

  async createHabit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Data is already validated by middleware
      const validated = req.validatedBody as typeof createHabitSchema._type;
      const habit = await habitsService.createHabit(req.userId, validated);
      
      res.status(201).json({
        success: true,
        data: habit,
        message: 'Habit created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async updateHabit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = habitIdSchema.parse({ id: req.params.id });
      // Data is already validated by middleware
      const validated = req.validatedBody as typeof updateHabitSchema._type;
      
      const habit = await habitsService.updateHabit(req.userId, id, validated);
      
      res.status(200).json({
        success: true,
        data: habit,
        message: 'Habit updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteHabit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = habitIdSchema.parse({ id: req.params.id });
      await habitsService.deleteHabit(req.userId, id);
      
      res.status(200).json({
        success: true,
        message: 'Habit deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getHabitsWithCompletions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { date } = req.query;
      if (!date || typeof date !== 'string') {
        throw new NotFoundError('Date parameter is required');
      }
      
      const habits = await habitsService.getHabitsWithCompletions(req.userId, date);
      
      res.status(200).json({
        success: true,
        data: habits,
        count: habits.length,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const habitsController = new HabitsController();
