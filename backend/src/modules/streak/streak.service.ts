import { desc } from 'drizzle-orm';
import { db } from '../../db/connection';
import { dailyLogs, type DailyLog } from '../../db/schema';

const STREAK_THRESHOLD = 6;

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  streakHistory: { date: string; score: number; meetsThreshold: boolean }[];
}

export class StreakService {
  async getStreakData(): Promise<StreakData> {
    const allLogs = await db.query.dailyLogs.findMany({
      orderBy: desc(dailyLogs.date),
    });

    if (allLogs.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastCompletedDate: null,
        streakHistory: [],
      };
    }

    const sortedLogs = [...allLogs].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastCompletedDate: string | null = null;

    const streakHistory = sortedLogs.map((log) => {
      const meetsThreshold = (log.score || 0) >= STREAK_THRESHOLD;
      return {
        date: log.date,
        score: log.score || 0,
        meetsThreshold,
      };
    });

    for (let i = 0; i < sortedLogs.length; i++) {
      const log = sortedLogs[i];
      const meetsThreshold = (log.score || 0) >= STREAK_THRESHOLD;

      if (meetsThreshold) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const todayLog = sortedLogs.find((l) => l.date === today);
    const yesterdayLog = sortedLogs.find((l) => l.date === yesterday);

    if (todayLog && (todayLog.score || 0) >= STREAK_THRESHOLD) {
      currentStreak = 1;
      lastCompletedDate = today;
      
      for (let i = sortedLogs.length - 2; i >= 0; i--) {
        const current = sortedLogs[i];
        const prev = sortedLogs[i + 1];
        
        const currentDate = new Date(current.date);
        const prevDate = new Date(prev.date);
        const dayDiff = Math.floor((prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

        if (dayDiff === 1 && (current.score || 0) >= STREAK_THRESHOLD) {
          currentStreak++;
        } else {
          break;
        }
      }
    } else if (yesterdayLog && (yesterdayLog.score || 0) >= STREAK_THRESHOLD) {
      currentStreak = 1;
      lastCompletedDate = yesterday;
      
      for (let i = sortedLogs.length - (todayLog ? 2 : 1) - 1; i >= 0; i--) {
        const current = sortedLogs[i];
        const next = sortedLogs[i + 1];
        
        const currentDate = new Date(current.date);
        const nextDate = new Date(next.date);
        const dayDiff = Math.floor((nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

        if (dayDiff === 1 && (current.score || 0) >= STREAK_THRESHOLD) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    const lastQualifying = sortedLogs
      .filter((l) => (l.score || 0) >= STREAK_THRESHOLD)
      .pop();
    
    if (lastQualifying) {
      lastCompletedDate = lastQualifying.date;
    }

    return {
      currentStreak,
      longestStreak,
      lastCompletedDate,
      streakHistory: streakHistory.reverse(),
    };
  }

  async getStreakStats(): Promise<{
    totalDaysTracked: number;
    qualifyingDays: number;
    streakPercentage: number;
    averageStreakLength: number;
  }> {
    const allLogs = await db.query.dailyLogs.findMany({
      orderBy: dailyLogs.date,
    });

    if (allLogs.length === 0) {
      return {
        totalDaysTracked: 0,
        qualifyingDays: 0,
        streakPercentage: 0,
        averageStreakLength: 0,
      };
    }

    const qualifyingDays = allLogs.filter((l: DailyLog) => (l.score || 0) >= STREAK_THRESHOLD).length;
    
    let currentStreak = 0;
    const streaks: number[] = [];
    
    for (const log of allLogs) {
      if ((log.score || 0) >= STREAK_THRESHOLD) {
        currentStreak++;
      } else {
        if (currentStreak > 0) {
          streaks.push(currentStreak);
          currentStreak = 0;
        }
      }
    }
    
    if (currentStreak > 0) {
      streaks.push(currentStreak);
    }

    const averageStreakLength = streaks.length > 0
      ? Math.round(streaks.reduce((a, b) => a + b, 0) / streaks.length)
      : 0;

    return {
      totalDaysTracked: allLogs.length,
      qualifyingDays,
      streakPercentage: Math.round((qualifyingDays / allLogs.length) * 100),
      averageStreakLength,
    };
  }
}

export const streakService = new StreakService();
