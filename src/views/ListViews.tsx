// 一覧系のページ（お知らせ、イベント、開店・閉店、マップ、検索）
import { Anchor, Card, Grid, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import type { ReactNode } from 'react';
import ArticleTable from '../components/ArticleTable';
import ChangeTable from '../components/ChangeTable';
import EventCard from '../components/EventCard';
import FilterBar from '../components/FilterBar';
import MapView from '../components/MapView';
import PageTitle from '../components/PageTitle';
import PlaceCard from '../components/PlaceCard';
import { Page } from '../components/Providers';
import SearchForm from '../components/SearchForm';
import type { MapMarker, Place } from '../data/types';
import { PLACE_KINDS } from '../data/labels';
import { formatWhen } from '../lib/format';
import type { ArticleView, ChangeView, EventView } from '../lib/views';

type Fields = Parameters<typeof FilterBar>[0]['fields'];

// 左に本文、右に絞り込みを置く
function WithSidebar({ main, side }: { main: ReactNode; side: ReactNode }) {
  return (
    <Grid gap="xl">
      <Grid.Col span={{ base: 12, md: 8 }} order={{ base: 2, md: 1 }}>
        {main}
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }} order={{ base: 1, md: 2 }}>
        {side}
      </Grid.Col>
    </Grid>
  );
}

function Filters({ fields, search, count }: { fields: Fields; search: string; count: string }) {
  return (
    <Card withBorder>
      <FilterBar fields={fields} search={search} />
      <Text size="sm" c="dimmed" mt="sm">
        {count}
      </Text>
    </Card>
  );
}

export function NewsView({
  groups,
  total,
  fields,
  search,
}: {
  groups: { label: string; items: ArticleView[] }[];
  total: number;
  fields: Fields;
  search: string;
}) {
  return (
    <Page>
      <PageTitle title="お知らせ" crumbs={[{ label: 'お知らせ' }]} />
      <WithSidebar
        main={
          groups.length > 0 ? (
            groups.map((g) => (
              <Stack key={g.label} mb="xl" gap="xs">
                <Title order={2}>{g.label}</Title>
                <ArticleTable articles={g.items} showSummary />
              </Stack>
            ))
          ) : (
            <Text>該当するお知らせはありません</Text>
          )
        }
        side={<Filters fields={fields} search={search} count={`${total} 件`} />}
      />
    </Page>
  );
}

export function EventsView({ events, fields, search }: { events: EventView[]; fields: Fields; search: string }) {
  return (
    <Page>
      <PageTitle title="イベント" crumbs={[{ label: 'イベント' }]} />
      <WithSidebar
        main={
          events.length > 0 ? (
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              {events.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </SimpleGrid>
          ) : (
            <Text>条件に合うイベントはありません</Text>
          )
        }
        side={<Filters fields={fields} search={search} count={`${events.length} 件`} />}
      />
    </Page>
  );
}

export function ChangesView({ changes, fields, search }: { changes: ChangeView[]; fields: Fields; search: string }) {
  return (
    <Page>
      <PageTitle title="開店・閉店" crumbs={[{ label: '開店・閉店' }]} />
      <WithSidebar
        main={changes.length > 0 ? <ChangeTable changes={changes} /> : <Text>該当する情報はありません</Text>}
        side={
          <Stack>
            <Filters fields={fields} search={search} count={`${changes.length} 件`} />
            <Card withBorder>
              <Text fw={600} mb="xs">
                掲載基準
              </Text>
              <Text size="sm">
                公式発表、報道、法人登録の変更などで確認できたものを載せています。実際の変更より掲載が遅れることがあります。
              </Text>
              <Anchor href="/about#submit" size="sm" mt="xs" display="block">
                情報提供はこちら
              </Anchor>
            </Card>
          </Stack>
        }
      />
    </Page>
  );
}

export function MapPageView({
  markers,
  places,
  events,
  fields,
  search,
}: {
  markers: MapMarker[];
  places: Place[];
  events: EventView[];
  fields: Fields;
  search: string;
}) {
  return (
    <Page>
      <PageTitle title="マップ" crumbs={[{ label: 'マップ' }]} />
      <Grid gap="xl">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <MapView markers={markers} height={600} label="市内の施設とイベント会場の地図" />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack>
            <Filters fields={fields} search={search} count={`${markers.length} 件を表示中`} />
            {places.length > 0 && (
              <Card withBorder>
                <Text fw={600} mb="xs">
                  スポット
                </Text>
                <Stack gap={6}>
                  {places.map((p) => (
                    <Text key={p.id} size="sm">
                      <Anchor href={`/places/${p.id}`}>{p.name}</Anchor>{' '}
                      <Text span size="xs" c="dimmed">
                        {PLACE_KINDS[p.kind]}
                      </Text>
                    </Text>
                  ))}
                </Stack>
              </Card>
            )}
            {events.length > 0 && (
              <Card withBorder>
                <Text fw={600} mb="xs">
                  イベント（30 日以内）
                </Text>
                <Stack gap={6}>
                  {events.map((e) => (
                    <div key={e.id}>
                      <Anchor href={`/events/${e.id}`} size="sm">
                        {e.title}
                      </Anchor>
                      <Text size="xs" c="dimmed">
                        {formatWhen(e.startsAt, e.endsAt, e.allDay)}
                      </Text>
                    </div>
                  ))}
                </Stack>
              </Card>
            )}
          </Stack>
        </Grid.Col>
      </Grid>
    </Page>
  );
}

export function SearchView({
  q,
  articles,
  events,
  places,
}: {
  q: string;
  articles: ArticleView[];
  events: EventView[];
  places: Place[];
}) {
  const total = articles.length + events.length + places.length;
  return (
    <Page>
      <PageTitle title="検索" crumbs={[{ label: '検索' }]} />
      <Stack maw={640} mb="xl">
        <SearchForm value={q} />
        {q && (
          <Text c="dimmed" size="sm">
            {total > 0 ? `「${q}」の検索結果 ${total} 件` : `「${q}」に一致する情報は見つかりませんでした`}
          </Text>
        )}
      </Stack>
      {events.length > 0 && (
        <Stack mb="xl" gap="sm">
          <Title order={2}>イベント（{events.length}）</Title>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
            {events.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </SimpleGrid>
        </Stack>
      )}
      {places.length > 0 && (
        <Stack mb="xl" gap="sm">
          <Title order={2}>スポット（{places.length}）</Title>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
            {places.map((p) => (
              <PlaceCard key={p.id} place={p} />
            ))}
          </SimpleGrid>
        </Stack>
      )}
      {articles.length > 0 && (
        <Stack gap="sm">
          <Title order={2}>お知らせ（{articles.length}）</Title>
          <ArticleTable articles={articles} showSummary />
        </Stack>
      )}
    </Page>
  );
}
