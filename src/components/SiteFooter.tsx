import { Anchor, Container, Divider, SimpleGrid, Stack, Text } from '@mantine/core';
import { formatDateTime } from '../lib/format';
import Providers from './Providers';

const GROUPS = [
  {
    title: '最新情報',
    links: [
      { href: '/news', label: 'お知らせ' },
      { href: '/events', label: 'イベント' },
      { href: '/changes', label: '開店・閉店' },
    ],
  },
  {
    title: '街を知る',
    links: [
      { href: '/map', label: 'マップ' },
      { href: '/areas', label: '地区ガイド' },
      { href: '/history', label: '歴史' },
      { href: '/access', label: '交通' },
      { href: '/stats', label: '統計' },
    ],
  },
  {
    title: 'その他',
    links: [
      { href: '/life', label: '暮らし・行政' },
      { href: '/about', label: 'サイトについて' },
      { href: '/about#sources', label: '情報源' },
    ],
  },
];

interface Props {
  siteName: string;
  updated: Date | null;
}

export default function SiteFooter({ siteName, updated }: Props) {
  return (
    <Providers>
      <Divider mt="xl" />
      <Container component="footer" size="lg" py="xl">
        <SimpleGrid cols={{ base: 1, sm: 3 }} mb="lg">
          {GROUPS.map((g) => (
            <Stack key={g.title} gap={4}>
              <Text size="sm" fw={700}>
                {g.title}
              </Text>
              {g.links.map((l) => (
                <Anchor key={l.href} href={l.href} size="sm" c="dimmed">
                  {l.label}
                </Anchor>
              ))}
            </Stack>
          ))}
        </SimpleGrid>
        <Text size="xs" c="dimmed">
          {siteName}は個人が運営する非公式のサイトです。
          {updated && `データ最終更新 ${formatDateTime(updated)}。`}
          地図は<Anchor href="https://maps.gsi.go.jp/development/ichiran.html" size="xs">国土地理院</Anchor>
          のタイルを使用しています。
        </Text>
      </Container>
    </Providers>
  );
}
