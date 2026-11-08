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
  const { t, lang } = useLanguage();
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

  const locStr = lang === 'en' ? 'en-US' : 'tr-TR';

  return (
    <Stack gap="md">
      {/* 1. HERO BAŞLIK & GERİ SAYIM KARTI */}
      <Paper p="md" className="glass-panel" style={{ borderRadius: 8 }}>
        <Group justify="space-between" mb="xs" align="flex-start" wrap="wrap">
          <div>
            <Group gap={8}>
              <Badge color="pink" variant="light" size="md">
                🔓 {lang === 'tr' ? 'Vesting & Hak Ediş' : 'Vesting & Claims'}
              </Badge>
              <Title order={4}>
                {lang === 'tr' ? 'Token Kilit Açılımı & Vesting Takvimi' : 'Token Unlocks & Vesting Schedule'}
              </Title>
            </Group>
            <Text size="xs" c="dimmed" mt={4}>
              {lang === 'tr'
                ? 'Humanode yerel ağında vesting kilit açılımları, tokenClaims airdrop hak edişleri ve çoklu imzalı hazine operasyonları'
                : 'Substrate native vesting schedule, tokenClaims airdrops and multisig treasury unlocks'}
            </Text>
          </div>
        </Group>

        {/* GERİ SAYIM & TAKVİM BİLGİ KARTI */}
        <Card p="sm" radius="md" mb="sm" style={{ background: 'rgba(236, 72, 153, 0.05)', border: '1px solid rgba(236, 72, 153, 0.25)' }}>
          <Group justify="space-between" align="center" wrap="wrap">
            <Group gap="xs">
              <IconCalendarEvent size={22} color="#ec4899" />
              <div>
                <Text size="sm" fw={700} c="#f0f6fc">
                  ⏱️ {lang === 'tr' ? 'Bir Sonraki Kilit Açılış Dönemi (Cliff / Epoch)' : 'Next Token Unlock Epoch'}
                </Text>
                <Text size="xs" c="dimmed">
                  {lang === 'tr'
                    ? 'Aylık periyodik kilit açılımı • Tahmini hak ediş: ~1.250.000 HMND (Vakıf & Ekosistem Teşvikleri)'
                    : 'Monthly periodic unlock epoch • Estimated cliff: ~1,250,000 HMND (Foundation & Ecosystem Incentives)'}
                </Text>
              </div>
            </Group>
            <Badge color="pink" variant="light" size="md">
              {lang === 'tr' ? 'Periyodik Takvim Aktif' : 'Vesting Schedule Active'}
            </Badge>
          </Group>
        </Card>

        {/* 4 KPI KARTI */}
        <SimpleGrid cols={{ base: 1, xs: 2, sm: 4 }} spacing="sm">
          <Box style={{ cursor: 'pointer' }} onClick={() => { setCategory('vesting'); setPage(1); }}>
            <KpiStatCard
              title={lang === 'tr' ? 'Vesting Kilit Açılımı' : 'Vesting Unlocks'}
              value={`${kpis?.vesting?.toLocaleString(locStr) || 0}`}
              unit={lang === 'tr' ? 'İşlem' : 'Txs'}
              color="pink"
              icon={IconLockOpen}
              badge={category === 'vesting' ? 'AKTİF' : null}
              badgeColor="pink"
              subtext={kpis?.vesting_amount_hmnd > 0 ? formatHMND(kpis.vesting_amount_hmnd, { locale: lang, showScale: false }) : (lang === 'tr' ? 'Vakıf Dağıtımları' : 'Vault Distributions')}
            />
          </Box>

          <Box style={{ cursor: 'pointer' }} onClick={() => { setCategory('tokenClaims'); setPage(1); }}>
            <KpiStatCard
              title="Token Claims (Airdrop)"
              value={`${kpis?.tokenClaims?.toLocaleString(locStr) || 0}`}
              unit={lang === 'tr' ? 'İşlem' : 'Txs'}
              color="yellow"
              icon={IconGift}
              badge={category === 'tokenClaims' ? 'AKTİF' : null}
              badgeColor="yellow"
              subtext={kpis?.tokenClaims_amount_hmnd > 0 ? formatHMND(kpis.tokenClaims_amount_hmnd, { locale: lang, showScale: false }) : 'tokenClaims:claim'}
            />
          </Box>

          <Box style={{ cursor: 'pointer' }} onClick={() => { setCategory('multisig'); setPage(1); }}>
            <KpiStatCard
              title={lang === 'tr' ? 'Multisig Onayları' : 'Multisig Ops'}
              value={`${kpis?.multisig?.toLocaleString(locStr) || 0}`}
              unit={lang === 'tr' ? 'İşlem' : 'Txs'}
              color="orange"
              icon={IconShieldLock}
              badge={category === 'multisig' ? 'AKTİF' : null}
              badgeColor="orange"
              subtext={lang === 'tr' ? 'Çoklu İmzalı Hazine' : 'Multi-Sig Governance'}
            />
          </Box>

          <KpiStatCard
            title={lang === 'tr' ? 'Toplam Açılan Token' : 'Total Unlocked'}
            value={formatHMND((kpis?.vesting_amount_hmnd || 0) + (kpis?.tokenClaims_amount_hmnd || 0), { locale: lang, showScale: false })}
            color="teal"
            icon={IconCoins}
            subtext={lang === 'tr' ? 'Kümülatif hak sahipliği' : 'Cumulative claimed tokens'}
          />
        </SimpleGrid>
      </Paper>

      {/* 2. KİLİT AÇILIMI TABLOSU VE STICKY ARAMA ÇUBUĞU */}
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
                  {lang === 'tr' ? 'Tüm Açılımlar' : 'All Unlocks'}
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
                    placeholder={lang === 'tr' ? 'Cüzdan veya extrinsic ara...' : 'Search wallet or hash...'}
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
                  <Table.Th style={{ width: 140 }}>{lang === 'tr' ? 'Zaman' : 'Time'}</Table.Th>
                  <Table.Th style={{ width: 100 }}>{lang === 'tr' ? 'Blok #' : 'Block #'}</Table.Th>
                  <Table.Th style={{ width: 130 }}>{lang === 'tr' ? 'Kategori & Metot' : 'Pallet & Method'}</Table.Th>
                  <Table.Th>{lang === 'tr' ? 'Gönderen / Hazine' : 'Sender / Vault'}</Table.Th>
                  <Table.Th>{lang === 'tr' ? 'Hak Sahibi Cüzdan' : 'Beneficiary Wallet'}</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>{lang === 'tr' ? 'Açılan Tutar' : 'Unlocked Amount'}</Table.Th>
                  <Table.Th style={{ width: 60, textAlign: 'center' }}>{lang === 'tr' ? 'Detay' : 'Info'}</Table.Th>
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
                        {lang === 'tr' ? 'Kriterlere uygun kilit açılımı bulunamadı.' : 'No unlocks found matching criteria.'}
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
                {lang === 'tr'
                  ? `Sayfa ${page} / ${totalPages} (Toplam ${totalCount.toLocaleString(locStr)} işlem)`
                  : `Page ${page} of ${totalPages} (${totalCount.toLocaleString(locStr)} total)`}
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
              {lang === 'tr' ? 'Kilit Açılım & Extrinsic Detayı' : 'Unlock & Extrinsic Details'}
            </Text>
          </Group>
        }
        size="lg"
        centered
      >
        {selectedExtrinsic && (
          <Stack gap="sm">
            <Paper p="sm" withBorder style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
                <div>
                  <Text size="xs" c="dimmed">
                    {lang === 'tr' ? 'Blok Numarası:' : 'Block Number:'}
                  </Text>
                  <Text size="sm" fw={700} className="font-mono">
                    #{selectedExtrinsic.block_number?.toLocaleString(locStr)}
                  </Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">
                    {lang === 'tr' ? 'Zaman:' : 'Timestamp:'}
                  </Text>
                  <Text size="sm">{formatTimestamp(selectedExtrinsic.timestamp, locStr)}</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">
                    {lang === 'tr' ? 'Açılan Miktar:' : 'Unlocked Amount:'}
                  </Text>
                  <AmountDisplay amount={selectedExtrinsic.value_hmnd} size="sm" />
                </div>
                <div>
                  <Text size="xs" c="dimmed">
                    {lang === 'tr' ? 'Ödenen Ücret:' : 'Fee:'}
                  </Text>
                  <Text size="sm" className="font-mono">
                    {formatFee(selectedExtrinsic.fee_hmnd)}
                  </Text>
                </div>
              </SimpleGrid>
            </Paper>

            <div>
              <Text size="xs" c="dimmed" mb={4}>
                {lang === 'tr' ? 'İmzalayan / Hazine:' : 'Signer / Treasury:'}
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
                {lang === 'tr' ? 'Hak Sahibi Cüzdan:' : 'Beneficiary Wallet:'}
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
                  {lang === 'tr' ? 'Hak Sahibi Defteri' : 'Beneficiary Ledger'}
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
                  {lang === 'tr' ? 'Para İzi' : 'Money Trail'}
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
                  {lang === 'tr' ? 'Bloğu İncele' : 'Inspect Block'}
                </Button>
              )}
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}
