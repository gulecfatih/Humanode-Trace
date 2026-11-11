'use client';
import { useState, useEffect } from 'react';
import {
  Paper,
  SimpleGrid,
  Text,
  Title,
  Group,
  TextInput,
  Select,
  Button,
  Table,
  Badge,
  Pagination,
  Stack,
  Box,
  CopyButton,
  ActionIcon,
  Tooltip,
  Modal,
  SegmentedControl,
  Switch,
  Progress,
  Divider,
  ScrollArea,
} from '@mantine/core';
import {
  IconSearch,
  IconFilter,
  IconCopy,
  IconCheck,
  IconEye,
  IconBook,
  IconCube,
  IconActivity,
  IconGasStation,
  IconArrowRight,
  IconClock,
  IconFlame,
  IconCalendar,
  IconTrendingUp,
  IconX,
  IconSparkles,
  IconGitFork,
  IconExternalLink,
} from '@tabler/icons-react';
import {
  formatHMND,
  formatFee,
  formatUSD,
  formatHMNDWithUSD,
  formatCompact,
  formatTimestamp,
  timeAgo,
  shortAddr,
  formatNumber,
} from './formatters';
import { useLanguage, LanguageSwitcher } from './LanguageContext';
import { useModuleFields } from './ModuleLayout';
import KpiStatCard from './ui/KpiStatCard';
import AmountDisplay from './ui/AmountDisplay';
import AddressBadge from './ui/AddressBadge';

