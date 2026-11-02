// 立川市公式サイトの新着情報（RSS 2.0）
import { XMLParser } from 'fast-xml-parser';
import type { ArticleCategory } from '../../src/data/types';
import { type ArticleInput, saveArticles } from '../articles';
import { fetchText } from '../http';
import type { SourceDefinition } from '../source';

const SITE_URL = 'https://www.city.tachikawa.lg.jp/';
const FEED_URL = `${SITE_URL}news.rss`;

// URL の最初の階層と分類の対応。ない階層は notice
const CATEGORY_BY_SECTION: Record<string, ArticleCategory> = {
  bosai: 'safety',
  kurashi: 'life',
  kenko: 'welfare',
  kosodate: 'kids',
  shisei: 'city',
  shigikai: 'city',
};

interface FeedItem {
  title?: string;
  link?: string;
  pubDate?: string;
}

function toArticle(item: FeedItem): ArticleInput | null {
  const title = item.title?.trim() ?? '';
  const link = item.link?.trim() ?? '';
  const publishedAt = new Date(item.pubDate ?? '');
  if (!title || !link.startsWith(SITE_URL) || Number.isNaN(publishedAt.getTime())) return null;
  const section = new URL(link).pathname.split('/')[1];
  return { sourceUrl: link, title, publishedAt, category: CATEGORY_BY_SECTION[section] ?? 'notice' };
}

export const cityNews: SourceDefinition = {
  slug: 'city-news',
  name: '立川市 新着情報',
  kind: 'rss',
  url: FEED_URL,
  intervalMinutes: 1440,
  termsNote: '文章と画像の無断転載は禁止。リンクはトップページへ張るよう求めている。見出し、公開日時、URL だけを掲載する',
  termsCheckedOn: '2026-11-02',
  async collect(db, sourceId) {
    const parser = new XMLParser({ parseTagValue: false, htmlEntities: true, isArray: (name) => name === 'item' });
    const items: FeedItem[] = parser.parse(await fetchText(FEED_URL))?.rss?.channel?.item ?? [];
    if (items.length === 0) throw new Error('RSS に記事がありません');
    const parsed = items.map(toArticle).filter((a) => a !== null);
    const skipped = items.length - parsed.length;
    return {
      seen: items.length,
      changed: await saveArticles(db, sourceId, parsed),
      warning: skipped > 0 ? `${skipped} 件は見出し、URL、日時のいずれかを読み取れなかった` : undefined,
    };
  },
};
