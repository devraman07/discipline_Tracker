import { gte, and, eq, desc, asc } from 'drizzle-orm';
import { db } from '../../database/connection';
import { dailySummaries, habitCompletions, habits, dailyReflections } from '../../database/schema';

export interface AnalyticsData {
  totalDays: number;
  totalHabitsCompleted: number;
  totalHabitsPossible: number;
  overallCompletionRate: number;
  excellentDays: number;
  goodDays: number;
  resetDays: number;
  excellentRate: number;
  currentStreak: number;
  longestStreak: number;
  deepWorkStats: {
    totalBlocksCompleted: number;
    totalDeepWorkHours: number;
    averageBlocksPerDay: number;
  };
}

export interface ScoreTrendItem {
  date: string;
  completionRate: number;
  scoreStatus: 'excellent' | 'good' | 'reset';
  totalPoints: number;
  maxPoints: number;
  deepWorkBlocks: number;
}

export interface CategoryBreakdown {
  category: string;
  completionRate: number;
  totalCompleted: number;
  totalPossible: number;
  habits: Array<{
    habitId: string;
    name: string;
    completionRate: number;
  }>;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  streakHistory: Array<{
    date: string;
    continued: boolean;
    scoreStatus: string;
  }>;
}

export interface WellbeingStats {
  averageMood: number;
  averageEnergy: number;
  averageSleepHours: number;
  sleepQualityDistribution: Record<string, number>;
  detoxStats: {
    noSocialMediaDays: number;
    noGamingDays: number;
    noYoutubeDays: number;
  };
}

export class AnalyticsService {
  async getAnalytics(userId: string): Promise<AnalyticsData> {
    const summaries = await db.query.dailySummaries.findMany({
      where: eq(dailySummaries.userId, userId),
      orderBy: desc(dailySummaries.date),
    });

    if (summaries.length === 0) {
      return {
        totalDays: 0,
        totalHabitsCompleted: 0,
        totalHabitsPossible: 0,
        overallCompletionRate: 0,
        excellentDays: 0,
        goodDays: 0,
        resetDays: 0,
        excellentRate: 0,
        currentStreak: 0,
        longestStreak: 0,
        deepWorkStats: {
          totalBlocksCompleted: 0,
          totalDeepWorkHours: 0,
          averageBlocksPerDay: 0,
        },
      };
    }

    const excellentDays = summaries.filter(s => s.scoreStatus === 'excellent').length;
    const goodDays = summaries.filter(s => s.scoreStatus === 'good').length;
    const resetDays = summaries.filter(s => s.scoreStatus === 'reset').length;

    const totalHabitsCompleted = summaries.reduce((sum, s) => sum + s.completedHabits, 0);
    const totalHabitsPossible = summaries.reduce((sum, s) => sum + s.totalHabits, 0);
    const totalDeepWorkBlocks = summaries.reduce((sum, s) => sum + s.deepWorkBlocksCompleted, 0);
    const totalDeepWorkHours = summaries.reduce((sum, s) => sum + parseFloat(s.deepWorkHours.toString()), 0);

    // Calculate streaks
    const streakData = await this.calculateStreaks(summaries);

    return {
      totalDays: summaries.length,
      totalHabitsCompleted,
      totalHabitsPossible,
      overallCompletionRate: Math.round((totalHabitsCompleted / totalHabitsPossible) * 100),
      excellentDays,
      goodDays,
      resetDays,
      excellentRate: Math.round((excellentDays / summaries.length) * 100),
      currentStreak: streakData.currentStreak,
      longestStreak: streakData.longestStreak,
      deepWorkStats: {
        totalBlocksCompleted: totalDeepWorkBlocks,
        totalDeepWorkHours: totalDeepWorkHours,
        averageBlocksPerDay: Math.round((totalDeepWorkBlocks / summaries.length) * 10) / 10,
      },
    };
  }

