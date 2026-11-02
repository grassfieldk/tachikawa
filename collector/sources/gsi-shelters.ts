// 国土地理院の指定緊急避難場所データと指定避難所データ（立川市分の CSV）
// CSV は手動でダウンロードし、data/shelters/ に置く
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { and, eq, notInArray, sql } from 'drizzle-orm';
import type { Db } from '../../db/client';
import { areas, places } from '../../db/schema';
import type { LngLat } from '../../src/data/types';
import { parseCsv } from '../csv';
import type { SourceDefinition } from '../source';

const FILES = {
  emergency: new URL('../../data/shelters/emergency.csv', import.meta.url),
  shelter: new URL('../../data/shelters/shelter.csv', import.meta.url),
};

// 指定緊急避難場所の CSV の列名と、表示する災害の種類
const HAZARDS: [string, string][] = [
  ['洪水', '洪水'],
  ['崖崩れ、土石流及び地滑り', '土砂災害'],
  ['高潮', '高潮'],
  ['地震', '地震'],
  ['津波', '津波'],
  ['大規模な火事', '大規模な火事'],
  ['内水氾濫', '内水氾濫'],
  ['火山現象', '火山現象'],
];

// 両方の CSV に載っている施設は、共通 ID の末尾 3 桁以外が同じ
const facilityId = (row: Record<string, string>) => row['共通ID'].slice(0, -3);

function lngLatOf(row: Record<string, string>): LngLat | null {
  const lng = Number(row['経度']);
  const lat = Number(row['緯度']);
  return row['経度'] && row['緯度'] && Number.isFinite(lng) && Number.isFinite(lat) ? [lng, lat] : null;
}

async function readRows() {
  const [emergency, shelter] = await Promise.all([
    readFile(FILES.emergency, 'utf8').then(parseCsv),
    readFile(FILES.shelter, 'utf8').then(parseCsv),
  ]);
  for (const [name, rows] of [
    ['指定緊急避難場所', emergency],
    ['指定避難所', shelter],
  ] as const) {
    if (rows.length === 0 || !('共通ID' in rows[0])) throw new Error(`${name}の CSV を読み取れません`);
  }
  return { emergency, shelter };
}

async function areaIdsByName(db: Db) {
  const rows = await db.select({ id: areas.id, name: areas.name }).from(areas);
  return new Map(rows.map((a) => [a.name, a.id]));
}

export const gsiShelters: SourceDefinition = {
  slug: 'gsi-shelters',
  name: '国土地理院 指定緊急避難場所・指定避難所データ',
  kind: 'file',
  url: 'https://hinanmap.gsi.go.jp/hinanjocp/hinanbasho/koukaidate.html',
  intervalMinutes: 5,
  termsNote:
    '国土地理院コンテンツ利用規約に従い出典を示す。第三者に提供する場合は、最新でない場合があること、指定緊急避難場所は災害の種類ごとに指定されること、随時更新されることを伝える',
  termsCheckedOn: '2026-11-02',
  async contentHash() {
    const hash = createHash('sha256');
    for (const file of [FILES.emergency, FILES.shelter]) hash.update(await readFile(file));
    return hash.digest('hex');
  },
  async collect(db, sourceId) {
    const { emergency, shelter } = await readRows();
    const areaIds = await areaIdsByName(db);
    const emergencyById = new Map(emergency.map((r) => [facilityId(r), r]));
    const shelterById = new Map(shelter.map((r) => [facilityId(r), r]));
    const ids = [...new Set([...shelterById.keys(), ...emergencyById.keys()])];

    const values = ids.map((id) => {
      const e = emergencyById.get(id);
      const s = shelterById.get(id);
      const base = (s ?? e)!;
      const address = base['住所'].replace(/^東京都/, '') || null;
      const town = address?.match(/^立川市(\D+?町)/)?.[1];
      const hazards = e ? HAZARDS.filter(([col]) => e[col] === '1').map(([, label]) => label) : [];
      const attributes: Record<string, string> = {};
      if (hazards.length > 0) attributes['対象とする災害'] = hazards.join('、');
      if (s?.['受入対象者']) attributes['受入対象者'] = s['受入対象者'];
      if (s?.['その他市町村長が必要と認める事項']) attributes['その他'] = s['その他市町村長が必要と認める事項'];
      const note = [s?.['備考'], e?.['備考']].filter((v) => v).join('、');
      if (note) attributes['備考'] = note;
      return {
        name: base['施設・場所名'],
        kind: 'shelter' as const,
        category: [s && '指定避難所', e && '指定緊急避難場所'].filter((v) => v).join('・'),
        address,
        location: (s && lngLatOf(s)) ?? (e && lngLatOf(e)) ?? null,
        areaId: (town && areaIds.get(town)) || null,
        status: 'open' as const,
        sourceId,
        externalId: id,
        attributes,
      };
    });

    const updated = await db
      .insert(places)
      .values(values)
      .onConflictDoUpdate({
        target: [places.sourceId, places.externalId],
        set: {
          name: sql`excluded.name`,
          category: sql`excluded.category`,
          address: sql`excluded.address`,
          location: sql`excluded.location`,
          areaId: sql`excluded.area_id`,
          status: sql`excluded.status`,
          attributes: sql`excluded.attributes`,
          updatedAt: new Date(),
        },
        setWhere: sql`(places.name, places.category, places.address, places.location, places.area_id, places.status, places.attributes)
          is distinct from (excluded.name, excluded.category, excluded.address, excluded.location, excluded.area_id, excluded.status, excluded.attributes)`,
      })
      .returning({ id: places.id });

    // CSV からなくなった施設を消す
    const removed = await db
      .delete(places)
      .where(and(eq(places.sourceId, sourceId), notInArray(places.externalId, ids)))
      .returning({ id: places.id });

    const noLocation = values.filter((v) => v.location === null).length;
    return {
      seen: ids.length,
      changed: updated.length + removed.length,
      warning: noLocation > 0 ? `${noLocation} 件は緯度経度がない` : undefined,
    };
  },
};
