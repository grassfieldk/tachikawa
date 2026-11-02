// ダミーデータを DB に入れ直す。収集したデータを含め、既存のデータはすべて消える
import { getTableName, sql } from 'drizzle-orm';
import { toDateOnly } from '../src/lib/dates';
import * as dummy from './dummy';
import { connect } from './client';
import { areas, articles, events, fetchRuns, placeChanges, places, sources } from './schema';

const { db, client } = connect();

const dateOnly = (d: Date | null) => (d === null ? null : toDateOnly(d));

// 種別ごとの取得元（ダミーの情報源の slug）
const PLACE_SOURCE: Record<string, string> = {
  shelter: 'ksj',
  facility: 'ksj',
  park: 'ksj',
  station: 'osm',
  shop: 'manual',
  restaurant: 'manual',
};

const tables = [placeChanges, places, events, articles, areas, fetchRuns, sources];

await db.transaction(async (tx) => {
  await tx.execute(sql`truncate ${sql.join(tables, sql`, `)} restart identity`);

  await tx.insert(sources).values(
    dummy.sources.map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      kind: s.kind,
      url: s.url,
      intervalMinutes: s.intervalMinutes,
      termsCheckedOn: dateOnly(s.termsCheckedOn),
    })),
  );

  // 最後に取得できた収集と、失敗している情報源にはその後の失敗した収集を入れる
  const now = Date.now();
  await tx.insert(fetchRuns).values(
    dummy.sources.flatMap((s) => {
      const runs = [];
      if (s.lastSuccessAt) {
        runs.push({
          sourceId: s.id,
          startedAt: new Date(s.lastSuccessAt.getTime() - 60 * 1000),
          finishedAt: s.lastSuccessAt,
          status: s.lastStatus === 'partial' ? ('partial' as const) : ('success' as const),
          error: s.lastStatus === 'partial' ? '一部の項目を取得できませんでした' : null,
        });
      }
      if (s.lastStatus === 'failed') {
        runs.push({
          sourceId: s.id,
          startedAt: new Date(now - 11 * 60 * 1000),
          finishedAt: new Date(now - 10 * 60 * 1000),
          status: 'failed' as const,
          error: '取得先に接続できませんでした',
        });
      }
      return runs;
    }),
  );

  await tx.insert(areas).values(dummy.areas.map((a) => ({ ...a, kind: '町' })));

  const sourceIdOf = (slug: string) => dummy.sources.find((s) => s.slug === slug)!.id;
  await tx.insert(places).values(
    dummy.places.map((p) => ({
      ...p,
      openedOn: dateOnly(p.openedOn),
      closedOn: dateOnly(p.closedOn),
      sourceId: sourceIdOf(PLACE_SOURCE[p.kind]),
      externalId: `dummy-${p.id}`,
    })),
  );

  await tx.insert(events).values(dummy.events);
  await tx.insert(placeChanges).values(
    dummy.changes.map((c) => ({ ...c, effectiveOn: dateOnly(c.effectiveOn), confirmed: true })),
  );

  // id を指定して入れたため、連番の続きを合わせる
  for (const t of tables) {
    await tx.execute(
      sql`select setval(pg_get_serial_sequence(${getTableName(t)}, 'id'), coalesce(max(id), 0) + 1, false) from ${t}`,
    );
  }
});

await client.end();
console.log('ダミーデータを投入しました');
