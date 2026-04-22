import { z } from 'zod';

export const dateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

export const dateRangeSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const habitCompletionSchema = z.object({
  habitId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  completed: z.boolean().default(true),
  count: z.number().int().min(0).default(1),
  notes: z.string().max(500).optional(),
});

export const dailyReflectionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mood: z.enum(['1', '2', '3', '4', '5']).optional(),
  energyLevel: z.enum(['1', '2', '3', '4', '5']).optional(),
  sleepQuality: z.enum(['poor', 'fair', 'good', 'excellent']).optional(),
  sleepHours: z.number().min(0).max(24).optional(),
  biggestWin: z.string().max(500).optional(),
  lessonLearned: z.string().max(500).optional(),
  priorityTomorrow: z.string().max(500).optional(),
  generalNotes: z.string().max(1000).optional(),
  noSocialMedia: z.boolean().default(false),
  noGaming: z.boolean().default(false),
  noUnnecessaryYoutube: z.boolean().default(false),
});

export const bulkHabitCompletionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  completions: z.array(z.object({
    habitId: z.string().uuid(),
    completed: z.boolean(),
    count: z.number().int().min(0).default(1),
    notes: z.string().optional(),
  })),
});

export type HabitCompletionInput = z.infer<typeof habitCompletionSchema>;
export type DailyReflectionInput = z.infer<typeof dailyReflectionSchema>;
export type BulkHabitCompletionInput = z.infer<typeof bulkHabitCompletionSchema>;
