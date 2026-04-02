import { SCORE_MAX, ELITE_THRESHOLD, GOOD_THRESHOLD } from './constants';

export { SCORE_MAX };

export function calculateScore(checkin: {
  wokeOnTime?: boolean;
  followedSleepSchedule?: boolean;
  didMorningReset?: boolean;
  deepWorkBlock1?: boolean;
  deepWorkBlock2?: boolean;
  deepWorkBlock3?: boolean;
  backendDone?: boolean;
  dsaDone?: boolean;
  githubCommit?: boolean;
  workoutDone?: boolean;
  sunlightTaken?: boolean;
  focusLevel?: string;
}): number {
  let score = 0;
  
  // 11 boolean tasks = 11 points
  if (checkin.wokeOnTime) score++;
  if (checkin.followedSleepSchedule) score++;
  if (checkin.didMorningReset) score++;
  if (checkin.deepWorkBlock1) score++;
  if (checkin.deepWorkBlock2) score++;
  if (checkin.deepWorkBlock3) score++;
  if (checkin.backendDone) score++;
  if (checkin.dsaDone) score++;
  if (checkin.githubCommit) score++;
  if (checkin.workoutDone) score++;
  if (checkin.sunlightTaken) score++;
  
  // Focus level bonus - high = +1 point
  if (checkin.focusLevel === 'high' || checkin.focusLevel === 'High') score++;
  
  return score;
}

export function getStatus(score: number): 'Elite' | 'Good' | 'Missed' {
  const pct = score / SCORE_MAX;
  if (pct >= ELITE_THRESHOLD) return 'Elite';
  if (pct >= GOOD_THRESHOLD) return 'Good';
  return 'Missed';
}

export function getStatusEmoji(status: string): string {
  if (status === 'Elite') return '🔥';
  if (status === 'Good') return '⚡';
  return '❌';
}

export function getFeedback(score: number, checkin?: {
  deepWorkBlock2?: boolean;
  deepWorkBlock3?: boolean;
  workoutDone?: boolean;
  dsaDone?: boolean;
}): string {
  const status = getStatus(score);
  if (status === 'Elite') return 'You followed your system today. Keep dominating.';
  if (status === 'Good') {
    if (checkin) {
      const missed: string[] = [];
      if (!checkin.deepWorkBlock2) missed.push('Deep Work Block 2');
      if (!checkin.deepWorkBlock3) missed.push('Deep Work Block 3');
      if (!checkin.workoutDone) missed.push('Workout');
      if (!checkin.dsaDone) missed.push('DSA');
      if (missed.length > 0) return `Almost there. You missed ${missed.slice(0, 2).join(' & ')}.`;
    }
    return 'Decent day. Push harder tomorrow.';
  }
  return 'You broke the chain. Reset and go again tomorrow.';
}

export function getRealTimeFeedback(score: number): string {
  const remaining = SCORE_MAX - score;
  if (remaining === 0) return "🔥 Perfect score. You're unstoppable.";
  if (remaining <= 2) return `⚡ ${remaining} task${remaining > 1 ? 's' : ''} away from an Elite day.`;
  if (remaining <= 5) return `Keep going — ${remaining} tasks left for a Good day.`;
  return `${remaining} tasks remaining. Start checking off.`;
}
