import { db } from '../../database/connection';
import { users, habits, type NewUser, type NewHabit } from '../../database/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { ConflictError, UnauthorizedError } from '../../utils/errors';
import type { RegisterInput, LoginInput } from './auth.validation';

const SALT_ROUNDS = 12;

export const authService = {
  async register(input: RegisterInput) {
    // Check if user exists
    const existing = await db.query.users.findFirst({
      where: eq(users.email, input.email),
    });

    if (existing) {
      throw new ConflictError('User already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    // Create user
    const [user] = await db.insert(users).values({
      email: input.email,
      passwordHash,
      firstName: input.username,
      timezone: input.timezone || 'UTC',
      isActive: true,
    } as NewUser).returning();

    // Create default habits for the user
    await this.createDefaultHabits(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
      },
    };
  },

  async login(input: LoginInput) {
    const user = await db.query.users.findFirst({
      where: eq(users.email, input.email),
    });

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
      },
    };
  },

  async createDefaultHabits(userId: string) {
    const defaultHabits = [
      // Anchor Habits
      { userId, name: 'Wake up at 5 AM', category: 'anchor', points: 1, sortOrder: 1 },
      { userId, name: 'Coding (minimum 1 hour)', category: 'anchor', points: 1, sortOrder: 2 },
      { userId, name: '1 DSA problem', category: 'anchor', points: 1, sortOrder: 3 },
      { userId, name: 'Workout / Physical activity', category: 'anchor', points: 1, sortOrder: 4 },
      { userId, name: 'No porn', category: 'anchor', points: 1, sortOrder: 5 },
      { userId, name: 'No scrolling after 10 PM', category: 'anchor', points: 1, sortOrder: 6 },
      { userId, name: 'Sleep by 10 PM', category: 'anchor', points: 1, sortOrder: 7 },
      
      // Deep Work Blocks
      { userId, name: 'Deep Work Block 1 (5:20-6:50)', category: 'deep_work', points: 1, targetCount: 1, sortOrder: 8 },
      { userId, name: 'Deep Work Block 2 (7:05-8:35)', category: 'deep_work', points: 1, targetCount: 1, sortOrder: 9 },
      { userId, name: 'Deep Work Block 3 (9:15-10:45)', category: 'deep_work', points: 1, targetCount: 1, sortOrder: 10 },
      { userId, name: 'Deep Work Block 4 (11:00-12:30)', category: 'deep_work', points: 1, targetCount: 1, sortOrder: 11 },
      { userId, name: 'Deep Work Block 5 (1:15-2:45)', category: 'deep_work', points: 1, targetCount: 1, sortOrder: 12 },
      { userId, name: 'Deep Work Block 6 (3:00-4:30)', category: 'deep_work', points: 1, targetCount: 1, sortOrder: 13 },
      { userId, name: 'Deep Work Block 7 (5:15-6:45)', category: 'deep_work', points: 1, targetCount: 1, sortOrder: 14 },
      
      // Detox
      { userId, name: 'No social media', category: 'detox', points: 1, sortOrder: 15 },
      { userId, name: 'No gaming', category: 'detox', points: 1, sortOrder: 16 },
      { userId, name: 'No unnecessary YouTube', category: 'detox', points: 1, sortOrder: 17 },
    ];

    await db.insert(habits).values(defaultHabits as NewHabit[]);
  },
};
