'use client';
import React from 'react';
import { Group, Text, Tooltip } from '@mantine/core';
import { useLanguage } from '../LanguageContext';

/**
 * AmountDisplay renders monetary and numeric amounts with:
 * - Strict 'nowrap' protection to prevent unit separation
 * - Tabular monospace numbers for perfect vertical scanning
 * - Subordinated unit typography (clear, professional visual hierarchy)
 * - Optional tooltip showing raw unrounded amount or USD equivalent
 */
export default function AmountDisplay({
  value,
  amount = null,
  unit = 'HMND',
  usdValue = null,
  sign = null, // '+' | '-' | null
  color = null,
  size = 'md', // 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  rawAmount = null,
  tooltipLabel = null,
  className = '',
  dimUnit = true,
  showUSD = true,
  locale = null,
}) {
  const { lang } = useLanguage();
  const activeLocale = locale || lang || undefined;
  const fontSizes = {
    xs: { val: '12px', unit: '10px' },
    sm: { val: '14px', unit: '11px' },
    md: { val: '16px', unit: '12px' },
    lg: { val: '20px', unit: '13px' },
    xl: { val: '24px', unit: '14px' },
    '2xl': { val: '30px', unit: '16px' },
  };

  const currentSize = fontSizes[size] || fontSizes.md;

  let displayColor = color;
  if (!displayColor) {
    if (sign === '+') displayColor = '#10b981';
    else if (sign === '-') displayColor = '#ef4444';
    else displayColor = '#f0f6fc';
  }

  const rawVal = value ?? amount ?? 0;
  let formattedValue = rawVal;
  if (typeof rawVal === 'number') {
    formattedValue = rawVal.toLocaleString(activeLocale, { maximumFractionDigits: 2 });
  }

  const content = (
    <span
      className={`font-mono ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        whiteSpace: 'nowrap',
        fontVariantNumeric: 'tabular-nums',
        gap: '4px',
      }}
    >
      {sign && (
        <span style={{ fontSize: currentSize.val, fontWeight: 800, color: displayColor }}>
          {sign}
        </span>
      )}
      <span
        style={{
          fontSize: currentSize.val,
          fontWeight: 800,
          color: displayColor,
          letterSpacing: '-0.3px',
        }}
      >
        {formattedValue}
      </span>
      {unit && (
        <span
          style={{
            fontSize: currentSize.unit,
            fontWeight: 600,
            color: dimUnit ? '#8b949e' : displayColor,
            textTransform: 'uppercase',
            letterSpacing: '0.4px',
          }}
        >
          {unit}
        </span>
      )}
      {usdValue && (
        <span
          style={{
            fontSize: currentSize.unit,
            fontWeight: 500,
            color: '#6e7681',
            marginLeft: '4px',
          }}
        >
          (≈ {usdValue})
        </span>
      )}
    </span>
  );

  const tip = tooltipLabel || (rawAmount != null ? `Tam Değer: ${rawAmount} ${unit}` : null);

  if (tip) {
    return (
      <Tooltip label={tip} withArrow position="top" multiline>
        <span style={{ cursor: 'help' }}>{content}</span>
      </Tooltip>
    );
  }

  return content;
}
