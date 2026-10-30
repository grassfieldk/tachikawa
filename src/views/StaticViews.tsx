// 内容がほぼ固定のページ（街を知る、暮らし・行政、交通、歴史、統計、サイトについて、404）
import {
  Alert,
  Anchor,
  Badge,
  Button,
  Card,
  Grid,
  Group,
  Paper,
  Progress,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Textarea,
  TextInput,
  Timeline,
  Title,
} from '@mantine/core';
import PageTitle from '../components/PageTitle';
import { Page } from '../components/Providers';
import { FETCH_STATUSES, SOURCE_KINDS } from '../data/labels';
import { formatDate, formatDateTime } from '../lib/format';
import type { SourceView } from '../lib/views';

function DummyNote({ children }: { children: string }) {
  return (
    <Text size="sm" c="dimmed" mb="lg">
      {children}
    </Text>
  );
}

export function TownView({ items }: { items: { href: string; title: string; text: string }[] }) {
  return (
    <Page>
      <PageTitle title="街を知る" crumbs={[{ label: '街を知る' }]} />
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
        {items.map((i) => (
          <Card key={i.href} withBorder component="a" href={i.href}>
            <Text fw={600}>{i.title}</Text>
            <Text size="sm" c="dimmed">
              {i.text}
            </Text>
          </Card>
        ))}
      </SimpleGrid>
    </Page>
  );
}

export function LifeView({ groups }: { groups: { id: string; title: string; links: string[] }[] }) {
  return (
    <Page>
      <PageTitle title="暮らし・行政" crumbs={[{ label: '暮らし・行政' }]} />
      <DummyNote>リンク先はダミーです。公開時は市の公式ページに差し替えます。</DummyNote>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
        {groups.map((g) => (
          <Card key={g.id} id={g.id} withBorder>
            <Text fw={600} mb="xs">
              {g.title}
            </Text>
            <Stack gap={4}>
              {g.links.map((l) => (
                <Anchor key={l} href="#" size="sm">
                  {l}
                </Anchor>
              ))}
            </Stack>
          </Card>
        ))}
      </SimpleGrid>
    </Page>
  );
}

export function AccessView({
  modes,
}: {
  modes: { name: string; text: string; stops: string[]; source: string }[];
}) {
  return (
    <Page>
      <PageTitle title="交通" crumbs={[{ label: '街を知る', href: '/town' }, { label: '交通' }]} />
      <DummyNote>この内容はダミーです。</DummyNote>
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        {modes.map((m) => (
          <Card key={m.name} withBorder>
            <Text fw={600}>{m.name}</Text>
            <Text size="sm" my="xs">
              {m.text}
            </Text>
            <Group gap={4}>
              {m.stops.map((s) => (
                <Badge key={s} variant="light" color="gray">
                  {s}
                </Badge>
              ))}
            </Group>
            <Text size="xs" c="dimmed" mt="sm">
              データ元: {m.source}
            </Text>
          </Card>
        ))}
      </SimpleGrid>
    </Page>
  );
}

export function HistoryView({
  eras,
}: {
  eras: { name: string; entries: { year: string; title: string; body: string; photo?: string }[] }[];
}) {
  return (
    <Page>
      <PageTitle title="歴史" crumbs={[{ label: '街を知る', href: '/town' }, { label: '歴史' }]} />
      <DummyNote>この年表はダミーです。公開前に出典と照合して書き直します。</DummyNote>
      <Grid gap="xl">
        <Grid.Col span={{ base: 12, md: 8 }}>
          {eras.map((era) => (
            <Stack key={era.name} mb="xl">
              <Title order={2}>{era.name}</Title>
              <Timeline bulletSize={14} lineWidth={2}>
                {era.entries.map((e) => (
                  <Timeline.Item key={e.year} title={`${e.year}: ${e.title}`}>
                    <Text size="sm">{e.body}</Text>
                    {e.photo && (
                      <Text size="xs" c="dimmed">
                        写真: {e.photo}（準備中）
                      </Text>
                    )}
                  </Timeline.Item>
                ))}
              </Timeline>
            </Stack>
          ))}
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder>
            <Text fw={600} mb="xs">
              空中写真の比較
            </Text>
            <Text size="sm">国土地理院の過去の空中写真と現在の地図を並べて表示する予定です。</Text>
          </Card>
        </Grid.Col>
      </Grid>
    </Page>
  );
}

type Series = { label: string; value: number }[];

