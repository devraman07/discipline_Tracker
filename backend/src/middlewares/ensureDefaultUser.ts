import type { Request, Response, NextFunction } from 'express';
import { db } from '../database/connection';
import { users } from '../database/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;
const DEFAULT_EMAIL = 'default@discipline.local';
const DEFAULT_PASSWORD = 'defaultpassword';

// In-memory cache for default user (avoids DB query on every request)
let cachedUser: { id: string; email: string } | null = null;

// Ensure default user exists in database (for personal use without auth)
export const ensureDefaultUserMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Use cached user if available (99% of requests)
    if (cachedUser) {
      req.userId = cachedUser.id;
      next();
      return;
    }

    // Check if user exists by email (more reliable than ID for upsert logic)
    let user = await db.query.users.findFirst({
      where: eq(users.email, DEFAULT_EMAIL),
    });

    // Create default user only if it doesn't exist
    if (!user) {
      const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

      const [created] = await db
        .insert(users)
        .values({
          email: DEFAULT_EMAIL,
          passwordHash,
          firstName: 'Default',
          lastName: 'User',
          timezone: 'UTC',
          isActive: true,
        })
        .returning();

      user = created;
      console.log(`[ensureDefaultUser] Created default user: ${user.id}`);
    }

    // Cache user in memory for subsequent requests
    cachedUser = { id: user.id, email: user.email };

    // Attach to request
    req.userId = user.id;
    next();
  } catch (error) {
    console.error('[ensureDefaultUser] Error:', error);
    // Don't crash - try to continue without user
    // This prevents total system failure
    req.userId = '00000000-0000-0000-0000-000000000000';
    next();
  }
};

// Reset cache (useful for testing)
export const resetDefaultUserCache = (): void => {
  cachedUser = null;
};
