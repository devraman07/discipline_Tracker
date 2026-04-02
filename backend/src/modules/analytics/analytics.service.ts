import { gte, sql } from 'drizzle-orm';
import { db } from '../../db/connection';
import { dailyLogs } from '../../db/schema';

export interface AnalyticsData {
  totalLogs: number;
  averageScore: number;
  completionRate: number;
  eliteDays: number;
  goodDays: number;
  missedDays: number;
  eliteRate: number;
  currentStreak: number;
  longestStreak: number;
}

export interface ScoreTrendItem {
  date: string;
  score: number;
  status: 'Elite' | 'Good' | 'Missed';
}

export interface CategoryBreakdown {
  category: string;
  completionRate: number;
  totalPoints: number;
}

export class AnalyticsService {
  async getAnalytics(): Promise<AnalyticsData> {
    console.log('[DEBUG] Fetching analytics...');

    try {
      // Get ALL logs (no date filter to ensure we count everything)
      const allLogs = await db.select().from(dailyLogs);
      console.log('[DEBUG] Total logs found:', allLogs.length);

      if (allLogs.length === 0) {
        console.log('[DEBUG] No logs found in database');
        return {
          totalLogs: 0,
          averageScore: 0,
          completionRate: 0,
          eliteDays: 0,
          goodDays: 0,
          missedDays: 0,
          eliteRate: 0,
          currentStreak: 0,
          longestStreak: 0,
        };
      }

      // Calculate metrics
      const totalLogs = allLogs.length;
      const eliteDays = allLogs.filter(l => (l.score || 0) >= 10).length;
      const goodDays = allLogs.filter(l => {
        const score = l.score || 0;
        return score >= 6 && score < 10;
      }).length;
      const missedDays = allLogs.filter(l => (l.score || 0) < 6).length;
      
      const averageScore = Math.round(
        allLogs.reduce((sum, l) => sum + (l.score || 0), 0) / totalLogs
      );

      const completionRate = Math.round(
        ((eliteDays + goodDays) / totalLogs) * 100
      );

      const eliteRate = Math.round((eliteDays / totalLogs) * 100);

      const result = {
        totalLogs,
        averageScore,
        completionRate,
        eliteDays,
        goodDays,
        missedDays,
        eliteRate,
        currentStreak: 0,
        longestStreak: 0,
      };

      console.log('[DEBUG] Analytics result:', result);
      return result;
    } catch (error) {
      console.error('[DEBUG] Analytics error:', error);
      throw error;
    }
  }

  async getScoreTrend(days: number): Promise<ScoreTrendItem[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const results = await db
      .select({
        date: dailyLogs.date,
        score: dailyLogs.score,
      })
      .from(dailyLogs)
      .where(gte(dailyLogs.date, cutoff.toISOString().split('T')[0]))
      .orderBy(dailyLogs.date);

    return results.map(r => ({
      date: r.date,
      score: r.score || 0,
      status: this.getScoreStatus(r.score || 0),
    }));
  }

  async getCategories(): Promise<CategoryBreakdown[]> {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const [habitStats] = await db
      .select({
        totalLogs: sql<number>`COUNT(*)`,
        deepWorkBlock1: sql<number>`SUM(CASE WHEN deep_work_block_1 THEN 1 ELSE 0 END)`,
        deepWorkBlock2: sql<number>`SUM(CASE WHEN deep_work_block_2 THEN 1 ELSE 0 END)`,
        deepWorkBlock3: sql<number>`SUM(CASE WHEN deep_work_block_3 THEN 1 ELSE 0 END)`,
        backendDone: sql<number>`SUM(CASE WHEN backend_done THEN 1 ELSE 0 END)`,
        dsaDone: sql<number>`SUM(CASE WHEN dsa_done THEN 1 ELSE 0 END)`,
        githubCommit: sql<number>`SUM(CASE WHEN github_commit THEN 1 ELSE 0 END)`,
        workoutDone: sql<number>`SUM(CASE WHEN workout_done THEN 1 ELSE 0 END)`,
        sunlightTaken: sql<number>`SUM(CASE WHEN sunlight_taken THEN 1 ELSE 0 END)`,
      })
      .from(dailyLogs)
      .where(gte(dailyLogs.date, monthAgo.toISOString().split('T')[0]));

    const totalLogs = Math.max(habitStats?.totalLogs || 0, 1);

    return [
      {
        category: 'Deep Work',
        completionRate: Math.round(((habitStats?.deepWorkBlock1 || 0) + (habitStats?.deepWorkBlock2 || 0) + (habitStats?.deepWorkBlock3 || 0)) / (totalLogs * 3) * 100),
        totalPoints: (habitStats?.deepWorkBlock1 || 0) + (habitStats?.deepWorkBlock2 || 0) + (habitStats?.deepWorkBlock3 || 0),
      },
      {
        category: 'Learning',
        completionRate: Math.round(((habitStats?.backendDone || 0) + (habitStats?.dsaDone || 0) + (habitStats?.githubCommit || 0)) / (totalLogs * 3) * 100),
        totalPoints: (habitStats?.backendDone || 0) + (habitStats?.dsaDone || 0) + (habitStats?.githubCommit || 0),
      },
      {
        category: 'Health',
        completionRate: Math.round(((habitStats?.workoutDone || 0) + (habitStats?.sunlightTaken || 0)) / (totalLogs * 2) * 100),
        totalPoints: (habitStats?.workoutDone || 0) + (habitStats?.sunlightTaken || 0),
      },
    ];
  }

  private getScoreStatus(score: number): 'Elite' | 'Good' | 'Missed' {
    const MAX_SCORE = 12;
    const pct = score / MAX_SCORE;
    if (pct >= 0.85) return 'Elite';
    if (pct >= 0.5) return 'Good';
    return 'Missed';
  }
}

export const analyticsService = new AnalyticsService();
