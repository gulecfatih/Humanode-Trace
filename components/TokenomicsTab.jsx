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
  const burnedTotal = data?.burnedTotal !== undefined ? data.burnedTotal : 300;
  const burnContractAddress = data?.burnContractAddress || '0x2248100d4d0950B06C1973b601f6DFD8Fb149e45';
  const burnedTxsCount = data?.burnedTxsCount || 1;
  const circulating = data?.circulatingEstimate || 285970432;
  const claimable = data?.claimableAirdrop || 14114881;
  const lockedVesting = data?.lockedVesting || Math.max(0, totalIssuance - circulating - claimable - burnedTotal);

  const pctCirculating = ((circulating / totalIssuance) * 100).toFixed(1);
  const pctLocked = ((lockedVesting / totalIssuance) * 100).toFixed(1);
  const pctClaimable = ((claimable / totalIssuance) * 100).toFixed(1);
  const pctBurnedNum = (burnedTotal / totalIssuance) * 100;
  const pctBurned = pctBurnedNum < 0.01 ? (pctBurnedNum > 0 ? '<0.01' : '0.00') : pctBurnedNum.toFixed(2);

  return (
    <Stack gap="md">
      {/* 1. HEADER TITLE & DESCRIPTION */}
      <Paper p="md" style={{ background: '#f5e6d8', border: '1px solid #d9cbbe', borderTop: '2px solid #111111', borderRadius: 0 }}>
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          <Box>
            <Group gap="xs" mb={4}>
              <IconChartPie size={24} color="#0d7680" />
              <Title order={2} size="h3" style={{ color: '#111111', fontFamily: 'var(--font-serif), Georgia, serif', fontWeight: 700 }}>
                {t('tokenomics_tokenomics400mSupplyArchitecture')}
              </Title>
              <Badge color="cyan" variant="light" size="sm">
                {t('tokenomics_proofOfHumanityBadge')}
              </Badge>
              <Badge color="teal" variant="light" size="sm">
                {t('tokenomics_verifiedOnChainData')}
              </Badge>
              <Tooltip label={`${t('tokenomics_burnContract')}: ${burnContractAddress}`} withArrow>
                <Badge
                  component="a"
                  href={`https://humanode.subscan.io/account/${burnContractAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  color="orange"
                  variant="light"
                  size="sm"
                  style={{ cursor: 'pointer' }}
                >
                  🔥 {t('tokenomics_burnContract')}: {shortAddr(burnContractAddress)} ({burnedTxsCount} {t('tokenomics_burnTxCountSuffix')}) ↗
                </Badge>
              </Tooltip>
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
            title={t('tokenomics_totalBurnedCoins')}
            value={burnedTotal.toLocaleString(locStr, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            unit="HMND"
            color="orange"
            icon={IconFlame}
            badge={t('tokenomics_burnContract')}
            badgeColor="orange"
            tooltip={`Burn Contract: ${burnContractAddress}`}
            subtext={t('tokenomics_burnedPermanentlyFromSupply')}
          />
        </SimpleGrid>
      </Paper>

      {/* 2. MACRO DISTRIBUTION BAR */}
      <Paper p="md" style={{ background: '#f5e6d8', border: '1px solid #d9cbbe', borderTop: '2px solid #111111', borderRadius: 0 }}>
        <Group justify="space-between" mb="xs">
          <Text size="sm" fw={700} style={{ color: '#111111', fontFamily: 'var(--font-serif), Georgia, serif' }}>
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

          <Tooltip label={`${t('tokenomics_burnedCoins')}: %${pctBurned} (${burnedTotal.toLocaleString(locStr, { maximumFractionDigits: 2 })} HMND)`}>
            <Progress.Section value={Math.max(0.2, Number(pctBurnedNum || 0.01))} color="orange" />
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
            <Box style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#f97316' }} />
            <Text size="xs" c="dimmed">
              {t('tokenomics_burnedCoins')} (%{pctBurned})
            </Text>
          </Group>
        </Group>
      </Paper>

      {/* 3. HISTORICAL UNLOCK EVENTS AND BLOCK/TX AUDIT TABLE */}
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
              <div>
                <Group gap={8}>
                  <Badge color="pink" variant="light" size="sm">
                    🔓 {t('tokenomics_onChainLedger')}
                  </Badge>
                  <Title order={5} style={{ color: '#111111', fontFamily: 'var(--font-serif), Georgia, serif', fontWeight: 700 }}>
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
                  backgroundColor: '#f5e6d8',
                  borderBottom: '2px solid #111111',
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
                        {t('loading')}
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
                          <Text size="xs" style={{ color: '#554f47', fontWeight: 600 }}>
                            {timeAgo(row.timestamp, lang)}
                          </Text>
                        </Tooltip>
                      </Table.Td>

                      <Table.Td>
                        <Text
                          size="xs"
                          className="font-mono"
                          style={{ color: '#0d7680', fontWeight: 700, cursor: onOpenBlock ? 'pointer' : 'default', textDecoration: onOpenBlock ? 'underline' : 'none' }}
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
                            style={{ color: '#0d7680', fontWeight: 600, cursor: onOpenTx ? 'pointer' : 'default', textDecoration: onOpenTx ? 'underline' : 'none' }}
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
        <Paper p="md" style={{ background: '#f5e6d8', border: '1px solid #d9cbbe', borderTop: '2px solid #111111', borderRadius: 0 }}>
          <Group gap={8} mb="sm">
            <IconUsers size={20} color="#0d7680" />
            <Text size="sm" fw={700} style={{ color: '#111111', fontFamily: 'var(--font-serif), Georgia, serif' }}>
              {t('tokenomics_walletWealthDistributionTiers')}
            </Text>
          </Group>
          <Text size="xs" c="dimmed" mb="md">
            {t('tokenomics_categorizationOfNetworkHolders')}
          </Text>

          <Stack gap="xs">
            <Paper p="xs" style={{ background: '#fff1e5', border: '1px solid #d9cbbe', borderLeft: '3px solid #ef4444', borderRadius: 0 }}>
              <Group justify="space-between">
                <Text size="xs" fw={700} style={{ color: '#111111' }}>🐋 {t('tokenomics_whale100kHmnd')}</Text>
                <Badge size="xs" color="red" variant="light">{t('tokenomics_exchangesAndTreasuries')}</Badge>
              </Group>
              <Text size="11px" c="dimmed">
                {t('tokenomics_whaleDesc')}
              </Text>
            </Paper>

            <Paper p="xs" style={{ background: '#fff1e5', border: '1px solid #d9cbbe', borderLeft: '3px solid #f59e0b', borderRadius: 0 }}>
              <Group justify="space-between">
                <Text size="xs" fw={700} style={{ color: '#111111' }}>🦈 {t('tokenomics_shark10k100kHmnd')}</Text>
                <Badge size="xs" color="yellow" variant="light">{t('tokenomics_nodeOperators')}</Badge>
              </Group>
              <Text size="11px" c="dimmed">
                {t('tokenomics_sharkDesc')}
              </Text>
            </Paper>

            <Paper p="xs" style={{ background: '#fff1e5', border: '1px solid #d9cbbe', borderLeft: '3px solid #14b8a6', borderRadius: 0 }}>
              <Group justify="space-between">
                <Text size="xs" fw={700} style={{ color: '#111111' }}>🐬 {t('tokenomics_dolphin1k10kHmnd')}</Text>
                <Badge size="xs" color="teal" variant="light">{t('tokenomics_defiParticipants')}</Badge>
              </Group>
              <Text size="11px" c="dimmed">
                {t('tokenomics_dolphinDesc')}
              </Text>
            </Paper>

            <Paper p="xs" style={{ background: '#fff1e5', border: '1px solid #d9cbbe', borderLeft: '3px solid #06b6d4', borderRadius: 0 }}>
              <Group justify="space-between">
                <Text size="xs" fw={700} style={{ color: '#111111' }}>🦐 {t('tokenomics_shrimpFish1kHmnd')}</Text>
                <Badge size="xs" color="cyan" variant="light">{t('tokenomics_communityMembers')}</Badge>
              </Group>
              <Text size="11px" c="dimmed">
                {t('tokenomics_shrimpDesc')}
              </Text>
            </Paper>
          </Stack>
        </Paper>

        {/* Biyometrik Adalet Skoru & Gini Endeksi */}
        <Paper p="md" style={{ background: '#f5e6d8', border: '1px solid #d9cbbe', borderTop: '2px solid #111111', borderRadius: 0 }}>
          <Group gap={8} mb="sm">
            <IconScale size={20} color="#0d7680" />
            <Text size="sm" fw={700} style={{ color: '#111111', fontFamily: 'var(--font-serif), Georgia, serif' }}>
              {t('tokenomics_proofOfHumanityDecentralization')}
            </Text>
          </Group>
          <Text size="xs" c="dimmed" mb="md">
            {t('tokenomics_unlikePosWhereCapital')}
          </Text>

          <Stack gap="sm">
            <Paper p="sm" style={{ background: '#fff1e5', border: '1px solid #0d7680', borderRadius: 0 }}>
              <Group justify="space-between" mb={4}>
                <Text size="xs" fw={700} style={{ color: '#0d7680' }}>
                  {t('tokenomics_validatorVotingEquality')}
                </Text>
                <Badge color="teal" size="sm" variant="light">
                  {t('tokenomics_100PercentEquality')}
                </Badge>
              </Group>
              <Text size="11px" c="dimmed">
                {t('tokenomics_regardlessOfHolding1')}
              </Text>
            </Paper>

            <Paper p="sm" style={{ background: '#fff1e5', border: '1px solid #d9cbbe', borderRadius: 0 }}>
              <Group justify="space-between" mb={4}>
                <Text size="xs" fw={700} style={{ color: '#111111' }}>
                  {t('tokenomics_sybilResistance')}
                </Text>
                <Badge color="cyan" size="sm" variant="light">
                  {t('tokenomics_3dLivenessDetection')}
                </Badge>
              </Group>
              <Text size="11px" c="dimmed">
                {t('tokenomics_neural3dLivenessDetection')}
              </Text>
            </Paper>

            <Paper p="sm" style={{ background: '#fff1e5', border: '1px solid #d9cbbe', borderRadius: 0 }}>
              <Group justify="space-between" mb={4}>
                <Text size="xs" fw={700} style={{ color: '#111111' }}>
                  {t('tokenomics_fixedSupplyHardCap')}
                </Text>
                <Badge color="orange" size="sm" variant="light">
                  {t('tokenomics_deflationaryMechanics')}
                </Badge>
              </Group>
              <Text size="11px" c="dimmed">
                {t('tokenomics_fixedSupplyDesc')}
              </Text>
            </Paper>
          </Stack>
        </Paper>
      </SimpleGrid>
    </Stack>
  );
}
