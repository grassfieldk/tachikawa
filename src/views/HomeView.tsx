import { Alert, Anchor, Card, Grid, SimpleGrid, Stack, Text } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import ArticleTable from '../components/ArticleTable';
import ChangeTable from '../components/ChangeTable';
import EventCard from '../components/EventCard';
import MapView from '../components/MapView';
import { Page } from '../components/Providers';
import SearchForm from '../components/SearchForm';
import SectionTitle from '../components/SectionTitle';
import type { MapMarker } from '../data/types';
import { FETCH_STATUSES } from '../data/labels';
import type { ArticleView, ChangeView, EventView, SourceView } from '../lib/views';

interface Props {
  today: string;
  todayCount: number;
  weekEvents: EventView[];
  articles: ArticleView[];
  alerts: ArticleView[];
  changes: ChangeView[];
  failedSources: SourceView[];
  updated: string | null;
  markers: MapMarker[];
}

const TOWN = [
  { href: '/areas', title: '地区ガイド', text: '町ごとの概要、施設、イベント' },
  { href: '/history', title: '歴史', text: '鉄道の開業から現在までの年表' },
  { href: '/access', title: '交通', text: '鉄道、モノレール、バス、道路' },
  { href: '/stats', title: '統計', text: '人口、世帯数、年齢構成' },
];

export default function HomeView(p: Props) {
  return (
    <Page>
      {p.alerts.length > 0 && (
        <Alert color="red" icon={<IconAlertTriangle />} title="注意情報" mb="xl">
          <Stack gap={4}>
            {p.alerts.map((a) => (
              <Text key={a.id} size="sm">
                <Anchor href={a.sourceUrl}>{a.title}</Anchor>{' '}
                <Text span size="xs" c="dimmed">
                  {a.ago}
                </Text>
              </Text>
            ))}
          </Stack>
        </Alert>
      )}

      <Grid gap="xl">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <SectionTitle title="今週のイベント" href="/events" linkLabel="イベント一覧" />
          <Text size="sm" c="dimmed" mb="sm">
            {p.today} / 今日 {p.todayCount} 件
          </Text>
          {p.weekEvents.length > 0 ? (
            <SimpleGrid cols={{ base: 1, sm: 2 }} mb="xl">
              {p.weekEvents.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </SimpleGrid>
          ) : (
            <Text mb="xl">今後 7 日間のイベントはありません</Text>
          )}

          <SectionTitle title="お知らせ" href="/news" />
          <ArticleTable articles={p.articles} />
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="xl">
            <SearchForm />

            <Card withBorder>
              <SectionTitle title="開店・閉店" href="/changes" order={3} />
              <ChangeTable changes={p.changes} compact />
            </Card>

            <Card withBorder>
              <SectionTitle title="更新状況" href="/about#sources" linkLabel="詳細" order={3} />
              <Text size="sm">最終更新日時: {p.updated ?? '-'}</Text>
              {p.failedSources.length > 0 && (
                <Stack gap={4} mt="sm">
                  <Text size="sm" c="red">
                    次の情報源から取得できていません
                  </Text>
                  {p.failedSources.map((s) => (
                    <Text key={s.id} size="sm">
                      {s.name}{s.lastStatus && `（${FETCH_STATUSES[s.lastStatus]}）`}
                    </Text>
                  ))}
                </Stack>
              )}
            </Card>
          </Stack>
        </Grid.Col>
      </Grid>

      <SectionTitle title="マップ" href="/map" linkLabel="マップを開く" />
      <MapView markers={p.markers} height={400} label="今週のイベント会場と主要施設の地図" />

      <Stack mt="xl">
        <SectionTitle title="街を知る" href="/town" linkLabel="一覧" />
      </Stack>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
        {TOWN.map((t) => (
          <Card key={t.href} withBorder component="a" href={t.href}>
            <Text fw={600}>{t.title}</Text>
            <Text size="sm" c="dimmed">
              {t.text}
            </Text>
          </Card>
        ))}
      </SimpleGrid>
    </Page>
  );
}
