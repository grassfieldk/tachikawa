import { Button, Group, TextInput } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

export default function SearchForm({ value = '' }: { value?: string }) {
  return (
    <form action="/search" method="get" role="search">
      <Group gap="xs" wrap="nowrap">
        <TextInput
          name="q"
          type="search"
          defaultValue={value}
          placeholder="イベント、お店、施設、お知らせ"
          aria-label="サイト内を検索"
          leftSection={<IconSearch size={16} />}
          style={{ flex: 1 }}
        />
        <Button type="submit">検索</Button>
      </Group>
    </form>
  );
}
