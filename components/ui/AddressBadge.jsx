'use client';
import React from 'react';
import { Group, Badge, Text, ActionIcon, Tooltip, CopyButton, Box } from '@mantine/core';
import { IconCopy, IconCheck, IconExternalLink, IconBook, IconBuildingBank, IconDna } from '@tabler/icons-react';
import { shortAddr } from '../formatters';
import { useLanguage } from '../LanguageContext';

const KNOWN_LABELS = {
  '0x0000000000000000000000000000000000000000': { key: 'addrZeroLabel', fallback: 'Zero Address', color: 'gray' },
  '0x6d6f646c70792f66656573706f74000000000000': { key: 'addrFeespotLabel', fallback: 'FeesPot Treasury', color: 'teal' },
  'hm239bcaec45fef3be9fb32c5211d1fa7d206f0e2634351da1': { key: 'addrFeespotLabel', fallback: 'FeesPot Treasury', color: 'teal' },
  '0x1111111111111111111111111111111111111111': { key: 'addrSystemReserveLabel', fallback: 'System Reserve', color: 'indigo' },
};

export default function AddressBadge({
  address,
  label = null,
  head = 6,
  tail = 4,
  onSelectAddress = null,
  onOpenLedger = null,
  showNetwork = true,
  copyable = true,
  size = 'xs',
}) {
  const { t } = useLanguage();
  if (!address) return <Text size="xs" c="dimmed">-</Text>;

  const isEvm = address.startsWith('0x') || address.startsWith('0X');
  const isSubstrate = address.startsWith('hm');
  const known = KNOWN_LABELS[address.toLowerCase()] || KNOWN_LABELS[address];
  const displayLabel = label || (known?.key ? (t(known.key) || known.fallback) : null);
  const labelColor = known?.color || 'blue';

  const short = shortAddr(address, head, tail);

  return (
    <Group gap={6} align="center" wrap="nowrap" style={{ display: 'inline-flex' }}>
      {showNetwork && (
        <Badge
          size="xs"
          variant="outline"
          color={isEvm ? 'cyan' : isSubstrate ? 'teal' : 'gray'}
          styles={{
            root: {
              height: 18,
              padding: '0 4px',
              fontSize: 10,
              fontWeight: 800,
              borderWidth: 1,
            },
          }}
        >
          {isEvm ? 'EVM' : isSubstrate ? 'SUB' : 'RAW'}
        </Badge>
      )}

      {displayLabel && (
        <Badge
          size="xs"
          color={labelColor}
          variant="light"
          styles={{ root: { height: 18, padding: '0 6px', fontSize: 10, fontWeight: 700 } }}
        >
          {displayLabel}
        </Badge>
      )}

      <Tooltip label={address} withArrow position="top">
        <Text
          size={size}
          className="font-mono"
          style={{
            cursor: onSelectAddress ? 'pointer' : 'default',
            color: '#f0f6fc',
            fontWeight: 600,
            textDecoration: onSelectAddress ? 'underline' : 'none',
            textDecorationColor: 'rgba(56, 189, 248, 0.4)',
          }}
          onClick={() => onSelectAddress?.(address)}
        >
          {short}
        </Text>
      </Tooltip>

      {copyable && (
        <CopyButton value={address} timeout={2000}>
          {({ copied, copy }) => (
            <Tooltip label={copied ? (t('copied') || 'Kopyalandı!') : (t('copyAddress') || 'Adresi Kopyala')} withArrow position="top">
              <ActionIcon
                size={18}
                variant="subtle"
                color={copied ? 'teal' : 'gray'}
                onClick={(e) => {
                  e.stopPropagation();
                  copy();
                }}
              >
                {copied ? <IconCheck size={11} /> : <IconCopy size={11} />}
              </ActionIcon>
            </Tooltip>
          )}
        </CopyButton>
      )}

      {onOpenLedger && (
        <Tooltip label={t('quickPeekOpenLedger') || 'Hesap Defterini Aç'} withArrow position="top">
          <ActionIcon
            size={18}
            variant="subtle"
            color="cyan"
            onClick={(e) => {
              e.stopPropagation();
              onOpenLedger(address);
            }}
          >
            <IconBook size={11} />
          </ActionIcon>
        </Tooltip>
      )}
    </Group>
  );
}
