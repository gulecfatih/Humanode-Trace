'use client';
import { useEffect } from 'react';
import {
  NavLink,
  Stack,
  Text,
  Box,
  Group,
  ActionIcon,
  Tooltip,
  UnstyledButton,
  Kbd,
  Center,
  Divider,
} from '@mantine/core';
import {
  IconDashboard,
  IconTrophy,
  IconCoins,
  IconDna,
  IconFlame,
  IconBook,
  IconGitFork,
  IconTrendingUp,
  IconLockOpen,
  IconBuildingBank,
  IconRadar,
  IconChartPie,
  IconShieldLock,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconArrowsExchange,
  IconNetwork,
  IconArrowsRightLeft,
  IconFingerprint,
  IconUsers,
} from '@tabler/icons-react';
import { useLanguage } from './LanguageContext';

export default function SidebarNav({
  activeTab,
  onTabChange,
  collapsed = false,
  onToggleCollapse,
}) {
  const { t } = useLanguage();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.key === '[' || (e.ctrlKey && e.key.toLowerCase() === 'b')) {
        e.preventDefault();
        onToggleCollapse?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleCollapse]);

  const NAV_CATEGORIES = [
    {
      id: 'cat_network',
      title: t('navCatNetwork') || 'AĞ & BLOKLAR',
      items: [
        { id: 'overview', label: t('navOverview'), icon: IconDashboard, color: 'cyan' },
        { id: 'leaderboard', label: t('navLeaderboard'), icon: IconTrophy, color: 'yellow' },
        { id: 'heatmap', label: t('navHeatmap'), icon: IconFlame, color: 'orange' },
      ],
    },
    {
      id: 'cat_economics',
      title: t('navCatEconomics') || 'EKONOMİ & ARZ',
      items: [
        { id: 'tokenomics', label: t('navTokenomics'), icon: IconChartPie, color: 'cyan' },
        { id: 'unlocks', label: t('navUnlocks'), icon: IconLockOpen, color: 'pink' },
        { id: 'bridge', label: t('navBridge'), icon: IconArrowsRightLeft, color: 'cyan' },
        { id: 'hodlers', label: t('navHodlers'), icon: IconUsers, color: 'teal' },
        { id: 'rates', label: t('navRates'), icon: IconTrendingUp, color: 'indigo' },
      ],
    },
    {
      id: 'cat_validators',
      title: t('navCatValidators') || 'BİYOMETRİ & VALİDATÖR',
      items: [
        { id: 'validators', label: t('navValidators'), icon: IconDna, color: 'blue' },
        { id: 'feespot', label: t('navFeesPot'), icon: IconCoins, color: 'teal' },
        { id: 'biomapper', label: t('navBiomapper'), icon: IconFingerprint, color: 'cyan' },
      ],
    },
    {
      id: 'cat_tokens',
      title: t('navCatTokens') || 'TOKENLAR & DEX',
      items: [
        { id: 'tokens', label: t('navTokens'), icon: IconCoins, color: 'teal' },
        { id: 'dexdepth', label: t('navDexDepth'), icon: IconArrowsExchange, color: 'indigo' },
      ],
    },
    {
      id: 'cat_wallets',
      title: t('navCatWallets') || 'CÜZDAN & İZ SÜRME',
      items: [
        { id: 'directory', label: t('navDirectory'), icon: IconBuildingBank, color: 'yellow' },
        { id: 'whales', label: t('navWhales'), icon: IconRadar, color: 'yellow' },
        { id: 'ledger', label: t('navLedger'), icon: IconBook, color: 'green' },
        { id: 'moneytrail', label: t('navMoneytrail'), icon: IconGitFork, color: 'violet' },
      ],
    },
  ];

  return (
    <Box
      p="xs"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
      }}
    >
      {/* Menü Üst Başlığı & Daralt/Genişlet Butonu */}
      <Box pb="xs" mb={4} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.07)' }}>
        {!collapsed ? (
          <Group justify="space-between" align="center" px={4} py={2}>
            <Group gap={6} align="center">
              <img
                src="/icon.png"
                alt="Humanode"
                width={14}
                height={14}
                style={{ objectFit: 'contain' }}
              />
              <Text
                size="xs"
                fw={700}
                c="dimmed"
                style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}
              >
                {t('menuTitle') || 'Menü'}
              </Text>
            </Group>
            <Tooltip
              label={`${t('collapseMenu') || 'Menüyü Daralt'} ([)`}
              position="right"
              withArrow
              offset={10}
            >
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                onClick={onToggleCollapse}
                aria-label={t('collapseMenu') || 'Menüyü Daralt'}
                style={{
                  borderRadius: 6,
                  color: '#94a3b8',
                }}
              >
                <IconLayoutSidebarLeftCollapse size={18} stroke={1.7} />
              </ActionIcon>
            </Tooltip>
          </Group>
        ) : (
          <Center py={2}>
            <Tooltip
              label={`${t('expandMenu') || 'Menüyü Genişlet'} ([)`}
              position="right"
              withArrow
              offset={14}
            >
              <ActionIcon
                variant="light"
                color="cyan"
                size="md"
                onClick={onToggleCollapse}
                aria-label={t('expandMenu') || 'Menüyü Genişlet'}
                style={{
                  borderRadius: 8,
                  backgroundColor: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                }}
              >
                <IconLayoutSidebarLeftExpand size={19} stroke={1.8} />
              </ActionIcon>
            </Tooltip>
          </Center>
        )}
      </Box>

      {/* Navigasyon Kategorileri ve Elemanları */}
      <Stack gap={6} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {NAV_CATEGORIES.map((category, catIdx) => (
          <Box key={category.id} mb={catIdx < NAV_CATEGORIES.length - 1 ? 4 : 0}>
            {!collapsed ? (
              <Box px={6} py={3}>
                <Text
                  size="10px"
                  fw={800}
                  c="#64748b"
                  style={{
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    userSelect: 'none',
                  }}
                >
                  {category.title}
                </Text>
              </Box>
            ) : (
              catIdx > 0 && <Divider my={4} color="rgba(255, 255, 255, 0.06)" />
            )}

            <Stack gap={2}>
              {category.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                if (collapsed) {
                  return (
                    <Tooltip
                      key={item.id}
                      label={item.label}
                      position="right"
                      withArrow
                      offset={14}
                      transitionProps={{ transition: 'fade', duration: 150 }}
                    >
                      <ActionIcon
                        variant={isActive ? 'filled' : 'subtle'}
                        color={isActive ? 'cyan' : 'gray'}
                        size={38}
                        onClick={(e) => {
                          e.preventDefault();
                          onTabChange(item.id);
                        }}
                        aria-label={item.label}
                        style={{
                          width: '100%',
                          height: 38,
                          borderRadius: 8,
                          backgroundColor: isActive ? 'rgba(56, 189, 248, 0.18)' : 'transparent',
                          border: isActive ? '1px solid rgba(56, 189, 248, 0.45)' : '1px solid transparent',
                          color: isActive ? '#38bdf8' : '#94a3b8',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Icon size={18} stroke={isActive ? 2 : 1.6} />
                      </ActionIcon>
                    </Tooltip>
                  );
                }

                return (
                  <NavLink
                    key={item.id}
                    component="button"
                    type="button"
                    active={isActive}
                    label={
                      <Text
                        size="12px"
                        fw={isActive ? 700 : 500}
                        style={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          letterSpacing: '-0.1px',
                        }}
                        title={item.label}
                      >
                        {item.label}
                      </Text>
                    }
                    leftSection={
                      <Icon
                        size={16}
                        stroke={isActive ? 2 : 1.6}
                        style={{
                          color: isActive ? '#38bdf8' : '#94a3b8',
                          flexShrink: 0,
                        }}
                      />
                    }
                    onClick={(e) => {
                      e.preventDefault();
                      onTabChange(item.id);
                    }}
                    style={{
                      borderRadius: 6,
                      transition: 'all 0.15s ease',
                      backgroundColor: isActive ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                      borderLeft: isActive ? '3px solid #38bdf8' : '3px solid transparent',
                      color: isActive ? '#f0f6fc' : '#94a3b8',
                      paddingTop: 5,
                      paddingBottom: 5,
                      paddingLeft: 8,
                      paddingRight: 8,
                      minHeight: 32,
                    }}
                  />
                );
              })}
            </Stack>
          </Box>
        ))}
      </Stack>

      {/* Menü Alt Bölümü */}
      <Box pt="xs" mt="auto" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.07)' }}>
        {!collapsed ? (
          <UnstyledButton
            onClick={onToggleCollapse}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '6px 8px',
              borderRadius: 6,
              color: '#94a3b8',
              fontSize: '11px',
              fontWeight: 500,
              transition: 'background 0.15s ease, color 0.15s ease',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.color = '#f0f6fc';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            <Group gap="xs" align="center">
              <IconLayoutSidebarLeftCollapse size={15} stroke={1.6} />
              <Text size="11px" fw={600}>
                {t('collapseMenu') || 'Menüyü Daralt'}
              </Text>
            </Group>
            <Kbd size="xs" style={{ background: '#1e293b', border: '1px solid #334155' }}>
              [
            </Kbd>
          </UnstyledButton>
        ) : (
          <Center py={2}>
            <Tooltip
              label={`${t('expandMenu') || 'Menüyü Genişlet'} ([)`}
              position="right"
              withArrow
              offset={14}
            >
              <ActionIcon
                variant="subtle"
                color="gray"
                size="md"
                onClick={onToggleCollapse}
                aria-label={t('expandMenu') || 'Menüyü Genişlet'}
                style={{ borderRadius: 8, color: '#94a3b8' }}
              >
                <IconLayoutSidebarLeftExpand size={18} stroke={1.6} />
              </ActionIcon>
            </Tooltip>
          </Center>
        )}
      </Box>
    </Box>
  );
}
