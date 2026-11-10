'use client';
import { useState, useEffect } from 'react';
import {
  Paper,
  Stack,
  Title,
  Text,
  Badge,
  Group,
  Box,
  SimpleGrid,
  Progress,
  Tooltip,
  Table,
  TextInput,
  ActionIcon,
  Pagination,
  Select,
} from '@mantine/core';
import {
  IconCoins,
  IconFlame,
  IconLock,
  IconGift,
  IconScale,
  IconUsers,
  IconChartPie,
  IconSearch,
  IconX,
  IconCalendarEvent,
  IconCube,
  IconLockOpen,
} from '@tabler/icons-react';
import { formatHMND, formatUSD, formatTimestamp, timeAgo, shortAddr } from './formatters';
import { useLanguage } from './LanguageContext';
import { useModuleFields } from './ModuleLayout';
import KpiStatCard from './ui/KpiStatCard';
import AmountDisplay from './ui/AmountDisplay';
import AddressBadge from './ui/AddressBadge';

export default function TokenomicsTab({
  onSelectAddress,
  onOpenBlock,
  onOpenTx,
  onOpenLedger,
  onOpenTrail,
}) {
  const { lang } = useLanguage();
  const { t, fields } = useModuleFields();
  const locStr = t('whales_enUs');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Vesting unlock table data. TODO: Cache historic unlock curves in memory
  const [unlocks, setUnlocks] = useState([]);
  const [unlocksLoading, setUnlocksLoading] = useState(false);
  const [unlocksSearch, setUnlocksSearch] = useState('');
  const [unlocksPage, setUnlocksPage] = useState(1);
  const [unlocksPageSize, setUnlocksPageSize] = useState('15');
  const [unlocksTotalPages, setUnlocksTotalPages] = useState(1);
  const [unlocksTotalCount, setUnlocksTotalCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    fetch('/api/tokenomics')
      .then((res) => res.json())
      .then((json) => {
        if (mounted) {
          setData(json);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Tokenomics verisi yüklenemedi:', err);
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const fetchUnlocksTable = () => {
    setUnlocksLoading(true);
    const params = new URLSearchParams({
      category: 'vesting',
      page: String(unlocksPage),
      limit: String(unlocksPageSize),
    });
    if (unlocksSearch.trim()) {
      params.append('q', unlocksSearch.trim());
    }

    fetch(`/api/unlocks-swaps?${params.toString()}`)
      .then((res) => res.json())
      .then((resData) => {
        const ops = resData.items || resData.operations?.items || (Array.isArray(resData.operations) ? resData.operations : []);
        setUnlocks(ops);
        setUnlocksTotalPages(resData.pagination?.totalPages || resData.operations?.totalPages || 1);
        setUnlocksTotalCount(resData.pagination?.totalCount || resData.operations?.total || ops.length);
        setUnlocksLoading(false);
      })
      .catch((err) => {
        console.error('Tokenomics unlocks fetch error:', err);
        setUnlocksLoading(false);
      });
  };

  useEffect(() => {
    fetchUnlocksTable();
  }, [unlocksPage, unlocksPageSize]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setUnlocksPage(1);
    fetchUnlocksTable();
  };

  const handleClearSearch = () => {
    setUnlocksSearch('');
    setUnlocksPage(1);
    setTimeout(fetchUnlocksTable, 0);
  };

  const totalIssuance = data?.totalIssuance || 400000000;
  const burnedTotal = data?.burnedTotal || 690246;
  const circulating = data?.circulatingEstimate || 285970432;
  const claimable = data?.claimableAirdrop || 14114881;
  const feesPot = data?.feesPotBalance || 402744;
  const lockedVesting = data?.lockedVesting || Math.max(0, totalIssuance - circulating - claimable - feesPot - burnedTotal);

  const pctCirculating = ((circulating / totalIssuance) * 100).toFixed(1);
  const pctLocked = ((lockedVesting / totalIssuance) * 100).toFixed(1);
  const pctClaimable = ((claimable / totalIssuance) * 100).toFixed(1);
  const pctFeesPot = ((feesPot / totalIssuance) * 100).toFixed(2);
  const pctBurned = ((burnedTotal / totalIssuance) * 100).toFixed(2);

  return (
    <Stack gap="md">
      {/* 1. HEADER TITLE & DESCRIPTION */}
      <Paper p="md" bg="rgba(0,0,0,0.3)" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          <Box>
            <Group gap="xs" mb={4}>
              <IconChartPie size={24} color="#38bdf8" />
              <Title order={2} size="h3" c="white">
                {t('tokenomics_tokenomics400mSupplyArchitecture')}
              </Title>
              <Badge color="cyan" variant="light" size="sm">
                Proof-of-Humanity
              </Badge>
              <Badge color="teal" variant="light" size="sm">
                {t('tokenomics_verifiedOnChainData')}
              </Badge>
            </Group>
            <Text size="xs" c="dimmed" maw={820}>
              {t('tokenomics_humanode400000000')}
            </Text>
            <Text size="11px" c="teal" mt={4} fw={500}>
              ✓ {t('tokenomics_officialSourceHumanodeNative')}
            </Text>
          </Box>

          <Group gap="xs">
            <Badge color="teal" size="md" variant="light">
              {t('tokenomics_maxSupply400000')}
            </Badge>
          </Group>
        </Group>

        {/* 4 Core KPI Cards */}
        <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing="sm" mt="md">
          <KpiStatCard
            title={t('tokenomics_circulatingSupply')}
            value={`~${circulating.toLocaleString(locStr, { maximumFractionDigits: 0 })}`}
            unit="HMND"
            color="teal"
            icon={IconCoins}
            subtext={`%${pctCirculating} ${t('tokenomics_ofTotalIssuance')}`}
          />

          <KpiStatCard
            title={t('tokenomics_lockedVestingReserve')}
            value={`~${lockedVesting.toLocaleString(locStr, { maximumFractionDigits: 0 })}`}
            unit="HMND"
            color="indigo"
            icon={IconLock}
            subtext={`%${pctLocked} ${t('tokenomics_foundationSeedSchedules')}`}
          />

          <KpiStatCard
            title={t('tokenomics_airdropClaimsReserve')}
            value={claimable.toLocaleString(locStr, { maximumFractionDigits: 0 })}
            unit="HMND"
            color="violet"
            icon={IconGift}
            subtext={t('tokenomics_unclaimedOnTokenclaimsPallet')}
          />

          <KpiStatCard
            title={t('totalBurnedGas')}
            value={burnedTotal.toLocaleString(locStr, { maximumFractionDigits: 0 })}
            unit="HMND"
            color="orange"
            icon={IconFlame}
            subtext={t('tokenomics_burnedPermanentlyFromSupply')}
          />
        </SimpleGrid>
      </Paper>

      {/* 2. MACRO DISTRIBUTION BAR */}
      <Paper p="md" bg="rgba(0,0,0,0.2)" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
        <Group justify="space-between" mb="xs">
          <Text size="sm" fw={700} c="white">
            {t('tokenomics_400000000Hmnd')}
          </Text>
          <Text size="xs" c="dimmed">
            {t('tokenomics_total100')}
          </Text>
        </Group>

        <Progress.Root size="xl" radius="sm">
          <Tooltip label={`${t('tokenomics_circulatingSupply_2')}: %${pctCirculating} (~${(circulating / 1e6).toFixed(1)}M HMND)`}>
            <Progress.Section value={Number(pctCirculating)} color="teal">
              <Progress.Label>%{pctCirculating}</Progress.Label>
            </Progress.Section>
          </Tooltip>

          <Tooltip label={`${t('tokenomics_locked')}: %${pctLocked} (~${(lockedVesting / 1e6).toFixed(1)}M HMND)`}>
            <Progress.Section value={Number(pctLocked)} color="indigo">
              <Progress.Label>%{pctLocked}</Progress.Label>
            </Progress.Section>
          </Tooltip>

          <Tooltip label={`${t('tokenomics_airdrop')}: %${pctClaimable} (~${(claimable / 1e6).toFixed(1)}M HMND)`}>
            <Progress.Section value={Number(pctClaimable)} color="violet">
              <Progress.Label>%{pctClaimable}</Progress.Label>
            </Progress.Section>
          </Tooltip>

          <Tooltip label={`${t('validators_feespotPool')}: %${pctFeesPot} (~${(feesPot / 1e3).toFixed(0)}K HMND)`}>
            <Progress.Section value={Math.max(0.8, Number(pctFeesPot))} color="yellow" />
          </Tooltip>

          <Tooltip label={`${t('tokenomics_burnedGas')}: %${pctBurned} (~${(burnedTotal / 1e3).toFixed(0)}K HMND)`}>
            <Progress.Section value={Math.max(0.5, Number(pctBurned))} color="orange" />
          </Tooltip>
        </Progress.Root>

        {/* Lejant */}
        <Group gap="lg" mt="sm" wrap="wrap">
          <Group gap={6}>
            <Box style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#14b8a6' }} />
            <Text size="xs" c="dimmed">
              {t('tokenomics_circulatingSupply_2')} (%{pctCirculating})
            </Text>
          </Group>
          <Group gap={6}>
            <Box style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#6366f1' }} />
            <Text size="xs" c="dimmed">
              {t('tokenomics_lockedVesting')} (%{pctLocked})
            </Text>
          </Group>
          <Group gap={6}>
            <Box style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#8b5cf6' }} />
            <Text size="xs" c="dimmed">
              {t('tokenomics_airdropClaims')} (%{pctClaimable})
            </Text>
          </Group>
          <Group gap={6}>
            <Box style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#eab308' }} />
            <Text size="xs" c="dimmed">
              {t('tokenomics_feespotReserve')} (%{pctFeesPot})
            </Text>
          </Group>
          <Group gap={6}>
            <Box style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#f97316' }} />
            <Text size="xs" c="dimmed">
              {t('tokenomics_burnedGas')} (%{pctBurned})
            </Text>
          </Group>
        </Group>
      </Paper>

      {/* 3. HISTORICAL UNLOCK EVENTS AND BLOCK/TX AUDIT TABLE */}
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
              <div>
                <Group gap={8}>
                  <Badge color="pink" variant="light" size="sm">
                    🔓 {t('tokenomics_onChainLedger')}
                  </Badge>
                  <Title order={5}>
                    {t('tokenomics_historicalUnlockScheduleBlocks')}
                  </Title>
                </Group>
                <Text size="xs" c="dimmed">
                  {t('tokenomics_exactUnlockBlockNumbers')}
                </Text>
              </div>

              <Group gap="xs" style={{ maxWidth: 380, width: '100%' }}>
                <form onSubmit={handleSearchSubmit} style={{ flex: 1 }}>
                  <TextInput
                    size="xs"
                    placeholder={t('tokenomics_searchWalletTxOr')}
                    leftSection={<IconSearch size={14} />}
                    rightSection={
                      unlocksSearch && (
                        <ActionIcon size="xs" variant="subtle" color="gray" onClick={handleClearSearch}>
                          <IconX size={12} />
                        </ActionIcon>
                      )
                    }
                    value={unlocksSearch}
                    onChange={(e) => setUnlocksSearch(e.target.value)}
                  />
                </form>
                <Select
                  size="xs"
                  value={unlocksPageSize}
                  onChange={(val) => {
                    setUnlocksPageSize(val || '15');
                    setUnlocksPage(1);
                  }}
                  data={[
                    { value: '15', label: '15 / s.' },
                    { value: '30', label: '30 / s.' },
                    { value: '50', label: '50 / s.' },
                  ]}
                  style={{ width: 85 }}
                />
              </Group>
            </Group>
          </Box>

          {/* TABLO */}
          <Table.ScrollContainer minWidth={750}>
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
                  <Table.Th style={{ width: 140 }}>{t('whales_timestamp')}</Table.Th>
                  <Table.Th style={{ width: 100 }}>{t('colBlock')}</Table.Th>
                  <Table.Th style={{ width: 150 }}>{t('tokenomics_txHash')}</Table.Th>
                  <Table.Th>{t('unlocks_beneficiaryWallet')}</Table.Th>
                  <Table.Th style={{ width: 130 }}>{t('tokenomics_method')}</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>{t('tokenomics_unlockedAmount')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {unlocksLoading ? (
                  <Table.Tr>
                    <Table.Td colSpan={6} align="center" py="xl">
                      <Text size="sm" c="dimmed">
                        {t('loading') || 'Yükleniyor...'}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : unlocks.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={6} align="center" py="xl">
                      <Text size="sm" c="dimmed">
                        {t('tokenomics_noUnlockTransactionsFound')}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  unlocks.map((row, idx) => (
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
                        <Tooltip label={row.hash} withArrow>
                          <Text
                            size="xs"
                            className="font-mono"
                            c="blue"
                            style={{ cursor: onOpenTx ? 'pointer' : 'default', textDecoration: onOpenTx ? 'underline' : 'none' }}
                            onClick={() => onOpenTx?.(row.hash)}
                          >
                            {shortAddr(row.hash, 6, 4)}
                          </Text>
                        </Tooltip>
                      </Table.Td>

                      <Table.Td>
                        <AddressBadge
                          address={row.target || row.signer}
                          onSelectAddress={onSelectAddress}
                          onOpenLedger={onOpenLedger}
                          size="xs"
                        />
                      </Table.Td>

                      <Table.Td>
                        <Badge size="xs" variant="light" color="pink">
                          {row.pallet}:{row.method || 'vest'}
                        </Badge>
                      </Table.Td>

                      <Table.Td style={{ textAlign: 'right' }}>
                        <AmountDisplay amount={row.value_hmnd} size="xs" showUSD={false} />
                      </Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>

          {/* Sayfalama */}
          {unlocksTotalPages > 1 && (
            <Group justify="space-between" align="center" mt="xs">
              <Text size="xs" c="dimmed">
                {t('paginationSummary', { page: unlocksPage, totalPages: unlocksTotalPages, total: unlocksTotalCount.toLocaleString(locStr) })}
              </Text>
              <Pagination
                size="sm"
                value={unlocksPage}
                onChange={setUnlocksPage}
                total={unlocksTotalPages}
                siblings={1}
                boundaries={1}
              />
            </Group>
          )}
        </Stack>
      </Paper>

      {/* 4. DUAL SECTION: WALLET TIERS & BIOMETRIC FAIRNESS SCORE */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        {/* Wallet Tiers Pyramid */}
        <Paper p="md" bg="rgba(0,0,0,0.25)" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <Group gap={8} mb="sm">
            <IconUsers size={20} color="#38bdf8" />
            <Text size="sm" fw={700} c="white">
              {t('tokenomics_walletWealthDistributionTiers')}
            </Text>
          </Group>
          <Text size="xs" c="dimmed" mb="md">
            {t('tokenomics_categorizationOfNetworkHolders')}
          </Text>

          <Stack gap="xs">
            <Paper p="xs" bg="rgba(0,0,0,0.3)" style={{ borderLeft: '3px solid #ef4444' }}>
              <Group justify="space-between">
                <Text size="xs" fw={700} c="white">🐋 {t('tokenomics_whale100kHmnd')}</Text>
                <Badge size="xs" color="red" variant="light">Borsalar & Kasalar</Badge>
              </Group>
              <Text size="11px" c="dimmed">
                KuCoin, BitMart, Vakıf Hazine Kasası ve ilk tohum yatırımcıları.
              </Text>
            </Paper>

            <Paper p="xs" bg="rgba(0,0,0,0.3)" style={{ borderLeft: '3px solid #f59e0b' }}>
              <Group justify="space-between">
                <Text size="xs" fw={700} c="white">🦈 {t('tokenomics_shark10k100kHmnd')}</Text>
                <Badge size="xs" color="yellow" variant="light">Düğüm Sahipleri</Badge>
              </Group>
              <Text size="11px" c="dimmed">
                Uzun vadeli validatör işletmecileri ve birikim yapan doğrulayıcılar.
              </Text>
            </Paper>

            <Paper p="xs" bg="rgba(0,0,0,0.3)" style={{ borderLeft: '3px solid #14b8a6' }}>
              <Group justify="space-between">
                <Text size="xs" fw={700} c="white">🐬 {t('tokenomics_dolphin1k10kHmnd')}</Text>
                <Badge size="xs" color="teal" variant="light">DeFi Katılımcıları</Badge>
              </Group>
              <Text size="11px" c="dimmed">
                Impossible Finance LP sağlayıcıları ve aktif token takası yapanlar.
              </Text>
            </Paper>

            <Paper p="xs" bg="rgba(0,0,0,0.3)" style={{ borderLeft: '3px solid #06b6d4' }}>
              <Group justify="space-between">
                <Text size="xs" fw={700} c="white">🦐 {t('tokenomics_shrimpFish1kHmnd')}</Text>
                <Badge size="xs" color="cyan" variant="light">Topluluk</Badge>
              </Group>
              <Text size="11px" c="dimmed">
                Biyometrik testnet katılımcıları, airdrop sahipleri ve mikro transferler.
              </Text>
            </Paper>
          </Stack>
        </Paper>

        {/* Biyometrik Adalet Skoru & Gini Endeksi */}
        <Paper p="md" bg="rgba(0,0,0,0.25)" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <Group gap={8} mb="sm">
            <IconScale size={20} color="#14b8a6" />
            <Text size="sm" fw={700} c="white">
              {t('tokenomics_proofOfHumanityDecentralization')}
            </Text>
          </Group>
          <Text size="xs" c="dimmed" mb="md">
            {t('tokenomics_unlikePosWhereCapital')}
          </Text>

          <Stack gap="sm">
            <Paper p="sm" bg="rgba(20, 184, 166, 0.08)" style={{ border: '1px solid rgba(20, 184, 166, 0.2)' }}>
              <Group justify="space-between" mb={4}>
                <Text size="xs" fw={700} c="teal">
                  {t('tokenomics_validatorVotingEquality')}
                </Text>
                <Badge color="teal" size="sm" variant="light">
                  %100 Tam Eşitlik
                </Badge>
              </Group>
              <Text size="11px" c="dimmed">
                {t('tokenomics_regardlessOfHolding1')}
              </Text>
            </Paper>

            <Paper p="sm" bg="rgba(0,0,0,0.3)" style={{ border: '1px solid rgba(255,255,255,0.04)' }}>
              <Group justify="space-between" mb={4}>
                <Text size="xs" fw={700} c="white">
                  {t('tokenomics_sybilResistance')}
                </Text>
                <Badge color="cyan" size="sm" variant="light">
                  3D Canlılık Testi
                </Badge>
              </Group>
              <Text size="11px" c="dimmed">
                {t('tokenomics_neural3dLivenessDetection')}
              </Text>
            </Paper>

            <Paper p="sm" bg="rgba(0,0,0,0.3)" style={{ border: '1px solid rgba(255,255,255,0.04)' }}>
              <Group justify="space-between" mb={4}>
                <Text size="xs" fw={700} c="white">
                  {t('tokenomics_fairRewardsFeespot')}
                </Text>
                <Badge color="yellow" size="sm" variant="light">
                  Eşit Paylaşım
                </Badge>
              </Group>
              <Text size="11px" c="dimmed">
                {t('tokenomicsPoolEqual', {
                  k: Math.round(feesPot / 1000),
                  amount: feesPot.toLocaleString(locStr, { maximumFractionDigits: 0 })
                })}
              </Text>
            </Paper>
          </Stack>
        </Paper>
      </SimpleGrid>
    </Stack>
  );
}
