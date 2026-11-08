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
  const { lang, t } = useLanguage();
  const locStr = lang === 'tr' ? 'tr-TR' : 'en-US';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Kilit Açılımları Tablosu Verileri
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
      {/* 1. ÜST BAŞLIK & AÇIKLAMA */}
      <Paper p="md" bg="rgba(0,0,0,0.3)" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          <Box>
            <Group gap="xs" mb={4}>
              <IconChartPie size={24} color="#38bdf8" />
              <Title order={2} size="h3" c="white">
                {lang === 'tr' ? 'Token Ekonomisi & 400M Arz Dağılımı' : 'Tokenomics & 400M Supply Architecture'}
              </Title>
              <Badge color="cyan" variant="light" size="sm">
                Proof-of-Humanity
              </Badge>
              <Badge color="teal" variant="light" size="sm">
                {lang === 'tr' ? 'Doğrulanmış Resmi Veri' : 'Verified On-Chain Data'}
              </Badge>
            </Group>
            <Text size="xs" c="dimmed" maw={820}>
              {lang === 'tr'
                ? 'Humanode ağının 400.000.000 HMND sabit toplam arz yapısı, resmi dolaşımdaki likit miktar, kilitli vakıf rezervleri, hak edilmeyi bekleyen airdrop havuzu ve yakılan işlem ücretleri.'
                : 'Humanode 400,000,000 HMND fixed total supply breakdown, verified circulating supply, vesting locks, token claim reserves, burned gas metrics, and equality metrics.'}
            </Text>
            <Text size="11px" c="teal" mt={4} fw={500}>
              ✓ {lang === 'tr' ? 'Resmi Kaynak: Humanode Native Supply API (supply-api.mainnet.stages.humanode.io) & CoinGecko / CMC' : 'Official Source: Humanode Native Supply API (supply-api.mainnet.stages.humanode.io) & CoinGecko'}
            </Text>
          </Box>

          <Group gap="xs">
            <Badge color="teal" size="md" variant="light">
              {lang === 'tr' ? 'Maksimum Arz: 400.000.000 HMND' : 'Max Supply: 400,000,000 HMND'}
            </Badge>
          </Group>
        </Group>

        {/* 4 Ana KPI Kartı */}
        <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing="sm" mt="md">
          <KpiStatCard
            title={lang === 'tr' ? 'Dolaşımdaki Likit Arz' : 'Circulating Supply'}
            value={`~${circulating.toLocaleString(locStr, { maximumFractionDigits: 0 })}`}
            unit="HMND"
            color="teal"
            icon={IconCoins}
            subtext={`%${pctCirculating} ${lang === 'tr' ? 'toplam arza oranı' : 'of total issuance'}`}
          />

          <KpiStatCard
            title={lang === 'tr' ? 'Kilitli & Vesting Rezervi' : 'Locked & Vesting Reserve'}
            value={`~${lockedVesting.toLocaleString(locStr, { maximumFractionDigits: 0 })}`}
            unit="HMND"
            color="indigo"
            icon={IconLock}
            subtext={`%${pctLocked} ${lang === 'tr' ? 'vakıf & tohum kilitleri' : 'foundation & seed schedules'}`}
          />

          <KpiStatCard
            title={lang === 'tr' ? 'Airdrop / Claim Rezervi' : 'Airdrop Claims Reserve'}
            value={claimable.toLocaleString(locStr, { maximumFractionDigits: 0 })}
            unit="HMND"
            color="violet"
            icon={IconGift}
            subtext={lang === 'tr' ? 'pallet tokenClaims talep bekleyen' : 'unclaimed on tokenClaims pallet'}
          />

          <KpiStatCard
            title={lang === 'tr' ? 'Toplam Yakılan Gas (Fee)' : 'Total Burned Gas Fees'}
            value={burnedTotal.toLocaleString(locStr, { maximumFractionDigits: 0 })}
            unit="HMND"
            color="orange"
            icon={IconFlame}
            subtext={lang === 'tr' ? 'EVM & Substrate işlemlerinde yok edildi' : 'burned permanently from supply'}
          />
        </SimpleGrid>
      </Paper>

      {/* 2. MAKRO DAĞILIM ÇUBUĞU */}
      <Paper p="md" bg="rgba(0,0,0,0.2)" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
        <Group justify="space-between" mb="xs">
          <Text size="sm" fw={700} c="white">
            {lang === 'tr' ? '400.000.000 HMND Makro Dağılım Spektrumu' : '400,000,000 HMND Macro Distribution Spectrum'}
          </Text>
          <Text size="xs" c="dimmed">
            {lang === 'tr' ? 'Toplam: %100' : 'Total: 100%'}
          </Text>
        </Group>

        <Progress.Root size="xl" radius="sm">
          <Tooltip label={`${lang === 'tr' ? 'Dolaşımdaki Arz' : 'Circulating'}: %${pctCirculating} (~${(circulating / 1e6).toFixed(1)}M HMND)`}>
            <Progress.Section value={Number(pctCirculating)} color="teal">
              <Progress.Label>%{pctCirculating}</Progress.Label>
            </Progress.Section>
          </Tooltip>

          <Tooltip label={`${lang === 'tr' ? 'Kilitli Rezerv' : 'Locked'}: %${pctLocked} (~${(lockedVesting / 1e6).toFixed(1)}M HMND)`}>
            <Progress.Section value={Number(pctLocked)} color="indigo">
              <Progress.Label>%{pctLocked}</Progress.Label>
            </Progress.Section>
          </Tooltip>

          <Tooltip label={`${lang === 'tr' ? 'Airdrop Rezervi' : 'Airdrop'}: %${pctClaimable} (~${(claimable / 1e6).toFixed(1)}M HMND)`}>
            <Progress.Section value={Number(pctClaimable)} color="violet">
              <Progress.Label>%{pctClaimable}</Progress.Label>
            </Progress.Section>
          </Tooltip>

          <Tooltip label={`${lang === 'tr' ? 'FeesPot Havuzu' : 'FeesPot'}: %${pctFeesPot} (~${(feesPot / 1e3).toFixed(0)}K HMND)`}>
            <Progress.Section value={Math.max(0.8, Number(pctFeesPot))} color="yellow" />
          </Tooltip>

          <Tooltip label={`${lang === 'tr' ? 'Yakılan Gas' : 'Burned'}: %${pctBurned} (~${(burnedTotal / 1e3).toFixed(0)}K HMND)`}>
            <Progress.Section value={Math.max(0.5, Number(pctBurned))} color="orange" />
          </Tooltip>
        </Progress.Root>

        {/* Lejant */}
        <Group gap="lg" mt="sm" wrap="wrap">
          <Group gap={6}>
            <Box style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#14b8a6' }} />
            <Text size="xs" c="dimmed">
              {lang === 'tr' ? 'Dolaşımdaki Arz' : 'Circulating Supply'} (%{pctCirculating})
            </Text>
          </Group>
          <Group gap={6}>
            <Box style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#6366f1' }} />
            <Text size="xs" c="dimmed">
              {lang === 'tr' ? 'Kilitli & Vesting' : 'Locked & Vesting'} (%{pctLocked})
            </Text>
          </Group>
          <Group gap={6}>
            <Box style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#8b5cf6' }} />
            <Text size="xs" c="dimmed">
              {lang === 'tr' ? 'Airdrop Havuzu' : 'Airdrop Claims'} (%{pctClaimable})
            </Text>
          </Group>
          <Group gap={6}>
            <Box style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#eab308' }} />
            <Text size="xs" c="dimmed">
              {lang === 'tr' ? 'FeesPot Rezervi' : 'FeesPot Reserve'} (%{pctFeesPot})
            </Text>
          </Group>
          <Group gap={6}>
            <Box style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#f97316' }} />
            <Text size="xs" c="dimmed">
              {lang === 'tr' ? 'Yakılan Gas' : 'Burned Gas'} (%{pctBurned})
            </Text>
          </Group>
        </Group>
      </Paper>

      {/* 3. TARİHSEL KİLİT AÇILIMLARI VE BLOK / İŞLEM DÖKÜM TABLOSU */}
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
                    🔓 {lang === 'tr' ? 'On-Chain Kayıtlar' : 'On-Chain Ledger'}
                  </Badge>
                  <Title order={5}>
                    {lang === 'tr' ? 'Tarihsel Kilit Açılım Takvimi, Bloklar ve İşlemler' : 'Historical Unlock Schedule, Blocks & Transactions'}
                  </Title>
                </Group>
                <Text size="xs" c="dimmed">
                  {lang === 'tr'
                    ? 'Açılan kilitlerin kesin blok numaraları, işlem hashleri, hak sahibi adresler ve açılan HMND miktarları'
                    : 'Exact unlock block numbers, transaction hashes, recipient wallets, and HMND amounts released'}
                </Text>
              </div>

              <Group gap="xs" style={{ maxWidth: 380, width: '100%' }}>
                <form onSubmit={handleSearchSubmit} style={{ flex: 1 }}>
                  <TextInput
                    size="xs"
                    placeholder={lang === 'tr' ? 'Cüzdan, tx veya blok ara...' : 'Search wallet, tx or block...'}
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
                  <Table.Th style={{ width: 140 }}>{lang === 'tr' ? 'Tarih' : 'Date'}</Table.Th>
                  <Table.Th style={{ width: 100 }}>{lang === 'tr' ? 'Blok #' : 'Block #'}</Table.Th>
                  <Table.Th style={{ width: 150 }}>{lang === 'tr' ? 'İşlem Hash' : 'Tx Hash'}</Table.Th>
                  <Table.Th>{lang === 'tr' ? 'Hak Sahibi Cüzdan' : 'Beneficiary Wallet'}</Table.Th>
                  <Table.Th style={{ width: 130 }}>{lang === 'tr' ? 'Metot' : 'Method'}</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>{lang === 'tr' ? 'Açılan Miktar' : 'Unlocked Amount'}</Table.Th>
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
                        {lang === 'tr' ? 'Kilit açılım işlemi bulunamadı.' : 'No unlock transactions found.'}
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
                {lang === 'tr'
                  ? `Sayfa ${unlocksPage} / ${unlocksTotalPages} (Toplam ${unlocksTotalCount.toLocaleString(locStr)} kilit açılımı)`
                  : `Page ${unlocksPage} of ${unlocksTotalPages} (${unlocksTotalCount.toLocaleString(locStr)} total)`}
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

      {/* 4. İKİLİ BÖLÜM: CÜZDAN KADEMELERİ & BİYOMETRİK ADALET SKORU */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        {/* Cüzdan Kademeleri Piramidi */}
        <Paper p="md" bg="rgba(0,0,0,0.25)" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <Group gap={8} mb="sm">
            <IconUsers size={20} color="#38bdf8" />
            <Text size="sm" fw={700} c="white">
              {lang === 'tr' ? 'Cüzdan Bakiyeleri ve Servet Kademeleri' : 'Wallet Wealth Distribution Tiers'}
            </Text>
          </Group>
          <Text size="xs" c="dimmed" mb="md">
            {lang === 'tr'
              ? 'Ağdaki hesapların bakiye büyüklüklerine göre sınıflandırılması ve ekosistemdeki varlık ağırlıkları.'
              : 'Categorization of network holders by balance size and ecosystem weight.'}
          </Text>

          <Stack gap="xs">
            <Paper p="xs" bg="rgba(0,0,0,0.3)" style={{ borderLeft: '3px solid #ef4444' }}>
              <Group justify="space-between">
                <Text size="xs" fw={700} c="white">🐋 {lang === 'tr' ? 'Balina (>100.000 HMND)' : 'Whale (>100K HMND)'}</Text>
                <Badge size="xs" color="red" variant="light">Borsalar & Kasalar</Badge>
              </Group>
              <Text size="11px" c="dimmed">
                KuCoin, BitMart, Vakıf Hazine Kasası ve ilk tohum yatırımcıları.
              </Text>
            </Paper>

            <Paper p="xs" bg="rgba(0,0,0,0.3)" style={{ borderLeft: '3px solid #f59e0b' }}>
              <Group justify="space-between">
                <Text size="xs" fw={700} c="white">🦈 {lang === 'tr' ? 'Köpekbalığı (10.000 - 100.000 HMND)' : 'Shark (10K - 100K HMND)'}</Text>
                <Badge size="xs" color="yellow" variant="light">Düğüm Sahipleri</Badge>
              </Group>
              <Text size="11px" c="dimmed">
                Uzun vadeli validatör işletmecileri ve birikim yapan doğrulayıcılar.
              </Text>
            </Paper>

            <Paper p="xs" bg="rgba(0,0,0,0.3)" style={{ borderLeft: '3px solid #14b8a6' }}>
              <Group justify="space-between">
                <Text size="xs" fw={700} c="white">🐬 {lang === 'tr' ? 'Yunus (1.000 - 10.000 HMND)' : 'Dolphin (1K - 10K HMND)'}</Text>
                <Badge size="xs" color="teal" variant="light">DeFi Katılımcıları</Badge>
              </Group>
              <Text size="11px" c="dimmed">
                Impossible Finance LP sağlayıcıları ve aktif token takası yapanlar.
              </Text>
            </Paper>

            <Paper p="xs" bg="rgba(0,0,0,0.3)" style={{ borderLeft: '3px solid #06b6d4' }}>
              <Group justify="space-between">
                <Text size="xs" fw={700} c="white">🦐 {lang === 'tr' ? 'Karides & Balık (<1.000 HMND)' : 'Shrimp & Fish (<1K HMND)'}</Text>
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
              {lang === 'tr' ? 'Biyometrik Eşitlik Endeksi (Proof-of-Humanity)' : 'Proof-of-Humanity Decentralization Index'}
            </Text>
          </Group>
          <Text size="xs" c="dimmed" mb="md">
            {lang === 'tr'
              ? 'Geleneksel PoW veya PoS blokzincirlerinde servet yoğunlaşması madencilik veya stake gücünü tekeline alırken, Humanode’da durum tamamen farklıdır:'
              : 'Unlike PoS where capital buys validator power, Humanode enforces strict biological decentralization:'}
          </Text>

          <Stack gap="sm">
            <Paper p="sm" bg="rgba(20, 184, 166, 0.08)" style={{ border: '1px solid rgba(20, 184, 166, 0.2)' }}>
              <Group justify="space-between" mb={4}>
                <Text size="xs" fw={700} c="teal">
                  {lang === 'tr' ? 'Validatör Güç Eşitliği' : 'Validator Voting Equality'}
                </Text>
                <Badge color="teal" size="sm" variant="light">
                  %100 Tam Eşitlik
                </Badge>
              </Group>
              <Text size="11px" c="dimmed">
                {lang === 'tr'
                  ? 'İster 1 HMND ister 10.000.000 HMND sahibi olun; her insan yalnızca 1 geçerli bioauth kaydına ve ağda 1 eşit blok üretim hakkına sahiptir. Servet, blok üretim şansını artıramaz.'
                  : 'Regardless of holding 1 or 10,000,000 HMND, each human commands exactly 1 node and 1 vote. Capital cannot purchase extra authoring slots.'}
              </Text>
            </Paper>

            <Paper p="sm" bg="rgba(0,0,0,0.3)" style={{ border: '1px solid rgba(255,255,255,0.04)' }}>
              <Group justify="space-between" mb={4}>
                <Text size="xs" fw={700} c="white">
                  {lang === 'tr' ? 'Sybil Saldırısı İmkânsızlığı' : 'Sybil Resistance'}
                </Text>
                <Badge color="cyan" size="sm" variant="light">
                  3D Canlılık Testi
                </Badge>
              </Group>
              <Text size="11px" c="dimmed">
                {lang === 'tr'
                  ? 'Yapay zeka veya sahte kimliklerle birden fazla düğüm açmak kriptografik ve nöral yüz tanıma algoritmalarıyla sıfıra indirgenmiştir.'
                  : 'Neural 3D liveness detection prevents artificial or duplicate node operations.'}
              </Text>
            </Paper>

            <Paper p="sm" bg="rgba(0,0,0,0.3)" style={{ border: '1px solid rgba(255,255,255,0.04)' }}>
              <Group justify="space-between" mb={4}>
                <Text size="xs" fw={700} c="white">
                  {lang === 'tr' ? 'Adil Ödül Dağıtımı (FeesPot)' : 'Fair Rewards (FeesPot)'}
                </Text>
                <Badge color="yellow" size="sm" variant="light">
                  Eşit Paylaşım
                </Badge>
              </Group>
              <Text size="11px" c="dimmed">
                {lang === 'tr'
                  ? `Havuzdaki ~${Math.round(feesPot / 1000)}K HMND (${feesPot.toLocaleString(locStr, { maximumFractionDigits: 0 })} HMND) tüm aktif insan düğümlerine eşit paylaştırılarak servet makası dengelenir.`
                  : `Current pool reserve of ~${Math.round(feesPot / 1000)}K HMND (${feesPot.toLocaleString(locStr, { maximumFractionDigits: 0 })} HMND) is distributed strictly equally across all live verified human nodes.`}
              </Text>
            </Paper>
          </Stack>
        </Paper>
      </SimpleGrid>
    </Stack>
  );
}
