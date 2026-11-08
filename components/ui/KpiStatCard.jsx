'use client';
import React from 'react';
import { Paper, Stack, Group, Text, Badge, Tooltip, Box } from '@mantine/core';

export default function KpiStatCard({
  title,
  value,
  unit = null,
  usdValue = null,
  sign = null,
  subtext = null,
  tooltip = null,
  color = 'cyan', // 'cyan' | 'teal' | 'yellow' | 'violet' | 'orange' | 'pink' | 'blue'
  icon: Icon = null,
  badge = null,
  badgeColor = 'teal',
  rawAmount = null,
}) {
  const accentColors = {
    cyan: '#38bdf8',
    teal: '#10b981',
    yellow: '#f59e0b',
    violet: '#a855f7',
    orange: '#f97316',
    pink: '#ec4899',
    blue: '#3b82f6',
    gray: '#64748b',
  };

  const accentHex = accentColors[color] || accentColors.cyan;

  const cardContent = (
    <Paper
      p="md"
      style={{
        background: 'rgba(22, 27, 34, 0.75)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderLeft: `4px solid ${accentHex}`,
        borderRadius: 8,
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color 0.2s ease, transform 0.15s ease',
      }}
    >
      <Stack gap={6}>
        {/* Başlık ve İkon */}
        <Group justify="space-between" align="center" wrap="nowrap">
          <Group gap={6} align="center" wrap="nowrap" style={{ minWidth: 0 }}>
            {Icon && <Icon size={16} color={accentHex} stroke={2} style={{ flexShrink: 0 }} />}
            <Text
              size="xs"
              c="dimmed"
              tt="uppercase"
              fw={700}
              style={{
                letterSpacing: '0.5px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {title}
            </Text>
          </Group>

          {badge && (
            <Badge size="xs" color={badgeColor} variant="light">
              {badge}
            </Badge>
          )}
        </Group>

        {/* Ana Rakam (Asla satır kırılmaz) */}
        <Group gap={6} align="baseline" wrap="nowrap" style={{ overflow: 'hidden' }}>
          <Text
            size="xl"
            fw={800}
            className="font-mono"
            style={{
              color: accentHex,
              whiteSpace: 'nowrap',
              letterSpacing: '-0.5px',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {sign && <span>{sign}</span>}
            {value}
          </Text>

          {unit && (
            <Text
              size="xs"
              fw={700}
              c="dimmed"
              tt="uppercase"
              style={{
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
              c="dimmed"
              style={{
                whiteSpace: 'nowrap',
                marginLeft: 2,
              }}
            >
              (≈ {usdValue})
            </Text>
          )}
        </Group>

        {/* Alt Açıklama / Detay Satırı (Ellipsis yok, temiz döküm) */}
        {subtext && (
          <Text
            size="xs"
            c="dimmed"
            style={{
              lineHeight: 1.35,
              wordBreak: 'break-word',
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
