const fs = require('fs');

const logsUtilsContent = `interface CalculateScoreInput {
  deepWorkBlock1?: boolean;
  deepWorkBlock2?: boolean;
  deepWorkBlock3?: boolean;
  backendDone?: boolean;
  dsaDone?: boolean;
  githubCommit?: boolean;
  workoutDone?: boolean;
  sunlightTaken?: boolean;
  sleepFollowed?: boolean;
  wokeOnTime?: boolean;
  morningReset?: boolean;
  focusLevel?: string;
}

const MAX_SCORE = 12;

export function calculateScore(log: CalculateScoreInput): number {
  let score = 0;
  if (log.deepWorkBlock1) score++;
  if (log.deepWorkBlock2) score++;
  if (log.deepWorkBlock3) score++;
  if (log.backendDone) score++;
  if (log.dsaDone) score++;
  if (log.githubCommit) score++;
  if (log.workoutDone) score++;
  if (log.sunlightTaken) score++;
  if (log.sleepFollowed) score++;
  if (log.wokeOnTime) score++;
  if (log.morningReset) score++;
  if (log.focusLevel === 'high') score++;
  return score;
}

export function getMaxPossibleScore(): number {
  return MAX_SCORE;
}

export function getScoreStatus(score: number): 'Elite' | 'Good' | 'Missed' {
  const pct = score / MAX_SCORE;
  if (pct >= 0.85) return 'Elite';
  if (pct >= 0.5) return 'Good';
  return 'Missed';
}

export function getScoreBreakdown(log: CalculateScoreInput) {
  const t = (b?: boolean) => b ? 1 : 0;
  return {
    deepWork: { b1: t(log.deepWorkBlock1), b2: t(log.deepWorkBlock2), b3: t(log.deepWorkBlock3) },
    learning: { backend: t(log.backendDone), dsa: t(log.dsaDone), github: t(log.githubCommit) },
    health: { workout: t(log.workoutDone), sunlight: t(log.sunlightTaken) },
    routine: { sleep: t(log.sleepFollowed), woke: t(log.wokeOnTime), reset: t(log.morningReset) },
    focus: log.focusLevel === 'high' ? 1 : 0,
    total: calculateScore(log),
    maxPossible: MAX_SCORE,
    status: getScoreStatus(calculateScore(log)),
  };
}
`;

const logsServiceContent = `import { eq, desc, gte } from 'drizzle-orm';
import { db } from '../../db/connection';
import { dailyLogs, type DailyLog, type NewDailyLog } from '../../db/schema';
import { calculateScore, getScoreStatus } from './logs.utils';
import type { CreateDailyLogInput, UpdateDailyLogInput } from './logs.validation';

export class LogsService {
  async createOrUpdateLog(input: CreateDailyLogInput): Promise<DailyLog> {
    const score = calculateScore(input);
    const status = getScoreStatus(score);
    
    console.log('[DEBUG] Creating/updating log:', { date: input.date, score, status });

    const logData: NewDailyLog = {
      date: input.date,
      deepWorkHours: input.deepWorkHours ?? 0,
      sleepHours: input.sleepHours ?? 0,
      wokeOnTime: input.wokeOnTime ?? false,
      sleepFollowed: input.sleepFollowed ?? false,
      morningReset: input.morningReset ?? false,
      deepWorkBlock1: input.deepWorkBlock1 ?? false,
      deepWorkBlock2: input.deepWorkBlock2 ?? false,
      deepWorkBlock3: input.deepWorkBlock3 ?? false,
      backendDone: input.backendDone ?? false,
      dsaDone: input.dsaDone ?? false,
      githubCommit: input.githubCommit ?? false,
      workoutDone: input.workoutDone ?? false,
      sunlightTaken: input.sunlightTaken ?? false,
      focusLevel: input.focusLevel ?? 'medium',
      reflection: input.reflection ?? '',
      score,
      status,
    };

    const existingLog = await db.query.dailyLogs.findFirst({
      where: eq(dailyLogs.date, input.date),
    });

    if (existingLog) {
      console.log('[DEBUG] Existing log found, updating ID:', existingLog.id);
      const [updated] = await db
        .update(dailyLogs)
        .set({ ...logData, updatedAt: new Date() })
        .where(eq(dailyLogs.id, existingLog.id))
        .returning();
      return updated;
    }

    console.log('[DEBUG] No existing log, creating new');
    const [created] = await db.insert(dailyLogs).values(logData).returning();
    return created;
  }

  async getAllLogs(range?: 'week' | 'month' | 'year'): Promise<DailyLog[]> {
    let dateFilter;
    if (range) {
      const now = new Date();
      let startDate: Date;
      switch (range) {
        case 'week': startDate = new Date(now.setDate(now.getDate() - 7)); break;
        case 'month': startDate = new Date(now.setMonth(now.getMonth() - 1)); break;
        case 'year': startDate = new Date(now.setFullYear(now.getFullYear() - 1)); break;
      }
      dateFilter = gte(dailyLogs.date, startDate!.toISOString().split('T')[0]);
    }
    return db.query.dailyLogs.findMany({ where: dateFilter, orderBy: desc(dailyLogs.date) });
  }

  async getLogByDate(date: string): Promise<DailyLog | null> {
    const log = await db.query.dailyLogs.findFirst({ where: eq(dailyLogs.date, date) });
    return log || null;
  }

  async updateLog(date: string, input: UpdateDailyLogInput): Promise<DailyLog | null> {
    const existingLog = await this.getLogByDate(date);
    if (!existingLog) return null;
    const score = calculateScore({ ...existingLog, ...input });
    const status = getScoreStatus(score);
    const [updated] = await db.update(dailyLogs).set({ ...input, score, status, updatedAt: new Date() }).where(eq(dailyLogs.id, existingLog.id)).returning();
    return updated;
  }

  async deleteLog(date: string): Promise<boolean> {
    const existingLog = await this.getLogByDate(date);
    if (!existingLog) return false;
    await db.delete(dailyLogs).where(eq(dailyLogs.id, existingLog.id));
    return true;
  }
}

export const logsService = new LogsService();
`;

fs.writeFileSync('src/modules/logs/logs.utils.ts', logsUtilsContent);
fs.writeFileSync('src/modules/logs/logs.service.ts', logsServiceContent);
console.log('✅ Backend files updated successfully');
console.log('✅ Scoring fixed to 12-point system');
console.log('✅ Now restart the backend: npm run dev');
