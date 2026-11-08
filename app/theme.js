'use client';
import { createTheme } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'cyan',
  defaultRadius: 'md',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  fontFamilyMonospace: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  colors: {
    dark: [
      '#f0f6fc', // 0: text
      '#c9d1d9', // 1: subtext
      '#8b949e', // 2: muted
      '#484f58', // 3: subtle
      '#30363d', // 4: border
      '#21262d', // 5: surface light
      '#161b22', // 6: surface main
      '#0d1117', // 7: card dark
      '#0b0f17', // 8: bg main
      '#030712', // 9: pitch dark
    ],
  },
  components: {
    Paper: {
      defaultProps: {
        bg: '#161b22',
        p: 'md',
        radius: 'md',
        withBorder: true,
      },
    },
    Card: {
      defaultProps: {
        bg: '#161b22',
        p: 'md',
        radius: 'md',
        withBorder: true,
      },
    },
    Table: {
      defaultProps: {
        striped: true,
        highlightOnHover: true,
        verticalSpacing: 'sm',
        stickyHeader: true,
        stickyHeaderOffset: 52,
      },
    },
  },
});
