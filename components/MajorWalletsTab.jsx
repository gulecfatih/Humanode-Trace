'use client';
import { useState, useEffect } from 'react';
import {
  Paper,
  Title,
  Text,
  Table,
  Badge,
  Group,
  Stack,
  Button,
  TextInput,
  SegmentedControl,
  CopyButton,
  ActionIcon,
  Tooltip,
  SimpleGrid,
  Box,
} from '@mantine/core';
import {
  IconSearch,
  IconCopy,
  IconCheck,
  IconEye,
  IconBook,
  IconGitFork,
  IconScale,
  IconBuildingBank,
} from '@tabler/icons-react';
import { formatHMND, formatUSD, shortAddr } from './formatters';
import { useLanguage } from './LanguageContext';
import AddressBadge from './ui/AddressBadge';
import AmountDisplay from './ui/AmountDisplay';

export default function MajorWalletsTab({
  onSelectAddress,
  onOpenLedger,
  onOpenTrail,
  onOpenCompare,
}) {
  const { t, lang } = useLanguage();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');

  const CATEGORY_META = {
    exchange: { label: lang === 'tr' ? 'Borsa (CEX)' : 'Exchange (CEX)', color: 'yellow' },
    system: { label: lang === 'tr' ? 'Sistem & Hazine' : 'System & Treasury', color: 'violet' },
    whale: { label: lang === 'tr' ? 'Büyük Balina' : 'Major Whale', color: 'cyan' },
    bridge: { label: lang === 'tr' ? 'Köprü (Bridge)' : 'Bridge', color: 'pink' },
    dex: { label: lang === 'tr' ? 'DEX Havuzu' : 'DEX Pool', color: 'blue' },
    defi: { label: lang === 'tr' ? 'DeFi / Staking' : 'DeFi / Staking', color: 'teal' },
    token: { label: lang === 'tr' ? 'ERC-20 Kontratı' : 'ERC-20 Contract', color: 'indigo' },
  };

  useEffect(() => {
    setLoading(true);
    fetch('/api/major-wallets')
      .then((res) => res.json())
      .then((resData) => {
        setItems(resData.items || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filtered = items.filter((w) => {
    if (categoryFilter === 'exchange' && w.category !== 'exchange') return false;
    if (categoryFilter === 'system' && w.category !== 'system') return false;
    if (categoryFilter === 'whale' && w.category !== 'whale') return false;
    if (
      categoryFilter === 'contracts' &&
      !['bridge', 'dex', 'defi', 'token'].includes(w.category)
    ) {
      return false;
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return (
        w.address.toLowerCase().includes(q) ||
        (w.label && w.label.toLowerCase().includes(q)) ||
        (w.notes && w.notes.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const countByCat = {
    exchange: items.filter((i) => i.category === 'exchange').length,
    system: items.filter((i) => i.category === 'system').length,
    whale: items.filter((i) => i.category === 'whale').length,
    contracts: items.filter((i) => ['bridge', 'dex', 'defi', 'token'].includes(i.category)).length,
  };

  const loc = lang === 'en' ? 'en-US' : 'tr-TR';

  return (
    <Stack gap="md">
      <Paper p="md" className="glass-panel" style={{ borderRadius: 8 }}>
        <Group justify="space-between" mb="sm" wrap="wrap">
          <div>
            <Group gap={8}>
              <IconBuildingBank size={20} color="#eab308" />
              <Title order={4}>{t('dirTitle')}</Title>
            </Group>
            <Text size="xs" c="dimmed" mt={2}>
              {t('dirSubtitle')}
            </Text>
          </div>
          <Badge size="md" color="yellow" variant="light">
            {t('dirRegisteredWallets', { count: filtered.length })}
          </Badge>
        </Group>

        <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing="sm" mb="md">
          <Paper
            p="xs"
            bg="rgba(0,0,0,0.25)"
            style={{
              borderLeft: '3px solid #eab308',
              cursor: 'pointer',
              background: categoryFilter === 'exchange' ? 'rgba(234, 179, 8, 0.14)' : 'rgba(0,0,0,0.25)',
            }}
            onClick={() => setCategoryFilter(categoryFilter === 'exchange' ? 'all' : 'exchange')}
          >
            <Text size="10px" c="dimmed" tt="uppercase" fw={700}>
              {t('dirExchangeCard')}
            </Text>
            <Text size="md" fw={800} c="yellow" className="font-mono">
              {t('dirExchangeCount', { count: countByCat.exchange })}
            </Text>
          </Paper>

          <Paper
            p="xs"
            bg="rgba(0,0,0,0.25)"
            style={{
              borderLeft: '3px solid #8b5cf6',
              cursor: 'pointer',
              background: categoryFilter === 'system' ? 'rgba(139, 92, 246, 0.14)' : 'rgba(0,0,0,0.25)',
            }}
            onClick={() => setCategoryFilter(categoryFilter === 'system' ? 'all' : 'system')}
          >
            <Text size="10px" c="dimmed" tt="uppercase" fw={700}>
              {t('dirSystemCard')}
            </Text>
            <Text size="md" fw={800} c="violet" className="font-mono">
              {t('dirSystemCount', { count: countByCat.system })}
            </Text>
          </Paper>

          <Paper
            p="xs"
            bg="rgba(0,0,0,0.25)"
            style={{
              borderLeft: '3px solid #06b6d4',
              cursor: 'pointer',
              background: categoryFilter === 'whale' ? 'rgba(6, 182, 212, 0.14)' : 'rgba(0,0,0,0.25)',
            }}
            onClick={() => setCategoryFilter(categoryFilter === 'whale' ? 'all' : 'whale')}
          >
            <Text size="10px" c="dimmed" tt="uppercase" fw={700}>
              {t('dirWhaleCard')}
            </Text>
            <Text size="md" fw={800} c="cyan" className="font-mono">
              {t('dirWhaleCount', { count: countByCat.whale })}
            </Text>
          </Paper>

          <Paper
            p="xs"
            bg="rgba(0,0,0,0.25)"
            style={{
              borderLeft: '3px solid #3b82f6',
              cursor: 'pointer',
              background: categoryFilter === 'contracts' ? 'rgba(59, 130, 246, 0.14)' : 'rgba(0,0,0,0.25)',
            }}
            onClick={() => setCategoryFilter(categoryFilter === 'contracts' ? 'all' : 'contracts')}
          >
            <Text size="10px" c="dimmed" tt="uppercase" fw={700}>
              {t('dirContractCard')}
            </Text>
            <Text size="md" fw={800} c="blue" className="font-mono">
              {t('dirContractCount', { count: countByCat.contracts })}
            </Text>
          </Paper>
        </SimpleGrid>

        <Group justify="space-between" gap="sm" wrap="wrap">
          <SegmentedControl
            size="xs"
            value={categoryFilter}
            onChange={setCategoryFilter}
            data={[
              { label: t('catAll'), value: 'all' },
              { label: t('catExchange'), value: 'exchange' },
              { label: t('catSystem'), value: 'system' },
              { label: t('catWhale'), value: 'whale' },
              { label: t('catContracts'), value: 'contracts' },
            ]}
          />

          <TextInput
            size="xs"
            placeholder={t('dirSearchPlaceholder')}
            leftSection={<IconSearch size={14} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ minWidth: 280, flex: 1, maxWidth: 420 }}
          />
        </Group>
      </Paper>

      <Paper p="md" className="glass-panel" style={{ borderRadius: 8 }}>
        <Box style={{ overflowX: 'auto', width: '100%' }}>
          <Table striped highlightOnHover verticalSpacing="xs">
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ width: '15%', minWidth: 120 }}>{t('dirColCategory')}</Table.Th>
                <Table.Th style={{ width: '25%', minWidth: 180 }}>{t('dirColName')}</Table.Th>
                <Table.Th style={{ width: '18%', minWidth: 140 }}>{t('dirColAddress')}</Table.Th>
                <Table.Th style={{ width: '18%', minWidth: 130 }}>{t('dirColTxCount')}</Table.Th>
                <Table.Th style={{ width: '14%', minWidth: 130 }}>{t('dirColBalance')}</Table.Th>
                <Table.Th style={{ width: '10%', minWidth: 110, textAlign: 'center' }}>{t('dirColActions')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filtered.map((w) => {
                const meta = CATEGORY_META[w.category] || { label: w.category, color: 'gray' };
                const netBal = w.live_balance_hmnd !== undefined ? w.live_balance_hmnd : Math.max(0, (w.inflow_hmnd || 0) - (w.outflow_hmnd || 0));
                return (
                  <Table.Tr key={w.address}>
                    <Table.Td style={{ whiteSpace: 'nowrap' }}>
                      <Group gap={4} wrap="nowrap">
                        <Badge size="xs" color={meta.color} variant="light">
                          {meta.label}
                        </Badge>
                        <Badge
                          size="xs"
                          color={w.layer === 'EVM' ? 'cyan' : 'green'}
                          variant="outline"
                        >
                          {w.layer}
                        </Badge>
                      </Group>
                    </Table.Td>

                    <Table.Td>
                      <Text size="xs" fw={700} c="gray.1" lineClamp={1} title={w.label}>
                        {w.label}
                      </Text>
                      <Text size="11px" c="dimmed" lineClamp={1} title={w.notes}>
                        {w.notes}
                      </Text>
                    </Table.Td>

                    <Table.Td style={{ whiteSpace: 'nowrap' }}>
                      <AddressBadge
                        address={w.address}
                        showNetwork={false}
                        onSelectAddress={onSelectAddress}
                        head={6}
                        tail={4}
                      />
                    </Table.Td>

                    <Table.Td style={{ whiteSpace: 'nowrap' }}>
                      <Text size="xs" fw={800} c="white" className="font-mono">
                        {(w.tx_count || 0).toLocaleString(loc)} {lang === 'tr' ? 'İşlem' : 'Txs'}
                      </Text>
                      <Text size="11px" c="dimmed" className="font-mono">
                        <span style={{ color: '#34d399' }}>↓ {(w.in_count || 0).toLocaleString(loc)} {lang === 'tr' ? 'giriş' : 'in'}</span>
                        {' • '}
                        <span style={{ color: '#f87171' }}>↑ {(w.out_count || 0).toLocaleString(loc)} {lang === 'tr' ? 'çıkış' : 'out'}</span>
                      </Text>
                    </Table.Td>

                    <Table.Td style={{ whiteSpace: 'nowrap' }}>
                      <AmountDisplay
                        value={formatHMND(netBal, { suffix: false, locale: lang })}
                        unit="HMND"
                        color={netBal > 0 ? '#10b981' : '#6e7681'}
                        size="xs"
                        usdValue={w.balance_usd ? formatUSD(w.balance_usd, lang) : null}
                      />
                    </Table.Td>

                    <Table.Td style={{ whiteSpace: 'nowrap', textAlign: 'center' }}>
                      <Group gap={4} wrap="nowrap" justify="center">
                        <Tooltip label={lang === 'tr' ? 'Önizle' : 'Preview'} withArrow position="top">
                          <ActionIcon
                            size="sm"
                            variant="light"
                            color="cyan"
                            onClick={() => onSelectAddress && onSelectAddress(w.address)}
                          >
                            <IconEye size={14} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label={lang === 'tr' ? 'Hesap Defteri' : 'Wallet Ledger'} withArrow position="top">
                          <ActionIcon
                            size="sm"
                            variant="light"
                            color="green"
                            onClick={() => onOpenLedger && onOpenLedger(w.address)}
                          >
                            <IconBook size={14} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label={lang === 'tr' ? 'Para İzi (Multi-Hop)' : 'Money Trail'} withArrow position="top">
                          <ActionIcon
                            size="sm"
                            variant="light"
                            color="violet"
                            onClick={() => onOpenTrail && onOpenTrail(w.address)}
                          >
                            <IconGitFork size={14} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label={lang === 'tr' ? 'Karşılaştır' : 'Compare'} withArrow position="top">
                          <ActionIcon
                            size="sm"
                            variant="light"
                            color="grape"
                            onClick={() => onOpenCompare && onOpenCompare(w.address)}
                          >
                            <IconScale size={14} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Box>
      </Paper>
    </Stack>
  );
}
