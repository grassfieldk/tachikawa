// 画面に渡す形へデータを整える。サーバー側でだけ使う
// 現在時刻に依存する判定をここで済ませ、ブラウザ側では計算しない
import type { Article, EventItem, Place, PlaceChange, Source } from '../data/types';
import { timeAgo } from './format';

export interface EventView extends EventItem {
  ongoing: boolean;
}

export type PlaceView = Place;

export interface ArticleView extends Article {
  ago: string;
}

export interface ChangeView extends PlaceChange {
  future: boolean;
}

export interface SourceView extends Source {
  ago: string | null;
}

export function eventView(e: EventItem, now = new Date()): EventView {
  const t = now.getTime();
  return {
    ...e,
    ongoing:
      e.status === 'scheduled' && e.startsAt.getTime() <= t && (e.endsAt ?? e.startsAt).getTime() >= t,
  };
}

export function placeView(p: Place): PlaceView {
  return p;
}

export function articleView(a: Article, now = new Date()): ArticleView {
  return { ...a, ago: timeAgo(a.publishedAt, now) };
}

export function changeView(c: PlaceChange, now = new Date()): ChangeView {
  return { ...c, future: c.effectiveOn !== null && c.effectiveOn.getTime() > now.getTime() };
}

export function sourceView(s: Source, now = new Date()): SourceView {
  return { ...s, ago: s.lastSuccessAt ? timeAgo(s.lastSuccessAt, now) : null };
}
