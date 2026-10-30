import type {
  ArticleCategory,
  EventCategory,
  EventStatus,
  FetchStatus,
  PlaceChangeType,
  PlaceKind,
  PlaceStatus,
  SourceKind,
} from './types';

export const ARTICLE_CATEGORIES: Record<ArticleCategory, string> = {
  notice: 'お知らせ',
  safety: '防災・防犯',
  life: 'くらし',
  welfare: '健康・福祉',
  kids: '子育て・教育',
  city: '市政',
};

export const EVENT_CATEGORIES: Record<EventCategory, string> = {
  festival: 'まつり',
  market: 'マルシェ',
  sports: 'スポーツ',
  culture: '文化・芸術',
  kids: '子ども向け',
  learning: '講座',
  other: 'その他',
};

// 予定どおりのイベントには状態を表示しない
export const EVENT_STATUS_LABELS: Partial<Record<EventStatus, string>> = {
  cancelled: '中止',
  postponed: '延期',
};

export const PLACE_KINDS: Record<PlaceKind, string> = {
  shop: 'お店',
  restaurant: '飲食店',
  facility: '公共施設',
  shelter: '避難所',
  park: '公園',
  station: '駅',
};

export const PLACE_STATUSES: Record<PlaceStatus, string> = {
  open: '営業中',
  closed: '閉店',
  planned: '開店予定',
  unknown: '状況不明',
};

export const CHANGE_TYPES: Record<PlaceChangeType, string> = {
  open: '開店',
  close: '閉店',
  relocate: '移転',
  renovate: '改装',
};

export const SOURCE_KINDS: Record<SourceKind, string> = {
  rss: 'RSS',
  html: 'ページ巡回',
  api: 'API',
  manual: '手入力・投稿',
};

export const FETCH_STATUSES: Record<FetchStatus, string> = {
  success: '正常',
  partial: '一部のみ',
  failed: '失敗',
};
