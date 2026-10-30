import { Anchor, Badge, Table, Text } from '@mantine/core';
import { ARTICLE_CATEGORIES } from '../data/labels';
import { formatDate } from '../lib/format';
import type { ArticleView } from '../lib/views';

interface Props {
  articles: ArticleView[];
  showSummary?: boolean;
}

const isExternal = (href: string) => href.startsWith('http');

export default function ArticleTable({ articles, showSummary = false }: Props) {
  return (
    <Table.ScrollContainer minWidth={560}>
      <Table highlightOnHover verticalSpacing="sm">
        <Table.Tbody>
          {articles.map((a) => (
            <Table.Tr key={a.id}>
              <Table.Td w={110} c="dimmed" fz="sm">
                {formatDate(a.publishedAt)}
              </Table.Td>
              <Table.Td w={120}>
                <Badge variant="light" color={a.category === 'safety' ? 'red' : 'blue'}>
                  {ARTICLE_CATEGORIES[a.category]}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Anchor
                  href={a.sourceUrl}
                  target={isExternal(a.sourceUrl) ? '_blank' : undefined}
                  rel={isExternal(a.sourceUrl) ? 'noopener noreferrer' : undefined}
                >
                  {a.title}
                </Anchor>
                {showSummary && a.summary && (
                  <Text size="sm" c="dimmed">
                    {a.summary}
                  </Text>
                )}
                {a.sourceName && (
                  <Text size="xs" c="dimmed">
                    {a.sourceName}
                  </Text>
                )}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
