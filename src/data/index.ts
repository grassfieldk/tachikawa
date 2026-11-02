// データの取り出し口。画面はこのファイルの関数だけを通して DB を読む
import { and, asc, desc, eq, ilike, isNull, or, sql, type SQL } from 'drizzle-orm';
import { areas, articles, events, fetchRuns, placeChanges, places, sources } from '../../db/schema';
import { MAP_CENTER } from '../config';
import { addDays, fromDateOnly, startOfJstDay, thisWeekendRange } from '../lib/dates';
import { db } from './db';
import type {
  AreaRef,
  Area,
  AreaSummary,
  Article,
  ArticleCategory,
  EventCategory,
  EventItem,
  FetchStatus,
  Place,
  PlaceChange,
  PlaceChangeType,
  PlaceKind,
  Source,
} from './types';

export type EventWhen = 'today' | 'weekend' | 'week' | 'month' | 'upcoming' | 'past';

const areaRef = (code: string | null, name: string | null): AreaRef | null =>
  code !== null && name !== null ? { code, name } : null;

const dateOrNull = (value: string | null) => (value === null ? null : fromDateOnly(value));

// LIKE の特殊文字をエスケープして部分一致のパターンにする
const contains = (word: string) => `%${word.replace(/[\\%_]/g, '\\$&')}%`;

// 終了日時がないイベントは、終日ならその日の終わり、それ以外は開始時刻で終わったものとみなす
const eventEnd = sql`coalesce(${events.endsAt}, case when ${events.allDay}
  then ((${events.startsAt} at time zone 'Asia/Tokyo')::date + 1)::timestamp at time zone 'Asia/Tokyo'
  else ${events.startsAt} end)`;

const overlaps = (from: Date, to: Date) =>
  and(sql`${events.startsAt} < ${to.toISOString()}`, sql`${eventEnd} >= ${from.toISOString()}`);

function whenCondition(when: EventWhen, now: Date): SQL | undefined {
  switch (when) {
    case 'today': {
      const today = startOfJstDay(now);
      return overlaps(today, addDays(today, 1));
    }
    case 'weekend': {
      const [from, to] = thisWeekendRange();
      return overlaps(from, to);
    }
    case 'week':
      return overlaps(now, addDays(now, 7));
    case 'month':
      return overlaps(now, addDays(now, 30));
    case 'upcoming':
      return sql`${eventEnd} >= ${now.toISOString()}`;
    case 'past':
      return sql`${eventEnd} < ${now.toISOString()}`;
  }
}

const eventColumns = {
  id: events.id,
  sourceId: events.sourceId,
  sourceName: sources.name,
  sourceUrl: events.sourceUrl,
  title: events.title,
  description: events.description,
  startsAt: events.startsAt,
  endsAt: events.endsAt,
  allDay: events.allDay,
  venueName: events.venueName,
  address: events.address,
  location: events.location,
  areaId: events.areaId,
  areaCode: areas.code,
  areaName: areas.name,
  category: events.category,
  status: events.status,
  feeText: events.feeText,
  organizer: events.organizer,
};

function selectEvents(where: (SQL | undefined)[]) {
  return db
    .select(eventColumns)
    .from(events)
    .innerJoin(sources, eq(sources.id, events.sourceId))
    .leftJoin(areas, eq(areas.id, events.areaId))
    .where(and(isNull(events.mergedIntoId), ...where))
    .$dynamic();
}

function toEvent({ areaCode, areaName, ...e }: Awaited<ReturnType<typeof selectEvents>>[number]): EventItem {
  return { ...e, area: areaRef(areaCode, areaName) };
}

const articleColumns = {
  id: articles.id,
  sourceId: articles.sourceId,
  sourceName: sources.name,
  sourceUrl: articles.sourceUrl,
  title: articles.title,
  summary: articles.summary,
  category: articles.category,
  publishedAt: articles.publishedAt,
};

