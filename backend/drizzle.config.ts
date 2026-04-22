import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in the .env file');
}
export default defineConfig({
  schema: './src/database/schema/index.ts', // New schema file path
  out: './drizzle/migrations', // Your migrations folder
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
