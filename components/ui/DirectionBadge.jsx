'use client';
import React from 'react';
import { Badge, Group } from '@mantine/core';
import {
  IconArrowDownLeft,
  IconArrowUpRight,
  IconFlame,
  IconGift,
  IconCpu,
  IconArrowsExchange,
} from '@tabler/icons-react';
import { useLanguage } from '../LanguageContext';

export default function DirectionBadge({ type = 'in', size = 'xs', label = null }) {
  const { lang } = useLanguage();
  const isTr = lang === 'tr';

  const normalized = (type || 'in').toLowerCase();

  let color = 'gray';
  let Icon = IconArrowsExchange;
  let text = label;

  switch (normalized) {
    case 'in':
    case 'gelen':
    case 'deposit':
    case 'inflow':
      color = 'teal';
      Icon = IconArrowDownLeft;
      text = text || (isTr ? 'GELEN' : 'IN');
      break;

    case 'out':
    case 'giden':
    case 'withdraw':
    case 'outflow':
      color = 'orange';
      Icon = IconArrowUpRight;
      text = text || (isTr ? 'GİDEN' : 'OUT');
      break;

    case 'burn':
    case 'fee':
    case 'gas':
      color = 'yellow';
      Icon = IconFlame;
      text = text || (isTr ? 'YAKIM' : 'BURN');
      break;

    case 'reward':
    case 'payout':
      color = 'cyan';
      Icon = IconGift;
      text = text || (isTr ? 'ÖDÜL' : 'REWARD');
      break;

    case 'call':
    case 'extrinsic':
    case 'tx':
      color = 'indigo';
      Icon = IconCpu;
      text = text || (isTr ? 'ÇAĞRI' : 'CALL');
      break;

    default:
      color = 'blue';
      Icon = IconArrowsExchange;
      text = text || (isTr ? 'TRANSFER' : 'TRANSFER');
      break;
  }

  return (
    <Badge
      size={size}
      color={color}
      variant="light"
      radius="sm"
      leftSection={<Icon size={12} stroke={2.2} />}
      styles={{
        root: {
          fontWeight: 700,
          letterSpacing: '0.4px',
          textTransform: 'uppercase',
          paddingLeft: '6px',
          paddingRight: '8px',
        },
      }}
    >
      {text}
    </Badge>
  );
}
