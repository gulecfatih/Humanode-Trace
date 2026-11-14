'use client';
import React from 'react';
import { Paper, Stack, Group, Text, Box, Tooltip } from '@mantine/core';

export default function KpiStatCard({
  title,
  value,
  unit = null,
  usdValue = null,
  sign = null,
  subtext = null,
  tooltip = null,
  color = 'cyan',
  icon: Icon = null,
  badge = null,
  badgeColor = 'teal',
  rawAmount = null,
}) {
  const pastelColors = {
    cyan: '#bfdbfe',    // pastel blue
    teal: '#bbf7d0',    // pastel mint
    yellow: '#fef08a',  // pastel yellow
    violet: '#e9d5ff',  // pastel purple
    orange: '#fed7aa',  // pastel orange
    pink: '#fbcfe8',    // pastel pink
    blue: '#bfdbfe',    // pastel blue
    gray: '#f4f4f5',    // pastel gray
  };

  const badgeBg = pastelColors[color] || '#fef08a';

  const cardContent = (
    <Paper
      p="md"
      style={{
        background: '#fff1e5',
        border: '1px solid #d9cbbe',
        borderTop: '2px solid #111111',
        boxShadow: 'none',
        borderRadius: 0,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Stack gap={8}>
        {/* Başlık ve İkon */}
        <Group justify="space-between" align="center" wrap="nowrap">
          <Group gap={6} align="center" wrap="nowrap" style={{ minWidth: 0 }}>
            {Icon && <Icon size={16} color="#111111" stroke={2} style={{ flexShrink: 0 }} />}
            <Text
              size="xs"
              c="#554f47"
              tt="uppercase"
              fw={800}
              style={{
                fontFamily: "var(--font-sans), 'Inter', sans-serif",
                letterSpacing: '0.6px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontSize: '10.5px',
              }}
            >
              {title}
            </Text>
          </Group>

          {badge && (
            <span
              className="neo-pill"
              style={{
                backgroundColor: '#f5e6d8',
                color: '#111111',
                border: '1px solid #c9b9aa',
                boxShadow: 'none',
                borderRadius: 2,
                fontSize: 10,
                fontWeight: 700,
                padding: '1px 6px',
              }}
            >
              {badge}
            </span>
          )}
        </Group>

        {/* Ana Rakam */}
        <Group gap={6} align="baseline" wrap="nowrap" style={{ overflow: 'hidden' }}>
          <Text
            size="xl"
            fw={700}
            className="font-mono"
            style={{
              color: '#111111',
              whiteSpace: 'nowrap',
              letterSpacing: '-0.3px',
              fontVariantNumeric: 'tabular-nums',
              fontSize: '22px',
            }}
          >
            {sign && <span>{sign}</span>}
            {value}
          </Text>

          {unit && (
            <Text
              size="xs"
              fw={700}
              c="#666059"
              tt="uppercase"
              style={{
                fontFamily: "var(--font-sans), 'Inter', sans-serif",
                whiteSpace: 'nowrap',
                letterSpacing: '0.4px',
              }}
            >
              {unit}
            </Text>
          )}

          {usdValue && (
            <Text
              size="xs"
              c="#666059"
              style={{
                fontFamily: "var(--font-sans), 'Inter', sans-serif",
                whiteSpace: 'nowrap',
                marginLeft: 2,
                fontWeight: 500,
              }}
            >
              (≈ {usdValue})
            </Text>
          )}
        </Group>

        {/* Alt Açıklama / Detay Satırı */}
        {subtext && (
          <Text
            size="xs"
            c="#666059"
            style={{
              lineHeight: 1.35,
              wordBreak: 'break-word',
              fontWeight: 500,
            }}
          >
            {subtext}
          </Text>
        )}
      </Stack>
    </Paper>
  );

  if (tooltip) {
    return (
      <Tooltip label={tooltip} withArrow multiline position="top">
        {cardContent}
      </Tooltip>
    );
  }

  return cardContent;
}
