'use client';
import { useState, useEffect } from 'react';
import { Modal, TextInput, Stack, Group, Text, Badge, Kbd, Box, UnstyledButton, ScrollArea } from '@mantine/core';
import { IconSearch, IconArrowRight, IconBook, IconGitFork, IconScale, IconDna, IconCoins, IconCube, IconActivity, IconBuildingBank, IconReceiptTax, IconArrowsExchange, IconFingerprint } from '@tabler/icons-react';
import { useLanguage } from './LanguageContext';

export default function CommandPaletteModal({ opened, onClose, onSelectAddress, onSelectTab, onOpenBlock, onOpenTx }) {
  const { t, lang } = useLanguage();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [opened, onClose]);

  const QUICK_ACTIONS = [
    { label: t('navDirectory'), tab: 'directory', icon: IconBuildingBank, color: 'yellow' },
    { label: t('navLedger'), tab: 'ledger', icon: IconBook, color: 'green' },
    { label: t('navBridge'), tab: 'bridge', icon: IconArrowsExchange, color: 'cyan' },
    { label: t('navHodlers'), tab: 'hodlers', icon: IconCoins, color: 'teal' },
    { label: t('navMoneytrail'), tab: 'moneytrail', icon: IconGitFork, color: 'violet' },
    { label: t('navDexDepth'), tab: 'dexdepth', icon: IconArrowsExchange, color: 'indigo' },
    { label: t('navValidators'), tab: 'validators', icon: IconDna, color: 'blue' },
    { label: t('navBiomapper'), tab: 'biomapper', icon: IconFingerprint, color: 'cyan' },
    { label: t('navTokens'), tab: 'tokens', icon: IconCoins, color: 'teal' },
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const clean = query.trim();
    if (!clean) return;
    if (/^[#]?\d+$/.test(clean)) {
      onOpenBlock?.(clean.replace('#', ''));
      onClose();
      return;
    }
    if (clean.startsWith('0x') && clean.length > 42) {
      onOpenTx?.(clean);
      onClose();
      return;
    }
    if (clean.startsWith('0x') || clean.startsWith('hm')) {
      onSelectAddress(clean);
      onClose();
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="min(720px, 94vw)"
      withCloseButton={false}
      padding={0}
      radius={0}
      centered
      styles={{
        content: {
          maxWidth: '720px',
          width: '94vw',
          background: '#fff1e5',
          border: '2px solid #111111',
          boxShadow: '6px 6px 0px #111111',
          borderRadius: 0,
        },
      }}
    >
      <form onSubmit={handleSearchSubmit}>
        <Box p="md" style={{ borderBottom: '2px solid #111111', background: '#f5e6d8' }}>
          <TextInput
            placeholder={t('cmdPlaceholder')}
            leftSection={<IconSearch size={18} color="#0d7680" />}
            rightSection={<Kbd size="xs" style={{ background: '#ecdcd0', color: '#111', border: '1px solid #c9b9aa', borderRadius: 0 }}>ESC</Kbd>}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            variant="unstyled"
            styles={{
              input: {
                fontSize: 16,
                color: '#111111',
              },
            }}
          />
        </Box>

        <ScrollArea h={340} p="md">
          {/^[#]?\d+$/.test(query.trim()) ? (
            <Box mb="md">
              <Text size="xs" fw={700} c="dimmed" mb="xs" tt="uppercase">
                {t('cmdBlockResult')}
              </Text>
              <UnstyledButton
                p="sm"
                style={{
                  width: '100%',
                  borderRadius: 0,
                  background: '#f5e6d8',
                  border: '1px solid #111111',
                }}
                onClick={() => {
                  onOpenBlock?.(query.trim().replace('#', ''));
                  onClose();
                }}
              >
                <Group justify="space-between">
                  <div>
                    <Group gap={6}>
                      <IconCube size={18} color="#0d7680" />
                      <Text size="sm" fw={700} style={{ color: '#0d7680' }} className="font-mono">
                        {t('colBlock')} #{query.trim().replace('#', '')}
                      </Text>
                    </Group>
                    <Text size="xs" c="dimmed" mt={2}>
                      {t('cmdInspectBlock')}
                    </Text>
                  </div>
                  <IconArrowRight size={16} color="#0d7680" />
                </Group>
              </UnstyledButton>
            </Box>
          ) : query.trim().startsWith('0x') && query.trim().length > 42 ? (
            <Box mb="md">
              <Text size="xs" fw={700} c="dimmed" mb="xs" tt="uppercase">
                {t('cmdTxResult')}
              </Text>
              <UnstyledButton
                p="sm"
                style={{
                  width: '100%',
                  borderRadius: 0,
                  background: '#f5e6d8',
                  border: '1px solid #111111',
                }}
                onClick={() => {
                  onOpenTx?.(query.trim());
                  onClose();
                }}
              >
                <Group justify="space-between">
                  <div>
                    <Group gap={6}>
                      <IconActivity size={18} color="#b45309" />
                      <Text size="sm" fw={700} style={{ color: '#b45309' }} className="font-mono" style={{ wordBreak: 'break-all' }}>
                        {query.trim().slice(0, 16)}...{query.trim().slice(-8)}
                      </Text>
                    </Group>
                    <Text size="xs" c="dimmed" mt={2}>
                      {t('cmdInspectTx')}
                    </Text>
                  </div>
                  <IconArrowRight size={16} color="#b45309" />
                </Group>
              </UnstyledButton>
            </Box>
          ) : query.trim().startsWith('0x') || query.trim().startsWith('hm') ? (
            <Box mb="md">
              <Text size="xs" fw={700} c="dimmed" mb="xs" tt="uppercase">
                {t('cmdWalletResult')}
              </Text>
              <UnstyledButton
                p="sm"
                style={{
                  width: '100%',
                  borderRadius: 0,
                  background: '#f5e6d8',
                  border: '1px solid #111111',
                }}
                onClick={() => {
                  onSelectAddress(query.trim());
                  onClose();
                }}
              >
                <Group justify="space-between">
                  <div>
                    <Text size="sm" fw={600} style={{ color: '#0d7680' }} className="font-mono">
                      {query.trim()}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {t('cmdInspectWallet')}
                    </Text>
                  </div>
                  <IconArrowRight size={16} color="#0d7680" />
                </Group>
              </UnstyledButton>
            </Box>
          ) : null}

          <Box mb="md">
            <Text size="xs" fw={700} c="dimmed" mb="xs" tt="uppercase">
              {t('cmdQuickNav')}
            </Text>
            <Stack gap={4}>
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <UnstyledButton
                    key={action.tab}
                    p="xs"
                    style={{
                      borderRadius: 6,
                      transition: 'background 0.15s ease',
                    }}
                    onClick={() => {
                      onSelectTab(action.tab);
                      onClose();
                    }}
                  >
                    <Group justify="space-between">
                      <Group gap="xs">
                        <Icon size={16} color={`var(--mantine-color-${action.color}-4)`} />
                        <Text size="sm">{action.label}</Text>
                      </Group>
                      <Badge size="xs" variant="light" color={action.color}>
                        {t('cmdGo')}
                      </Badge>
                    </Group>
                  </UnstyledButton>
                );
              })}
            </Stack>
          </Box>
        </ScrollArea>
      </form>
    </Modal>
  );
}
