// サイト用の DB 接続。読み取り専用のロールで接続する
import { DATABASE_URL_WEB } from 'astro:env/server';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

export const db = drizzle(postgres(DATABASE_URL_WEB), { casing: 'snake_case' });
