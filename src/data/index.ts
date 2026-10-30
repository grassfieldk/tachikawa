// データの取り出し口。DB に切り替えるときはこのファイルの中身だけ差し替える
import { addDays, startOfJstDay, thisWeekendRange } from '../lib/dates';
import { areas, articles, changes, events, places, sources } from './dummy';
import type {
  Area,
  AreaSummary,
  Article,
  ArticleCategory,
  EventCategory,
  EventItem,
  Place,
  PlaceChange,
  PlaceChangeType,
  PlaceKind,
  Source,
} from './types';

export type EventWhen = 'today' | 'weekend' | 'week' | 'month' | 'upcoming' | 'past';

const limited = <T>(items: T[], limit?: number) => (limit === undefined ? items : items.slice(0, limit));

// 地区の指定がないときは undefined、存在しない地区なら null
function areaIdOf(areaSlug?: string): number | null | undefined {
  if (areaSlug === undefined) return undefined;
  return areas.find((a) => a.code === areaSlug)?.id ?? null;
}

// 終了日時がないイベントは、終日ならその日の終わり、それ以外は開始時刻で終わったものとみなす
function endOf(e: EventItem): Date {
  if (e.endsAt) return e.endsAt;
  return e.allDay ? addDays(startOfJstDay(e.startsAt), 1) : e.startsAt;
}

const overlaps = (e: EventItem, from: Date, to: Date) =>
  e.startsAt.getTime() < to.getTime() && endOf(e).getTime() >= from.getTime();

function matchesWhen(e: EventItem, when: EventWhen, now: Date): boolean {
  switch (when) {
    case 'today': {
      const today = startOfJstDay(now);
      return overlaps(e, today, addDays(today, 1));
    }
    case 'weekend': {
      const [from, to] = thisWeekendRange();
      return overlaps(e, from, to);
    }
    case 'week':
      return overlaps(e, now, addDays(now, 7));
    case 'month':
      return overlaps(e, now, addDays(now, 30));
    case 'upcoming':
      return endOf(e).getTime() >= now.getTime();
    case 'past':
      return endOf(e).getTime() < now.getTime();
  }
}

export function areaOf(areaId: number | null): Area | undefined {
  return areaId === null ? undefined : areas.find((a) => a.id === areaId);
}

export function sourceOf(sourceId: number): Source | undefined {
  return sources.find((s) => s.id === sourceId);
}

export async function listEvents(
  opts: { when?: EventWhen; category?: EventCategory; areaSlug?: string; limit?: number } = {},
): Promise<EventItem[]> {
  const { when = 'upcoming', category, limit } = opts;
  const areaId = areaIdOf(opts.areaSlug);
  const now = new Date();
  const items = events
    .filter((e) => matchesWhen(e, when, now))
    .filter((e) => !category || e.category === category)
    .filter((e) => areaId === undefined || e.areaId === areaId)
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  if (when === 'past') items.reverse();
  return limited(items, limit);
}

export async function getEvent(id: number): Promise<EventItem | null> {
  return events.find((e) => e.id === id) ?? null;
}

export async function listArticles(
  opts: { category?: ArticleCategory; limit?: number } = {},
): Promise<Article[]> {
  const items = articles
    .filter((a) => !opts.category || a.category === opts.category)
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  return limited(items, opts.limit);
}

export async function listChanges(
  opts: { type?: PlaceChangeType; limit?: number } = {},
): Promise<PlaceChange[]> {
  const items = changes
    .filter((c) => !opts.type || c.changeType === opts.type)
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  return limited(items, opts.limit);
}

export async function listPlaces(opts: { kind?: PlaceKind; areaSlug?: string } = {}): Promise<Place[]> {
  const areaId = areaIdOf(opts.areaSlug);
  return places
    .filter((p) => !opts.kind || p.kind === opts.kind)
    .filter((p) => areaId === undefined || p.areaId === areaId);
}

export async function getPlace(id: number): Promise<Place | null> {
  return places.find((p) => p.id === id) ?? null;
}

export async function listAreas(): Promise<AreaSummary[]> {
  const now = new Date();
  return areas.map((a) => ({
    ...a,
    placeCount: places.filter((p) => p.areaId === a.id).length,
    upcomingEventCount: events.filter((e) => e.areaId === a.id && matchesWhen(e, 'upcoming', now)).length,
  }));
}

export async function getArea(code: string): Promise<Area | null> {
  return areas.find((a) => a.code === code) ?? null;
}

export async function listSources(): Promise<Source[]> {
  return sources;
}

// 情報源のうち、最後に収集に成功した日時
export async function lastUpdatedAt(): Promise<Date | null> {
  const times = sources.flatMap((s) => (s.lastSuccessAt ? [s.lastSuccessAt.getTime()] : []));
  return times.length > 0 ? new Date(Math.max(...times)) : null;
}

export async function search(
  q: string,
): Promise<{ articles: Article[]; events: EventItem[]; places: Place[] }> {
  const word = q.trim().toLowerCase();
  if (!word) return { articles: [], events: [], places: [] };
  const hit = (...texts: (string | null)[]) => texts.some((t) => t?.toLowerCase().includes(word));
  return {
    articles: (await listArticles()).filter((a) => hit(a.title, a.summary)),
    events: events
      .filter((e) => hit(e.title, e.description, e.venueName, e.organizer))
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime()),
    places: places.filter((p) => hit(p.name, p.category, p.address)),
  };
}
