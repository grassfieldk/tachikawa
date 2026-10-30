import { Container, createTheme, MantineProvider } from '@mantine/core';
import type { ReactNode } from 'react';

const fontFamily = "Inter, 'Noto Sans JP', system-ui, sans-serif";

export const theme = createTheme({
  fontFamily,
  headings: { fontFamily },
});

// 画面の部品はそれぞれ独立して描画されるため、部品ごとにこれで包む
export default function Providers({ children }: { children: ReactNode }) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="auto">
      {children}
    </MantineProvider>
  );
}

// ページ本文の外枠
export function Page({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <Container size="lg" py="xl">
        {children}
      </Container>
    </Providers>
  );
}
