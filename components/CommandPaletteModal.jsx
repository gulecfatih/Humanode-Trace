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
      radius="md"
      centered
      styles={{
        content: {
          maxWidth: '720px',
          width: '94vw',
          background: '#161b22',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.7), 0 0 25px rgba(56, 189, 248, 0.15)',
        },
      }}
    >
      <form onSubmit={handleSearchSubmit}>
        <Box p="md" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <TextInput
            placeholder={t('cmdPlaceholder')}
            leftSection={<IconSearch size={18} color="#38bdf8" />}
            rightSection={<Kbd size="xs">ESC</Kbd>}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            variant="unstyled"
            styles={{
              input: {
                fontSize: 16,
                color: '#f0f6fc',
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
                  borderRadius: 8,
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                }}
                onClick={() => {
                  onOpenBlock?.(query.trim().replace('#', ''));
                  onClose();
                }}
              >
                <Group justify="space-between">
                  <div>
                    <Group gap={6}>
                      <IconCube size={18} color="#38bdf8" />
                      <Text size="sm" fw={700} c="cyan" className="font-mono">
                        {t('colBlock')} #{query.trim().replace('#', '')}
                      </Text>
                    </Group>
                    <Text size="xs" c="dimmed" mt={2}>
                      {t('cmdInspectBlock')}
                    </Text>
                  </div>
                  <IconArrowRight size={16} color="#38bdf8" />
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
                  borderRadius: 8,
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                }}
                onClick={() => {
                  onOpenTx?.(query.trim());
                  onClose();
                }}
              >
                <Group justify="space-between">
                  <div>
                    <Group gap={6}>
                      <IconActivity size={18} color="#f59e0b" />
                      <Text size="sm" fw={700} c="yellow" className="font-mono" style={{ wordBreak: 'break-all' }}>
                        {query.trim().slice(0, 16)}...{query.trim().slice(-8)}
                      </Text>
                    </Group>
                    <Text size="xs" c="dimmed" mt={2}>
                      {t('cmdInspectTx')}
                    </Text>
                  </div>
                  <IconArrowRight size={16} color="#f59e0b" />
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
                  borderRadius: 8,
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                }}
                onClick={() => {
                  onSelectAddress(query.trim());
                  onClose();
                }}
              >
                <Group justify="space-between">
                  <div>
                    <Text size="sm" fw={600} c="cyan" className="font-mono">
                      {query.trim()}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {t('cmdInspectWallet')}
                    </Text>
                  </div>
                  <IconArrowRight size={16} color="#38bdf8" />
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
