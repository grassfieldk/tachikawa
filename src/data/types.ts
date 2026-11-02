// 画面で扱うデータの型。列の意味は docs/database.md を参照

// 経度, 緯度
export type LngLat = [number, number];

export type SourceKind = 'rss' | 'html' | 'api' | 'file' | 'manual';
export type FetchStatus = 'success' | 'partial' | 'failed';

export interface Source {
  id: number;
  slug: string;
  name: string;
  kind: SourceKind;
  url: string | null;
  intervalMinutes: number;
  // 収集を一度も終えていなければ null
  lastStatus: FetchStatus | null;
  lastSuccessAt: Date | null;
  termsCheckedOn: Date | null;
}

export interface Area {
  id: number;
  code: string;
  name: string;
  summary: string;
  features: string[];
  center: LngLat;
}

export interface AreaRef {
  code: string;
  name: string;
}

export interface AreaSummary extends Area {
  placeCount: number;
  upcomingEventCount: number;
}

export type ArticleCategory = 'notice' | 'safety' | 'life' | 'welfare' | 'kids' | 'city';

export interface Article {
  id: number;
  sourceId: number;
  sourceName: string;
  sourceUrl: string;
  title: string;
  summary: string | null;
  category: ArticleCategory;
  publishedAt: Date;
}

export type EventCategory = 'festival' | 'market' | 'sports' | 'culture' | 'kids' | 'learning' | 'other';
export type EventStatus = 'scheduled' | 'cancelled' | 'postponed';

export interface EventItem {
  id: number;
  sourceId: number;
  sourceName: string;
  sourceUrl: string;
  title: string;
  description: string;
  startsAt: Date;
  endsAt: Date | null;
  allDay: boolean;
  venueName: string;
  address: string | null;
  location: LngLat | null;
  areaId: number | null;
  area: AreaRef | null;
  category: EventCategory;
  status: EventStatus;
  feeText: string | null;
  organizer: string | null;
}

export type PlaceKind = 'shop' | 'restaurant' | 'facility' | 'shelter' | 'park' | 'station';
export type PlaceStatus = 'open' | 'closed' | 'planned' | 'unknown';

export interface Place {
  id: number;
  name: string;
  kind: PlaceKind;
  category: string;
  address: string | null;
  location: LngLat | null;
  areaId: number | null;
  area: AreaRef | null;
  status: PlaceStatus;
  openedOn: Date | null;
  closedOn: Date | null;
  websiteUrl: string | null;
  // 避難所の収容人数など、種別ごとの項目（キーは表示名）
  attributes: Record<string, string | number>;
}

export type PlaceChangeType = 'open' | 'close' | 'relocate' | 'renovate';

export interface PlaceChange {
  id: number;
  // 未登録の店は null
  placeId: number | null;
  placeName: string;
  changeType: PlaceChangeType;
  effectiveOn: Date | null;
  areaId: number | null;
  area: AreaRef | null;
  sourceUrl: string;
  publishedAt: Date;
  note: string | null;
}

export interface MapMarker {
  id: string;
  lng: number;
  lat: number;
  title: string;
  subtitle: string | null;
  href: string;
  kind: PlaceKind | 'event' | 'area';
}
