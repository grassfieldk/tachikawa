// 画面に渡す形へデータを整える。サーバー側でだけ使う
// 地区名や情報源名の参照と、現在時刻に依存する判定をここで済ませ、ブラウザ側では計算しない
import { areaOf, sourceOf } from '../data';
import type { Article, EventItem, Place, PlaceChange, Source } from '../data/types';
import { timeAgo } from './format';

export interface AreaRef {
  code: string;
  name: string;
}

export interface EventView extends EventItem {
  area: AreaRef | null;
  sourceName: string | null;
  ongoing: boolean;
}

export interface PlaceView extends Place {
  area: AreaRef | null;
}

export interface ArticleView extends Article {
  sourceName: string | null;
  ago: string;
}

export interface ChangeView extends PlaceChange {
  area: AreaRef | null;
  future: boolean;
}

export interface SourceView extends Source {
  ago: string | null;
}

function areaRef(areaId: number | null): AreaRef | null {
  const a = areaOf(areaId);
  return a ? { code: a.code, name: a.name } : null;
}

export function eventView(e: EventItem, now = new Date()): EventView {
  const t = now.getTime();
  return {
    ...e,
    area: areaRef(e.areaId),
    sourceName: sourceOf(e.sourceId)?.name ?? null,
    ongoing:
      e.status === 'scheduled' && e.startsAt.getTime() <= t && (e.endsAt ?? e.startsAt).getTime() >= t,
  };
}

export function placeView(p: Place): PlaceView {
  return { ...p, area: areaRef(p.areaId) };
}

export function articleView(a: Article, now = new Date()): ArticleView {
  return { ...a, sourceName: sourceOf(a.sourceId)?.name ?? null, ago: timeAgo(a.publishedAt, now) };
}

export function changeView(c: PlaceChange, now = new Date()): ChangeView {
  return {
    ...c,
    area: areaRef(c.areaId),
    future: c.effectiveOn !== null && c.effectiveOn.getTime() > now.getTime(),
  };
}

export function sourceView(s: Source, now = new Date()): SourceView {
  return { ...s, ago: s.lastSuccessAt ? timeAgo(s.lastSuccessAt, now) : null };
}
