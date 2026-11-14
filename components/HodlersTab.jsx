'use client';
import { useState, useEffect } from 'react';
import {
  Paper,
  Title,
  Text,
  Table,
  Badge,
  Group,
  Box,
  Pagination,
  SimpleGrid,
  TextInput,
  ActionIcon,
  Tooltip,
  Stack,
  Select,
  SegmentedControl,
  Progress,
  Card,
  Button,
} from '@mantine/core';
import {
  IconSearch,
  IconEye,
  IconBook,
  IconGitFork,
  IconX,
  IconUsers,
  IconCoins,
  IconBuildingBank,
  IconNetwork,
} from '@tabler/icons-react';
import { formatHMND, formatUSD, formatTimestamp, shortAddr } from './formatters';
import { useLanguage } from './LanguageContext';
import { useModuleFields } from './ModuleLayout';
import KpiStatCard from './ui/KpiStatCard';
import AddressBadge from './ui/AddressBadge';
import AmountDisplay from './ui/AmountDisplay';

export default function HodlersTab({
  onSelectAddress,
  onOpenLedger,
  onOpenTrail,
}) {
  const { lang } = useLanguage();
  const { t, fields } = useModuleFields();
  const [data, setData] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [network, setNetwork] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState('25');
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchHodlers = () => {
    setLoading(true);
    const params = new URLSearchParams({
      network,
      page: String(page),
      limit: String(pageSize),
    });
    if (searchQuery.trim()) {
      params.append('q', searchQuery.trim());
    }

    fetch(`/api/hodlers?${params.toString()}`)
      .then((res) => res.json())
      .then((resData) => {
        setData(resData.items || []);
        setKpis(resData.kpis || null);
        setTotalPages(resData.pagination?.totalPages || 1);
        setTotalCount(resData.pagination?.totalCount || 0);
        setLoading(false);
      })
      .catch((err) => {
        console.error('fetchHodlers error:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchHodlers();
  }, [network, page, pageSize]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchHodlers();
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setPage(1);
    setTimeout(fetchHodlers, 0);
  };

  const locStr = lang || undefined;

  return (
    <Stack gap="md">
      {/* 1. HERO HEADER & DUAL-NETWORK COMPARISON CARDS */}
      <Paper p="md" className="glass-panel" style={{ borderRadius: 8 }}>
        <Group justify="space-between" mb="xs" align="flex-start" wrap="wrap">
          <div>
            <Group gap={8}>
              <Badge color="teal" variant="light" size="md">
                👥 {t('hodlers_supplyAssetDistribution')}
              </Badge>
              <Title order={4}>
                {t('hodlers_walletHodlersDualNetwork')}
              </Title>
            </Group>
            <Text size="xs" c="dimmed" mt={4}>
              {t('hodlers_topWalletBalancesCirculating')}
            </Text>
          </div>
        </Group>

        {/* 4 KPI Comparison Cards */}
        <SimpleGrid cols={{ base: 1, xs: 2, sm: 4 }} spacing="sm" mt="sm">
          {/* Total Balance and Wallets */}
          <KpiStatCard
            title={t('hodlers_totalTrackedBalance')}
            value={formatHMND(kpis?.total_balance_hmnd || 0, { locale: lang, showScale: false })}
            color="teal"
            icon={IconCoins}
            subtext={`${kpis?.total_holders || 0} ${t('hodlers_verifiedWallets')}`}
          />

          {/* Substrate Network */}
          <Card p="sm" style={{ background: '#fff1e5', border: '1px solid #d9cbbe', borderRadius: 0 }}>
            <Group justify="space-between" align="center" mb={6}>
              <Badge color="teal" variant="light" size="xs">
                {t('hodlers_substrateNetwork')}
              </Badge>
              <IconNetwork size={16} color="#0d7680" />
            </Group>
            <Text size="md" fw={800} style={{ color: '#0d7680', fontFamily: 'var(--font-mono)' }}>
              {formatHMND(kpis?.substrate_balance_hmnd || 0, { locale: lang, showScale: false })}
            </Text>
            <Group justify="space-between" mt={4}>
              <Text size="xs" c="dimmed">
                {kpis?.substrate_holders || 0} {t('hodlers_wallets_3')}
              </Text>
              <Badge color="teal" variant="light" size="xs">
                %{kpis?.substrate_share_percent || 0} {t('hodlers_share_2')}
              </Badge>
            </Group>
          </Card>

          {/* EVM Network */}
          <Card p="sm" style={{ background: '#fff1e5', border: '1px solid #d9cbbe', borderRadius: 0 }}>
            <Group justify="space-between" align="center" mb={6}>
              <Badge color="cyan" variant="light" size="xs">
                {t('hodlers_evmNetwork')}
              </Badge>
              <IconBuildingBank size={16} color="#0d7680" />
            </Group>
            <Text size="md" fw={800} style={{ color: '#0d7680', fontFamily: 'var(--font-mono)' }}>
              {formatHMND(kpis?.evm_balance_hmnd || 0, { locale: lang, showScale: false })}
            </Text>
            <Group justify="space-between" mt={4}>
              <Text size="xs" c="dimmed">
                {kpis?.evm_holders || 0} {t('hodlers_wallets_3')}
              </Text>
              <Badge color="cyan" variant="light" size="xs">
                %{kpis?.evm_share_percent || 0} {t('hodlers_share_2')}
              </Badge>
            </Group>
          </Card>

          {/* Top Hodler Concentration Share */}
          <KpiStatCard
            title={t('hodlers_top1HolderShare')}
            value={`%${kpis?.top_holder_share || 0}`}
            color="yellow"
            icon={IconUsers}
            subtext={t('hodlers_circulatingSupplyConcentration')}
          />
        </SimpleGrid>
      </Paper>

      {/* 2. HODLERS TABLE AND STICKY SEARCH BAR */}
      <Paper p="md" style={{ background: '#f5e6d8', border: '1px solid #d9cbbe', borderTop: '2px solid #111111', borderRadius: 0 }}>
        <Stack gap="sm">
          {/* TOOLBAR */}
          <Box
            p="xs"
            style={{
              backgroundColor: '#f5e6d8',
              borderRadius: 0,
              border: '1px solid #d9cbbe',
            }}
          >
            <Group justify="space-between" align="center" wrap="wrap" gap="sm">
              <Group gap="xs" wrap="wrap">
                <SegmentedControl
                  size="xs"
                  value={network}
                  onChange={(val) => {
                    setNetwork(val);
                    setPage(1);
                  }}
                  data={[
                    { value: 'all', label: t('hodlers_all') },
                    { value: 'substrate', label: '⚡ Substrate (hm...)' },
                    { value: 'evm', label: '🌐 EVM (0x...)' },
                    { value: 'cross_layer', label: t('hodlers_optCrossLayer') },
                  ]}
                  styles={{
                    root: { background: '#ecdcd0', border: '1px solid #d9cbbe' },
                  }}
                />
                <Badge variant="light" color="teal" size="sm">
                  {totalCount.toLocaleString(locStr)} {t('hodlers_wallets_3')}
                </Badge>
              </Group>

              <Group gap="xs" style={{ maxWidth: 420, width: '100%' }}>
                <form onSubmit={handleSearchSubmit} style={{ flex: 1 }}>
                  <TextInput
                    size="xs"
                    placeholder={t('hodlers_searchWalletOrLabel')}
                    leftSection={<IconSearch size={14} />}
                    rightSection={
                      searchQuery && (
                        <ActionIcon size="xs" variant="subtle" color="gray" onClick={handleClearSearch}>
                          <IconX size={12} />
                        </ActionIcon>
                      )
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </form>
                <Select
                  size="xs"
                  value={pageSize}
                  onChange={(val) => {
                    setPageSize(val || '25');
                    setPage(1);
                  }}
                  data={[
                    { value: '25', label: t('perPage', { count: 25 }) },
                    { value: '50', label: t('perPage', { count: 50 }) },
                    { value: '100', label: t('perPage', { count: 100 }) },
                  ]}
                  style={{ width: 105 }}
                />
              </Group>
            </Group>
          </Box>

          {/* TABLO */}
          <Table.ScrollContainer minWidth={800}>
            <Table highlightOnHover verticalSpacing="xs">
              <Table.Thead
                style={{
                  backgroundColor: '#f5e6d8',
                  borderBottom: '2px solid #111111',
                }}
              >
                <Table.Tr>
                  <Table.Th style={{ width: 60, textAlign: 'center' }}>#</Table.Th>
                  <Table.Th>{t('hodlers_walletAddressId')}</Table.Th>
                  <Table.Th style={{ width: 120 }}>{t('hodlers_network')}</Table.Th>
                  <Table.Th style={{ textAlign: 'right', width: 180 }}>{t('hodlers_balanceHmnd')}</Table.Th>
                  <Table.Th style={{ width: 150 }}>{t('hodlers_circulatingShare')}</Table.Th>
                  <Table.Th>{t('hodlers_crossLayerCounterpart')}</Table.Th>
                  <Table.Th style={{ width: 90, textAlign: 'center' }}>{t('colActions')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {loading ? (
                  <Table.Tr>
                    <Table.Td colSpan={7} align="center" py="xl">
                      <Text size="sm" c="dimmed">
                        {t('loading')}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : data.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={7} align="center" py="xl">
                      <Text size="sm" c="dimmed">
                        {t('hodlers_noWalletsFoundMatching')}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  data.map((item) => {
                    const isSub = item.layer === 'Substrate';
                    return (
                      <Table.Tr key={item.address}>
                        <Table.Td style={{ textAlign: 'center' }}>
                          <Badge
                            size="xs"
                            variant={item.rank <= 3 ? 'filled' : 'light'}
                            color={item.rank === 1 ? 'yellow' : item.rank === 2 ? 'gray' : item.rank === 3 ? 'orange' : 'dark'}
                          >
                            #{item.rank}
                          </Badge>
                        </Table.Td>

                        <Table.Td>
                          <Group gap="xs" wrap="nowrap">
                            <AddressBadge
                              address={item.address}
                              label={item.label}
                              onSelectAddress={onSelectAddress}
                              onOpenLedger={onOpenLedger}
                              size="xs"
                            />
                          </Group>
                        </Table.Td>

                        <Table.Td>
                          <Badge
                            size="xs"
                            variant="light"
                            color={isSub ? 'teal' : 'cyan'}
                            styles={{ root: { fontSize: 10, fontWeight: 700 } }}
                          >
                            {isSub ? '⚡ Substrate' : '🌐 EVM'}
                          </Badge>
                        </Table.Td>

                        <Table.Td style={{ textAlign: 'right' }}>
                          <AmountDisplay value={item.balance_hmnd} amount={item.balance_hmnd} size="xs" showUSD={false} />
                        </Table.Td>

                        <Table.Td>
                          <Stack gap={2}>
                            <Group justify="space-between">
                              <Text size="11px" fw={700} c="dimmed">
                                %{item.share_percent}
                              </Text>
                            </Group>
                            <Progress
                              value={Math.min(item.share_percent * 4, 100)}
                              size="xs"
                              color="#0d7680"
                              radius={0}
                            />
                          </Stack>
                        </Table.Td>

                        <Table.Td>
                          {item.counterpart ? (
                            <AddressBadge
                              address={item.counterpart}
                              onSelectAddress={onSelectAddress}
                              onOpenLedger={onOpenLedger}
                              size="xs"
                            />
                          ) : (
                            <Text size="xs" c="dimmed">-</Text>
                          )}
                        </Table.Td>

                        <Table.Td style={{ textAlign: 'center' }}>
                          <Group gap={4} justify="center" wrap="nowrap">
                            {onOpenLedger && (
                              <Tooltip label={t('validators_walletLedger')} withArrow>
                                <ActionIcon
                                  size="xs"
                                  variant="subtle"
                                  style={{ color: '#0d7680' }}
                                  onClick={() => onOpenLedger(item.address)}
                                >
                                  <IconBook size={13} />
                                </ActionIcon>
                              </Tooltip>
                            )}
                            {onOpenTrail && (
                              <Tooltip label={t('unlocks_moneyTrail')} withArrow>
                                <ActionIcon
                                  size="xs"
                                  variant="subtle"
                                  style={{ color: '#0d7680' }}
                                  onClick={() => onOpenTrail(item.address)}
                                >
                                  <IconGitFork size={13} />
                                </ActionIcon>
                              </Tooltip>
                            )}
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })
                )}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>

          {/* SAYFALAMA */}
          {totalPages > 1 && (
            <Group justify="space-between" align="center" mt="sm">
              <Text size="xs" c="dimmed">
                {t('paginationSummary', { page: page, totalPages: totalPages, total: totalCount.toLocaleString(locStr) })}
              </Text>
              <Pagination
                size="sm"
                value={page}
                onChange={setPage}
                total={totalPages}
                siblings={1}
                boundaries={1}
              />
            </Group>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}
