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
  Button,
  ActionIcon,
  Tooltip,
  Stack,
  Divider,
  Modal,
  Select,
  Card,
  CopyButton,
} from '@mantine/core';
import {
  IconLockOpen,
  IconSearch,
  IconEye,
  IconBook,
  IconGitFork,
  IconGift,
  IconShieldLock,
  IconX,
  IconClock,
  IconCalendarEvent,
  IconCube,
  IconCoins,
} from '@tabler/icons-react';
import { formatHMND, formatFee, formatUSD, formatTimestamp, timeAgo, shortAddr } from './formatters';
import { useLanguage } from './LanguageContext';
import { useModuleFields } from './ModuleLayout';
import KpiStatCard from './ui/KpiStatCard';
import AddressBadge from './ui/AddressBadge';
import AmountDisplay from './ui/AmountDisplay';

export default function UnlocksTab({
  onSelectAddress,
  onOpenLedger,
  onOpenTrail,
  onOpenBlock,
  onOpenTx,
}) {
  const { lang } = useLanguage();
  const { t, fields } = useModuleFields();
  const [data, setData] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [category, setCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState('25');
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedExtrinsic, setSelectedExtrinsic] = useState(null);

  const fetchUnlocks = () => {
    setLoading(true);
    // Unlocks tab purely handles vesting, tokenClaims, multisig or all unlock operations
    const apiCategory = category === 'all' ? 'all' : category;
    const params = new URLSearchParams({
      category: apiCategory,
      page: String(page),
      limit: String(pageSize),
    });
    if (searchQuery.trim()) {
      params.append('q', searchQuery.trim());
    }

    fetch(`/api/unlocks-swaps?${params.toString()}`)
      .then((res) => res.json())
      .then((resData) => {
        let ops = resData.items || resData.operations?.items || (Array.isArray(resData.operations) ? resData.operations : []);
        // In all mode, filter out pure nativeToEvmSwap and currencySwap since bridge has its own dedicated tab
        if (category === 'all') {
          ops = ops.filter(op => op.pallet === 'vesting' || op.pallet === 'tokenClaims' || op.pallet === 'multisig' || (op.signer && op.signer.startsWith('hm')));
        }
        setData(ops);
        setKpis(resData.kpis || null);
        const totalP = resData.pagination?.totalPages || resData.operations?.totalPages || resData.totalPages || 1;
        const totalC = resData.pagination?.totalCount || resData.operations?.total || resData.total || ops.length;
        setTotalPages(totalP);
        setTotalCount(totalC);
        setLoading(false);
      })
      .catch((err) => {
        console.error('fetchUnlocks error:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUnlocks();
  }, [category, page, pageSize]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUnlocks();
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setPage(1);
    setTimeout(fetchUnlocks, 0);
  };

  const locStr = lang || undefined;

  return (
    <Stack gap="md">
      {/* 1. HERO HEADER & COUNTDOWN CARD */}
      <Paper p="md" className="glass-panel" style={{ borderRadius: 8 }}>
        <Group justify="space-between" mb="xs" align="flex-start" wrap="wrap">
          <div>
            <Group gap={8}>
              <Badge color="pink" variant="light" size="md">
                🔓 {t('unlocks_vestingClaims')}
              </Badge>
              <Title order={4}>
                {t('unlocks_tokenUnlocksVestingSchedule')}
              </Title>
            </Group>
            <Text size="xs" c="dimmed" mt={4}>
              {t('unlocks_substrateNativeVestingSchedule')}
            </Text>
          </div>
        </Group>

        {/* COUNTDOWN & CALENDAR INFO CARD */}
        <Card p="sm" radius="md" mb="sm" style={{ background: 'rgba(236, 72, 153, 0.05)', border: '1px solid rgba(236, 72, 153, 0.25)' }}>
          <Group justify="space-between" align="center" wrap="wrap">
            <Group gap="xs">
              <IconCalendarEvent size={22} color="#ec4899" />
              <div>
                <Text size="sm" fw={700} c="#f0f6fc">
                  ⏱️ {t('unlocks_nextTokenUnlockEpoch')}
                </Text>
                <Text size="xs" c="dimmed">
                  {t('unlocks_monthlyPeriodicUnlockEpoch')}
                </Text>
              </div>
            </Group>
            <Badge color="pink" variant="light" size="md">
              {t('unlocks_vestingScheduleActive')}
            </Badge>
          </Group>
        </Card>

        {/* 4 KPI KARTI */}
        <SimpleGrid cols={{ base: 1, xs: 2, sm: 4 }} spacing="sm">
          <Box style={{ cursor: 'pointer' }} onClick={() => { setCategory('vesting'); setPage(1); }}>
            <KpiStatCard
              title={t('unlocks_vestingUnlocks')}
              value={`${kpis?.vesting?.toLocaleString(locStr) || 0}`}
              unit={t('unlocks_txs_3')}
              color="pink"
              icon={IconLockOpen}
              badge={category === 'vesting' ? 'AKTİF' : null}
              badgeColor="pink"
              subtext={kpis?.vesting_amount_hmnd > 0 ? formatHMND(kpis.vesting_amount_hmnd, { locale: lang, showScale: false }) : (t('unlocks_vaultDistributions'))}
            />
          </Box>

          <Box style={{ cursor: 'pointer' }} onClick={() => { setCategory('tokenClaims'); setPage(1); }}>
            <KpiStatCard
              title="Token Claims (Airdrop)"
              value={`${kpis?.tokenClaims?.toLocaleString(locStr) || 0}`}
              unit={t('unlocks_txs_3')}
              color="yellow"
              icon={IconGift}
              badge={category === 'tokenClaims' ? 'AKTİF' : null}
              badgeColor="yellow"
              subtext={kpis?.tokenClaims_amount_hmnd > 0 ? formatHMND(kpis.tokenClaims_amount_hmnd, { locale: lang, showScale: false }) : 'tokenClaims:claim'}
            />
          </Box>

          <Box style={{ cursor: 'pointer' }} onClick={() => { setCategory('multisig'); setPage(1); }}>
            <KpiStatCard
              title={t('unlocks_multisigOps')}
              value={`${kpis?.multisig?.toLocaleString(locStr) || 0}`}
              unit={t('unlocks_txs_3')}
              color="orange"
              icon={IconShieldLock}
              badge={category === 'multisig' ? 'AKTİF' : null}
              badgeColor="orange"
              subtext={t('unlocks_multiSigGovernance')}
            />
          </Box>

          <KpiStatCard
            title={t('unlocks_totalUnlocked')}
            value={formatHMND((kpis?.vesting_amount_hmnd || 0) + (kpis?.tokenClaims_amount_hmnd || 0), { locale: lang, showScale: false })}
            color="teal"
            icon={IconCoins}
            subtext={t('unlocks_cumulativeClaimedTokens')}
          />
        </SimpleGrid>
      </Paper>

      {/* 2. UNLOCK SCHEDULE TABLE AND STICKY SEARCH BAR */}
      <Paper p="md" className="glass-panel" style={{ borderRadius: 8 }}>
        <Stack gap="sm">
          {/* STICKY TOOLBAR */}
          <Box
            p="xs"
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 15,
              backdropFilter: 'blur(12px)',
              backgroundColor: 'rgba(13, 17, 23, 0.92)',
              borderRadius: 6,
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <Group justify="space-between" align="center" wrap="wrap" gap="sm">
              <Group gap={6} wrap="wrap">
                <Button
                  size="xs"
                  variant={category === 'all' ? 'filled' : 'light'}
                  color="gray"
                  onClick={() => { setCategory('all'); setPage(1); }}
                >
                  {t('unlocks_allUnlocks')}
                </Button>
                <Button
                  size="xs"
                  variant={category === 'vesting' ? 'filled' : 'light'}
                  color="pink"
                  leftSection={<IconLockOpen size={13} />}
                  onClick={() => { setCategory('vesting'); setPage(1); }}
                >
                  Vesting ({kpis?.vesting || 0})
                </Button>
                <Button
                  size="xs"
                  variant={category === 'tokenClaims' ? 'filled' : 'light'}
                  color="yellow"
                  leftSection={<IconGift size={13} />}
                  onClick={() => { setCategory('tokenClaims'); setPage(1); }}
                >
                  Token Claims ({kpis?.tokenClaims || 0})
                </Button>
                <Button
                  size="xs"
                  variant={category === 'multisig' ? 'filled' : 'light'}
                  color="orange"
                  leftSection={<IconShieldLock size={13} />}
                  onClick={() => { setCategory('multisig'); setPage(1); }}
                >
                  Multisig ({kpis?.multisig || 0})
                </Button>
              </Group>

              <Group gap="xs" style={{ maxWidth: 400, width: '100%' }}>
                <form onSubmit={handleSearchSubmit} style={{ flex: 1 }}>
                  <TextInput
                    size="xs"
                    placeholder={t('unlocks_searchWalletOrHash')}
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
                    { value: '25', label: '25 / s.' },
                    { value: '50', label: '50 / s.' },
                    { value: '100', label: '100 / s.' },
                  ]}
                  style={{ width: 85 }}
                />
              </Group>
            </Group>
          </Box>

          {/* TABLO */}
          <Table.ScrollContainer minWidth={800}>
            <Table highlightOnHover verticalSpacing="xs">
              <Table.Thead
                style={{
                  position: 'sticky',
                  top: 50,
                  zIndex: 10,
                  backdropFilter: 'blur(10px)',
                  backgroundColor: 'rgba(13, 17, 23, 0.95)',
                }}
              >
                <Table.Tr>
                  <Table.Th style={{ width: 140 }}>{t('unlocks_time')}</Table.Th>
                  <Table.Th style={{ width: 100 }}>{t('colBlock')}</Table.Th>
                  <Table.Th style={{ width: 130 }}>{t('unlocks_palletMethod')}</Table.Th>
                  <Table.Th>{t('unlocks_senderVault')}</Table.Th>
                  <Table.Th>{t('unlocks_beneficiaryWallet')}</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>{t('unlocks_unlockedAmount')}</Table.Th>
                  <Table.Th style={{ width: 60, textAlign: 'center' }}>{t('unlocks_info')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {loading ? (
                  <Table.Tr>
                    <Table.Td colSpan={7} align="center" py="xl">
                      <Text size="sm" c="dimmed">
                        {t('loading') || 'Yükleniyor...'}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : data.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={7} align="center" py="xl">
                      <Text size="sm" c="dimmed">
                        {t('unlocks_noUnlocksFoundMatching')}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  data.map((row, idx) => {
                    let palletColor = 'pink';
                    if (row.pallet === 'tokenClaims') palletColor = 'yellow';
                    else if (row.pallet === 'multisig') palletColor = 'orange';

                    return (
                      <Table.Tr key={`${row.hash || row.block_number}-${idx}`}>
                        <Table.Td>
                          <Tooltip label={formatTimestamp(row.timestamp, locStr)} withArrow>
                            <Text size="xs" c="dimmed">
                              {timeAgo(row.timestamp, lang)}
                            </Text>
                          </Tooltip>
                        </Table.Td>

                        <Table.Td>
                          <Text
                            size="xs"
                            className="font-mono"
                            c="cyan"
                            style={{ cursor: onOpenBlock ? 'pointer' : 'default', textDecoration: onOpenBlock ? 'underline' : 'none' }}
                            onClick={() => onOpenBlock?.(row.block_number)}
                          >
                            #{row.block_number?.toLocaleString(locStr)}
                          </Text>
                        </Table.Td>

                        <Table.Td>
                          <Badge
                            size="xs"
                            variant="light"
                            color={palletColor}
                            styles={{ root: { fontSize: 10, fontWeight: 700 } }}
                          >
                            {row.pallet}:{row.method || 'vest'}
                          </Badge>
                        </Table.Td>

                        <Table.Td>
                          <AddressBadge
                            address={row.signer}
                            onSelectAddress={onSelectAddress}
                            onOpenLedger={onOpenLedger}
                            size="xs"
                          />
                        </Table.Td>

                        <Table.Td>
                          <AddressBadge
                            address={row.target || row.signer}
                            onSelectAddress={onSelectAddress}
                            onOpenLedger={onOpenLedger}
                            size="xs"
                          />
                        </Table.Td>

                        <Table.Td style={{ textAlign: 'right' }}>
                          <AmountDisplay value={row.value_hmnd} amount={row.value_hmnd} size="xs" showUSD={false} />
                        </Table.Td>

                        <Table.Td style={{ textAlign: 'center' }}>
                          <ActionIcon
                            size="sm"
                            variant="subtle"
                            color="gray"
                            onClick={() => setSelectedExtrinsic(row)}
                          >
                            <IconEye size={14} />
                          </ActionIcon>
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

      {/* 3. EXTRINSIC DETAY MODALI */}
      <Modal
        opened={Boolean(selectedExtrinsic)}
        onClose={() => setSelectedExtrinsic(null)}
        title={
          <Group gap="xs">
            <Badge color="pink" variant="light">
              {selectedExtrinsic?.pallet}:{selectedExtrinsic?.method}
            </Badge>
            <Text fw={700} size="sm">
              {t('unlocks_unlockExtrinsicDetails')}
            </Text>
          </Group>
        }
        size="min(760px, 94vw)"
        centered
        styles={{
          content: {
            maxWidth: '760px',
            width: '94vw',
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
        {selectedExtrinsic && (
          <Stack gap="sm">
            <Paper p="sm" withBorder style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
                <div>
                  <Text size="xs" c="dimmed">
                    {t('unlocks_blockNumber')}
                  </Text>
                  <Text size="sm" fw={700} className="font-mono">
                    #{selectedExtrinsic.block_number?.toLocaleString(locStr)}
                  </Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">
                    {t('unlocks_timestamp')}
                  </Text>
                  <Text size="sm">{formatTimestamp(selectedExtrinsic.timestamp, locStr)}</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">
                    {t('unlocks_unlockedAmount_2')}
                  </Text>
                  <AmountDisplay amount={selectedExtrinsic.value_hmnd} size="sm" />
                </div>
                <div>
                  <Text size="xs" c="dimmed">
                    {t('unlocks_fee')}
                  </Text>
                  <Text size="sm" className="font-mono">
                    {formatFee(selectedExtrinsic.fee_hmnd)}
                  </Text>
                </div>
              </SimpleGrid>
            </Paper>

            <div>
              <Text size="xs" c="dimmed" mb={4}>
                {t('unlocks_signerTreasury')}
              </Text>
              <AddressBadge
                address={selectedExtrinsic.signer}
                onSelectAddress={onSelectAddress}
                onOpenLedger={onOpenLedger}
                size="sm"
              />
            </div>

            <div>
              <Text size="xs" c="dimmed" mb={4}>
                {t('unlocks_beneficiaryWallet_2')}
              </Text>
              <AddressBadge
                address={selectedExtrinsic.target || selectedExtrinsic.signer}
                onSelectAddress={onSelectAddress}
                onOpenLedger={onOpenLedger}
                size="sm"
              />
            </div>

            <Divider my="xs" />

            <Group justify="flex-end" gap="xs">
              {onOpenLedger && (
                <Button
                  size="xs"
                  variant="light"
                  color="cyan"
                  leftSection={<IconBook size={14} />}
                  onClick={() => {
                    onOpenLedger(selectedExtrinsic.target || selectedExtrinsic.signer);
                    setSelectedExtrinsic(null);
                  }}
                >
                  {t('unlocks_beneficiaryLedger')}
                </Button>
              )}
              {onOpenTrail && (
                <Button
                  size="xs"
                  variant="light"
                  color="teal"
                  leftSection={<IconGitFork size={14} />}
                  onClick={() => {
                    onOpenTrail(selectedExtrinsic.target || selectedExtrinsic.signer);
                    setSelectedExtrinsic(null);
                  }}
                >
                  {t('unlocks_moneyTrail')}
                </Button>
              )}
              {onOpenBlock && (
                <Button
                  size="xs"
                  variant="filled"
                  color="blue"
                  leftSection={<IconCube size={14} />}
                  onClick={() => {
                    onOpenBlock(selectedExtrinsic.block_number);
                    setSelectedExtrinsic(null);
                  }}
                >
                  {t('unlocks_inspectBlock')}
                </Button>
              )}
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}
