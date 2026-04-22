import { eq, and, sql } from 'drizzle-orm';
import { db } from '../../database/connection';
import { 
  habitCompletions, 
  dailyReflections, 
  dailySummaries,
  habits,
  type HabitCompletion,
  type DailyReflection,
  type DailySummary
} from '../../database/schema';
import { NotFoundError } from '../../utils/errors';
import type { HabitCompletionInput, DailyReflectionInput, BulkHabitCompletionInput } from './tracking.validation';

export interface DailyLogData {
  date: string;
  habits: Array<{
    habitId: string;
    name: string;
    category: string;
    points: number;
    completed: boolean;
    count: number;
  }>;
  summary: {
    totalHabits: number;
    completedHabits: number;
    totalPoints: number;
    maxPossiblePoints: number;
    completionRate: number;
    scoreStatus: string;
    deepWorkBlocksCompleted: number;
    deepWorkHours: number;
  };
  reflection?: DailyReflection;
}

export class TrackingService {
  // Complete or uncomplete a habit
  async completeHabit(userId: string, input: HabitCompletionInput): Promise<HabitCompletion> {
    // Check if completion already exists
    const existing = await db.query.habitCompletions.findFirst({
      where: and(
        eq(habitCompletions.habitId, input.habitId),
        eq(habitCompletions.date, input.date),
        eq(habitCompletions.userId, userId)
      ),
    });

    if (existing) {
      // Update existing
      const [updated] = await db
        .update(habitCompletions)
        .set({
          completed: input.completed,
          count: input.count,
          notes: input.notes,
          completedAt: input.completed ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(habitCompletions.id, existing.id))
        .returning();
      
      // Update daily summary
      await this.updateDailySummary(userId, input.date);
      
      return updated;
    }

    // Create new completion
    const [completion] = await db
      .insert(habitCompletions)
      .values({
        ...input,
        userId,
        completedAt: input.completed ? new Date() : null,
      })
      .returning();

    // Update daily summary
    await this.updateDailySummary(userId, input.date);

    return completion;
  }

  // Bulk update habit completions for a day
  async bulkCompleteHabits(userId: string, input: BulkHabitCompletionInput): Promise<void> {
    for (const completion of input.completions) {
      await this.completeHabit(userId, {
        ...completion,
        date: input.date,
      });
    }
  }

  // Get or create daily summary
  async updateDailySummary(userId: string, date: string): Promise<DailySummary> {
    // Get all habits and completions for the date
    const [userHabits, completions] = await Promise.all([
      db.query.habits.findMany({
        where: and(eq(habits.userId, userId), eq(habits.isActive, true)),
      }),
      db.query.habitCompletions.findMany({
        where: and(
          eq(habitCompletions.userId, userId),
          eq(habitCompletions.date, date)
        ),
      }),
    ]);

    const completionMap = new Map(completions.map(c => [c.habitId, c]));

    // Calculate metrics
    let totalPoints = 0;
    let maxPossiblePoints = 0;
    let completedHabits = 0;
    let deepWorkBlocksCompleted = 0;

    for (const habit of userHabits) {
      const completion = completionMap.get(habit.id);
      const isCompleted = completion?.completed ?? false;
      const count = completion?.count ?? 0;

      maxPossiblePoints += habit.points;

      if (isCompleted) {
        completedHabits++;
        totalPoints += habit.points;
        
        if (habit.category === 'deep_work') {
          deepWorkBlocksCompleted += count;
        }
      }
    }

    const completionRate = maxPossiblePoints > 0 
      ? Math.round((totalPoints / maxPossiblePoints) * 100) 
      : 0;

    // Determine score status
    const anchorHabits = userHabits.filter(h => h.category === 'anchor');
    const completedAnchors = anchorHabits.filter(h => {
      const c = completionMap.get(h.id);
      return c?.completed ?? false;
    }).length;

    let scoreStatus: string;
    if (completedAnchors >= 7) {
      scoreStatus = 'excellent';
    } else if (completedAnchors >= 5) {
      scoreStatus = 'good';
    } else {
      scoreStatus = 'reset';
    }

    const deepWorkHours = deepWorkBlocksCompleted * 1.5; // 90 min blocks

    // Check if summary exists
    const existingSummary = await db.query.dailySummaries.findFirst({
      where: and(
        eq(dailySummaries.userId, userId),
        eq(dailySummaries.date, date)
      ),
    });

    const summaryData = {
      totalHabits: userHabits.length,
      completedHabits,
      totalPoints,
      maxPossiblePoints,
      completionRate: completionRate.toString(),
      scoreStatus,
      deepWorkBlocksCompleted,
      deepWorkHours: deepWorkHours.toString(),
      streakContinued: completedAnchors >= 5, // Threshold for streak
    };

    if (existingSummary) {
      const [updated] = await db
        .update(dailySummaries)
        .set({
          ...summaryData,
          updatedAt: new Date(),
        })
        .where(eq(dailySummaries.id, existingSummary.id))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(dailySummaries)
      .values({
        userId,
        date,
        ...summaryData,
      })
      .returning();

    return created;
  }

  // Get daily log with all data
  async getDailyLog(userId: string, date: string): Promise<DailyLogData> {
    const [userHabits, completions, summary, reflection] = await Promise.all([
      db.query.habits.findMany({
        where: and(eq(habits.userId, userId), eq(habits.isActive, true)),
        orderBy: habits.sortOrder,
      }),
      db.query.habitCompletions.findMany({
        where: and(
          eq(habitCompletions.userId, userId),
          eq(habitCompletions.date, date)
        ),
      }),
      db.query.dailySummaries.findFirst({
        where: and(
          eq(dailySummaries.userId, userId),
          eq(dailySummaries.date, date)
        ),
      }),
      db.query.dailyReflections.findFirst({
        where: and(
          eq(dailyReflections.userId, userId),
          eq(dailyReflections.date, date)
        ),
      }),
    ]);

    const completionMap = new Map(completions.map(c => [c.habitId, c]));

    const habitsData = userHabits.map(habit => {
      const completion = completionMap.get(habit.id);
      return {
        habitId: habit.id,
        name: habit.name,
        category: habit.category,
        points: habit.points,
        completed: completion?.completed ?? false,
        count: completion?.count ?? 0,
      };
    });

    const defaultSummary = {
      totalHabits: userHabits.length,
      completedHabits: 0,
      totalPoints: 0,
      maxPossiblePoints: userHabits.reduce((sum, h) => sum + h.points, 0),
      completionRate: 0,
      scoreStatus: 'reset',
      deepWorkBlocksCompleted: 0,
      deepWorkHours: 0,
    };

    return {
      date,
      habits: habitsData,
      summary: summary ? {
        totalHabits: summary.totalHabits,
        completedHabits: summary.completedHabits,
        totalPoints: summary.totalPoints,
        maxPossiblePoints: summary.maxPossiblePoints,
        completionRate: parseFloat(summary.completionRate.toString()),
        scoreStatus: summary.scoreStatus,
        deepWorkBlocksCompleted: summary.deepWorkBlocksCompleted,
        deepWorkHours: parseFloat(summary.deepWorkHours.toString()),
      } : defaultSummary,
      reflection: reflection ?? undefined,
    };
  }

  // Get logs for date range
  async getLogsForRange(userId: string, startDate: string, endDate: string): Promise<DailyLogData[]> {
    const summaries = await db.query.dailySummaries.findMany({
      where: and(
        eq(dailySummaries.userId, userId),
        sql`${dailySummaries.date} >= ${startDate}`,
        sql`${dailySummaries.date} <= ${endDate}`
      ),
      orderBy: dailySummaries.date,
    });

    const logs: DailyLogData[] = [];
    for (const summary of summaries) {
      const log = await this.getDailyLog(userId, summary.date);
      logs.push(log);
    }

    return logs;
  }

  // Save daily reflection
  async saveReflection(userId: string, input: DailyReflectionInput): Promise<DailyReflection> {
    const existing = await db.query.dailyReflections.findFirst({
      where: and(
        eq(dailyReflections.userId, userId),
        eq(dailyReflections.date, input.date)
      ),
    });

    if (existing) {
      const [updated] = await db
        .update(dailyReflections)
        .set({
          mood: input.mood,
          energyLevel: input.energyLevel,
          sleepQuality: input.sleepQuality,
          sleepHours: input.sleepHours?.toString(),
          biggestWin: input.biggestWin,
          lessonLearned: input.lessonLearned,
          priorityTomorrow: input.priorityTomorrow,
          generalNotes: input.generalNotes,
          noSocialMedia: input.noSocialMedia,
          noGaming: input.noGaming,
          noUnnecessaryYoutube: input.noUnnecessaryYoutube,
          updatedAt: new Date(),
        })
        .where(eq(dailyReflections.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(dailyReflections)
      .values({
        userId,
        date: input.date,
        mood: input.mood,
        energyLevel: input.energyLevel,
        sleepQuality: input.sleepQuality,
        sleepHours: input.sleepHours?.toString(),
        biggestWin: input.biggestWin,
        lessonLearned: input.lessonLearned,
        priorityTomorrow: input.priorityTomorrow,
        generalNotes: input.generalNotes,
        noSocialMedia: input.noSocialMedia,
        noGaming: input.noGaming,
        noUnnecessaryYoutube: input.noUnnecessaryYoutube,
      })
      .returning();

    return created;
  }

  // Delete daily log (reflections and completions for a date)
  async deleteDailyLog(userId: string, date: string): Promise<void> {
    await Promise.all([
      db.delete(habitCompletions).where(
        and(eq(habitCompletions.userId, userId), eq(habitCompletions.date, date))
      ),
      db.delete(dailyReflections).where(
        and(eq(dailyReflections.userId, userId), eq(dailyReflections.date, date))
      ),
      db.delete(dailySummaries).where(
        and(eq(dailySummaries.userId, userId), eq(dailySummaries.date, date))
      ),
    ]);
  }
}

export const trackingService = new TrackingService();
