import { pgTable, uuid, date, integer, boolean, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const focusLevelEnum = pgEnum('focus_level', ['high', 'medium', 'low']);

export const dailyLogs = pgTable('daily_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  date: date('date').notNull().unique(),
  
  deepWorkHours: integer('deep_work_hours').default(0).notNull(),
  sleepHours: integer('sleep_hours').default(0).notNull(),
  
  wokeOnTime: boolean('woke_on_time').default(false).notNull(),
  sleepFollowed: boolean('sleep_followed').default(false).notNull(),
  morningReset: boolean('morning_reset').default(false).notNull(),
  
  deepWorkBlock1: boolean('deep_work_block_1').default(false).notNull(),
  deepWorkBlock2: boolean('deep_work_block_2').default(false).notNull(),
  deepWorkBlock3: boolean('deep_work_block_3').default(false).notNull(),
  
  backendDone: boolean('backend_done').default(false).notNull(),
  dsaDone: boolean('dsa_done').default(false).notNull(),
  githubCommit: boolean('github_commit').default(false).notNull(),
  
  workoutDone: boolean('workout_done').default(false).notNull(),
  sunlightTaken: boolean('sunlight_taken').default(false).notNull(),
  
  focusLevel: focusLevelEnum('focus_level').default('medium').notNull(),
  
  reflection: text('reflection').default('').notNull(),
  
  score: integer('score').default(0).notNull(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type DailyLog = typeof dailyLogs.$inferSelect;
export type NewDailyLog = typeof dailyLogs.$inferInsert;
