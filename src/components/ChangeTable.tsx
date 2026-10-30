import { Anchor, Badge, Stack, Table, Text } from '@mantine/core';
import { CHANGE_TYPES } from '../data/labels';
import { formatDate } from '../lib/format';
import type { ChangeView } from '../lib/views';

interface Props {
  changes: ChangeView[];
  // サイドバー向けの簡易表示
  compact?: boolean;
}

const COLORS = { open: 'green', close: 'gray', relocate: 'blue', renovate: 'yellow' } as const;

function whenLabel(c: ChangeView): string {
  if (!c.effectiveOn) return '時期未定';
  return c.future ? `${formatDate(c.effectiveOn)}（予定）` : formatDate(c.effectiveOn);
}

function Name({ c }: { c: ChangeView }) {
  return c.placeId ? <Anchor href={`/places/${c.placeId}`}>{c.placeName}</Anchor> : <>{c.placeName}</>;
}

function TypeBadge({ c }: { c: ChangeView }) {
  return (
    <Badge variant="light" color={COLORS[c.changeType]}>
      {CHANGE_TYPES[c.changeType]}
    </Badge>
  );
}

export default function ChangeTable({ changes, compact = false }: Props) {
  if (compact) {
    return (
      <Stack gap="sm">
        {changes.map((c) => (
          <div key={c.id}>
            <TypeBadge c={c} /> <Name c={c} />
            <Text size="xs" c="dimmed">
              {whenLabel(c)}
            </Text>
          </div>
        ))}
      </Stack>
    );
  }

  return (
    <Table.ScrollContainer minWidth={640}>
      <Table highlightOnHover verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>種類</Table.Th>
            <Table.Th>店名</Table.Th>
            <Table.Th>時期</Table.Th>
            <Table.Th>地区</Table.Th>
            <Table.Th>備考</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {changes.map((c) => (
            <Table.Tr key={c.id}>
              <Table.Td>
                <TypeBadge c={c} />
              </Table.Td>
              <Table.Td>
                <Name c={c} />
              </Table.Td>
              <Table.Td>{whenLabel(c)}</Table.Td>
              <Table.Td>{c.area?.name ?? '-'}</Table.Td>
              <Table.Td c="dimmed" fz="sm">
                {c.note}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
