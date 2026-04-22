import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { env } from '../config/env';
import * as schema from './schema';

// Lazy initialization for serverless environments
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;
let sqlInstance: NeonQueryFunction<false, false> | null = null;

function getDb() {
  if (!dbInstance) {
    sqlInstance = neon(env.DATABASE_URL);
    dbInstance = drizzle(sqlInstance, { schema });
  }
  return dbInstance;
}

// Export getter for serverless compatibility
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get: (_target, prop) => {
    const instance = getDb();
    return (instance as any)[prop];
  },
});

export type Database = ReturnType<typeof drizzle<typeof schema>>;
