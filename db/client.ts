// 収集処理と投入処理で使う DB 接続。管理用のロールで接続する
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

export function connect() {
  const url = process.env.DATABASE_URL_ADMIN;
  if (!url) throw new Error('DATABASE_URL_ADMIN が設定されていません');
  const client = postgres(url, { onnotice: () => {} });
  return { db: drizzle(client, { casing: 'snake_case' }), client };
}

export type Db = ReturnType<typeof connect>['db'];
