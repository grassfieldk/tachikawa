import { Anchor, Badge, Card, Group, Text } from '@mantine/core';
import { EVENT_CATEGORIES, EVENT_STATUS_LABELS } from '../data/labels';
import { formatWhen } from '../lib/format';
import type { EventView } from '../lib/views';

export default function EventCard({ event }: { event: EventView }) {
  const status = EVENT_STATUS_LABELS[event.status];
  return (
    <Card withBorder padding="md">
      <Group gap="xs" mb="xs">
        <Badge variant="light">{EVENT_CATEGORIES[event.category]}</Badge>
        {event.ongoing && <Badge color="green">開催中</Badge>}
        {status && <Badge color={event.status === 'cancelled' ? 'red' : 'yellow'}>{status}</Badge>}
      </Group>
      <Anchor href={`/events/${event.id}`} fw={600}>
        {event.title}
      </Anchor>
      <Text size="sm" mt={4}>
        {formatWhen(event.startsAt, event.endsAt, event.allDay)}
      </Text>
      <Text size="sm" c="dimmed">
        {event.venueName}
        {event.area && `（${event.area.name}）`}
      </Text>
      {event.feeText && (
        <Text size="sm" c="dimmed">
          {event.feeText}
        </Text>
      )}
    </Card>
  );
}
