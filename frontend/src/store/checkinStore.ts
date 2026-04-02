import { create } from 'zustand';

export interface DailyCheckin {
  id: string;
  date: string;

  // Routine
  wokeUpOnTime: boolean;
  followedSleepSchedule: boolean;
  didMorningReset: boolean;

  // Deep Work
  deepWorkBlock1: boolean;
  deepWorkBlock2: boolean;
  deepWorkBlock3: boolean;
  deepWorkHours: number;

  // Learning & Output
  backendTaskDone: boolean;
  dsaDone: boolean;
  githubCommit: boolean;

  // Health
  workoutDone: boolean;
  sunlightTaken: boolean;

  // Focus
  focusLevel: 'High' | 'Medium' | 'Low';

  // Reflection
  whatBuilt: string;
  whatWentWrong: string;

  // Calculated
  score: number;
  maxScore: number;
  status: 'Elite' | 'Good' | 'Missed';
}

export const SCORE_MAP = {
  wokeUpOnTime: 1,
  followedSleepSchedule: 1,
  didMorningReset: 1,
  deepWorkBlock1: 1,
  deepWorkBlock2: 1,
  deepWorkBlock3: 1,
  backendTaskDone: 1,
  dsaDone: 1,
  githubCommit: 1,
  workoutDone: 1,
  sunlightTaken: 1,
  focusHigh: 1,
} as const;

export const MAX_SCORE = Object.values(SCORE_MAP).reduce((a, b) => a + b, 0);

export function calculateScore(checkin: Partial<DailyCheckin>): number {
  let score = 0;
  const boolFields: (keyof typeof SCORE_MAP)[] = [
    'wokeUpOnTime', 'followedSleepSchedule', 'didMorningReset',
    'deepWorkBlock1', 'deepWorkBlock2', 'deepWorkBlock3',
    'backendTaskDone', 'dsaDone', 'githubCommit',
    'workoutDone', 'sunlightTaken',
  ];
  for (const f of boolFields) {
    if ((checkin as any)[f]) score += SCORE_MAP[f];
  }
  if (checkin.focusLevel === 'High') score += 1;
  return score;
}

export function getStatus(score: number): 'Elite' | 'Good' | 'Missed' {
  const pct = score / MAX_SCORE;
  if (pct >= 0.85) return 'Elite';
  if (pct >= 0.5) return 'Good';
  return 'Missed';
}

export function getStatusEmoji(status: string) {
  if (status === 'Elite') return '🔥';
  if (status === 'Good') return '⚡';
  return '❌';
}

export function getFeedback(score: number, checkin: Partial<DailyCheckin>): string {
  const status = getStatus(score);
  if (status === 'Elite') return 'You followed your system today. Keep dominating.';
  if (status === 'Good') {
    const missed: string[] = [];
    if (!checkin.deepWorkBlock2) missed.push('Deep Work Block 2');
    if (!checkin.deepWorkBlock3) missed.push('Deep Work Block 3');
    if (!checkin.workoutDone) missed.push('Workout');
    if (!checkin.dsaDone) missed.push('DSA');
    if (missed.length > 0) return `Almost there. You missed ${missed.slice(0, 2).join(' & ')}.`;
    return 'Decent day. Push harder tomorrow.';
  }
  return 'You broke the chain. Reset and go again tomorrow.';
}

export function getRealTimeFeedback(score: number): string {
  const remaining = MAX_SCORE - score;
  if (remaining === 0) return "🔥 Perfect score. You're unstoppable.";
  if (remaining <= 2) return `⚡ ${remaining} task${remaining > 1 ? 's' : ''} away from an Elite day.`;
  if (remaining <= 5) return `Keep going — ${remaining} tasks left for a Good day.`;
  return `${remaining} tasks remaining. Start checking off.`;
}

interface CheckinStore {
  checkins: DailyCheckin[];
  addCheckin: (checkin: DailyCheckin) => void;
}

function generateSampleData(): DailyCheckin[] {
  const data: DailyCheckin[] = [];
  for (let i = 30; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const rand = () => Math.random() > 0.25;
    const partial: Partial<DailyCheckin> = {
      wokeUpOnTime: rand(),
      followedSleepSchedule: rand(),
      didMorningReset: rand(),
      deepWorkBlock1: rand(),
      deepWorkBlock2: Math.random() > 0.35,
      deepWorkBlock3: Math.random() > 0.5,
      deepWorkHours: Math.round((2 + Math.random() * 6) * 10) / 10,
      backendTaskDone: rand(),
      dsaDone: Math.random() > 0.35,
      githubCommit: rand(),
      workoutDone: Math.random() > 0.3,
      sunlightTaken: rand(),
      focusLevel: (['High', 'Medium', 'Low'] as const)[Math.floor(Math.random() * 3)],
      whatBuilt: 'API endpoints and refactoring.',
      whatWentWrong: 'Got distracted after lunch.',
    };
    const score = calculateScore(partial);
    const status = getStatus(score);
    data.push({
      id: crypto.randomUUID(),
      date: dateStr,
      ...partial,
      score,
      maxScore: MAX_SCORE,
      status,
    } as DailyCheckin);
  }
  return data;
}

export const useCheckinStore = create<CheckinStore>((set) => ({
  checkins: generateSampleData(),
  addCheckin: (checkin) => set((state) => ({ checkins: [checkin, ...state.checkins] })),
}));

export function getStreak(checkins: DailyCheckin[]): number {
  const sorted = [...checkins].sort((a, b) => b.date.localeCompare(a.date));
  let count = 0;
  const d = new Date();
  for (const log of sorted) {
    const expected = d.toISOString().split('T')[0];
    if (log.date !== expected) break;
    if (log.status !== 'Missed') count++;
    else break;
    d.setDate(d.getDate() - 1);
  }
  return count;
}
