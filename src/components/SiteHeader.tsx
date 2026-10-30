import {
  ActionIcon,
  Anchor,
  Box,
  Burger,
  Container,
  Divider,
  Drawer,
  Group,
  NavLink,
  Text,
  useComputedColorScheme,
  useMantineColorScheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconMoon, IconSun } from '@tabler/icons-react';
import Providers from './Providers';

const NAV = [
  { href: '/news', label: 'お知らせ', match: ['/news'] },
  { href: '/events', label: 'イベント', match: ['/events'] },
  { href: '/changes', label: '開店・閉店', match: ['/changes'] },
  { href: '/map', label: 'マップ', match: ['/map', '/places'] },
  { href: '/town', label: '街を知る', match: ['/town', '/areas', '/history', '/access', '/stats'] },
  { href: '/life', label: '暮らし・行政', match: ['/life'] },
  { href: '/search', label: '検索', match: ['/search'] },
];

interface Props {
  siteName: string;
  path: string;
  isDummy: boolean;
}

function ColorSchemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const computed = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const dark = computed === 'dark';
  return (
    <ActionIcon
      variant="default"
      size="lg"
      onClick={() => setColorScheme(dark ? 'light' : 'dark')}
      aria-label={dark ? 'ライトモードにする' : 'ダークモードにする'}
    >
      {dark ? <IconSun size={18} /> : <IconMoon size={18} />}
    </ActionIcon>
  );
}

function Header({ siteName, path, isDummy }: Props) {
  const [opened, { toggle, close }] = useDisclosure(false);
  const isActive = (match: string[]) => match.some((p) => path === p || path.startsWith(`${p}/`));

  return (
    <Box component="header">
      <Container size="lg" py="sm">
        <Group justify="space-between" wrap="nowrap">
          <Anchor href="/" c="inherit" fw={700} size="lg" underline="never">
            {siteName}
          </Anchor>
          <Group gap="xs" wrap="nowrap">
            <Group gap="md" visibleFrom="md">
              {NAV.map((item) => (
                <Anchor
                  key={item.href}
                  href={item.href}
                  size="sm"
                  c={isActive(item.match) ? undefined : 'dimmed'}
                  fw={isActive(item.match) ? 700 : undefined}
                  aria-current={isActive(item.match) ? 'page' : undefined}
                >
                  {item.label}
                </Anchor>
              ))}
            </Group>
            <ColorSchemeToggle />
            <Burger opened={opened} onClick={toggle} hiddenFrom="md" aria-label="メニュー" />
          </Group>
        </Group>
        {isDummy && (
          <Text size="xs" c="dimmed">
            表示中のデータはすべてダミーです
          </Text>
        )}
      </Container>
      <Divider />
      <Drawer opened={opened} onClose={close} title={siteName} position="right" size="xs" hiddenFrom="md">
        {NAV.map((item) => (
          <NavLink key={item.href} href={item.href} label={item.label} active={isActive(item.match)} />
        ))}
      </Drawer>
    </Box>
  );
}

export default function SiteHeader(props: Props) {
  return (
    <Providers>
      <Header {...props} />
    </Providers>
  );
}
