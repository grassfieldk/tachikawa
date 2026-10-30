import { Anchor, Breadcrumbs, Text, Title } from '@mantine/core';

interface Crumb {
  label: string;
  href?: string;
}

interface Props {
  title: string;
  crumbs?: Crumb[];
}

export default function PageTitle({ title, crumbs = [] }: Props) {
  return (
    <>
      {crumbs.length > 0 && (
        <Breadcrumbs mb="xs" fz="sm">
          <Anchor href="/">トップ</Anchor>
          {crumbs.map((c) =>
            c.href ? (
              <Anchor key={c.label} href={c.href}>
                {c.label}
              </Anchor>
            ) : (
              <Text key={c.label} size="sm" c="dimmed">
                {c.label}
              </Text>
            ),
          )}
        </Breadcrumbs>
      )}
      <Title order={1} mb="lg">
        {title}
      </Title>
    </>
  );
}
