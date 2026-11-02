import { existsSync } from 'node:fs';
import { defineConfig } from 'drizzle-kit';

if (existsSync('.env')) process.loadEnvFile('.env');

export default defineConfig({
  dialect: 'postgresql',
  schema: './db/schema.ts',
  out: './db/migrations',
  casing: 'snake_case',
  dbCredentials: { url: process.env.DATABASE_URL_ADMIN ?? '' },
});