function selectArticles(where: (SQL | undefined)[]) {
  return db
    .select(articleColumns)
    .from(articles)
    .innerJoin(sources, eq(sources.id, articles.sourceId))
    .where(and(...where))
    .orderBy(desc(articles.publishedAt))
    .$dynamic();
}

const placeColumns = {
  id: places.id,
  name: places.name,
  kind: places.kind,
  category: places.category,
  address: places.address,
  location: places.location,
  areaId: places.areaId,
  areaCode: areas.code,
  areaName: areas.name,
  status: places.status,
  openedOn: places.openedOn,
  closedOn: places.closedOn,
  websiteUrl: places.websiteUrl,
  attributes: places.attributes,
};

function selectPlaces(where: (SQL | undefined)[]) {
  return db
    .select(placeColumns)
    .from(places)
    .leftJoin(areas, eq(areas.id, places.areaId))
    .where(and(...where))
    .orderBy(asc(places.id))
    .$dynamic();
}

function toPlace({
  areaCode,
  areaName,
  openedOn,
  closedOn,
  ...p
}: Awaited<ReturnType<typeof selectPlaces>>[number]): Place {
  return {
    ...p,
    area: areaRef(areaCode, areaName),
    openedOn: dateOrNull(openedOn),
    closedOn: dateOrNull(closedOn),
  };
}

// 地区の指定がなければ条件なし。存在しない地区を指定したときは該当なしになる
const areaCondition = (column: typeof events.areaId | typeof places.areaId, areaSlug?: string) =>
  areaSlug === undefined
    ? undefined
    : eq(column, sql`(select ${areas.id} from ${areas} where ${areas.code} = ${areaSlug})`);

export async function listEvents(
  opts: { when?: EventWhen; category?: EventCategory; areaSlug?: string; limit?: number } = {},
): Promise<EventItem[]> {
  const { when = 'upcoming', category, limit } = opts;
  const query = selectEvents([
    whenCondition(when, new Date()),
    category ? eq(events.category, category) : undefined,
    areaCondition(events.areaId, opts.areaSlug),
  ]).orderBy(when === 'past' ? desc(events.startsAt) : asc(events.startsAt));
  const rows = await (limit === undefined ? query : query.limit(limit));
  return rows.map(toEvent);
}

export async function getEvent(id: number): Promise<EventItem | null> {
  const [row] = await selectEvents([eq(events.id, id)]);
  return row ? toEvent(row) : null;
}

export async function listArticles(
  opts: { category?: ArticleCategory; limit?: number } = {},
): Promise<Article[]> {
  const query = selectArticles([opts.category ? eq(articles.category, opts.category) : undefined]);
  return opts.limit === undefined ? query : query.limit(opts.limit);
}

export async function listChanges(
  opts: { type?: PlaceChangeType; limit?: number } = {},
): Promise<PlaceChange[]> {
  const query = db
    .select({
      id: placeChanges.id,
      placeId: placeChanges.placeId,
      placeName: placeChanges.placeName,
      changeType: placeChanges.changeType,
      effectiveOn: placeChanges.effectiveOn,
      areaId: placeChanges.areaId,
      areaCode: areas.code,
      areaName: areas.name,
      sourceUrl: placeChanges.sourceUrl,
      publishedAt: placeChanges.publishedAt,
      note: placeChanges.note,
    })
    .from(placeChanges)
    .leftJoin(areas, eq(areas.id, placeChanges.areaId))
    .where(
      and(eq(placeChanges.confirmed, true), opts.type ? eq(placeChanges.changeType, opts.type) : undefined),
    )
    .orderBy(desc(placeChanges.publishedAt))
    .$dynamic();
  const rows = await (opts.limit === undefined ? query : query.limit(opts.limit));
  return rows.map(({ areaCode, areaName, effectiveOn, ...c }) => ({
    ...c,
    area: areaRef(areaCode, areaName),
    effectiveOn: dateOrNull(effectiveOn),
  }));
}

