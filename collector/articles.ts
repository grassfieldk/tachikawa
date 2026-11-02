import { createHash } from 'node:crypto';
import { and, eq, inArray, sql } from 'drizzle-orm';
import type { Db } from '../db/client';
import { articles } from '../db/schema';
import type { ArticleCategory } from '../src/data/types';

export interface ArticleInput {
  sourceUrl: string;
  title: string;
  category: ArticleCategory;
  publishedAt: Date;
}

const hashOf = (a: ArticleInput) =>
  createHash('sha256')
    .update(JSON.stringify([a.title, a.category, a.publishedAt.toISOString()]))
    .digest('hex');

// 記事を登録し、新規または内容が変わった件数を返す
export async function saveArticles(db: Db, sourceId: number, items: ArticleInput[]): Promise<number> {
  const unique = [...new Map(items.map((a) => [a.sourceUrl, a])).values()];
  if (unique.length === 0) return 0;
  const now = new Date();
  const changed = await db
    .insert(articles)
    .values(unique.map((a) => ({ ...a, sourceId, contentHash: hashOf(a), lastSeenAt: now })))
    .onConflictDoUpdate({
      target: [articles.sourceId, articles.sourceUrl],
      set: {
        title: sql`excluded.title`,
        category: sql`excluded.category`,
        publishedAt: sql`excluded.published_at`,
        contentHash: sql`excluded.content_hash`,
        updatedAt: now,
      },
      setWhere: sql`articles.content_hash is distinct from excluded.content_hash`,
    })
    .returning({ id: articles.id });
  await db
    .update(articles)
    .set({ lastSeenAt: now })
    .where(
      and(
        eq(articles.sourceId, sourceId),
        inArray(
          articles.sourceUrl,
          unique.map((a) => a.sourceUrl),
        ),
      ),
    );
  return changed.length;
}
