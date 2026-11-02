// 詳細系のページ（イベント、スポット、地区）
import { Anchor, Badge, Button, Card, Grid, Group, SimpleGrid, Stack, Table, Text, Title } from '@mantine/core';
import type { ReactNode } from 'react';
import ChangeTable from '../components/ChangeTable';
import EventCard from '../components/EventCard';
import MapView from '../components/MapView';
import PageTitle from '../components/PageTitle';
import PlaceCard from '../components/PlaceCard';
import { Page } from '../components/Providers';
import SectionTitle from '../components/SectionTitle';
import type { AreaSummary, LngLat, MapMarker, Place } from '../data/types';
import { EVENT_CATEGORIES, EVENT_STATUS_LABELS, PLACE_KINDS, PLACE_STATUSES } from '../data/labels';
import { formatDate, formatWhen } from '../lib/format';
import type { ChangeView, EventView } from '../lib/views';

function Facts({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <Table withTableBorder variant="vertical" mb="lg">
      <Table.Tbody>
        {rows.map(([k, v]) => (
          <Table.Tr key={k}>
            <Table.Th w={120}>{k}</Table.Th>
            <Table.Td>{v}</Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}

function SideMap({ markers, center, label }: { markers: MapMarker[]; center: LngLat | null; label: string }) {
  return center ? (
    <MapView markers={markers} center={center} zoom={16} height={280} label={label} />
  ) : (
    <Text c="dimmed" size="sm">
      位置情報はありません
    </Text>
  );
}

const compact = <T,>(rows: (T | false | null)[]) => rows.filter(Boolean) as T[];

export function EventDetailView({
  event,
  markers,
  nearby,
}: {
  event: EventView;
  markers: MapMarker[];
  nearby: EventView[];
}) {
  const status = EVENT_STATUS_LABELS[event.status];
  const isExternal = event.sourceUrl.startsWith('http');
  return (
    <Page>
      <PageTitle title={event.title} crumbs={[{ label: 'イベント', href: '/events' }, { label: event.title }]} />
      <Grid gap="xl">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Group gap="xs" mb="md">
            <Badge variant="light">{EVENT_CATEGORIES[event.category]}</Badge>
            {event.ongoing && <Badge color="green">開催中</Badge>}
            {status && <Badge color={event.status === 'cancelled' ? 'red' : 'yellow'}>{status}</Badge>}
          </Group>
          {status && (
            <Text c="dimmed" size="sm" mb="sm">
              最新の情報は主催者の案内を確認してください。
            </Text>
          )}
          <Text mb="lg">{event.description}</Text>
          <Facts
            rows={compact<[string, ReactNode]>([
              ['日時', formatWhen(event.startsAt, event.endsAt, event.allDay)],
              ['会場', event.venueName],
              !!event.area && ['地区', <Anchor href={`/areas/${event.area.code}`}>{event.area.name}</Anchor>],
              !!event.feeText && ['参加費', event.feeText],
              !!event.organizer && ['主催', event.organizer],
              ['出典', event.sourceName],
            ])}
          />
          <Button
            component="a"
            href={event.sourceUrl}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
          >
            出典元のページを開く
          </Button>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack>
            <SideMap markers={markers} center={event.location} label={`${event.venueName}の地図`} />
            {nearby.length > 0 && (
              <Card withBorder>
                <Text fw={600} mb="xs">
                  {event.area ? `${event.area.name}のイベント` : 'ほかのイベント'}
                </Text>
                <Stack gap={6}>
                  {nearby.map((e) => (
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

export function PlaceDetailView({
  place,
  markers,
  changes,
  nearby,
}: {
  place: Place;
  markers: MapMarker[];
  changes: ChangeView[];
  nearby: Place[];
}) {
  return (
    <Page>
      <PageTitle title={place.name} crumbs={[{ label: 'マップ', href: '/map' }, { label: place.name }]} />
      <Grid gap="xl">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Group gap="xs" mb="md">
            <Badge variant="light" color="gray">
              {PLACE_KINDS[place.kind]}
            </Badge>
            {place.status !== 'open' && <Badge color="yellow">{PLACE_STATUSES[place.status]}</Badge>}
          </Group>
          <Facts
            rows={compact<[string, ReactNode]>([
              ['分類', place.category],
              place.kind !== 'shelter' && ['状態', PLACE_STATUSES[place.status]],
              !!place.address && ['住所', place.address],
              !!place.area && ['地区', <Anchor href={`/areas/${place.area.code}`}>{place.area.name}</Anchor>],
              !!place.openedOn && ['開店', formatDate(place.openedOn)],
              !!place.closedOn && ['閉店', formatDate(place.closedOn)],
              ...Object.entries(place.attributes).map(([k, v]): [string, ReactNode] => [k, v]),
            ])}
          />
          {place.kind === 'shelter' && (
            <Text size="sm" c="dimmed" mb="md">
              出典: 国土地理院 指定緊急避難場所・指定避難所データ。最新でない場合があるため、詳しくは立川市に確認してください。指定緊急避難場所は災害の種類ごとに指定されています。
            </Text>
          )}
          {place.websiteUrl && (
            <Button component="a" href={place.websiteUrl} variant="default" target="_blank" rel="noopener noreferrer">
              公式サイト
            </Button>
          )}
          {changes.length > 0 && (
            <Stack mt="xl" gap="sm">
              <Title order={2}>開店・閉店の情報</Title>
              <ChangeTable changes={changes} />
            </Stack>
          )}
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack>
            <SideMap markers={markers} center={place.location} label={`${place.name}の地図`} />
            {nearby.length > 0 && (
              <Card withBorder>
                <Text fw={600} mb="xs">
                  {place.area ? `${place.area.name}のスポット` : 'ほかのスポット'}
                </Text>
                <Stack gap={6}>
                  {nearby.map((p) => (
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
          </Stack>
        </Grid.Col>
      </Grid>
    </Page>
  );
}

export function AreasView({ areas, markers }: { areas: AreaSummary[]; markers: MapMarker[] }) {
  return (
    <Page>
      <PageTitle title="地区ガイド" crumbs={[{ label: '街を知る', href: '/town' }, { label: '地区ガイド' }]} />
      <MapView markers={markers} height={360} label="地区の位置" />
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} mt="xl">
        {areas.map((a) => (
          <Card key={a.code} withBorder>
            <Anchor href={`/areas/${a.code}`} fw={600}>
              {a.name}
            </Anchor>
            <Text size="sm" mt={4}>
              {a.summary}
            </Text>
            <Group gap={4} mt="sm">
              {a.features.map((f) => (
                <Badge key={f} variant="light" color="gray" size="sm">
                  {f}
                </Badge>
              ))}
            </Group>
            <Text size="xs" c="dimmed" mt="sm">
              スポット {a.placeCount} 件 / イベント {a.upcomingEventCount} 件
            </Text>
          </Card>
        ))}
      </SimpleGrid>
    </Page>
  );
}

export function AreaDetailView({
  area,
  events,
  places,
  markers,
}: {
  area: { code: string; name: string; summary: string; features: string[]; center: LngLat };
  events: EventView[];
  places: Place[];
  markers: MapMarker[];
}) {
  return (
    <Page>
      <PageTitle
        title={area.name}
        crumbs={[{ label: '街を知る', href: '/town' }, { label: '地区ガイド', href: '/areas' }, { label: area.name }]}
      />
      <Grid gap="xl">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Text mb="xl">{area.summary}</Text>
          <SectionTitle title="これからのイベント" href={`/events?area=${area.code}`} />
          {events.length > 0 ? (
            <SimpleGrid cols={{ base: 1, sm: 2 }} mb="xl">
              {events.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </SimpleGrid>
          ) : (
            <Text mb="xl">予定されているイベントはありません</Text>
          )}
          <SectionTitle title="スポット" />
          {places.length > 0 ? (
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              {places.map((p) => (
                <PlaceCard key={p.id} place={p} />
              ))}
            </SimpleGrid>
          ) : (
            <Text>登録されているスポットはありません</Text>
          )}
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack>
            <MapView markers={markers} center={area.center} zoom={15} height={320} label={`${area.name}の地図`} />
            <Group gap={4}>
              {area.features.map((f) => (
                <Badge key={f} variant="light" color="gray">
                  {f}
                </Badge>
              ))}
            </Group>
          </Stack>
        </Grid.Col>
      </Grid>
    </Page>
  );
}
