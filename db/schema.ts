// テーブル定義。列の意味は docs/database.md を参照
import { sql } from 'drizzle-orm';
import {
  type AnyPgColumn,
  bigint,
  boolean,
  customType,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { parseEWKB } from 'drizzle-orm/pg-core/columns/postgis_extension/utils';
import type {
  ArticleCategory,
  EventCategory,
  EventStatus,
  FetchStatus,
  LngLat,
  PlaceChangeType,
  PlaceKind,
  PlaceStatus,
  SourceKind,
} from '../src/data/types';

// geometry(Point, 4326) を [経度, 緯度] で読み書きする
const point = customType<{ data: LngLat; driverData: string }>({
  dataType: () => 'geometry(Point, 4326)',
  toDriver: ([lng, lat]) => `SRID=4326;POINT(${lng} ${lat})`,
  fromDriver: (value) => parseEWKB(value),
});

// 地区の境界。読み取りは SQL の関数で行うため、値は EWKB の 16 進文字列のまま扱う
const multiPolygon = customType<{ data: string; driverData: string }>({
  dataType: () => 'geometry(MultiPolygon, 4326)',
});

type ExtractedBy = 'rule' | 'llm' | 'manual';

const id = () => bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity();
const ref = () => bigint({ mode: 'number' });
const timestamptz = () => timestamp({ withTimezone: true });

const timestamps = {
  createdAt: timestamptz().notNull().defaultNow(),
  updatedAt: timestamptz()
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

// 収集した公開コンテンツに共通の列
const collected = {
  contentHash: text(),
  firstSeenAt: timestamptz().notNull().defaultNow(),
  lastSeenAt: timestamptz().notNull().defaultNow(),
  extractedBy: text().$type<ExtractedBy>().notNull().default('rule'),
  needsReview: boolean().notNull().default(false),
};

export const sources = pgTable('sources', {
  id: id(),
  slug: text().notNull().unique(),
  name: text().notNull(),
  kind: text().$type<SourceKind>().notNull(),
  url: text(),
  enabled: boolean().notNull().default(true),
  intervalMinutes: integer().notNull(),
  termsNote: text(),
  termsCheckedOn: date({ mode: 'string' }),
  ...timestamps,
});

export const fetchRuns = pgTable(
  'fetch_runs',
  {
    id: id(),
    sourceId: ref()
      .notNull()
      .references(() => sources.id),
    startedAt: timestamptz().notNull(),
    // 実行中は null
    finishedAt: timestamptz(),
    status: text().$type<FetchStatus>(),
    itemsSeen: integer().notNull().default(0),
    itemsChanged: integer().notNull().default(0),
    error: text(),
    ...timestamps,
  },
  (t) => [index().on(t.sourceId, t.finishedAt)],
);

export const areas = pgTable(
  'areas',
  {
    id: id(),
    code: text().notNull().unique(),
    name: text().notNull(),
    kind: text().notNull(),
    parentId: ref().references((): AnyPgColumn => areas.id),
    summary: text().notNull().default(''),
    features: text()
      .array()
      .notNull()
      .default(sql`'{}'`),
    center: point(),
    geom: multiPolygon(),
    ...timestamps,
  },
  (t) => [index().using('gist', t.geom)],
);

export const articles = pgTable(
  'articles',
  {
    id: id(),
    sourceId: ref()
      .notNull()
      .references(() => sources.id),
    sourceUrl: text().notNull(),
    title: text().notNull(),
    summary: text(),
    category: text().$type<ArticleCategory>().notNull().default('notice'),
    publishedAt: timestamptz().notNull(),
    ...collected,
    ...timestamps,
  },
  (t) => [uniqueIndex().on(t.sourceId, t.sourceUrl), index().on(t.publishedAt.desc())],
);

export const events = pgTable(
  'events',
  {
    id: id(),
    sourceId: ref()
      .notNull()
      .references(() => sources.id),
    sourceUrl: text().notNull(),
    title: text().notNull(),
    description: text().notNull().default(''),
    startsAt: timestamptz().notNull(),
    endsAt: timestamptz(),
    allDay: boolean().notNull().default(false),
    venueName: text().notNull(),
    address: text(),
    location: point(),
    areaId: ref().references(() => areas.id),
    category: text().$type<EventCategory>().notNull().default('other'),
    status: text().$type<EventStatus>().notNull().default('scheduled'),
    feeText: text(),
    organizer: text(),
    ...collected,
    mergedIntoId: ref().references((): AnyPgColumn => events.id),
    ...timestamps,
  },
  (t) => [
    uniqueIndex().on(t.sourceId, t.sourceUrl),
    index().on(t.startsAt),
    index().using('gist', t.location),
  ],
);

export const places = pgTable(
  'places',
  {
    id: id(),
    name: text().notNull(),
    kind: text().$type<PlaceKind>().notNull(),
    category: text().notNull().default(''),
    address: text(),
    location: point(),
    areaId: ref().references(() => areas.id),
    status: text().$type<PlaceStatus>().notNull().default('unknown'),
    openedOn: date({ mode: 'string' }),
    closedOn: date({ mode: 'string' }),
    websiteUrl: text(),
    sourceId: ref()
      .notNull()
      .references(() => sources.id),
    externalId: text().notNull(),
    osmId: bigint({ mode: 'number' }),
    corporateNumber: text(),
    // キーは表示名
    attributes: jsonb().$type<Record<string, string | number>>().notNull().default({}),
    ...timestamps,
  },
  (t) => [
    uniqueIndex().on(t.sourceId, t.externalId),
    index().on(t.kind, t.status),
    index().using('gist', t.location),
  ],
);

export const placeChanges = pgTable(
  'place_changes',
  {
    id: id(),
    placeId: ref().references(() => places.id),
    placeName: text().notNull(),
    changeType: text().$type<PlaceChangeType>().notNull(),
    effectiveOn: date({ mode: 'string' }),
    areaId: ref().references(() => areas.id),
    sourceUrl: text().notNull(),
    publishedAt: timestamptz().notNull(),
    note: text(),
    // 確認前は公開しない
    confirmed: boolean().notNull().default(false),
    ...timestamps,
  },
  (t) => [index().on(t.publishedAt.desc())],
);
