'use client';
import { useState, useEffect } from 'react';
import {
  Paper,
  Title,
  Text,
  Table,
  Badge,
  Group,
  Button,
  SegmentedControl,
  Box,
  CopyButton,
  ActionIcon,
  Tooltip,
  SimpleGrid,
  Stack,
  Loader,
  Center,
} from '@mantine/core';
import {
  IconTrophy,
  IconEye,
  IconBook,
  IconGitFork,
  IconCopy,
  IconCheck,
  IconCrown,
  IconMedal,
} from '@tabler/icons-react';
import { formatHMND, formatFee, shortAddr } from './formatters';
import { useLanguage } from './LanguageContext';
import { useModuleFields } from './ModuleLayout';
import AddressBadge from './ui/AddressBadge';
import AmountDisplay from './ui/AmountDisplay';

export default function LeaderboardTab({ onSelectAddress, onOpenLedger, onOpenTrail }) {
  const { lang } = useLanguage();
  const { t, fields } = useModuleFields();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [network, setNetwork] = useState('substrate'); // 'substrate' | 'evm' | 'all'
  const [metric, setMetric] = useState('balance'); // 'balance' | 'senders' | 'fees' | 'volume'

  useEffect(() => {
    setLoading(true);
    fetch('/api/leaderboard')
      .then((res) => res.json())
      .then((resData) => {
        setData(resData || null);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  let rawList = [];
  if (metric === 'balance') {
    if (network === 'substrate') rawList = data?.topBalancesSubstrate || [];
    else if (network === 'evm') rawList = data?.topBalancesEvm || [];
    else rawList = data?.topBalances || [];
  } else if (metric === 'senders') {
    if (network === 'substrate') rawList = data?.topSendersSubstrate || [];
    else if (network === 'evm') rawList = data?.topSendersEvm || [];
    else rawList = data?.topSenders || [];
  } else if (metric === 'fees') {
    if (network === 'substrate') rawList = data?.topFeeSpendersSubstrate || [];
    else if (network === 'evm') rawList = data?.topFeeSpendersEvm || [];
    else rawList = data?.topFeeSpenders || [];
  } else {
    if (network === 'substrate') rawList = data?.topVolumeSubstrate || [];
    else if (network === 'evm') rawList = data?.topVolumeEvm || [];
    else rawList = data?.topVolume || [];
  }

  // Protocol layer security filtering (Substrate vs EVM)
  const rows = rawList.filter((r) => {
    if (network === 'substrate') return r.address && r.address.startsWith('hm');
    if (network === 'evm') return r.address && (r.address.startsWith('0x') || r.address.startsWith('0X'));
    return true;
  });

  const loc = lang || undefined;
  const topThree = rows.slice(0, 3);

  return (
    <Stack gap="md">
      {/* Header Title & Controls */}
      <Paper p="md" className="glass-panel" style={{ borderRadius: 8 }}>
        <Group justify="space-between" align="center" mb="sm" wrap="wrap" gap="sm">
          <div>
            <Group gap={8}>
              <IconTrophy size={24} color="#eab308" />
              <Title order={3} c="white">
                {t('lbTitle')}
              </Title>
              <Badge color="yellow" variant="light" size="sm">
                Top 100 On-Chain
              </Badge>
            </Group>
            <Text size="xs" c="dimmed" mt={2}>
              {t('lbDesc')}
            </Text>
          </div>

          <SegmentedControl
            size="xs"
            value={metric}
            onChange={setMetric}
            color="yellow"
            data={[
              { label: t('lbBalance'), value: 'balance' },
              { label: t('lbSenders'), value: 'senders' },
              { label: t('lbFees'), value: 'fees' },
              { label: t('lbVolume'), value: 'volume' },
            ]}
          />
        </Group>

        {/* Network Selection Tabs: Substrate vs EVM */}
        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          <SegmentedControl
            size="xs"
            value={network}
            onChange={setNetwork}
            color={network === 'substrate' ? 'teal' : network === 'evm' ? 'cyan' : 'gray'}
            data={[
              { label: t('lbSubTab'), value: 'substrate' },
              { label: t('lbEvmTab'), value: 'evm' },
            ]}
          />
          <Badge
            size="md"
            color={network === 'substrate' ? 'teal' : network === 'evm' ? 'cyan' : 'gray'}
            variant="light"
          >
            {rows.length} {t('recordsRanked')}
          </Badge>
        </Group>

        {/* Top 3 Podium (Visual Highlight) */}
        {topThree.length >= 3 && (
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm" mt="md">
            {/* Rank 1 (Gold) */}
            <Paper
              p="sm"
              style={{
                background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.12), rgba(0, 0, 0, 0.4))',
                border: '1px solid rgba(234, 179, 8, 0.4)',
                borderRadius: 8,
              }}
            >
              <Group justify="space-between" mb={4}>
                <Badge color="yellow" variant="filled" size="sm" leftSection={<IconCrown size={12} />}>
                  #1 LİDER (ALTIN)
                </Badge>
                <Badge size="xs" color="gray" variant="light">
                  {(topThree[0].total_txs || 0).toLocaleString(loc)} TX
                </Badge>
              </Group>
              <AddressBadge
                address={topThree[0].address}
                onSelectAddress={onSelectAddress}
                head={7}
                tail={5}
              />
              <Box mt={6}>
                <AmountDisplay
                  value={formatHMND(metric === 'volume' ? topThree[0].total_volume_hmnd : (topThree[0].balance_hmnd ?? topThree[0].total_volume_hmnd), { suffix: false, locale: lang })}
                  unit="HMND"
                  color="#eab308"
                  size="md"
                />
              </Box>
            </Paper>

            {/* Rank 2 (Silver) */}
            <Paper
              p="sm"
              style={{
                background: 'linear-gradient(135deg, rgba(148, 163, 184, 0.1), rgba(0, 0, 0, 0.4))',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                borderRadius: 8,
              }}
            >
              <Group justify="space-between" mb={4}>
                <Badge color="gray" variant="filled" size="sm" leftSection={<IconMedal size={12} />}>
                  #2 GÜMÜŞ
                </Badge>
                <Badge size="xs" color="gray" variant="light">
                  {(topThree[1].total_txs || 0).toLocaleString(loc)} TX
                </Badge>
              </Group>
              <AddressBadge
                address={topThree[1].address}
                onSelectAddress={onSelectAddress}
                head={7}
                tail={5}
              />
              <Box mt={6}>
                <AmountDisplay
                  value={formatHMND(metric === 'volume' ? topThree[1].total_volume_hmnd : (topThree[1].balance_hmnd ?? topThree[1].total_volume_hmnd), { suffix: false, locale: lang })}
                  unit="HMND"
                  color="#94a3b8"
                  size="md"
                />
              </Box>
            </Paper>

            {/* Rank 3 (Bronze) */}
            <Paper
              p="sm"
              style={{
                background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(0, 0, 0, 0.4))',
                border: '1px solid rgba(249, 115, 22, 0.3)',
                borderRadius: 8,
              }}
            >
              <Group justify="space-between" mb={4}>
                <Badge color="orange" variant="filled" size="sm" leftSection={<IconMedal size={12} />}>
                  #3 BRONZ
                </Badge>
                <Badge size="xs" color="gray" variant="light">
                  {(topThree[2].total_txs || 0).toLocaleString(loc)} TX
                </Badge>
              </Group>
              <AddressBadge
                address={topThree[2].address}
                onSelectAddress={onSelectAddress}
                head={7}
                tail={5}
              />
              <Box mt={6}>
                <AmountDisplay
                  value={formatHMND(metric === 'volume' ? topThree[2].total_volume_hmnd : (topThree[2].balance_hmnd ?? topThree[2].total_volume_hmnd), { suffix: false, locale: lang })}
                  unit="HMND"
                  color="#f97316"
                  size="md"
                />
              </Box>
            </Paper>
          </SimpleGrid>
        )}
      </Paper>

      {/* Liderlik Tablosu */}
      <Paper p="md" className="glass-panel" style={{ borderRadius: 8 }}>
        <Box style={{ overflowX: 'auto', width: '100%' }}>
          <Table striped highlightOnHover verticalSpacing="xs" style={{ width: '100%', minWidth: 720 }}>
            <Table.Thead>
              <Table.Tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <Table.Th style={{ width: 70, whiteSpace: 'nowrap' }}>{t('lbRank')}</Table.Th>
                <Table.Th style={{ whiteSpace: 'nowrap' }}>{t('lbAddress')}</Table.Th>
                <Table.Th style={{ width: 110, whiteSpace: 'nowrap' }}>{t('colLayerPallet')}</Table.Th>
                <Table.Th style={{ width: 90, whiteSpace: 'nowrap' }}>{t('lbTxs')}</Table.Th>
                <Table.Th style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                  {metric === 'volume' ? t('lbVol') : t('lbColBalance')}
                </Table.Th>
                <Table.Th style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>{t('lbPaidFee')}</Table.Th>
                <Table.Th style={{ width: 120, whiteSpace: 'nowrap', textAlign: 'center' }}>{t('colActions')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {loading ? (
                <Table.Tr>
                  <Table.Td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                    <Center>
                      <Loader size="sm" color="yellow" mr="xs" />
                      <Text size="sm" c="dimmed">
                        {t('leaderboard_loadingLeaderboardData')}
                      </Text>
                    </Center>
                  </Table.Td>
                </Table.Tr>
              ) : rows.length > 0 ? (
                rows.map((row, idx) => {
                  const isEvm = row.address?.startsWith('0x') || row.address?.startsWith('0X');
                  const displayAmount = metric === 'volume' ? row.total_volume_hmnd : (row.balance_hmnd !== undefined ? row.balance_hmnd : row.total_volume_hmnd);
                  const isTop3 = idx < 3;
                  const rankColors = ['yellow', 'gray', 'orange'];

                  return (
                    <Table.Tr key={row.address || idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <Table.Td>
                        <Badge
                          size="sm"
                          variant={isTop3 ? 'filled' : 'light'}
                          color={isTop3 ? rankColors[idx] : 'dark'}
                          style={{ minWidth: 44, textAlign: 'center' }}
                        >
                          #{idx + 1}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <AddressBadge
                          address={row.address}
                          showNetwork={false}
                          onSelectAddress={onSelectAddress}
                          head={8}
                          tail={6}
                        />
                      </Table.Td>
                      <Table.Td>
                        <Badge size="xs" color={isEvm ? 'cyan' : 'green'} variant="light">
                          {isEvm ? 'EVM (0x)' : 'Substrate (hm)'}
                        </Badge>
                      </Table.Td>
                      <Table.Td className="font-mono" fw={700}>
                        {(row.total_txs || 0).toLocaleString(loc)}
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'right' }}>
                        <AmountDisplay
                          value={formatHMND(displayAmount || 0, { suffix: false, locale: lang })}
                          unit="HMND"
                          color="#10b981"
                          size="xs"
                        />
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'right' }}>
                        <AmountDisplay
                          value={formatFee(row.total_fees_hmnd || 0, false, lang)}
                          unit="HMND"
                          color="#f59e0b"
                          size="xs"
                        />
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'center' }}>
                        <Group gap={4} wrap="nowrap" justify="center">
                          <Tooltip label={t('preview') || 'Önizle'} withArrow position="top">
                            <ActionIcon
                              size="sm"
                              variant="light"
                              color="cyan"
                              onClick={() => onSelectAddress(row.address)}
                            >
                              <IconEye size={14} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label={t('ledger') || 'Hesap Defteri'} withArrow position="top">
                            <ActionIcon
                              size="sm"
                              variant="light"
                              color="green"
                              onClick={() => onOpenLedger(row.address)}
                            >
                              <IconBook size={14} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label={t('moneyTrail') || 'Para İzi'} withArrow position="top">
                            <ActionIcon
                              size="sm"
                              variant="light"
                              color="violet"
                              onClick={() => onOpenTrail(row.address)}
                            >
                              <IconGitFork size={14} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  );
                })
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={7} style={{ textAlign: 'center', padding: '30px' }}>
                    <Text size="sm" c="dimmed">
                      {t('leaderboard_noRecordsFoundFor')}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Box>
      </Paper>
    </Stack>
  );
}
