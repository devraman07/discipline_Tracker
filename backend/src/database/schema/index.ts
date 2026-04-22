import { pgTable, uuid, varchar, timestamp, boolean, integer, text, pgEnum, date, decimal, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);
export const habitCategoryEnum = pgEnum('habit_category', ['anchor', 'deep_work', 'detox', 'wellbeing', 'custom']);
export const habitFrequencyEnum = pgEnum('habit_frequency', ['daily', 'weekly', 'monthly']);
export const moodLevelEnum = pgEnum('mood_level', ['1', '2', '3', '4', '5']);
export const energyLevelEnum = pgEnum('energy_level', ['1', '2', '3', '4', '5']);
export const sleepQualityEnum = pgEnum('sleep_quality', ['poor', 'fair', 'good', 'excellent']);

// Users Table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  timezone: varchar('timezone', { length: 50 }).default('UTC').notNull(),
  role: userRoleEnum('role').default('user').notNull(),
  isEmailVerified: boolean('is_email_verified').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
  roleIdx: index('users_role_idx').on(table.role),
}));

// Habits Table (Dynamic habit definitions)
export const habits = pgTable('habits', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  category: habitCategoryEnum('category').notNull(),
  frequency: habitFrequencyEnum('frequency').default('daily').notNull(),
  points: integer('points').default(1).notNull(),
  targetCount: integer('target_count').default(1).notNull(), // For habits like "7 deep work blocks"
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  color: varchar('color', { length: 7 }).default('#3B82F6'), // Hex color for UI
  icon: varchar('icon', { length: 50 }), // Lucide icon name
  reminderTime: varchar('reminder_time', { length: 5 }), // HH:MM format
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('habits_user_id_idx').on(table.userId),
  categoryIdx: index('habits_category_idx').on(table.category),
  userCategoryIdx: index('habits_user_category_idx').on(table.userId, table.category),
}));

// Habit Completions Table (Daily tracking)
export const habitCompletions = pgTable('habit_completions', {
  id: uuid('id').primaryKey().defaultRandom(),
  habitId: uuid('habit_id').references(() => habits.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  date: date('date').notNull(),
  completed: boolean('completed').default(false).notNull(),
  count: integer('count').default(1).notNull(), // For counting multiple instances (e.g., 5 deep work blocks)
  notes: text('notes'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  habitDateIdx: uniqueIndex('habit_completions_habit_date_idx').on(table.habitId, table.date),
  userDateIdx: index('habit_completions_user_date_idx').on(table.userId, table.date),
  dateIdx: index('habit_completions_date_idx').on(table.date),
}));

// Daily Summaries Table (Cached daily stats)
export const dailySummaries = pgTable('daily_summaries', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  date: date('date').notNull(),
  
  // Score metrics
  totalHabits: integer('total_habits').default(0).notNull(),
  completedHabits: integer('completed_habits').default(0).notNull(),
  totalPoints: integer('total_points').default(0).notNull(),
  maxPossiblePoints: integer('max_possible_points').default(0).notNull(),
  completionRate: decimal('completion_rate', { precision: 5, scale: 2 }).default('0').notNull(),
  scoreStatus: varchar('score_status', { length: 20 }).default('reset').notNull(), // 'excellent', 'good', 'reset'
  
  // Deep work specific
  deepWorkBlocksCompleted: integer('deep_work_blocks_completed').default(0).notNull(),
  deepWorkHours: decimal('deep_work_hours', { precision: 4, scale: 1 }).default('0').notNull(),
  
  // Streak info
  streakContinued: boolean('streak_continued').default(false).notNull(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userDateIdx: uniqueIndex('daily_summaries_user_date_idx').on(table.userId, table.date),
  dateIdx: index('daily_summaries_date_idx').on(table.date),
}));

// Daily Reflections Table
export const dailyReflections = pgTable('daily_reflections', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  date: date('date').notNull(),
  
  // Well-being metrics
  mood: moodLevelEnum('mood'),
  energyLevel: energyLevelEnum('energy_level'),
  sleepQuality: sleepQualityEnum('sleep_quality'),
  sleepHours: decimal('sleep_hours', { precision: 3, scale: 1 }),
  
  // Reflection content
  biggestWin: text('biggest_win'),
  lessonLearned: text('lesson_learned'),
  priorityTomorrow: text('priority_tomorrow'),
  generalNotes: text('general_notes'),
  
  // Dopamine detox tracking
  noSocialMedia: boolean('no_social_media').default(false),
  noGaming: boolean('no_gaming').default(false),
  noUnnecessaryYoutube: boolean('no_unnecessary_youtube').default(false),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userDateIdx: uniqueIndex('daily_reflections_user_date_idx').on(table.userId, table.date),
  dateIdx: index('daily_reflections_date_idx').on(table.date),
}));

// Streak History Table (Track streak changes)
export const streakHistory = pgTable('streak_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  date: date('date').notNull(),
  currentStreak: integer('current_streak').default(0).notNull(),
  bestStreak: integer('best_streak').default(0).notNull(),
  streakBroken: boolean('streak_broken').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userDateIdx: uniqueIndex('streak_history_user_date_idx').on(table.userId, table.date),
}));

// Refresh Tokens Table (for JWT rotation)
export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  isRevoked: boolean('is_revoked').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  userAgent: text('user_agent'),
  ipAddress: varchar('ip_address', { length: 45 }),
}, (table) => ({
  tokenIdx: index('refresh_tokens_token_idx').on(table.token),
  userIdIdx: index('refresh_tokens_user_id_idx').on(table.userId),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  habits: many(habits),
  habitCompletions: many(habitCompletions),
  dailySummaries: many(dailySummaries),
  dailyReflections: many(dailyReflections),
  streakHistory: many(streakHistory),
  refreshTokens: many(refreshTokens),
}));

export const habitsRelations = relations(habits, ({ one, many }) => ({
  user: one(users, {
    fields: [habits.userId],
    references: [users.id],
  }),
  completions: many(habitCompletions),
}));

export const habitCompletionsRelations = relations(habitCompletions, ({ one }) => ({
  habit: one(habits, {
    fields: [habitCompletions.habitId],
    references: [habits.id],
  }),
  user: one(users, {
    fields: [habitCompletions.userId],
    references: [users.id],
  }),
}));

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Habit = typeof habits.$inferSelect;
export type NewHabit = typeof habits.$inferInsert;

export type HabitCompletion = typeof habitCompletions.$inferSelect;
export type NewHabitCompletion = typeof habitCompletions.$inferInsert;

export type DailySummary = typeof dailySummaries.$inferSelect;
export type NewDailySummary = typeof dailySummaries.$inferInsert;

export type DailyReflection = typeof dailyReflections.$inferSelect;
export type NewDailyReflection = typeof dailyReflections.$inferInsert;

export type StreakHistory = typeof streakHistory.$inferSelect;
export type NewStreakHistory = typeof streakHistory.$inferInsert;

export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;