export default function OverviewTab({
  initialDate,
  onSelectAddress,
  onOpenLedger,
  onOpenTrail,
  onOpenBlock,
  onOpenTx,
}) {
  const { lang } = useLanguage();
  const { t, fields } = useModuleFields();
  const [stats, setStats] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [activities, setActivities] = useState([]);
  const [viewMode, setViewMode] = useState('block'); // 'block' veya 'tx'
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPallet, setSelectedPallet] = useState('all');
  const [layerFilter, setLayerFilter] = useState('all');
  const [hideZeroFee, setHideZeroFee] = useState(true);
  const [loading, setLoading] = useState(false);

  // Date range filter & gas calculation state
  const [startDate, setStartDate] = useState(initialDate ? `${initialDate}T00:00` : '');
  const [endDate, setEndDate] = useState(initialDate ? `${initialDate}T23:59` : '');
  const [quickFilter, setQuickFilter] = useState(initialDate ? 'custom' : 'all'); // 'all', 'today', 'yesterday', '7d', '30d', '1y', 'custom'
  const [rangeStats, setRangeStats] = useState(null);
  const [rangeLoading, setRangeLoading] = useState(false);

  // Periodic gas & activity chart (Yearly / Monthly / Weekly / Daily)
  const [chartInterval, setChartInterval] = useState('month'); // 'year', 'month', 'week', 'day'
  const [chartDayScope, setChartDayScope] = useState('30d'); // '30d', '90d', '1y', 'all'
  const [chartMetric, setChartMetric] = useState('fee'); // 'fee', 'count', 'volume'
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);

  // Block & transaction detail modal state
  const [selectedBlockModal, setSelectedBlockModal] = useState(null);
  const [loadingBlockModal, setLoadingBlockModal] = useState(false);
  const [selectedTxModal, setSelectedTxModal] = useState(null);
  const [loadingTxModal, setLoadingTxModal] = useState(false);

  // 1. General KPIs and indexer progress polling. TODO: Use WebSocket stream for sub-second updates
  useEffect(() => {
    const fetchStatsAndProgress = () => {
      fetch('/api/stats')
        .then((res) => res.json())
        .then((d) => setStats(d))
        .catch(console.error);

      fetch('/api/progress')
        .then((res) => res.json())
        .then((d) => setProgressData(d))
        .catch(console.error);
    };

    fetchStatsAndProgress();
    const interval = setInterval(fetchStatsAndProgress, 4000);
    return () => clearInterval(interval);
  }, []);

  // 2. Periodic gas and activity chart synchronized with active filters
  const loadDailyChart = () => {
    setChartLoading(true);
    const params = new URLSearchParams({
      interval: chartInterval,
      hideZeroFee: hideZeroFee ? 'true' : 'false',
      layer: layerFilter,
      pallet: selectedPallet,
    });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (searchQuery.trim()) params.append('q', searchQuery.trim());

    fetch(`/api/daily?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setChartData(Array.isArray(data) ? data : []);
        setChartLoading(false);
      })
      .catch((err) => {
        console.error('loadDailyChart hatası:', err);
        setChartData([]);
        setChartLoading(false);
      });
  };

  useEffect(() => {
    loadDailyChart();
  }, [chartInterval, chartMetric, layerFilter, selectedPallet, hideZeroFee, startDate, endDate, searchQuery]);

  // 3. Range-specific gas analytics and calculation
  const loadRangeStats = () => {
    setRangeLoading(true);
    const params = new URLSearchParams({
      layer: layerFilter,
      pallet: selectedPallet,
      filter: quickFilter,
      hideZeroFee: hideZeroFee ? 'true' : 'false',
    });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (searchQuery.trim()) params.append('q', searchQuery.trim());

    fetch(`/api/stats?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setRangeStats(data);
        setRangeLoading(false);
      })
      .catch((err) => {
        console.error('loadRangeStats hatası:', err);
        setRangeLoading(false);
      });
  };

  useEffect(() => {
    loadRangeStats();
  }, [startDate, endDate, quickFilter, layerFilter, selectedPallet, hideZeroFee, searchQuery]);

  // 4. Fetch blocks or transactions for targeted date range
  const loadActivities = () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: '25',
      viewMode,
      pallet: selectedPallet,
      layer: layerFilter,
      hideZeroFee: hideZeroFee ? 'true' : 'false',
    });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (searchQuery.trim()) params.append('q', searchQuery.trim());

    fetch(`/api/search?${params.toString()}`)
      .then((res) => res.json())
      .then((resData) => {
        const items = resData.results || resData.items || [];
        const pages = resData.pagination?.totalPages || resData.totalPages || 1;
        const total = resData.pagination?.totalCount || resData.count || items.length;
        setActivities(items);
        setTotalPages(pages);
        setTotalCount(total);
        setLoading(false);
      })
      .catch((err) => {
        console.error('loadActivities hatası:', err);
        setActivities([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadActivities();
  }, [page, viewMode, selectedPallet, layerFilter, hideZeroFee, startDate, endDate, quickFilter]);

  // Quick date preset click handler
  const handleQuickFilter = (qf) => {
    setQuickFilter(qf);
    setPage(1);

    const now = new Date();
    if (qf === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (qf === 'today') {
      const todayStr = now.toISOString().slice(0, 10);
      setStartDate(`${todayStr}T00:00`);
      setEndDate(`${todayStr}T23:59`);
    } else if (qf === 'yesterday') {
      const yest = new Date(now.getTime() - 86400000);
      const yestStr = yest.toISOString().slice(0, 10);
      setStartDate(`${yestStr}T00:00`);
      setEndDate(`${yestStr}T23:59`);
    } else if (qf === '7d') {
      const d7 = new Date(now.getTime() - 7 * 86400000);
      setStartDate(`${d7.toISOString().slice(0, 10)}T00:00`);
      setEndDate(`${now.toISOString().slice(0, 10)}T23:59`);
    } else if (qf === '30d') {
      const d30 = new Date(now.getTime() - 30 * 86400000);
      setStartDate(`${d30.toISOString().slice(0, 10)}T00:00`);
      setEndDate(`${now.toISOString().slice(0, 10)}T23:59`);
    } else if (qf === '1y') {
      setStartDate('2026-01-01T00:00');
      setEndDate('2026-12-31T23:59');
    }
  };

  // Clear all active filters and reset query parameters
  const handleResetFilters = () => {
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setQuickFilter('all');
    setSelectedPallet('all');
    setLayerFilter('all');
    setHideZeroFee(true);
    setPage(1);
  };

  // Filter blocks corresponding to clicked chart bar timestamp window
  const handleBarClick = (item) => {
    if (!item?.period && !item?.day) return;
    const period = item.period || item.day;
    setQuickFilter('custom');
    setPage(1);

    if (chartInterval === 'year') {
      setStartDate(`${period}-01-01T00:00`);
      setEndDate(`${period}-12-31T23:59`);
    } else if (chartInterval === 'month') {
      const parts = String(period).split('-');
      if (parts.length === 2) {
        const yr = parseInt(parts[0], 10);
        const mo = parseInt(parts[1], 10);
        const lastDay = new Date(yr, mo, 0).getDate();
        setStartDate(`${period}-01T00:00`);
        setEndDate(`${period}-${String(lastDay).padStart(2, '0')}T23:59`);
      } else {
        setStartDate(`${period}-01T00:00`);
        setEndDate(`${period}-28T23:59`);
      }
    } else if (chartInterval === 'week') {
      const parts = String(period).split('-W');
      if (parts.length === 2) {
        const yr = parseInt(parts[0], 10);
        const wk = parseInt(parts[1], 10);
        const simple = new Date(Date.UTC(yr, 0, 1 + (wk - 1) * 7));
        const dow = simple.getUTCDay();
        const isoStart = simple;
        if (dow <= 4) isoStart.setUTCDate(simple.getUTCDate() - simple.getUTCDay() + 1);
        else isoStart.setUTCDate(simple.getUTCDate() + 8 - simple.getUTCDay());
        const isoEnd = new Date(isoStart);
        isoEnd.setUTCDate(isoEnd.getUTCDate() + 6);
        setStartDate(`${isoStart.toISOString().slice(0, 10)}T00:00`);
        setEndDate(`${isoEnd.toISOString().slice(0, 10)}T23:59`);
      } else {
        setStartDate(`${period}T00:00`);
        setEndDate(`${period}T23:59`);
      }
    } else {
      setStartDate(`${period}T00:00`);
      setEndDate(`${period}T23:59`);
    }

    const el = document.getElementById('unifiedTableArea');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Open detailed block inspection modal
  const handleOpenBlock = (blockNumber) => {
    if (!blockNumber) return;
    if (onOpenBlock) {
      onOpenBlock(blockNumber);
      return;
    }
    setLoadingBlockModal(true);
    fetch(`/api/block?number=${blockNumber}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.found) {
          setSelectedBlockModal(data);
        } else {
          setSelectedBlockModal({
            block_number: blockNumber,
            transactions: [],
            total_tx_count: 0,
            evm_count: 0,
            substrate_count: 0,
            total_fees_hmnd: 0,
            total_volume_hmnd: 0,
          });
        }
        setLoadingBlockModal(false);
      })
      .catch((err) => {
        console.error('Blok getirme hatası:', err);
        setLoadingBlockModal(false);
      });
  };

  // Open detailed transaction inspection modal (including internal transfers and DEX swaps)
  const handleOpenTx = (txHash) => {
    if (!txHash) return;
    if (onOpenTx) {
      onOpenTx(txHash);
      return;
    }
    setLoadingTxModal(true);
    fetch(`/api/transactions?hash=${encodeURIComponent(txHash)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && (data.tx || data.hash)) {
          const sender = data.tx?.from_address || data.tx?.signer || '';
          const isEvm = (data.layer || data.tx?.layer || '').toUpperCase() === 'EVM' || (!data.layer && sender.startsWith('0x') && sender.length === 42);
          const resolvedLayer = isEvm ? 'EVM' : 'SUBSTRATE';
          const txObj = data.tx ? { ...data.tx, layer: resolvedLayer, tokenTransfers: data.tokenTransfers || [] } : { ...data, layer: resolvedLayer };
          setSelectedTxModal(txObj);
        }
        setLoadingTxModal(false);
      })
      .catch((err) => {
        console.error('İşlem getirme hatası:', err);
        setLoadingTxModal(false);
      });
  };

  // Periodic chart data scaled by date range
  const displayChartData = (chartData && chartData.length > 0)
    ? (chartInterval === 'day' && !startDate && !endDate && (!quickFilter || quickFilter === 'all')
        ? (chartDayScope === '30d'
            ? chartData.slice(-30)
            : chartDayScope === '90d'
            ? chartData.slice(-90)
            : chartDayScope === '1y'
            ? chartData.slice(-365)
            : chartData)
        : chartData)
    : [];

  // Chart visualization metrics
  const maxMetricVal = Math.max(
    ...displayChartData.map((d) => {
      if (chartMetric === 'fee') return Number(d.total_fees_hmnd ?? d.totalFeesHmnd ?? 0);
      if (chartMetric === 'count') return Number(d.tx_count ?? d.txCount ?? 0);
      return Number(d.total_volume_hmnd ?? d.totalVolumeHmnd ?? 0);
    }),
    1
  );

  const totalChartFees = displayChartData.reduce((acc, d) => acc + Number(d.total_fees_hmnd ?? d.totalFeesHmnd ?? 0), 0);
  const totalChartFeesUsd = displayChartData.reduce((acc, d) => acc + Number(d.total_fees_usd ?? d.fees_usd ?? d.feesUsd ?? 0), 0);
  const totalChartTxs = displayChartData.reduce((acc, d) => acc + Number(d.tx_count ?? d.txCount ?? 0), 0);
  const totalChartVol = displayChartData.reduce((acc, d) => acc + Number(d.total_volume_hmnd ?? d.totalVolumeHmnd ?? 0), 0);

  const evmTxCount = stats?.progress?.totalEvmTxs || stats?.evm?.total_txs || stats?.totalTransactions || 0;
  const subExtrinsicCount = stats?.progress?.totalSubstrateExtrinsics || stats?.substrate?.total_extrinsics || stats?.totalExtrinsics || 0;
  const totalFeesHmnd = stats?.total_network_fees ?? stats?.totalFeesHmnd ?? ((stats?.evm?.total_fees_hmnd || 0) + (stats?.substrate?.total_fees_hmnd || 0));

  const isDateFiltered = Boolean(startDate || endDate || (quickFilter && quickFilter !== 'all'));

  // Active values for selected timeframe
  const displayFeesHmnd = rangeStats?.total_network_fees ?? rangeStats?.totalFeesHmnd ?? totalFeesHmnd ?? 0;
  const displayFeesUsd = rangeStats?.total_network_fees_usd ?? rangeStats?.totalFeesUsd ?? stats?.total_network_fees_usd ?? stats?.totalFeesUsd ?? 0;
  const displayTxCount = rangeStats?.total_all_transactions ?? (rangeStats?.totalTransactions != null ? (rangeStats.totalTransactions + (rangeStats.totalExtrinsics || 0)) : null) ?? (evmTxCount + subExtrinsicCount) ?? 0;
  const displayEvmCount = rangeStats?.evm?.total_txs ?? rangeStats?.totalTransactions ?? evmTxCount;
  const displaySubCount = rangeStats?.substrate?.total_extrinsics ?? rangeStats?.totalExtrinsics ?? subExtrinsicCount;
  const displayVolumeHmnd = rangeStats?.total_all_volume ?? rangeStats?.totalVolumeHmnd ?? ((stats?.evm?.total_volume_hmnd || 0) + (stats?.substrate?.total_volume_hmnd || 0)) ?? 0;
  const avgFeePerBlock = totalCount > 0 ? (displayFeesHmnd / totalCount) : 0;

  const loc = lang || undefined;

  return (
    <Stack gap="md">

      {/* 1. Senkronizasyon İlerleme Çubuğu */}
      {progressData && (
        <Paper p="sm" bg="rgba(22, 27, 34, 0.7)">
          <Group justify="space-between" mb={4}>
            <Text size="xs" fw={700} c="cyan">
              {t('syncStatus')}: #{progressData.currentBlock?.toLocaleString(loc)} / #{(progressData.highestBlock ?? progressData.targetBlock)?.toLocaleString(loc)}
            </Text>
            <Group gap="xs">
              <Text size="xs" c="dimmed">{progressData.speed || 0} {t('blocksPerSec')}</Text>
              <Badge size="xs" color="teal">%{progressData.percentage || '100'}</Badge>
            </Group>
          </Group>
          <Progress
            value={parseFloat(progressData.percentage) || 100}
            size="sm"
            color="cyan"
            radius="xl"
            animated={progressData.percentage < 100}
          />
        </Paper>
      )}

      {/* 2. KPI Üst Özet Kartları */}
      <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing="sm">
        <KpiStatCard
          title={t('totalEvmTx')}
          value={evmTxCount.toLocaleString(loc)}
          unit="TX"
          color="cyan"
          icon={IconActivity}
          subtext={t('totalEvmTxSub')}
          tooltip={`${evmTxCount.toLocaleString(loc)} toplam EVM tabanlı transfer ve akıllı sözleşme çağrısı`}
        />

        <KpiStatCard
          title={t('totalSubExtrinsics')}
          value={subExtrinsicCount.toLocaleString(loc)}
          unit="CALL"
          color="teal"
          icon={IconCube}
          subtext={t('totalSubExtrinsicsSub')}
          tooltip={`${subExtrinsicCount.toLocaleString(loc)} toplam Substrate extrinsic ve konsensüs çağrısı`}
        />

        <KpiStatCard
          title={t('bridgeTransfers')}
          value={formatHMND(stats?.bridge_swap_volume_hmnd ?? stats?.bridgeSwapVolumeHmnd ?? 0, { suffix: false, locale: lang })}
          unit="HMND"
          color="violet"
          icon={IconGitFork}
          subtext={`${t('bridgeTransfersSub')} (${(stats?.bridge_swap_count ?? stats?.bridgeSwapCount ?? 0).toLocaleString(loc)})`}
          tooltip={`Köprü üzerinden taşınan toplam hacim: ${(stats?.bridge_swap_count ?? stats?.bridgeSwapCount ?? 0).toLocaleString(loc)} işlem`}
        />

        <KpiStatCard
          title={t('totalBurnedGas')}
          value={formatFee(totalFeesHmnd, false, lang)}
          unit="HMND"
          color="yellow"
          icon={IconFlame}
          usdValue={formatUSD(stats?.total_network_fees_usd ?? stats?.totalFeesUsd ?? 0, lang)}
          subtext={`${t('totalBurnedGasSub')}`}
          tooltip={`Ağ genelinde yakılan net gas komisyonu: ${totalFeesHmnd} HMND`}
        />
      </SimpleGrid>

      {/* 3. UNIFIED PRIMARY DASHBOARD (Filters, Gas Estimator, Chart & Blocks) */}
      <Paper p="md" id="unifiedSection" style={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <Stack gap="md">
          {/* Üst Başlık & Görünüm Seçimi */}
          <Group justify="space-between" align="center" wrap="wrap" gap="sm">
            <Group gap="xs" align="center">
              <IconFlame size={22} color="#f59e0b" />
              <div>
                <Title order={4} style={{ color: '#f0f6fc' }}>
                  {t('unifiedTitle')}
                </Title>
                <Text size="xs" c="dimmed">
                  {t('unifiedDesc')}
                </Text>
              </div>
            </Group>
          </Group>

          {/* Filter and Date Range Ribbon */}
          <Paper p="sm" bg="rgba(0,0,0,0.25)" style={{ borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <Stack gap="xs">
              <Group justify="space-between" align="center" wrap="wrap" gap="xs">
                <Text size="xs" fw={700} c="cyan" tt="uppercase" style={{ letterSpacing: 0.5 }}>
                  {t('dateRangePresets')}
                </Text>

                <Group gap={6}>
                  <Button
                    size="compact-xs"
                    variant={quickFilter === 'all' && !startDate ? 'filled' : 'subtle'}
                    color="gray"
                    onClick={() => handleQuickFilter('all')}
                  >
                    {t('presetAll')}
                  </Button>
                  <Button
                    size="compact-xs"
                    variant={quickFilter === 'today' ? 'filled' : 'subtle'}
                    color="cyan"
                    onClick={() => handleQuickFilter('today')}
                  >
                    {t('presetToday')}
                  </Button>
                  <Button
                    size="compact-xs"
                    variant={quickFilter === 'yesterday' ? 'filled' : 'subtle'}
                    color="cyan"
                    onClick={() => handleQuickFilter('yesterday')}
                  >
                    {t('presetYesterday')}
                  </Button>
                  <Button
                    size="compact-xs"
                    variant={quickFilter === '7d' ? 'filled' : 'subtle'}
                    color="cyan"
                    onClick={() => handleQuickFilter('7d')}
                  >
                    {t('preset7d')}
                  </Button>
                  <Button
                    size="compact-xs"
                    variant={quickFilter === '30d' ? 'filled' : 'subtle'}
                    color="cyan"
                    onClick={() => handleQuickFilter('30d')}
                  >
                    {t('preset30d')}
                  </Button>
                  <Button
                    size="compact-xs"
                    variant={quickFilter === '1y' ? 'filled' : 'subtle'}
                    color="cyan"
                    onClick={() => handleQuickFilter('1y')}
                  >
                    {t('preset1y')}
                  </Button>
                </Group>
              </Group>

              {/* Detailed Filter Selectors */}
              <Group gap="sm" align="flex-end" wrap="wrap">
                <TextInput
                  type="datetime-local"
                  size="xs"
                  label={t('startDate')}
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setQuickFilter('custom');
                    setPage(1);
                  }}
                  style={{ minWidth: 190 }}
                />

                <TextInput
                  type="datetime-local"
                  size="xs"
                  label={t('endDate')}
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setQuickFilter('custom');
                    setPage(1);
                  }}
                  style={{ minWidth: 190 }}
                />

                <Select
                  size="xs"
                  label={t('layer')}
                  data={[
                    { value: 'all', label: t('layerAll') },
                    { value: 'evm', label: t('layerEvm') },
                    { value: 'substrate', label: t('layerSub') },
                  ]}
                  value={layerFilter}
                  onChange={(val) => {
                    setLayerFilter(val);
                    setPage(1);
                  }}
                  style={{ width: 170 }}
                />

                <Select
                  size="xs"
                  label={t('module')}
                  data={[
                    { value: 'all', label: t('moduleAll') },
                    { value: 'ethereum', label: 'ethereum (EVM / Smart Contracts)' },
                    { value: 'balances', label: 'balances (HMND Transfer)' },
                    { value: 'bioauth', label: 'bioauth (Bioauth Heartbeats)' },
                    { value: 'nativeToEvmSwap', label: 'nativeToEvmSwap (Cross-Layer Bridge)' },
                    { value: 'vesting', label: 'vesting (Locks & Vesting)' },
                    { value: 'session', label: 'session (Validator Sessions)' },
                  ]}
                  value={selectedPallet}
                  onChange={(val) => {
                    setSelectedPallet(val);
                    setPage(1);
                  }}
                  style={{ width: 220 }}
                />

                <Switch
                  label={t('hideZeroFee')}
                  size="xs"
                  checked={hideZeroFee}
                  onChange={(event) => {
                    setHideZeroFee(event.currentTarget.checked);
                    setPage(1);
                  }}
                  style={{ paddingBottom: 6 }}
                />

                {isDateFiltered && (
                  <Button
                    size="xs"
                    variant="subtle"
                    color="red"
                    leftSection={<IconX size={14} />}
                    onClick={handleResetFilters}
                    style={{ marginBottom: 4 }}
                  >
                    {t('resetFilters')}
                  </Button>
                )}
              </Group>
            </Stack>
          </Paper>

          {/* 5-Column Unified KPI Report */}
          <Paper
            p="md"
            style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(6, 182, 212, 0.08))',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              borderRadius: 8,
            }}
          >
            <Group justify="space-between" align="center" wrap="wrap" mb="xs">
              <Group gap={8}>
                <IconFlame size={18} color="#f59e0b" />
                <Title order={5} style={{ color: '#fbbf24' }}>
                  {t('kpiReportTitle')}
                </Title>
                <Badge color="orange" size="sm" variant="filled">
                  {!isDateFiltered
                    ? t('presetAll')
                    : quickFilter === 'today'
                    ? t('presetToday')
                    : quickFilter === 'yesterday'
                    ? t('presetYesterday')
                    : quickFilter === '7d'
                    ? t('preset7d')
                    : quickFilter === '30d'
                    ? t('preset30d')
                    : quickFilter === '1y'
                    ? t('preset1y')
                    : 'Custom'}
                </Badge>
              </Group>

              <Text size="xs" c="dimmed">
                {startDate ? startDate.replace('T', ' ') : '2022-11-15 (Genesis)'} ➔ {endDate ? endDate.replace('T', ' ') : (t('overview_present'))}
              </Text>
            </Group>

            <Divider my="xs" color="rgba(255, 255, 255, 0.08)" />

            <SimpleGrid cols={{ base: 1, xs: 2, sm: 3, lg: 5 }} spacing="sm">
              {/* 1. Burned Gas KPI Card */}
              <Box p="xs" style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 6, borderLeft: '3px solid #f59e0b' }}>
                <Text size="11px" c="dimmed" tt="uppercase" fw={700}>{t('kpiBurnedGas')}</Text>
                <Box my={3}>
                  <AmountDisplay
                    value={formatHMND(displayFeesHmnd, { suffix: false, locale: lang })}
                    unit="HMND"
                    color="#f59e0b"
                    size="md"
                    usdValue={formatUSD(displayFeesUsd, lang)}
                  />
                </Box>
                <Text size="10px" c="yellow.5" style={{ lineHeight: 1.3 }}>
                  {t('kpiBurnedGasSub')}
                </Text>
              </Box>

              {/* 2. Toplam Blok */}
              <Box p="xs" style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 6, borderLeft: '3px solid #38bdf8' }}>
                <Text size="11px" c="dimmed" tt="uppercase" fw={700}>{t('kpiTotalBlocks')}</Text>
                <Box my={3}>
                  <AmountDisplay
                    value={totalCount.toLocaleString(loc)}
                    unit={t('overview_blocks')}
                    color="#38bdf8"
                    size="md"
                  />
                </Box>
                <Text size="10px" c="dimmed" style={{ lineHeight: 1.3 }}>{t('kpiTotalBlocksSub')}</Text>
              </Box>

              {/* 3. Total Transactions KPI Card */}
              <Box p="xs" style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 6, borderLeft: '3px solid #10b981' }}>
                <Text size="11px" c="dimmed" tt="uppercase" fw={700}>{t('kpiTotalTxs')}</Text>
                <Box my={3}>
                  <AmountDisplay
                    value={displayTxCount.toLocaleString(loc)}
                    unit={t('overview_txs_3')}
                    color="#10b981"
                    size="md"
                  />
                </Box>
                <Text size="10px" c="dimmed" style={{ lineHeight: 1.3 }}>
                  {displayEvmCount.toLocaleString(loc)} EVM, {displaySubCount.toLocaleString(loc)} Sub
                </Text>
              </Box>

              {/* 4. Toplam Hacim */}
              <Box p="xs" style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 6, borderLeft: '3px solid #14b8a6' }}>
                <Text size="11px" c="dimmed" tt="uppercase" fw={700}>{t('kpiTotalVol')}</Text>
                <Box my={3}>
                  <AmountDisplay
                    value={formatHMND(displayVolumeHmnd, { suffix: false, locale: lang })}
                    unit="HMND"
                    color="#14b8a6"
                    size="md"
                  />
                </Box>
                <Text size="10px" c="dimmed" style={{ lineHeight: 1.3 }}>{t('kpiTotalVolSub')}</Text>
              </Box>

              {/* 5. Ortalama Gas / Blok */}
              <Box p="xs" style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 6, borderLeft: '3px solid #a855f7' }}>
                <Text size="11px" c="dimmed" tt="uppercase" fw={700}>{t('kpiAvgGas')}</Text>
                <Box my={3}>
                  <AmountDisplay
                    value={formatFee(avgFeePerBlock, false, lang)}
                    unit="HMND"
                    color="#a855f7"
                    size="md"
                  />
                </Box>
                <Text size="10px" c="dimmed" style={{ lineHeight: 1.3 }}>{t('kpiAvgGasSub')}</Text>
              </Box>
            </SimpleGrid>
          </Paper>

          {/* Interactive Bar Chart Visualization */}
          <Paper p="sm" bg="rgba(0,0,0,0.35)" style={{ borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
            <Group justify="space-between" align="center" mb="xs" wrap="wrap" gap="xs">
              <Group gap="xs">
                <IconTrendingUp size={16} color="#38bdf8" />
                <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                  {t('chartTitle')}
                </Text>
              </Group>

              <Group gap="xs" wrap="wrap">
                <SegmentedControl
                  size="xs"
                  value={chartMetric}
                  onChange={setChartMetric}
                  data={[
                    { value: 'fee', label: t('metricFee') },
                    { value: 'count', label: t('metricCount') },
                    { value: 'volume', label: t('metricVol') },
                  ]}
                  color="orange"
                />

                {chartInterval === 'day' && !startDate && !endDate && (!quickFilter || quickFilter === 'all') && (
                  <SegmentedControl
                    size="xs"
                    value={chartDayScope}
                    onChange={setChartDayScope}
                    data={[
                      { value: '30d', label: t('preset30d') },
                      { value: '90d', label: t('overview_last90Days') },
                      { value: '1y', label: t('overview_last1Year') },
                      { value: 'all', label: t('overview_allTime') },
                    ]}
                    color="teal"
                  />
                )}

                <SegmentedControl
                  size="xs"
                  value={chartInterval}
                  onChange={setChartInterval}
                  data={[
                    { value: 'day', label: t('intervalDay') },
                    { value: 'week', label: t('intervalWeek') },
                    { value: 'month', label: t('intervalMonth') },
                    { value: 'year', label: t('intervalYear') },
                  ]}
                  color="cyan"
                />
              </Group>
            </Group>

            <ScrollArea h={225} offsetScrollbars type="auto">
              <Box style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: chartInterval === 'day' ? 2 : 5,
                width: 'max-content',
                minWidth: '100%',
                height: 165,
                paddingBottom: chartInterval === 'day' ? 44 : 26,
                paddingTop: 10
              }}>
                {displayChartData.length > 0 ? (
                  displayChartData.map((bar, idx) => {
                    const feeVal = Number(bar.total_fees_hmnd ?? bar.totalFeesHmnd ?? 0);
                    const feeUsdVal = Number(bar.total_fees_usd ?? bar.fees_usd ?? bar.feesUsd ?? 0);
                    const txVal = Number(bar.tx_count ?? bar.txCount ?? 0);
                    const volVal = Number(bar.total_volume_hmnd ?? bar.totalVolumeHmnd ?? 0);

                    const currVal = chartMetric === 'fee' ? feeVal : chartMetric === 'count' ? txVal : volVal;

                    // Power-law / logarithmic chart scale (prevents massive whale bars from squashing baseline daily bars)
                    let heightPercent = 6;
                    if (currVal > 0 && maxMetricVal > 0) {
                      if (chartMetric === 'volume') {
                        const logV = Math.log10(Math.max(1, currVal));
                        const logM = Math.log10(Math.max(10, maxMetricVal));
                        heightPercent = Math.max(10, Math.min(100, Math.round((logV / logM) * 100)));
                      } else {
                        const ratio = currVal / maxMetricVal;
                        heightPercent = Math.max(8, Math.min(100, Math.round(Math.pow(ratio, 0.38) * 100)));
                      }
                    }

                    const barColor = chartMetric === 'fee'
                      ? 'linear-gradient(180deg, #f59e0b 0%, #ea580c 100%)'
                      : chartMetric === 'count'
                      ? 'linear-gradient(180deg, #38bdf8 0%, #0284c7 100%)'
                      : 'linear-gradient(180deg, #10b981 0%, #059669 100%)';

                    const periodLabel = bar.period || bar.day || idx;
                    const tipContent = `${periodLabel} (${t('overview_period')}):\n🔥 ${t('metricFee')}: ${formatFee(feeVal, true, lang)} (≈ $${feeUsdVal.toLocaleString(loc, { maximumFractionDigits: 2 })})\n⚡ ${t('metricCount')}: ${txVal.toLocaleString(loc)}\n💰 ${t('metricVol')}: ${formatHMND(volVal, { locale: lang })}\n\n👉 ${t('overview_clickToFilterBlocks')}`;

                    const totalBars = displayChartData.length;
                    let showLabel = false;
                    let labelText = '';
                    let isVertical = false;

                    if (chartInterval === 'year') {
                      showLabel = true;
                      labelText = periodLabel;
                    } else if (chartInterval === 'month') {
                      showLabel = true;
                      labelText = periodLabel.slice(2);
                    } else if (chartInterval === 'week') {
                      labelText = periodLabel.slice(2);
                      if (totalBars > 40) {
                        isVertical = true;
                        showLabel = idx % 2 === 0 || idx === totalBars - 1;
                      } else {
                        showLabel = true;
                      }
                    } else {
                      // Daily view: Intelligent non-overlapping calendar step intervals (TradingView / CoinGecko standard)
                      isVertical = true;
                      labelText = String(periodLabel).slice(5); // MM-DD
                      if (totalBars <= 31) {
                        showLabel = true; // Fits comfortably for up to 31 daily intervals
                      } else if (totalBars <= 90) {
                        showLabel = idx % 3 === 0 || idx === totalBars - 1;
                      } else if (totalBars <= 180) {
                        showLabel = idx % 7 === 0 || idx === totalBars - 1;
                      } else if (totalBars <= 365) {
                        showLabel = idx % 14 === 0 || idx === totalBars - 1;
                      } else {
                        showLabel = String(periodLabel).endsWith('-01') || idx === 0 || idx === totalBars - 1;
                      }
                    }

                    const barFlex = chartInterval === 'year'
                      ? '1 1 80px'
                      : chartInterval === 'month'
                      ? '1 1 30px'
                      : chartInterval === 'week'
                      ? (totalBars > 80 ? '0 0 16px' : '1 1 20px')
                      : (totalBars > 90 ? '0 0 14px' : totalBars > 31 ? '1 1 18px' : '1 1 26px');

                    return (
                      <Tooltip key={periodLabel} label={tipContent} withArrow position="top" multiline>
                        <Box
                          onClick={() => handleBarClick(bar)}
                          style={{
                            flex: barFlex,
                            minWidth: chartInterval === 'day' ? (totalBars > 90 ? 13 : totalBars > 31 ? 16 : 22) : 20,
                            height: `${heightPercent}%`,
                            background: barColor,
                            borderRadius: '4px 4px 1px 1px',
                            cursor: 'pointer',
                            position: 'relative',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.3)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
                        >
                          {showLabel && (
                            <Text
                              size={isVertical ? '8px' : '9px'}
                              className="font-mono"
                              c="dimmed"
                              style={{
                                position: 'absolute',
                                bottom: isVertical ? -38 : -22,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                writingMode: isVertical ? 'vertical-rl' : 'horizontal-tb',
                                whiteSpace: 'nowrap',
                                pointerEvents: 'none',
                                letterSpacing: '-0.5px',
                                opacity: 0.85,
                              }}
                            >
                              {labelText}
                            </Text>
                          )}
                        </Box>
                      </Tooltip>
                    );
                  })
                ) : (
                  <Text size="sm" c="dimmed" style={{ width: '100%', textAlign: 'center', padding: '40px' }}>
                    {chartLoading ? t('chartLoading') : t('chartEmpty')}
                  </Text>
                )}
              </Box>
            </ScrollArea>
          </Paper>

          {/* Arama Inputu */}
          <form id="unifiedTableArea" onSubmit={(e) => { e.preventDefault(); setPage(1); loadActivities(); }}>
            <Group gap="sm">
              <TextInput
                placeholder={t('searchPlaceholderOverview')}
                leftSection={<IconSearch size={16} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex: 1 }}
              />
              <Button type="submit" color="cyan" leftSection={<IconFilter size={16} />}>
                {t('filterAndSearch')}
              </Button>
            </Group>
          </form>

          {/* Block / Extrinsic View Switcher and Table Header */}
          <Paper
            p="xs"
            bg="rgba(15, 23, 42, 0.75)"
            style={{
              borderRadius: 8,
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <Group justify="space-between" align="center" wrap="wrap" gap="sm">
              <Group gap="xs" align="center">
                <Title order={5} style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                  {viewMode === 'block'
                    ? isDateFiltered
                      ? t('blocksTableTitleFiltered')
                      : t('blocksTableTitle')
                    : t('txsTableTitle')}
                </Title>
                <Badge variant="light" color="cyan" size="sm" className="font-mono">
                  {totalCount.toLocaleString(loc)} {viewMode === 'block' ? (t('overview_blocks_2')) : (t('unlocks_txs_3'))}
                </Badge>
              </Group>

              <Group gap="sm" align="center" wrap="wrap">
                <Text size="xs" c="dimmed">
                  {t('pageInfo', { page, totalPages, total: totalCount.toLocaleString(loc) })}
                </Text>

                <SegmentedControl
                  value={viewMode}
                  onChange={(val) => {
                    setViewMode(val);
                    setPage(1);
                  }}
                  size="xs"
                  radius="md"
                  data={[
                    {
                      value: 'block',
                      label: (
                        <Group gap={6} align="center" wrap="nowrap">
                          <IconCube size={15} />
                          <Text size="xs" fw={600}>{t('viewBlocks')}</Text>
                        </Group>
                      ),
                    },
                    {
                      value: 'tx',
                      label: (
                        <Group gap={6} align="center" wrap="nowrap">
                          <IconActivity size={15} />
                          <Text size="xs" fw={600}>{t('viewTxs')}</Text>
                        </Group>
                      ),
                    },
                  ]}
                  color="cyan"
                />
              </Group>
            </Group>
          </Paper>

          {/* Blocks or Extrinsics Data Table */}
          <Box style={{ overflowX: 'auto' }}>
            {viewMode === 'block' ? (
              /* =================== BLOCK VIEW =================== */
              <Table striped highlightOnHover verticalSpacing="xs">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('colBlock')}</Table.Th>
                    <Table.Th>{t('colTimestamp')}</Table.Th>
                    <Table.Th>{t('colTxCount')}</Table.Th>
                    <Table.Th>{t('colPallets')}</Table.Th>
                    <Table.Th>{t('colBlockVol')}</Table.Th>
                    <Table.Th>{t('colBlockFee')}</Table.Th>
                    <Table.Th>{t('colActions')}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {activities.length > 0 ? (
                    activities.map((block) => {
                      const blockNum = block.block_number ?? block.blockNumber;
                      const txCount = block.total_tx_count ?? block.txCount ?? 0;
                      const evmCount = block.evm_count ?? block.evmCount ?? 0;
                      const subCount = block.substrate_count ?? block.substrateCount ?? 0;
                      const vol = block.total_volume_hmnd ?? block.totalVolumeHmnd ?? 0;
                      const fee = block.total_fees_hmnd ?? block.totalFeesHmnd ?? 0;
                      const price = Number(block.price_usd ?? block.priceUsd ?? 0);
                      const volUsd = vol * price;
                      const pallets = block.pallets ? block.pallets.split(',').filter(Boolean) : [];

                      return (
                        <Table.Tr key={blockNum}>
                          <Table.Td>
                            <Group gap={6}>
                              <Text
                                size="sm"
                                fw={700}
                                className="font-mono"
                                c="cyan"
                                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                onClick={() => handleOpenBlock(blockNum)}
                              >
                                #{blockNum}
                              </Text>
                            </Group>
                          </Table.Td>

                          <Table.Td>
                            <div>
                              <Text size="xs" fw={500} className="font-mono">
                                {formatTimestamp(block.timestamp, lang)}
                              </Text>
                              <Text size="10px" c="dimmed">
                                {timeAgo(block.timestamp, lang)}
                              </Text>
                            </div>
                          </Table.Td>

                          <Table.Td>
                            <Group gap={6}>
                              <Badge size="xs" color="indigo" variant="filled">
                                {txCount} {t('overview_txs_3')}
                              </Badge>
                              {evmCount > 0 && (
                                <Badge size="xs" color="cyan" variant="outline">
                                  {evmCount} EVM
                                </Badge>
                              )}
                              {subCount > 0 && (
                                <Badge size="xs" color="teal" variant="outline">
                                  {subCount} SUBSTRATE
                                </Badge>
                              )}
                            </Group>
                          </Table.Td>

                          <Table.Td>
                            <Group gap={4}>
                              {pallets.map((p) => (
                                <Badge key={p} size="xs" color="gray" variant="light">
                                  {p.toUpperCase()}
                                </Badge>
                              ))}
                            </Group>
                          </Table.Td>

                          <Table.Td>
                            <Box>
                              <AmountDisplay
                                value={formatHMND(vol, { suffix: false, locale: lang })}
                                unit="HMND"
                                color={vol > 0 ? '#10b981' : '#6e7681'}
                                size="xs"
                                usdValue={vol > 0 ? formatUSD(volUsd, lang) : null}
                              />
                            </Box>
                          </Table.Td>

                          <Table.Td>
                            <AmountDisplay
                              value={formatFee(fee, false, lang)}
                              unit="HMND"
                              color={fee > 0 ? '#f59e0b' : '#6e7681'}
                              size="xs"
                            />
                          </Table.Td>

                          <Table.Td>
                            <Button
                              size="xs"
                              variant="light"
                              color="cyan"
                              leftSection={<IconEye size={12} />}
                              onClick={() => handleOpenBlock(blockNum)}
                            >
                              {t('inspect')} ({txCount})
                            </Button>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })
                  ) : (
                    <Table.Tr>
                      <Table.Td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                        <Text size="sm" c="dimmed">
                          {loading ? (t('overview_scanningBlocksForSelected')) : (t('overview_noBlockRecordsFound'))}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            ) : (
              /* =================== TRANSACTION VIEW =================== */
              <Table striped highlightOnHover verticalSpacing="xs">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('colTxHash')}</Table.Th>
                    <Table.Th>{t('colBlock')}</Table.Th>
                    <Table.Th>{t('colTimestamp')}</Table.Th>
                    <Table.Th>{t('colLayerPallet')}</Table.Th>
                    <Table.Th>{t('colFromTo')}</Table.Th>
                    <Table.Th>{t('colAmount')}</Table.Th>
                    <Table.Th>{t('colFee')}</Table.Th>
                    <Table.Th>{t('colDetail')}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {activities.length > 0 ? (
                    activities.map((tx) => {
                      const sender = tx.from_address || tx.signer || '';
                      const target = tx.to_address || tx.target || '';
                      const isEvm = (tx.layer || '').toUpperCase() === 'EVM' || (!tx.layer && sender.startsWith('0x') && sender.length === 42);
                      const val = tx.value_hmnd || tx.amount || 0;
                      const fee = tx.fee_hmnd || 0;

                      return (
                        <Table.Tr key={tx.hash || tx.id}>
                          <Table.Td>
                            <Text
                              size="xs"
                              fw={600}
                              className="font-mono"
                              c="cyan"
                              style={{ cursor: 'pointer', textDecoration: 'underline' }}
                              onClick={() => handleOpenTx(tx.hash)}
                              title={tx.hash}
                            >
                              {shortAddr(tx.hash, 8, 6)}
                            </Text>
                          </Table.Td>

                          <Table.Td>
                            <Text
                              size="xs"
                              className="font-mono"
                              c="blue"
                              style={{ cursor: 'pointer', textDecoration: 'underline' }}
                              onClick={() => handleOpenBlock(tx.block_number)}
                            >
                              #{tx.block_number}
                            </Text>
                          </Table.Td>

                          <Table.Td>
                            <Text size="xs" className="font-mono">
                              {timeAgo(tx.timestamp, lang)}
                            </Text>
                          </Table.Td>

                          <Table.Td>
                            <Badge size="xs" color={isEvm ? 'cyan' : 'green'} variant="light">
                              {tx.pallet ? `${tx.pallet}:${tx.method}` : isEvm ? 'EVM' : 'SUBSTRATE'}
                            </Badge>
                          </Table.Td>

                          <Table.Td>
                            <Group gap={4} wrap="nowrap" align="center">
                              <AddressBadge
                                address={sender}
                                showNetwork={false}
                                onSelectAddress={onSelectAddress}
                                head={5}
                                tail={4}
                              />
                              <Text size="xs" c="dimmed">➔</Text>
                              {target ? (
                                <AddressBadge
                                  address={target}
                                  showNetwork={false}
                                  onSelectAddress={onSelectAddress}
                                  head={5}
                                  tail={4}
                                />
                              ) : (
                                <Text size="xs" c="dimmed">-</Text>
                              )}
                            </Group>
                          </Table.Td>

                          <Table.Td>
                            <AmountDisplay
                              value={formatHMND(val, { suffix: false, locale: lang })}
                              unit="HMND"
                              color={val > 0 ? '#10b981' : '#6e7681'}
                              size="xs"
                            />
                          </Table.Td>

                          <Table.Td>
                            <AmountDisplay
                              value={formatFee(fee, false, lang)}
                              unit="HMND"
                              color={fee > 0 ? '#f59e0b' : '#6e7681'}
                              size="xs"
                            />
                          </Table.Td>

                          <Table.Td>
                            <Button size="xs" variant="subtle" color="cyan" onClick={() => handleOpenTx(tx.hash)}>
                              {t('inspect')}
                            </Button>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })
                  ) : (
                    <Table.Tr>
                      <Table.Td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>
                        <Text size="sm" c="dimmed">
                          {loading ? (t('overview_loadingTransactions')) : (t('overview_noTransactionsFoundFor'))}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            )}
          </Box>

          {/* Sayfalama */}
          <Group justify="space-between" mt="md" align="center">
            <Text size="xs" c="dimmed">
              {t('pageInfo', { page, totalPages, total: totalCount.toLocaleString(loc) })}
            </Text>
            <Pagination value={page} onChange={setPage} total={totalPages} color="cyan" size="sm" />
          </Group>
        </Stack>
      </Paper>

      {/* 4. BLOK DETAY MODALI */}
      <Modal
        opened={Boolean(selectedBlockModal)}
        onClose={() => setSelectedBlockModal(null)}
        centered
        title={
          <Group gap={8}>
            <IconCube size={20} color="#38bdf8" />
            <Title order={4}>{t('blockModalTitle', { block: selectedBlockModal?.block_number })}</Title>
            <CopyButton value={String(selectedBlockModal?.block_number || '')} timeout={1500}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? (t('copied')) : (t('overview_copyBlock'))}>
                  <ActionIcon size="xs" variant="subtle" color={copied ? 'teal' : 'gray'} onClick={copy}>
                    {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
          </Group>
        }
        size="min(1240px, 96vw)"
        styles={{
          content: {
            maxWidth: '1240px',
            width: '96vw',
            border: '1px solid rgba(56, 189, 248, 0.28)',
            borderRadius: 14,
            background: '#0d1117',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 30px rgba(56, 189, 248, 0.12)',
          },
          header: {
            background: '#161b22',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '14px 20px',
          },
          body: {
            background: '#0d1117',
            padding: '20px',
          },
        }}
      >
        {selectedBlockModal && (
          <Stack gap="md">
            {/* 3-Column Summary Cards */}
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
              <Paper p="sm" bg="rgba(0,0,0,0.3)" style={{ borderLeft: '3px solid #38bdf8', borderRadius: 8 }}>
                <Text size="11px" c="dimmed" tt="uppercase" fw={700}>
                  📅 {t('colTimestamp')}
                </Text>
                <Text size="sm" fw={700} className="font-mono mt-1" style={{ whiteSpace: 'nowrap' }}>
                  {formatTimestamp(selectedBlockModal.timestamp, lang)}
                </Text>
                <Text size="11px" c="dimmed">{timeAgo(selectedBlockModal.timestamp, lang)}</Text>
              </Paper>

              <Paper p="sm" bg="rgba(0,0,0,0.3)" style={{ borderLeft: '3px solid #10b981', borderRadius: 8 }}>
                <Text size="11px" c="dimmed" tt="uppercase" fw={700}>
                  ⚡ {t('colTxCount')}
                </Text>
                <Text size="sm" fw={700} c="cyan" className="font-mono mt-1">
                  {selectedBlockModal.total_tx_count || selectedBlockModal.transactions?.length || 0} {t('unlocks_txs_3')}
                </Text>
                <Group gap={4} mt={3}>
                  <Badge size="xs" color="cyan" variant="light">
                    {selectedBlockModal.evm_count || 0} EVM
                  </Badge>
                  <Badge size="xs" color="teal" variant="light">
                    {selectedBlockModal.substrate_count || 0} Substrate
                  </Badge>
                </Group>
              </Paper>

              <Paper p="sm" bg="rgba(0,0,0,0.3)" style={{ borderLeft: '3px solid #f59e0b', borderRadius: 8 }}>
                <Text size="11px" c="dimmed" tt="uppercase" fw={700}>
                  🔥 {t('colBlockFee')}
                </Text>
                <Text size="sm" fw={800} c="yellow" className="font-mono mt-1" style={{ whiteSpace: 'nowrap' }}>
                  {formatFee(selectedBlockModal.total_fees_hmnd, true, lang, false)}
                </Text>
                {selectedBlockModal.price_usd > 0 && Number(selectedBlockModal.total_fees_hmnd || 0) > 0 && (
                  <Text size="11px" c="dimmed">
                    ≈ {formatUSD((Number(selectedBlockModal.total_fees_hmnd) || 0) * selectedBlockModal.price_usd, lang, 4)}
                  </Text>
                )}
              </Paper>
            </SimpleGrid>

            <div>
              <Group justify="space-between" mb="xs" align="center">
                <Group gap={6} align="center">
                  <Text size="sm" fw={700} c="white">
                    {t('overview_allTransactionsInThis')}
                  </Text>
                  <Badge size="sm" color="cyan" variant="light" className="font-mono">
                    {selectedBlockModal.transactions?.length || 0} {t('overview_records')}
                  </Badge>
                </Group>
                <Text size="xs" c="dimmed">
                  {t('overview_clickTransactionToView')}
                </Text>
              </Group>

              <Box style={{ overflowX: 'auto', maxHeight: 460 }}>
                <Table striped highlightOnHover verticalSpacing="sm" style={{ minWidth: 960 }}>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th style={{ width: 150, whiteSpace: 'nowrap' }}>{t('colTxHash')}</Table.Th>
                      <Table.Th style={{ width: 140, whiteSpace: 'nowrap' }}>{t('colLayerPallet')}</Table.Th>
                      <Table.Th style={{ minWidth: 260, whiteSpace: 'nowrap' }}>{t('overview_fromTo')}</Table.Th>
                      <Table.Th style={{ width: 130, whiteSpace: 'nowrap', textAlign: 'right' }}>{t('colAmount')}</Table.Th>
                      <Table.Th style={{ width: 130, whiteSpace: 'nowrap', textAlign: 'right' }}>{t('colFee')}</Table.Th>
                      <Table.Th style={{ minWidth: 150, whiteSpace: 'nowrap' }}>{t('overview_detailsSwaps')}</Table.Th>
                      <Table.Th style={{ width: 80, whiteSpace: 'nowrap', textAlign: 'center' }}>{t('colActions')}</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {selectedBlockModal.transactions?.map((tx, idx) => {
                      const fromAddr = tx.from_address || tx.signer || tx.sender;
                      const toAddr = tx.to_address || tx.target;
                      const isEvm = (tx.layer || '').toUpperCase() === 'EVM' || (!tx.layer && (fromAddr?.startsWith('0x') && fromAddr?.length === 42));
                      const layerLabel = isEvm
                        ? (tx.method ? `EVM: ${tx.method}` : 'EVM')
                        : (tx.pallet ? `${tx.pallet}:${tx.method || ''}` : 'SUBSTRATE');
                      return (
                        <Table.Tr key={tx.hash || idx}>
                          <Table.Td className="font-mono" style={{ whiteSpace: 'nowrap' }}>
                            <Group gap={4} wrap="nowrap">
                              <Text
                                size="xs"
                                c="cyan"
                                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                onClick={() => {
                                  setSelectedBlockModal(null);
                                  handleOpenTx(tx.hash);
                                }}
                                title={tx.hash}
                              >
                                {shortAddr(tx.hash, 8, 6)}
                              </Text>
                              <CopyButton value={tx.hash} timeout={1200}>
                                {({ copied, copy }) => (
                                  <ActionIcon size="xs" variant="subtle" color={copied ? 'teal' : 'gray'} onClick={copy}>
                                    {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                                  </ActionIcon>
                                )}
                              </CopyButton>
                            </Group>
                          </Table.Td>

                          <Table.Td style={{ whiteSpace: 'nowrap' }}>
                            <Badge size="xs" color={isEvm ? 'cyan' : 'teal'} variant="light" style={{ whiteSpace: 'nowrap' }}>
                              {layerLabel}
                            </Badge>
                          </Table.Td>

                          <Table.Td className="font-mono" style={{ whiteSpace: 'nowrap' }}>
                            <Group gap={6} wrap="nowrap" align="center">
                              <Tooltip label={fromAddr} withArrow position="top">
                                <Text
                                  size="xs"
                                  style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                  c="cyan"
                                  onClick={() => fromAddr && onSelectAddress(fromAddr)}
                                >
                                  {shortAddr(fromAddr, 7, 5)}
                                </Text>
                              </Tooltip>
                              <Text size="xs" c="dimmed">➔</Text>
                              <Tooltip label={toAddr || (t('overview_systemContract'))} withArrow position="top">
                                <Text
                                  size="xs"
                                  style={{ cursor: toAddr ? 'pointer' : 'default', textDecoration: toAddr ? 'underline' : 'none' }}
                                  c={toAddr ? 'teal' : 'dimmed'}
                                  onClick={() => toAddr && onSelectAddress(toAddr)}
                                >
                                  {toAddr ? shortAddr(toAddr, 7, 5) : (t('overview_contractSystem'))}
                                </Text>
                              </Tooltip>
                            </Group>
                          </Table.Td>

                          <Table.Td className="font-mono" fw={700} c="green" style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                            {formatHMND(tx.value_hmnd || tx.amount || 0, { locale: lang, showScale: false })}
                          </Table.Td>

                          <Table.Td className="font-mono" c="dimmed" style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                            {formatFee(tx.fee_hmnd, true, lang, false)}
                          </Table.Td>

                          <Table.Td style={{ whiteSpace: 'nowrap' }}>
                            {tx.tokenTransfers && tx.tokenTransfers.length > 0 ? (
                              <Badge size="xs" color="indigo" variant="light">
                                🔄 {tx.tokenTransfers.length} {t('overview_tokenTransfer')}
                              </Badge>
                            ) : tx.details ? (
                              <Text size="xs" c="dimmed" lineClamp={1}>
                                {tx.details}
                              </Text>
                            ) : (
                              <Text size="xs" c="dimmed">-</Text>
                            )}
                          </Table.Td>

                          <Table.Td style={{ whiteSpace: 'nowrap', textAlign: 'center' }}>
                            <Tooltip label={t('overview_viewTransactionDetails')} withArrow position="top">
                              <ActionIcon
                                size="sm"
                                variant="light"
                                color="cyan"
                                onClick={() => {
                                  setSelectedBlockModal(null);
                                  handleOpenTx(tx.hash);
                                }}
                              >
                                <IconEye size={14} />
                              </ActionIcon>
                            </Tooltip>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </Box>
            </div>
          </Stack>
        )}
      </Modal>

      {/* 5. TRANSACTION DETAIL & TOKEN SWAP MODAL */}
      <Modal
        opened={Boolean(selectedTxModal)}
        onClose={() => setSelectedTxModal(null)}
        centered
        title={
          <Group gap={8}>
            <IconActivity size={20} color="#38bdf8" />
            <Title order={4}>{t('txModalTitle')}</Title>
          </Group>
        }
        size="min(1120px, 95vw)"
        styles={{
          content: {
            maxWidth: '1120px',
            width: '95vw',
            border: '1px solid rgba(56, 189, 248, 0.28)',
            borderRadius: 14,
            background: '#0d1117',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 30px rgba(56, 189, 248, 0.12)',
          },
          header: {
            background: '#161b22',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '14px 20px',
          },
          body: {
            background: '#0d1117',
            padding: '20px',
          },
        }}
      >
        {selectedTxModal && (
          <Stack gap="md">
            {/* Top Information Card */}
            <Paper p="sm" bg="rgba(0,0,0,0.35)" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              <Group justify="space-between" align="center" wrap="wrap" mb="xs">
                <Group gap="xs">
                  <Badge color={selectedTxModal.layer === 'EVM' ? 'cyan' : 'green'} variant="filled">
                    {selectedTxModal.layer === 'EVM' ? t('txLayerEvm') : t('txLayerSub')}
                  </Badge>
                  <Badge color={selectedTxModal.status === 1 || selectedTxModal.status === 'success' ? 'teal' : 'red'}>
                    {selectedTxModal.status === 1 || selectedTxModal.status === 'success' ? t('txSuccess') : t('txFailed')}
                  </Badge>
                  {selectedTxModal.pallet && (
                    <Badge color="violet" variant="outline">
                      {selectedTxModal.pallet}:{selectedTxModal.method}
                    </Badge>
                  )}
                </Group>

                {selectedTxModal.price_usd > 0 && (
                  <Badge color="yellow" variant="light">
                    {t('historicalRate', { rate: formatNumber(selectedTxModal.price_usd, { minDecimals: 4, maxDecimals: 6 }) })}
                  </Badge>
                )}
              </Group>

              {/* Hash & Kopyalama */}
              <Box mb="xs">
                <Text size="xs" c="dimmed">{t('txHashLabel')}</Text>
                <Group gap="xs">
                  <Text size="xs" fw={700} className="font-mono" c="cyan" style={{ wordBreak: 'break-all' }}>
                    {selectedTxModal.hash}
                  </Text>
                  <CopyButton value={selectedTxModal.hash}>
                    {({ copied, copy }) => (
                      <ActionIcon size="xs" color={copied ? 'teal' : 'gray'} variant="subtle" onClick={copy}>
                        {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                      </ActionIcon>
                    )}
                  </CopyButton>
                </Group>
              </Box>

              {/* Detay Tablosu / Grid */}
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm" mt="xs">
                <Box>
                  <Text size="xs" c="dimmed">{t('colBlock')}</Text>
                  <Group gap={6}>
                    <Text size="sm" fw={700} className="font-mono" c="blue" style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { setSelectedTxModal(null); handleOpenBlock(selectedTxModal.block_number); }}>
                      #{selectedTxModal.block_number}
                    </Text>
                  </Group>
                </Box>

                <Box>
                  <Text size="xs" c="dimmed">{t('colTimestamp')}</Text>
                  <Text size="xs" fw={600} className="font-mono">
                    {formatTimestamp(selectedTxModal.timestamp, lang)} ({timeAgo(selectedTxModal.timestamp, lang)})
                  </Text>
                </Box>

                <Box>
                  <Text size="xs" c="dimmed">{t('fromLabel')}</Text>
                  <Group gap={4}>
                    <Text size="xs" className="font-mono" c="cyan" style={{ wordBreak: 'break-all' }}>
                      {selectedTxModal.from_address || selectedTxModal.signer}
                    </Text>
                    <CopyButton value={selectedTxModal.from_address || selectedTxModal.signer}>
                      {({ copied, copy }) => (
                        <ActionIcon size="xs" color={copied ? 'teal' : 'gray'} variant="subtle" onClick={copy}>
                          {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                        </ActionIcon>
                      )}
                    </CopyButton>
                  </Group>
                </Box>

                <Box>
                  <Text size="xs" c="dimmed">{t('toLabel')}</Text>
                  <Group gap={4}>
                    <Text size="xs" className="font-mono" c="teal" style={{ wordBreak: 'break-all' }}>
                      {selectedTxModal.to_address || selectedTxModal.target || (t('overview_contractCreationSystem'))}
                    </Text>
                    {(selectedTxModal.to_address || selectedTxModal.target) && (
                      <CopyButton value={selectedTxModal.to_address || selectedTxModal.target}>
                        {({ copied, copy }) => (
                          <ActionIcon size="xs" color={copied ? 'teal' : 'gray'} variant="subtle" onClick={copy}>
                            {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                          </ActionIcon>
                        )}
                      </CopyButton>
                    )}
                  </Group>
                </Box>

                <Box>
                  <Text size="xs" c="dimmed">{t('transferAmount')}</Text>
                  <Text size="md" fw={800} c="green" className="font-mono">
                    {formatHMND(selectedTxModal.value_hmnd || selectedTxModal.amount || 0, { locale: lang })}
                  </Text>
                  {selectedTxModal.price_usd > 0 && Number(selectedTxModal.value_hmnd || 0) > 0 && (
                    <Text size="xs" c="dimmed">
                      ≈ {formatUSD((Number(selectedTxModal.value_hmnd || 0)) * selectedTxModal.price_usd)} USD
                    </Text>
                  )}
                </Box>

                <Box>
                  <Text size="xs" c="dimmed">{t('gasFeeLabel')}</Text>
                  <Text size="md" fw={800} c="yellow" className="font-mono">
                    {formatFee(selectedTxModal.fee_hmnd, true, lang)}
                  </Text>
                  {selectedTxModal.price_usd > 0 && Number(selectedTxModal.fee_hmnd || 0) > 0 && (
                    <Text size="xs" c="dimmed">
                      ≈ {formatUSD((Number(selectedTxModal.fee_hmnd || 0)) * selectedTxModal.price_usd, null, 4)} USD
                    </Text>
                  )}
                </Box>

                {selectedTxModal.gas_used && (
                  <Box>
                    <Text size="xs" c="dimmed">{t('gasUsedLabel')}</Text>
                    <Text size="xs" className="font-mono">
                      {Number(selectedTxModal.gas_used).toLocaleString(loc)} Gas
                    </Text>
                  </Box>
                )}
              </SimpleGrid>
            </Paper>

            {/* Internal Token Transfers & DEX Swap Steps */}
            {selectedTxModal.tokenTransfers && selectedTxModal.tokenTransfers.length > 0 && (
              <Paper p="sm" bg="rgba(0,0,0,0.25)" style={{ border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                <Group justify="space-between" mb="xs">
                  <Group gap={6}>
                    <IconSparkles size={16} color="#38bdf8" />
                    <Title order={6} c="cyan">{t('tokenTransfersTitle')}</Title>
                  </Group>
                  <Badge color="cyan" size="xs">{selectedTxModal.tokenTransfers.length} {t('tokenColTransfers')}</Badge>
                </Group>

                <Box style={{ overflowX: 'auto' }}>
                  <Table striped highlightOnHover verticalSpacing="xs">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Token</Table.Th>
                        <Table.Th>{t('fromLabel')}</Table.Th>
                        <Table.Th>{t('toLabel')}</Table.Th>
                        <Table.Th>{t('colAmount')}</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {selectedTxModal.tokenTransfers.map((tt, idx) => (
                        <Table.Tr key={tt.id || idx}>
                          <Table.Td>
                            <Badge color="violet" size="sm" variant="filled">
                              {tt.token_symbol || 'TOKEN'}
                            </Badge>
                          </Table.Td>
                          <Table.Td className="font-mono">
                            <Text size="xs" c="cyan">{shortAddr(tt.from_address, 8, 6)}</Text>
                          </Table.Td>
                          <Table.Td className="font-mono">
                            <Text size="xs" c="teal">{shortAddr(tt.to_address, 8, 6)}</Text>
                          </Table.Td>
                          <Table.Td className="font-mono" fw={700} c="green">
                            {Number(tt.amount || 0).toLocaleString(loc, { maximumFractionDigits: 6 })} {tt.token_symbol}
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Box>
              </Paper>
            )}

            {/* Actions & Navigate to Wallet Ledger Buttons */}
            <Group justify="flex-end" gap="xs">
              <Button
                size="xs"
                variant="light"
                color="cyan"
                leftSection={<IconBook size={14} />}
                onClick={() => {
                  const s = selectedTxModal.from_address || selectedTxModal.signer;
                  if (s) {
                    setSelectedTxModal(null);
                    onOpenLedger(s);
                  }
                }}
              >
                {t('btnViewSenderLedger')}
              </Button>

              {(selectedTxModal.to_address || selectedTxModal.target) && (
                <Button
                  size="xs"
                  variant="light"
                  color="teal"
                  leftSection={<IconBook size={14} />}
                  onClick={() => {
                    const tAddr = selectedTxModal.to_address || selectedTxModal.target;
                    if (tAddr) {
                      setSelectedTxModal(null);
                      onOpenLedger(tAddr);
                    }
                  }}
                >
                  {t('btnViewTargetLedger')}
                </Button>
              )}

              <Button
                size="xs"
                variant="filled"
                color="violet"
                leftSection={<IconGitFork size={14} />}
                onClick={() => {
                  const s = selectedTxModal.from_address || selectedTxModal.signer;
                  if (s) {
                    setSelectedTxModal(null);
                    onOpenTrail(s);
                  }
                }}
              >
                {t('btnTraceMoneyTrail')}
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}
