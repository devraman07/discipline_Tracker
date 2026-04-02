export type FocusLevel = 'high' | 'medium' | 'low';

export interface DailyLog {
  id: string;
  date: string;
  deepWorkHours: number;
  sleepHours: number;
  wokeOnTime: boolean;
  sleepFollowed: boolean;
  morningReset: boolean;
  deepWorkBlock1: boolean;
  deepWorkBlock2: boolean;
  deepWorkBlock3: boolean;
  backendDone: boolean;
  dsaDone: boolean;
  githubCommit: boolean;
  workoutDone: boolean;
  sunlightTaken: boolean;
  focusLevel: FocusLevel;
  reflection: string;
  score: number;
  status: 'Elite' | 'Good' | 'Missed';
  createdAt: string;
  updatedAt: string;
}

export interface CreateLogInput {
  date: string;
  deepWorkHours: number;
  sleepHours: number;
  wokeOnTime: boolean;
  sleepFollowed: boolean;
  morningReset: boolean;
  deepWorkBlock1: boolean;
  deepWorkBlock2: boolean;
  deepWorkBlock3: boolean;
  backendDone: boolean;
  dsaDone: boolean;
  githubCommit: boolean;
  workoutDone: boolean;
  sunlightTaken: boolean;
  focusLevel: FocusLevel;
  reflection: string;
}

export interface PaginatedLogsResponse {
  data: DailyLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AnalyticsSummary {
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

export interface ScoreTrend {
  date: string;
  score: number;
  status: 'Elite' | 'Good' | 'Missed';
}

export interface CategoryBreakdown {
  category: string;
  completionRate: number;
  totalPoints: number;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastCheckIn: string | null;
  streakStatus: 'active' | 'broken' | 'none';
}

// 12-point scoring system
export const SCORE_MAX = 12;

// Frontend field mapping to backend
export interface CheckinFormData {
  wokeUpOnTime: boolean;
  followedSleepSchedule: boolean;
  didMorningReset: boolean;
  deepWorkBlock1: boolean;
  deepWorkBlock2: boolean;
  deepWorkBlock3: boolean;
  backendTaskDone: boolean;
  dsaDone: boolean;
  githubCommit: boolean;
  workoutDone: boolean;
  sunlightTaken: boolean;
  deepWorkHours: number;
  focusLevel: 'High' | 'Medium' | 'Low';
  whatBuilt: string;
  whatWentWrong: string;
}