function SeriesTable({ title, data, unit }: { title: string; data: Series; unit: string }) {
  return (
    <Card withBorder>
      <Text fw={600} mb="xs">
        {title}
      </Text>
      <Table striped>
        <Table.Tbody>
          {data.map((d) => (
            <Table.Tr key={d.label}>
              <Table.Td>{d.label}</Table.Td>
              <Table.Td ta="right">
                {d.value.toLocaleString('ja-JP')} {unit}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      <Text size="xs" c="dimmed" mt="xs">
        各年 10 月 1 日時点
      </Text>
    </Card>
  );
}

export function StatsView({
  figures,
  population,
  households,
  ages,
}: {
  figures: { label: string; value: string }[];
  population: Series;
  households: Series;
  ages: Series;
}) {
  return (
    <Page>
      <PageTitle title="統計" crumbs={[{ label: '街を知る', href: '/town' }, { label: '統計' }]} />
      <DummyNote>数値はすべてダミーです。公開時は e-Stat（政府統計の総合窓口）のデータを使います。</DummyNote>
      <SimpleGrid cols={{ base: 2, md: 4 }} mb="xl">
        {figures.map((f) => (
          <Paper key={f.label} withBorder p="md">
            <Text size="sm" c="dimmed">
              {f.label}
            </Text>
            <Text fz="xl" fw={700}>
              {f.value}
            </Text>
          </Paper>
        ))}
      </SimpleGrid>
      <SimpleGrid cols={{ base: 1, md: 3 }}>
        <SeriesTable title="人口" data={population} unit="人" />
        <SeriesTable title="世帯数" data={households} unit="世帯" />
        <Card withBorder>
          <Text fw={600} mb="xs">
            年齢構成
          </Text>
          <Stack gap="sm">
            {ages.map((a) => (
              <div key={a.label}>
                <Group justify="space-between">
                  <Text size="sm">{a.label}</Text>
                  <Text size="sm">{a.value}%</Text>
                </Group>
                <Progress value={a.value} />
              </div>
            ))}
          </Stack>
        </Card>
      </SimpleGrid>
    </Page>
  );
}

const INTERVAL = (min: number) => {
  if (min === 0) return '随時';
  if (min < 60) return `${min} 分ごと`;
  if (min < 1440) return `${min / 60} 時間ごと`;
  return `${Math.round(min / 1440)} 日ごと`;
};

const STATUS_COLOR = { success: 'green', partial: 'yellow', failed: 'red' } as const;

export function AboutView({ sources }: { sources: SourceView[] }) {
  return (
    <Page>
      <PageTitle title="サイトについて" crumbs={[{ label: 'サイトについて' }]} />
      <Grid gap="xl">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Stack mb="xl">
            <Text>
              立川市の公式情報、イベント、お店の開店・閉店などを集めた非公式のサイトです。各情報には出典元へのリンクを付けています。
            </Text>
            <Text>
              自動で集めた情報を含むため、実際の内容と異なる場合があります。日時や場所は出典元で確認してください。
            </Text>
          </Stack>
          <Title order={2} id="sources" mb="sm">
            情報源と更新状況
          </Title>
          <Table.ScrollContainer minWidth={720}>
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>情報源</Table.Th>
                  <Table.Th>取得方法</Table.Th>
                  <Table.Th>間隔</Table.Th>
                  <Table.Th>状態</Table.Th>
                  <Table.Th>最終取得</Table.Th>
                  <Table.Th>規約の確認</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {sources.map((s) => (
                  <Table.Tr key={s.id}>
                    <Table.Td fw={600}>{s.name}</Table.Td>
                    <Table.Td>{SOURCE_KINDS[s.kind]}</Table.Td>
                    <Table.Td>{INTERVAL(s.intervalMinutes)}</Table.Td>
                    <Table.Td>
                      <Badge variant="dot" color={STATUS_COLOR[s.lastStatus]}>
                        {FETCH_STATUSES[s.lastStatus]}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {s.lastSuccessAt ? (
                        <>
                          {formatDateTime(s.lastSuccessAt)}
                          <Text size="xs" c="dimmed">
                            {s.ago}
                          </Text>
                        </>
                      ) : (
                        '-'
                      )}
                    </Table.Td>
                    <Table.Td>{s.termsCheckedOn ? formatDate(s.termsCheckedOn) : '未確認'}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
          <Text size="sm" c="dimmed" mt="xs">
            取得に失敗している情報源は、復旧するまで前回取得した内容を表示します。
          </Text>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder id="submit">
            <Text fw={600} mb="xs">
              情報提供
            </Text>
            <Text size="sm" mb="md">
              イベントやお店の変化の情報を受け付けます。内容を確認してから掲載します。
            </Text>
            <Stack>
              <Select label="種類" data={['イベント', 'お店の変化', 'その他']} defaultValue="イベント" disabled />
              <Textarea label="内容" minRows={4} autosize disabled />
              <TextInput label="連絡先（任意）" disabled />
              <Button disabled>送信（準備中）</Button>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </Page>
  );
}

export function NotFoundView() {
  return (
    <Page>
      <Alert title="ページが見つかりません" color="gray" mb="lg">
        URL が間違っているか、ページが移動または削除された可能性があります。
      </Alert>
      <Group>
        <Button component="a" href="/">
          トップへ戻る
        </Button>
        <Button component="a" href="/search" variant="default">
          サイト内を検索する
        </Button>
      </Group>
    </Page>
  );
}
