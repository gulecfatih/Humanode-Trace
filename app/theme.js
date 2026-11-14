'use client';
import { createTheme } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'dark',
  defaultRadius: 'xs',
  fontFamily: "'Newsreader', Georgia, 'Times New Roman', serif",
  fontFamilyMonospace: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  colors: {
    dark: [
      '#111111', // 0
      '#24201c', // 1
      '#3a342e', // 2
      '#554f47', // 3
      '#756d64', // 4
      '#999084', // 5
      '#c2b8ad', // 6
      '#d9cbbe', // 7
      '#f5e6d8', // 8
      '#fff1e5', // 9
    ],
  },
  components: {
    Paper: {
      defaultProps: {
        bg: '#fff1e5',
        p: 'md',
        radius: 'xs',
        withBorder: true,
      },
    },
    Card: {
      defaultProps: {
        bg: '#fff1e5',
        p: 'md',
        radius: 'xs',
        withBorder: true,
      },
    },
    Button: {
      defaultProps: {
        radius: 'xs',
      },
    },
    Badge: {
      defaultProps: {
        radius: 'xs',
      },
    },
    Table: {
      defaultProps: {
        striped: false,
        highlightOnHover: true,
        verticalSpacing: 'xs',
      },
    },
  },
});
