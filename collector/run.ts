// 収集を実行する。引数に slug を指定するとその情報源を間隔や内容の変化に関係なく実行し、指定がなければ収集間隔を過ぎた情報源を実行する
import { and, desc, eq, isNotNull } from 'drizzle-orm';
import { connect, type Db } from '../db/client';
import { fetchRuns, sources } from '../db/schema';
import type { SourceDefinition } from './source';
import { cityNews } from './sources/city-news';
import { gsiShelters } from './sources/gsi-shelters';

const DEFINITIONS: SourceDefinition[] = [cityNews, gsiShelters];

// 定義の内容で sources を登録または更新する
async function register(db: Db, def: SourceDefinition) {
  const values = {
    slug: def.slug,
    name: def.name,
    kind: def.kind,
    url: def.url,
    intervalMinutes: def.intervalMinutes,
    termsNote: def.termsNote,
    termsCheckedOn: def.termsCheckedOn,
  };
  const [row] = await db
    .insert(sources)
    .values(values)
    .onConflictDoUpdate({ target: sources.slug, set: { ...values, updatedAt: new Date() } })
    .returning({ id: sources.id, enabled: sources.enabled });
  return row;
}

// 収集間隔からこの時間を引いた時点で、収集の時期とみなす
// 起動から収集の開始までの遅れで、収集が timer の 1 回分あとにずれないようにする。timer の起動間隔（5 分）より短くする
const DUE_MARGIN_MINUTES = 4;

async function isDue(db: Db, sourceId: number, intervalMinutes: number) {
  const [last] = await db
    .select({ startedAt: fetchRuns.startedAt })
    .from(fetchRuns)
    .where(eq(fetchRuns.sourceId, sourceId))
    .orderBy(desc(fetchRuns.startedAt))
    .limit(1);
  const dueAt = (intervalMinutes - DUE_MARGIN_MINUTES) * 60 * 1000;
  return !last || Date.now() - last.startedAt.getTime() >= dueAt;
}

// 前回収集したときの内容のハッシュ
async function lastContentHash(db: Db, sourceId: number) {
  const [last] = await db
    .select({ contentHash: fetchRuns.contentHash })
    .from(fetchRuns)
    .where(and(eq(fetchRuns.sourceId, sourceId), isNotNull(fetchRuns.contentHash)))
    .orderBy(desc(fetchRuns.startedAt))
    .limit(1);
  return last?.contentHash ?? null;
}

async function runOnce(db: Db, def: SourceDefinition, sourceId: number, contentHash: string | null) {
  const [run] = await db
    .insert(fetchRuns)
    .values({ sourceId, startedAt: new Date() })
    .returning({ id: fetchRuns.id });
  const finish = (values: Partial<typeof fetchRuns.$inferInsert>) =>
    db
      .update(fetchRuns)
      .set({ ...values, finishedAt: new Date() })
      .where(eq(fetchRuns.id, run.id));
  try {
    const r = await def.collect(db, sourceId);
    await finish({
      status: r.warning ? 'partial' : 'success',
      itemsSeen: r.seen,
      itemsChanged: r.changed,
      error: r.warning ?? null,
      contentHash,
    });
    console.log(`${def.slug}: ${r.seen} 件中 ${r.changed} 件を登録または更新${r.warning ? `（${r.warning}）` : ''}`);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await finish({ status: 'failed', error: message });
    console.error(`${def.slug}: 失敗（${message}）`);
  }
}

const slugs = process.argv.slice(2);
const unknown = slugs.filter((s) => !DEFINITIONS.some((d) => d.slug === s));
if (unknown.length > 0) throw new Error(`定義されていない情報源: ${unknown.join(', ')}`);

const { db, client } = connect();
try {
  for (const def of DEFINITIONS) {
    if (slugs.length > 0 && !slugs.includes(def.slug)) continue;
    const source = await register(db, def);
    if (!source.enabled) continue;
    if (slugs.length === 0 && !(await isDue(db, source.id, def.intervalMinutes))) continue;
    // 取得できないときは収集を実行し、失敗として記録する
    const hash = def.contentHash ? await def.contentHash().catch(() => null) : null;
    if (slugs.length === 0 && hash !== null && hash === (await lastContentHash(db, source.id))) continue;
    await runOnce(db, def, source.id, hash);
  }
} finally {
  await client.end();
}
