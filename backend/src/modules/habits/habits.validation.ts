import { z } from 'zod';

export const habitCategorySchema = z.enum(['anchor', 'deep_work', 'detox', 'wellbeing', 'custom']);
export const habitFrequencySchema = z.enum(['daily', 'weekly', 'monthly']);

export const createHabitSchema = z.object({
  name: z.string().min(1, 'Habit name is required').max(100),
  description: z.string().max(500).optional(),
  category: habitCategorySchema,
  frequency: habitFrequencySchema.default('daily'),
  points: z.number().int().min(0).max(10).default(1),
  targetCount: z.number().int().min(1).max(20).default(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#3B82F6'),
  icon: z.string().max(50).optional(),
  reminderTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(), // HH:MM format
  sortOrder: z.number().int().default(0),
});

export const updateHabitSchema = createHabitSchema.partial();

export const habitIdSchema = z.object({
  id: z.string().uuid(),
});

export type CreateHabitInput = z.infer<typeof createHabitSchema>;
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;
