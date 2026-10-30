import { Anchor, Badge, Card, Group, Text } from '@mantine/core';
import { PLACE_KINDS, PLACE_STATUSES } from '../data/labels';
import type { PlaceView } from '../lib/views';

export default function PlaceCard({ place }: { place: PlaceView }) {
  return (
    <Card withBorder padding="md">
      <Group gap="xs" mb="xs">
        <Badge variant="light" color="gray">
          {PLACE_KINDS[place.kind]}
        </Badge>
        {place.status !== 'open' && <Badge color="yellow">{PLACE_STATUSES[place.status]}</Badge>}
      </Group>
      <Anchor href={`/places/${place.id}`} fw={600}>
        {place.name}
      </Anchor>
      <Text size="sm" c="dimmed" mt={4}>
        {place.category}
        {place.area && ` / ${place.area.name}`}
      </Text>
    </Card>
  );
}