export async function listPlaces(opts: { kind?: PlaceKind; areaSlug?: string } = {}): Promise<Place[]> {
  const rows = await selectPlaces([
    opts.kind ? eq(places.kind, opts.kind) : undefined,
    areaCondition(places.areaId, opts.areaSlug),
  ]);
  return rows.map(toPlace);
}

export async function getPlace(id: number): Promise<Place | null> {
  const [row] = await selectPlaces([eq(places.id, id)]);
  return row ? toPlace(row) : null;
}

const areaColumns = {
  id: areas.id,
  code: areas.code,
  name: areas.name,
  summary: areas.summary,
  features: areas.features,
  center: areas.center,
};

const toArea = <T extends { center: Area['center'] | null }>(a: T) => ({ ...a, center: a.center ?? MAP_CENTER });

export async function listAreas(): Promise<AreaSummary[]> {
  const rows = await db
    .select({
      ...areaColumns,
      placeCount: sql<number>`(select count(*) from places where places.area_id = areas.id)`.mapWith(Number),
      upcomingEventCount: sql<number>`(select count(*) from events
        where events.area_id = areas.id and events.merged_into_id is null and ${eventEnd} >= now())`.mapWith(
        Number,
      ),
    })
    .from(areas)
    .orderBy(asc(areas.id));
  return rows.map(toArea);
}

export async function getArea(code: string): Promise<Area | null> {
  const [row] = await db.select(areaColumns).from(areas).where(eq(areas.code, code));
  return row ? toArea(row) : null;
}

// 最後に終わった収集の状態と、最後に取得できた（一部のみを含む）日時
// 単一テーブルの select では列名がテーブル名なしで展開されるため、相関サブクエリは列名を直接書く
const lastStatus = sql<FetchStatus | null>`(select r.status from fetch_runs r
  where r.source_id = sources.id and r.finished_at is not null
  order by r.finished_at desc limit 1)`;
const lastSuccessAt = sql`(select max(r.finished_at) from fetch_runs r
  where r.source_id = sources.id and r.status in ('success', 'partial'))`.mapWith(fetchRuns.finishedAt);

export async function listSources(): Promise<Source[]> {
  const rows = await db
    .select({
      id: sources.id,
      slug: sources.slug,
      name: sources.name,
      kind: sources.kind,
      url: sources.url,
      intervalMinutes: sources.intervalMinutes,
      lastStatus,
      lastSuccessAt,
      termsCheckedOn: sources.termsCheckedOn,
    })
    .from(sources)
    .where(eq(sources.enabled, true))
    .orderBy(asc(sources.id));
  return rows.map((s) => ({ ...s, termsCheckedOn: dateOrNull(s.termsCheckedOn) }));
}

// 情報源のうち、最後に収集に成功した日時
export async function lastUpdatedAt(): Promise<Date | null> {
  const [row] = await db
    .select({ at: sql`max(${fetchRuns.finishedAt})`.mapWith(fetchRuns.finishedAt) })
    .from(fetchRuns)
    .where(sql`${fetchRuns.status} in ('success', 'partial')`);
  return row?.at ?? null;
}

export async function search(
  q: string,
): Promise<{ articles: Article[]; events: EventItem[]; places: Place[] }> {
  const word = q.trim();
  if (!word) return { articles: [], events: [], places: [] };
  const pattern = contains(word);
  const [articleRows, eventRows, placeRows] = await Promise.all([
    selectArticles([or(ilike(articles.title, pattern), ilike(articles.summary, pattern))]),
    selectEvents([
      or(
        ilike(events.title, pattern),
        ilike(events.description, pattern),
        ilike(events.venueName, pattern),
        ilike(events.organizer, pattern),
      ),
    ]).orderBy(asc(events.startsAt)),
    selectPlaces([or(ilike(places.name, pattern), ilike(places.category, pattern), ilike(places.address, pattern))]),
  ]);
  return { articles: articleRows, events: eventRows.map(toEvent), places: placeRows.map(toPlace) };
}
