'use client';
import { useState, useEffect, useMemo } from 'react';
import {
  Paper,
  Stack,
  Title,
  Text,
  Table,
  Badge,
  Group,
  Button,
  Box,
  SimpleGrid,
  CopyButton,
  ActionIcon,
  Tooltip,
  Loader,
  Center,
  Pagination,
  SegmentedControl,
} from '@mantine/core';
import {
  IconCoins,
  IconClock,
  IconCalendar,
  IconCheck,
  IconCopy,
  IconExternalLink,
  IconShieldCheck,
  IconArrowDownLeft,
} from '@tabler/icons-react';
import { shortAddr, formatHMND, formatUSD, formatTimestamp } from './formatters';
import { useLanguage } from './LanguageContext';
import { useModuleFields } from './ModuleLayout';
import KpiStatCard from './ui/KpiStatCard';
import AmountDisplay from './ui/AmountDisplay';
import AddressBadge from './ui/AddressBadge';
import DirectionBadge from './ui/DirectionBadge';

export default function FeesPotTab({ onOpenBlock, onSelectAddress }) {
  const { lang } = useLanguage();
  const { t, fields } = useModuleFields();
  const locStr = t('whales_enUs');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // View selection: 'payouts' (Outflow rounds) or 'inflows' (Treasury funding sources)
  const [activeView, setActiveView] = useState('payouts');

  // Seconds remaining for live epoch countdown
  const [nowSec, setNowSec] = useState(() => Math.floor(Date.now() / 1000));

  // Sayfalama
  const [page, setPage] = useState(1);
  const pageSize = 12;

  useEffect(() => {
    let mounted = true;
    fetch('/api/fees-pot-analytics')
      .then((res) => res.json())
      .then((json) => {
        if (mounted) {
          setData(json);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('FeesPot verisi yüklenemedi:', err);
        if (mounted) setLoading(false);
      });

    // Update countdown ticker every second. TODO: Sync with block timestamp drift
    const timer = setInterval(() => {
      setNowSec(Math.floor(Date.now() / 1000));
    }, 1000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  // Countdown calculation
  const nextTargetTs = data?.nextEstimatedTs || (1793211744 + 14 * 86400);
  const diffSec = Math.max(0, nextTargetTs - nowSec);
  const cdDays = Math.floor(diffSec / 86400);
  const cdHours = Math.floor((diffSec % 86400) / 3600);
  const cdMins = Math.floor((diffSec % 3600) / 60);
  const cdSecs = diffSec % 60;
  const countdownFormatted = `${cdDays}g ${String(cdHours).padStart(2, '0')}:${String(cdMins).padStart(2, '0')}:${String(cdSecs).padStart(2, '0')}`;

  // Paginated payout batch history. TODO: Support CSV export of historic rounds
  const historyList = data?.history || [];
  const totalPages = Math.ceil(historyList.length / pageSize) || 1;
  const paginatedHistory = historyList.slice((page - 1) * pageSize, page * pageSize);

  const poolAddress = data?.feesPotAddress || 'hmpwhPbL5XJTYPWXPMkacfqGhJ3eoQRPLKphajpvcot5Q5zkk';

  return (
    <Stack gap="md">
      {/* Header Title & Description */}
      <Paper p="md" className="glass-panel" style={{ borderRadius: 8 }}>
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          <Box>
            <Group gap="xs" mb={4}>
              <IconCoins size={24} color="#14b8a6" />
              <Title order={2} size="h3" c="white">
                {t('feespot_feespotRewardsPoolValidator')}
              </Title>
              <Badge color="teal" variant="light" size="sm">
                Pallet feesPot (py/humfe)
              </Badge>
            </Group>
            <Text size="xs" c="dimmed" maw={800}>
              {t('feespot_officialHumanodeFeePool')}
            </Text>
          </Box>

          <Group gap="sm" wrap="wrap" align="center">
            <Group gap="xs">
              <Text size="xs" c="dimmed">
                {t('feespot_poolAddress')}
              </Text>
              <AddressBadge
                address={poolAddress}
                label="FeesPot"
                showNetwork={true}
                onSelectAddress={onSelectAddress}
              />
            </Group>

            <Button
              size="compact-xs"
              variant="light"
              color="teal"
              leftSection={<IconExternalLink size={12} />}
              onClick={() => onSelectAddress && onSelectAddress(poolAddress)}
            >
              {t('feespot_openInLedger')}
            </Button>
          </Group>
        </Group>

        {/* 5 Primary KPI Cards (Standardized single-row layout) */}
        <SimpleGrid cols={{ base: 1, xs: 2, sm: 3, md: 5 }} spacing="sm" mt="md">
          {/* 1. Current Pool Balance Card */}
          <KpiStatCard
            title={t('feespot_poolBalanceFeespot')}
            value={data ? Number(data.currentBalance).toLocaleString(locStr, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '403.719,23'}
            unit="HMND"
            color="teal"
            icon={IconCoins}
            subtext={t('feespot_currentUnspentTreasuryReserve')}
            tooltip={t('activeBalanceTooltip', { amount: data?.currentBalance || '403,719.23' })}
          />

          {/* 2. Total Cumulative Inflow to Treasury Card */}
          <KpiStatCard
            title={t('feespot_totalTreasuryInflow')}
            value={data?.totalInflowHmnd ? Number(data.totalInflowHmnd).toLocaleString(locStr, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '1.094.941,16'}
            sign="+"
            unit="HMND"
            color="teal"
            icon={IconArrowDownLeft}
            subtext={t('feesPotGasReserve', {
              burned: Number(data?.burnedTotal || 691222).toLocaleString(locStr, { maximumFractionDigits: 0 }),
              reserve: Number(data?.genesisReserveHmnd || 403662).toLocaleString(locStr, { maximumFractionDigits: 0 })
            })}
            tooltip={
              t('feespot_69122193Hmnd')
            }
          />

          {/* 3. Runway Estimated Duration Card */}
          <KpiStatCard
            title={t('feespot_runwayEstimate')}
            value={`~${data?.runwayDays || 113}`}
            unit={t('heatmap_days')}
            color="cyan"
            icon={IconClock}
            subtext={`~${data?.runwayRounds || 8.1} ${t('feespot_consecutiveDistributionRounds')}`}
            tooltip={t('feespot_estimatedDaysUntilReserve')}
          />

          {/* 4. Last Round Reward Card */}
          <KpiStatCard
            title={t('feespot_lastBatch112')}
            value={Number(data?.lastBatch?.samplePerValidator || 613.48).toFixed(2)}
            unit="HMND"
            color="yellow"
            icon={IconShieldCheck}
            subtext={`${data?.lastBatch?.recipientCount || 62} ${t('feespot_validatorsReceivedShare')}`}
            tooltip={t('feespot_perValidatorNetReward')}
          />

          {/* 5. Next Distribution Countdown Card */}
          <KpiStatCard
            title={t('feespot_nextBatchCountdown')}
            value={countdownFormatted}
            color="violet"
            icon={IconCalendar}
            subtext={`~10-14 ${t('feespot_nov620HmndNode')}`}
            tooltip={t('feespot_estimatedNextPayoutBatch')}
          />
        </SimpleGrid>
      </Paper>

      {/* Table Area: Distribution Rounds (Outflow) vs Treasury Inflow Transfers */}
      <Paper p="md" className="glass-panel" style={{ borderRadius: 8 }}>
        <Group justify="space-between" mb="md" wrap="wrap" gap="xs">
          <SegmentedControl
            value={activeView}
            onChange={setActiveView}
            size="xs"
            color="teal"
            data={[
              {
                value: 'payouts',
                label: t('feespot_payoutBatches112Batches'),
              },
              {
                value: 'inflows',
                label: t('feespot_treasuryInflowFundingSources'),
              },
            ]}
          />
          {activeView === 'payouts' ? (
            <Text size="xs" c="dimmed">
              {t('feesPotBatchesPagination', { page, totalPages, total: historyList.length })}
            </Text>
          ) : (
            <Badge color="green" variant="light" size="sm">
              {t('feespot_totalInflow')}
              +{data ? formatHMND(data.totalInflowHmnd || 1094941.16, { locale: lang }) : '1.094.941 HMND'}
            </Badge>
          )}
        </Group>

        {activeView === 'inflows' ? (
          <Stack gap="md">
            {/* Inflow Sources 3-Column Distribution Cards */}
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
              <KpiStatCard
                title={t('feespot_1NetworkGasTransaction')}
                value={Number(data?.burnedTotal || 691221.93).toLocaleString(locStr, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                unit="HMND"
                sign="+"
                color="teal"
                badge={t('feespot_protocolPot')}
                badgeColor="teal"
                subtext={
                  t('feespot_officialFeePotCollected')
                }
              />

              <KpiStatCard
                title={t('feespot_2GenesisSeedReserve')}
                value={Number(data?.genesisReserveHmnd || 403661.73).toLocaleString(locStr, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                unit="HMND"
                sign="+"
                color="cyan"
                badge="Genesis #0"
                badgeColor="cyan"
                subtext={
                  t('feespot_block0GenesisAllocation')
                }
              />

              <KpiStatCard
                title={t('feespot_3DirectWalletTransfers')}
                value={Number(data?.directTransfersHmnd || 57.50).toLocaleString(locStr, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                unit="HMND"
                sign="+"
                color="yellow"
                badge="balances"
                badgeColor="yellow"
                subtext={
                  t('feespot_directBalanceTransfersSent')
                }
              />
            </SimpleGrid>

            {/* Inflow Transactions Stream Table */}
            <Box style={{ overflowX: 'auto', width: '100%' }}>
              <Table highlightOnHover verticalSpacing="xs" style={{ width: '100%', minWidth: 680, tableLayout: 'fixed' }}>
                <Table.Thead>
                  <Table.Tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <Table.Th style={{ width: '22%', minWidth: 140, padding: '10px 8px' }}>
                      {t('feespot_fundingSourceSender')}
                    </Table.Th>
                    <Table.Th style={{ width: '18%', minWidth: 110, padding: '10px 8px' }}>
                      {t('feespot_inflowTypeMethod')}
                    </Table.Th>
                    <Table.Th style={{ width: '15%', minWidth: 95, padding: '10px 8px' }}>
                      {t('colBlock')}
                    </Table.Th>
                    <Table.Th style={{ width: '18%', minWidth: 110, padding: '10px 8px' }}>
                      {t('feespot_timestamp_2')}
                    </Table.Th>
                    <Table.Th style={{ width: '15%', minWidth: 110, textAlign: 'right', padding: '10px 8px' }}>
                      {t('feespot_inflowAmount')}
                    </Table.Th>
                    <Table.Th style={{ width: '12%', minWidth: 80, textAlign: 'right', padding: '10px 8px' }}>
                      {t('moneytrail_direction')}
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {/* Record 1: Direct Wallet Transfers */}
                  {(data?.incomingTransfers?.length ? data.incomingTransfers : [
                    {
                      hash: '0x2449f8114d4b905a1e82441cd6585122bc49d1cd1dbc12c704a31a765c428065',
                      block: 1071836,
                      timestamp: 1675071138,
                      signer: 'hmpt3fxBvpWrkZxq5H5uWjZ2BgHRMJs2hKHiWJDoqD7am1xPs',
                      amount: 57.5,
                      pallet: 'balances',
                      method: 'transferKeepAlive',
                      type: 'DIRECT_TRANSFER'
                    }
                  ]).map((tx, idx) => (
                    <Table.Tr key={tx.hash || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <Table.Td style={{ padding: '8px 8px' }}>
                        <AddressBadge
                          address={tx.signer}
                          showNetwork={true}
                          onSelectAddress={onSelectAddress}
                        />
                      </Table.Td>

                      <Table.Td style={{ padding: '8px 8px' }}>
                        <Badge size="xs" color="yellow" variant="light">
                          {tx.pallet}:{tx.method}
                        </Badge>
                      </Table.Td>

                      <Table.Td style={{ padding: '8px 8px' }} className="font-mono">
                        <Text
                          size="xs"
                          c="cyan"
                          fw={700}
                          style={{ cursor: 'pointer', textDecoration: 'underline' }}
                          onClick={() => onOpenBlock && onOpenBlock(tx.block)}
                        >
                          #{tx.block?.toLocaleString(locStr)}
                        </Text>
                      </Table.Td>

                      <Table.Td style={{ padding: '8px 8px' }}>
                        <Text size="xs" c="gray.3">
                          {formatTimestamp(tx.timestamp, lang)}
                        </Text>
                      </Table.Td>

                      <Table.Td style={{ textAlign: 'right', padding: '8px 8px' }}>
                        <AmountDisplay
                          value={Number(tx.amount || 0).toLocaleString(locStr, { minimumFractionDigits: 2 })}
                          unit="HMND"
                          sign="+"
                          color="#10b981"
                          size="sm"
                        />
                      </Table.Td>

                      <Table.Td style={{ textAlign: 'right', padding: '8px 8px' }}>
                        <DirectionBadge type="in" size="xs" />
                      </Table.Td>
                    </Table.Tr>
                  ))}

                  {/* Record 2: Genesis / System Reserve Inflow */}
                  <Table.Tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', backgroundColor: 'rgba(56, 189, 248, 0.02)' }}>
                    <Table.Td style={{ padding: '8px 8px' }}>
                      <Text size="xs" fw={700} c="cyan">
                        Genesis / Sistem Rezervi
                      </Text>
                    </Table.Td>

                    <Table.Td style={{ padding: '8px 8px' }}>
                      <Badge size="xs" color="cyan" variant="light">
                        system:genesisSeed
                      </Badge>
                    </Table.Td>

                    <Table.Td style={{ padding: '8px 8px' }} className="font-mono">
                      <Text
                        size="xs"
                        c="cyan"
                        fw={700}
                        style={{ cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => onOpenBlock && onOpenBlock(0)}
                      >
                        #0 (Genesis)
                      </Text>
                    </Table.Td>

                    <Table.Td style={{ padding: '8px 8px' }}>
                      <Text size="xs" c="gray.3">
                        {t('feespot_oct142022')}
                      </Text>
                    </Table.Td>

                    <Table.Td style={{ textAlign: 'right', padding: '8px 8px' }}>
                      <AmountDisplay
                        value={Number(data?.genesisReserveHmnd || 403661.73).toLocaleString(locStr, { minimumFractionDigits: 2 })}
                        unit="HMND"
                        sign="+"
                        color="#10b981"
                        size="sm"
                      />
                    </Table.Td>

                    <Table.Td style={{ textAlign: 'right', padding: '8px 8px' }}>
                      <Badge size="xs" color="cyan" variant="outline">
                        {t('feespot_seed')}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>

                  {/* Record 3: Network Transaction Gas Pool Inflow */}
                  <Table.Tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', backgroundColor: 'rgba(16, 185, 129, 0.02)' }}>
                    <Table.Td style={{ padding: '8px 8px' }}>
                      <Text size="xs" fw={700} c="teal">
                        Ağ Gas İşlem Komisyonları
                      </Text>
                    </Table.Td>

                    <Table.Td style={{ padding: '8px 8px' }}>
                      <Badge size="xs" color="teal" variant="light">
                        pallet:feesPot (py/humfe)
                      </Badge>
                    </Table.Td>

                    <Table.Td style={{ padding: '8px 8px' }} className="font-mono">
                      <Text size="xs" c="dimmed">
                        {t('feespot_allBlocks0Now')}
                      </Text>
                    </Table.Td>

                    <Table.Td style={{ padding: '8px 8px' }}>
                      <Text size="xs" c="gray.3">
                        {t('feespot_continuousOnBlock')}
                      </Text>
                    </Table.Td>

                    <Table.Td style={{ textAlign: 'right', padding: '8px 8px' }}>
                      <AmountDisplay
                        value={Number(data?.burnedTotal || 691221.93).toLocaleString(locStr, { minimumFractionDigits: 2 })}
                        unit="HMND"
                        sign="+"
                        color="#10b981"
                        size="sm"
                      />
                    </Table.Td>

                    <Table.Td style={{ textAlign: 'right', padding: '8px 8px' }}>
                      <DirectionBadge type="burn" size="xs" />
                    </Table.Td>
                  </Table.Tr>
                </Table.Tbody>
              </Table>
            </Box>
          </Stack>
        ) : (
          <>
            <Box style={{ overflowX: 'auto', width: '100%' }}>
              <Table highlightOnHover verticalSpacing="xs" style={{ width: '100%', minWidth: 640, tableLayout: 'fixed' }}>
                <Table.Thead>
                  <Table.Tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <Table.Th style={{ width: '12%', minWidth: 70, padding: '10px 8px' }}>
                      {t('feespot_batch')}
                    </Table.Th>
                    <Table.Th style={{ width: '18%', minWidth: 110, padding: '10px 8px' }}>
                      {t('feespot_block')}
                    </Table.Th>
                    <Table.Th style={{ width: '22%', minWidth: 130, padding: '10px 8px' }}>
                      {t('feespot_timestamp_2')}
                    </Table.Th>
                    <Table.Th style={{ width: '18%', minWidth: 110, textAlign: 'center', padding: '10px 8px' }}>
                      {t('feespot_recipients')}
                    </Table.Th>
                    <Table.Th style={{ width: '18%', minWidth: 110, textAlign: 'right', padding: '10px 8px' }}>
                      {t('feespot_totalDistributed')}
                    </Table.Th>
                    <Table.Th style={{ width: '12%', minWidth: 80, textAlign: 'right', padding: '10px 8px' }}>
                      {t('feespot_perNode')}
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {loading ? (
                    <Table.Tr>
                      <Table.Td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                        <Center>
                          <Loader size="sm" color="cyan" mr="xs" />
                          <Text size="sm" c="dimmed">
                            {t('feespot_loadingPayoutHistory')}
                          </Text>
                        </Center>
                      </Table.Td>
                    </Table.Tr>
                  ) : paginatedHistory.length > 0 ? (
                    paginatedHistory.map((item, idx) => {
                      const batchNum = historyList.length - ((page - 1) * pageSize + idx);
                      const isLatest = batchNum === historyList.length;

                      return (
                        <Table.Tr
                          key={item.block || idx}
                          style={{
                            backgroundColor: idx % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                          }}
                        >
                          {/* Tur # */}
                          <Table.Td style={{ padding: '8px 8px' }}>
                            <Badge
                              size="xs"
                              variant={isLatest ? 'filled' : 'light'}
                              color={isLatest ? 'teal' : 'gray'}
                            >
                              #{batchNum} {isLatest ? (t('feespot_latest')) : ''}
                            </Badge>
                          </Table.Td>

                          {/* Blok # */}
                          <Table.Td style={{ padding: '8px 8px' }} className="font-mono">
                            <Text
                              size="xs"
                              c="cyan"
                              fw={700}
                              style={{ cursor: 'pointer', textDecoration: 'underline' }}
                              onClick={() => onOpenBlock && onOpenBlock(item.block)}
                              title={`${item.block} - ${t('feespot_inspectBlock')}`}
                            >
                              #{item.block?.toLocaleString(locStr)}
                            </Text>
                          </Table.Td>

                          {/* Tarih */}
                          <Table.Td style={{ padding: '8px 8px' }}>
                            <Text size="xs" c="gray.3">
                              {formatTimestamp(item.timestamp, lang)}
                            </Text>
                          </Table.Td>

                          {/* Eligible Validator Count */}
                          <Table.Td style={{ textAlign: 'center', padding: '8px 8px' }}>
                            <Badge variant="dot" color="blue" size="sm">
                              {item.recipientCount} {t('validators_nodes')}
                            </Badge>
                          </Table.Td>

                          {/* Total Distributed */}
                          <Table.Td style={{ textAlign: 'right', padding: '8px 8px' }}>
                            <AmountDisplay
                              value={Number(item.totalDistributed || 0).toLocaleString(locStr)}
                              unit="HMND"
                              color="#10b981"
                              size="xs"
                            />
                          </Table.Td>

                          {/* Per Node Amount */}
                          <Table.Td style={{ textAlign: 'right', padding: '8px 8px' }}>
                            <AmountDisplay
                              value={`~${Number(item.samplePerValidator || 0).toFixed(1)}`}
                              unit="HMND"
                              color="#f59e0b"
                              size="xs"
                            />
                          </Table.Td>
                        </Table.Tr>
                      );
                    })
                  ) : (
                    <Table.Tr>
                      <Table.Td colSpan={6} style={{ textAlign: 'center', padding: '30px' }}>
                        <Text size="sm" c="dimmed">
                          {t('feespot_noPayoutRecordsFound')}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Box>

            {totalPages > 1 && (
              <Group justify="center" mt="md">
                <Pagination
                  value={page}
                  onChange={setPage}
                  total={totalPages}
                  size="xs"
                  color="teal"
                />
              </Group>
            )}
          </>
        )}
      </Paper>
    </Stack>
  );
}
