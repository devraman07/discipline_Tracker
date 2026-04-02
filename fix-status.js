const fs = require('fs');
const path = require('path');

const logsUtilsPath = 'd:/Raman/personal_projects/habit-tracker/backend/src/modules/logs/logs.utils.ts';

const correctContent = `interface CalculateScoreInput {
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
  // 11 tasks = 11 points
  if (log.deepWorkBlock1) score += 1;
  if (log.deepWorkBlock2) score += 1;
  if (log.deepWorkBlock3) score += 1;
  if (log.backendDone) score += 1;
  if (log.dsaDone) score += 1;
  if (log.githubCommit) score += 1;
  if (log.workoutDone) score += 1;
  if (log.sunlightTaken) score += 1;
  if (log.sleepFollowed) score += 1;
  if (log.wokeOnTime) score += 1;
  if (log.morningReset) score += 1;
  // Focus bonus = +1
  if (log.focusLevel === 'high') score += 1;
  return score;
}

export function getMaxPossibleScore(): number {
  return MAX_SCORE;
}

export function getScoreStatus(score: number): 'Elite' | 'Good' | 'Missed' {
  // FIXED: Proper thresholds
  // Elite: 10-12 points (83.3%+)
  // Good: 6-9 points (50-83%)
  // Missed: 0-5 points (<50%)
  if (score >= 10) return 'Elite';
  if (score >= 6) return 'Good';
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

try {
  fs.writeFileSync(logsUtilsPath, correctContent);
  console.log('✅ logs.utils.ts FIXED');
  console.log('✅ Score thresholds corrected:');
  console.log('   Elite: 10-12 points');
  console.log('   Good: 6-9 points');
  console.log('   Missed: 0-5 points');
  console.log('');
  console.log('🔄 RESTART BACKEND: npm run dev');
} catch (err) {
  console.error('❌ Failed to write file:', err);
}