  private calculateStreaks(summaries: typeof dailySummaries.$inferSelect[]): { currentStreak: number; longestStreak: number } {
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Check if streak is still active
    const todaySummary = summaries.find(s => s.date === today);
    const yesterdaySummary = summaries.find(s => s.date === yesterday);

    const isStreakActive = (todaySummary?.streakContinued || yesterdaySummary?.streakContinued) ?? false;

    if (isStreakActive) {
      // Calculate current streak from most recent
      for (const summary of summaries) {
        if (summary.streakContinued) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    for (const summary of [...summaries].reverse()) {
      if (summary.streakContinued) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    return { currentStreak, longestStreak };
  }

  async getScoreTrend(userId: string, days: number): Promise<ScoreTrendItem[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const results = await db.query.dailySummaries.findMany({
      where: and(
        eq(dailySummaries.userId, userId),
        gte(dailySummaries.date, cutoff.toISOString().split('T')[0])
      ),
      orderBy: asc(dailySummaries.date),
    });

    return results.map(r => ({
      date: r.date,
      completionRate: parseFloat(r.completionRate.toString()),
      scoreStatus: r.scoreStatus as 'excellent' | 'good' | 'reset',
      totalPoints: r.totalPoints,
      maxPoints: r.maxPossiblePoints,
      deepWorkBlocks: r.deepWorkBlocksCompleted,
    }));
  }

  async getCategoryBreakdown(userId: string): Promise<CategoryBreakdown[]> {
    const userHabits = await db.query.habits.findMany({
      where: eq(habits.userId, userId),
    });

    const completions = await db.query.habitCompletions.findMany({
      where: and(
        eq(habitCompletions.userId, userId),
        eq(habitCompletions.completed, true)
      ),
    });

    const categoryStats = new Map<string, { completed: number; total: number; habits: Map<string, { name: string; completed: number; total: number }> }>();

    for (const habit of userHabits) {
      const habitCompletions = completions.filter(c => c.habitId === habit.id);
      const completed = habitCompletions.length;

      if (!categoryStats.has(habit.category)) {
        categoryStats.set(habit.category, { completed: 0, total: 0, habits: new Map() });
      }

      const cat = categoryStats.get(habit.category)!;
      cat.completed += completed;
      cat.total += 30; // Approximate last 30 days

      cat.habits.set(habit.id, {
        name: habit.name,
        completed,
        total: 30,
      });
    }

    return Array.from(categoryStats.entries()).map(([category, stats]) => ({
      category,
      completionRate: Math.round((stats.completed / Math.max(stats.total, 1)) * 100),
      totalCompleted: stats.completed,
      totalPossible: stats.total,
      habits: Array.from(stats.habits.entries()).map(([habitId, h]) => ({
        habitId,
        name: h.name,
        completionRate: Math.round((h.completed / Math.max(h.total, 1)) * 100),
      })),
    }));
  }

  async getStreakData(userId: string): Promise<StreakData> {
    const summaries = await db.query.dailySummaries.findMany({
      where: eq(dailySummaries.userId, userId),
      orderBy: desc(dailySummaries.date),
    });

    const { currentStreak, longestStreak } = this.calculateStreaks(summaries);

    const streakHistory = summaries.slice(0, 30).map(s => ({
      date: s.date,
      continued: s.streakContinued,
      scoreStatus: s.scoreStatus,
    }));

    return {
      currentStreak,
      longestStreak,
      streakHistory,
    };
  }

  async getWellbeingStats(userId: string): Promise<WellbeingStats> {
    const reflections = await db.query.dailyReflections.findMany({
      where: eq(dailyReflections.userId, userId),
    });

    if (reflections.length === 0) {
      return {
        averageMood: 0,
        averageEnergy: 0,
        averageSleepHours: 0,
        sleepQualityDistribution: {},
        detoxStats: { noSocialMediaDays: 0, noGamingDays: 0, noYoutubeDays: 0 },
      };
    }

    const validMoods = reflections.filter(r => r.mood).map(r => parseInt(r.mood!));
    const validEnergy = reflections.filter(r => r.energyLevel).map(r => parseInt(r.energyLevel!));
    const validSleep = reflections.filter(r => r.sleepHours).map(r => parseFloat(r.sleepHours!.toString()));

    const sleepQualityDist: Record<string, number> = {};
    for (const r of reflections) {
      if (r.sleepQuality) {
        sleepQualityDist[r.sleepQuality] = (sleepQualityDist[r.sleepQuality] || 0) + 1;
      }
    }

    return {
      averageMood: validMoods.length > 0 ? Math.round((validMoods.reduce((a, b) => a + b, 0) / validMoods.length) * 10) / 10 : 0,
      averageEnergy: validEnergy.length > 0 ? Math.round((validEnergy.reduce((a, b) => a + b, 0) / validEnergy.length) * 10) / 10 : 0,
      averageSleepHours: validSleep.length > 0 ? Math.round((validSleep.reduce((a, b) => a + b, 0) / validSleep.length) * 10) / 10 : 0,
      sleepQualityDistribution: sleepQualityDist,
      detoxStats: {
        noSocialMediaDays: reflections.filter(r => r.noSocialMedia).length,
        noGamingDays: reflections.filter(r => r.noGaming).length,
        noYoutubeDays: reflections.filter(r => r.noUnnecessaryYoutube).length,
      },
    };
  }
}

export const analyticsService = new AnalyticsService();
