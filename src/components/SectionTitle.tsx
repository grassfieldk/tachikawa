import { Anchor, Group, Title } from '@mantine/core';

interface Props {
  title: string;
  href?: string;
  linkLabel?: string;
  order?: 2 | 3;
}

export default function SectionTitle({ title, href, linkLabel = 'すべて見る', order = 2 }: Props) {
  return (
    <Group justify="space-between" align="baseline" mb="sm">
      <Title order={order}>{title}</Title>
      {href && (
        <Anchor href={href} size="sm">
          {linkLabel}
        </Anchor>
      )}
    </Group>
  );
}
