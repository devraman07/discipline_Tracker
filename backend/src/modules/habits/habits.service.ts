import { eq, and, asc } from 'drizzle-orm';
import { db } from '../../database/connection';
import { 
  habits, 
  habitCompletions, 
  habitCategoryEnum,
  type Habit, 
  type NewHabit 
} from '../../database/schema';

import { NotFoundError } from '../../utils/errors';
import type { CreateHabitInput, UpdateHabitInput } from './habits.validation';

// Extract type from the enum
type HabitCategory = typeof habitCategoryEnum.enumValues[number];

export class HabitsService {
  // Get all habits for user
  async getHabits(userId: string, category?: HabitCategory): Promise<Habit[]> {
    const conditions = [eq(habits.userId, userId), eq(habits.isActive, true)];
    
    if (category) {
      conditions.push(eq(habits.category, category));
    }

    return db.query.habits.findMany({
      where: and(...conditions),
      orderBy: [asc(habits.sortOrder), asc(habits.createdAt)],
    });
  }

  // Get single habit
  async getHabitById(userId: string, habitId: string): Promise<Habit> {
    const habit = await db.query.habits.findFirst({
      where: and(eq(habits.id, habitId), eq(habits.userId, userId)),
    });

    if (!habit) {
      throw new NotFoundError('Habit not found');
    }

    return habit;
  }

  // Create habit
  async createHabit(userId: string, input: CreateHabitInput): Promise<Habit> {
    const [habit] = await db
      .insert(habits)
      .values({
        ...input,
        userId,
      })
      .returning();

    return habit;
  }

  // Update habit
  async updateHabit(userId: string, habitId: string, input: UpdateHabitInput): Promise<Habit> {
    await this.getHabitById(userId, habitId); // Verify ownership

    const [updated] = await db
      .update(habits)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))
      .returning();

    return updated;
  }

  // Delete habit (soft delete)
  async deleteHabit(userId: string, habitId: string): Promise<void> {
    await this.getHabitById(userId, habitId); // Verify ownership

    await db
      .update(habits)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(habits.id, habitId), eq(habits.userId, userId)));
  }

  // Get habits with completion status for a date
  async getHabitsWithCompletions(userId: string, date: string): Promise<Array<Habit & { completion?: any }>> {
    const userHabits = await this.getHabits(userId);
    
    const completions = await db.query.habitCompletions.findMany({
      where: and(
        eq(habitCompletions.userId, userId),
        eq(habitCompletions.date, date)
      ),
    });

    const completionMap = new Map(completions.map(c => [c.habitId, c]));

    return userHabits.map(habit => ({
      ...habit,
      completion: completionMap.get(habit.id),
    }));
  }

  // Initialize default habits for new user
  async createDefaultHabits(userId: string): Promise<void> {
    const defaultHabits: NewHabit[] = [
      // Anchor Habits (Non-negotiables)
      { userId, name: 'Wake up at 5 AM', category: 'anchor', points: 1, sortOrder: 1, color: '#F59E0B' },
      { userId, name: 'Coding (minimum 1 hour)', category: 'anchor', points: 1, sortOrder: 2, color: '#3B82F6' },
      { userId, name: '1 DSA problem', category: 'anchor', points: 1, sortOrder: 3, color: '#8B5CF6' },
      { userId, name: 'Workout / Physical activity', category: 'anchor', points: 1, sortOrder: 4, color: '#EF4444' },
      { userId, name: 'No porn', category: 'anchor', points: 1, sortOrder: 5, color: '#10B981' },
      { userId, name: 'No scrolling after 10 PM', category: 'anchor', points: 1, sortOrder: 6, color: '#6366F1' },
      { userId, name: 'Daily planning & reflection', category: 'anchor', points: 1, sortOrder: 7, color: '#EC4899' },
      { userId, name: 'Sleep by 10 PM', category: 'anchor', points: 1, sortOrder: 8, color: '#14B8A6' },
      
      // Deep Work Blocks (7 blocks, 90 min each)
      { userId, name: 'Deep Work Block 1 (5:20-6:50)', category: 'deep_work', points: 1, targetCount: 1, sortOrder: 9, color: '#3B82F6' },
      { userId, name: 'Deep Work Block 2 (7:05-8:35)', category: 'deep_work', points: 1, targetCount: 1, sortOrder: 10, color: '#3B82F6' },
      { userId, name: 'Deep Work Block 3 (9:15-10:45)', category: 'deep_work', points: 1, targetCount: 1, sortOrder: 11, color: '#3B82F6' },
      { userId, name: 'Deep Work Block 4 (11:00-12:30)', category: 'deep_work', points: 1, targetCount: 1, sortOrder: 12, color: '#3B82F6' },
      { userId, name: 'Deep Work Block 5 (1:15-2:45)', category: 'deep_work', points: 1, targetCount: 1, sortOrder: 13, color: '#3B82F6' },
      { userId, name: 'Deep Work Block 6 (3:00-4:30)', category: 'deep_work', points: 1, targetCount: 1, sortOrder: 14, color: '#3B82F6' },
      { userId, name: 'Deep Work Block 7 (5:15-6:45)', category: 'deep_work', points: 1, targetCount: 1, sortOrder: 15, color: '#3B82F6' },
      
      // Dopamine Detox
      { userId, name: 'No social media', category: 'detox', points: 1, sortOrder: 16, color: '#8B5CF6' },
      { userId, name: 'No gaming', category: 'detox', points: 1, sortOrder: 17, color: '#8B5CF6' },
      { userId, name: 'No unnecessary YouTube', category: 'detox', points: 1, sortOrder: 18, color: '#8B5CF6' },
    ];

    await db.insert(habits).values(defaultHabits);
  }
}

export const habitsService = new HabitsService();
