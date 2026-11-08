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
  Modal,
  Select,
  SegmentedControl,
  Card,
  Divider,
  Button,
} from '@mantine/core';
import {
  IconSearch,
  IconEye,
  IconBook,
  IconGitFork,
  IconArrowsExchange,
  IconX,
  IconArrowRight,
  IconArrowLeft,
  IconCube,
  IconActivity,
  IconArrowsRightLeft,
  IconExternalLink,
  IconShieldCheck,
} from '@tabler/icons-react';
import { formatHMND, formatFee, formatUSD, formatTimestamp, timeAgo, shortAddr } from './formatters';
import { useLanguage } from './LanguageContext';
import KpiStatCard from './ui/KpiStatCard';
import AddressBadge from './ui/AddressBadge';
import AmountDisplay from './ui/AmountDisplay';

export default function BridgeTab({
  onSelectAddress,
  onOpenLedger,
  onOpenTrail,
  onOpenBlock,
  onOpenTx,
}) {
  const { t, lang } = useLanguage();
  const [data, setData] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [direction, setDirection] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState('25');
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);

  const fetchBridgeData = () => {
    setLoading(true);
    const params = new URLSearchParams({
      direction,
      page: String(page),
      limit: String(pageSize),
    });
    if (searchQuery.trim()) {
      params.append('q', searchQuery.trim());
    }

    fetch(`/api/bridge?${params.toString()}`)
      .then((res) => res.json())
      .then((resData) => {
        setData(resData.items || []);
        setKpis(resData.kpis || null);
        setTotalPages(resData.pagination?.totalPages || 1);
        setTotalCount(resData.pagination?.totalCount || 0);
        setLoading(false);
      })
      .catch((err) => {
        console.error('fetchBridgeData error:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBridgeData();
  }, [direction, page, pageSize]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchBridgeData();
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setPage(1);
    setTimeout(fetchBridgeData, 0);
  };

  const locStr = lang === 'en' ? 'en-US' : 'tr-TR';

  return (
    <Stack gap="md">
      {/* 1. HERO BAŞLIK & GENEL KÖPRÜ BİLGİSİ */}
      <Paper p="md" className="glass-panel" style={{ borderRadius: 8 }}>
        <Group justify="space-between" mb="xs" align="flex-start" wrap="wrap">
          <div>
            <Group gap={8}>
              <Badge color="cyan" variant="light" size="md">
                🌉 {lang === 'tr' ? 'Çift Katman Entegrasyonu' : 'Dual-Layer Integration'}
              </Badge>
              <Title order={4}>
                {lang === 'tr'
                  ? 'Substrate ⇄ EVM Çift Katman Yerel Köprü Analitiği'
                  : 'Substrate ⇄ EVM Dual-Layer Bridge Analytics'}
              </Title>
            </Group>
            <Text size="xs" c="dimmed" mt={4}>
              {lang === 'tr'
                ? 'Humanode yerel katmanı (Substrate) ile akıllı sözleşme katmanı (EVM) arasındaki anlık token geçişleri ve 0x...0900 precompile transferleri'
                : 'Real-time cross-layer token swaps and 0x...0900 precompile operations between Substrate native and EVM execution layers'}
            </Text>
          </div>
        </Group>

        {/* 2. ÇİFT YÖNLÜ NET AKIŞ VE PRECOMPILE KARTLARI */}
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="sm" mt="sm">
          {/* Substrate -> EVM */}
          <Card p="sm" radius="md" style={{ background: 'rgba(56, 189, 248, 0.06)', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
            <Group justify="space-between" align="center" mb={6}>
              <Badge color="cyan" variant="light" size="xs">
                ⚡ Substrate ➔ EVM
              </Badge>
              <IconArrowRight size={16} color="#38bdf8" />
            </Group>
            <Text size="lg" fw={800} c="cyan" className="font-mono">
              {formatHMND(kpis?.sub_to_evm_volume_hmnd || 0, { locale: lang, showScale: false })}
            </Text>
            <Text size="xs" c="dimmed" mt={2}>
              {kpis?.sub_to_evm_count?.toLocaleString(locStr) || 0} {lang === 'tr' ? 'adet köprü extrinsiği' : 'bridge extrinsics'}
            </Text>
          </Card>

          {/* EVM -> Substrate */}
          <Card p="sm" radius="md" style={{ background: 'rgba(168, 85, 247, 0.06)', border: '1px solid rgba(168, 85, 247, 0.25)' }}>
            <Group justify="space-between" align="center" mb={6}>
              <Badge color="violet" variant="light" size="xs">
                🌐 EVM ➔ Substrate
              </Badge>
              <IconArrowLeft size={16} color="#a855f7" />
            </Group>
            <Text size="lg" fw={800} c="violet" className="font-mono">
              {formatHMND(kpis?.evm_to_sub_volume_hmnd || 0, { locale: lang, showScale: false })}
            </Text>
            <Text size="xs" c="dimmed" mt={2}>
              {kpis?.evm_to_sub_count?.toLocaleString(locStr) || 0} {lang === 'tr' ? 'adet precompile işlemi' : 'precompile operations'}
            </Text>
          </Card>

          {/* Net Yön ve Fark */}
          <Card p="sm" radius="md" style={{ background: 'rgba(46, 160, 67, 0.06)', border: '1px solid rgba(46, 160, 67, 0.25)' }}>
            <Group justify="space-between" align="center" mb={6}>
              <Badge color="teal" variant="light" size="xs">
                📊 {lang === 'tr' ? 'Net Akış Yönü' : 'Net Bridge Flow'}
              </Badge>
              <IconArrowsRightLeft size={16} color="#2ea043" />
            </Group>
            <Text size="md" fw={700} c="teal" className="font-mono" lineClamp={1}>
              {kpis?.net_direction || '-'}
            </Text>
            <Text size="xs" c="dimmed" mt={2}>
              Δ {formatHMND(Math.abs(kpis?.net_flow_hmnd || 0), { locale: lang, showScale: false })}
            </Text>
          </Card>

          {/* Resmi Precompile Sözleşmesi */}
          <Card p="sm" radius="md" style={{ background: 'rgba(234, 179, 8, 0.06)', border: '1px solid rgba(234, 179, 8, 0.25)' }}>
            <Group justify="space-between" align="center" mb={6}>
              <Badge color="yellow" variant="light" size="xs">
                ⚙️ {lang === 'tr' ? 'Swap Precompile' : 'Precompile Contract'}
              </Badge>
              <IconShieldCheck size={16} color="#eab308" />
            </Group>
            <Text size="xs" fw={700} className="font-mono" c="#f0f6fc" lineClamp={1}>
              0x0000...0900
            </Text>
            <Text size="10px" c="dimmed" mt={2}>
              {lang === 'tr' ? 'Humanode Resmi Native Swap Motoru' : 'Humanode Native Swap Engine'}
            </Text>
          </Card>
        </SimpleGrid>

        {/* 4 KPI Kartı */}
        <SimpleGrid cols={{ base: 1, xs: 2, sm: 4 }} spacing="sm" mt="sm">
          <KpiStatCard
            title={lang === 'tr' ? 'Toplam Köprü Hacmi' : 'Total Bridge Volume'}
            value={formatHMND(kpis?.total_volume_hmnd || 0, { locale: lang, showScale: false })}
            color="cyan"
            icon={IconArrowsExchange}
            subtext={lang === 'tr' ? 'Her iki yönde aktarılan kümülatif tutar' : 'Cumulative swaps both directions'}
          />
          <KpiStatCard
            title={lang === 'tr' ? 'Toplam Köprü İşlemi' : 'Total Bridge Swaps'}
            value={`${kpis?.total_swaps?.toLocaleString(locStr) || 0}`}
            unit={lang === 'tr' ? 'İşlem' : 'Txs'}
            color="violet"
            icon={IconActivity}
            subtext={lang === 'tr' ? 'Tüm doğrulanmış transferler' : 'All verified transactions'}
          />
          <KpiStatCard
            title={lang === 'tr' ? 'Eşleşen Cüzdan Çifti' : 'Cross-Layer Wallets'}
            value={`${kpis?.cross_layer_matched_wallets?.toLocaleString(locStr) || 0}`}
            unit={lang === 'tr' ? 'Cüzdan' : 'Wallets'}
            color="teal"
            icon={IconGitFork}
            subtext={lang === 'tr' ? 'hm... ⇄ 0x... kimlik bağı kuranlar' : 'Identified dual-identity addresses'}
          />
          <KpiStatCard
            title={lang === 'tr' ? 'Ortalama Transfer' : 'Avg Swap Size'}
            value={kpis?.total_swaps > 0 ? formatHMND(kpis.total_volume_hmnd / kpis.total_swaps, { locale: lang, showScale: false }) : '0 HMND'}
            color="blue"
            icon={IconCube}
            subtext={lang === 'tr' ? 'İşlem başına köprü ortalaması' : 'Average tokens per swap'}
          />
        </SimpleGrid>
      </Paper>

      {/* 3. KÖPRÜ İŞLEMLERİ TABLOSU VE STICKY ARAMA ÇUBUĞU */}
      <Paper p="md" className="glass-panel" style={{ borderRadius: 8 }}>
        <Stack gap="sm">
          {/* STICKY TOOLBAR: Arama, Filtre ve Sayfalama */}
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
              <Group gap="xs" wrap="wrap">
                <SegmentedControl
                  size="xs"
                  value={direction}
                  onChange={(val) => {
                    setDirection(val);
                    setPage(1);
                  }}
                  data={[
                    { value: 'all', label: lang === 'tr' ? '📊 Tümü' : 'All' },
                    { value: 'sub_to_evm', label: '⚡ Substrate ➔ EVM' },
                    { value: 'evm_to_sub', label: '🌐 EVM ➔ Substrate' },
                  ]}
                  styles={{
                    root: { background: 'rgba(255, 255, 255, 0.05)' },
                  }}
                />
                <Badge variant="light" color="cyan" size="sm">
                  {totalCount.toLocaleString(locStr)} {lang === 'tr' ? 'kayıt' : 'records'}
                </Badge>
              </Group>

              <Group gap="xs" style={{ maxWidth: 420, width: '100%' }}>
                <form onSubmit={handleSearchSubmit} style={{ flex: 1 }}>
                  <TextInput
                    size="xs"
                    placeholder={lang === 'tr' ? 'Adres, tx hash veya blok # ara...' : 'Search address, hash or block #...'}
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
                  <Table.Th style={{ width: 150 }}>{lang === 'tr' ? 'İşlem Hash' : 'Tx Hash'}</Table.Th>
                  <Table.Th style={{ width: 160 }}>{lang === 'tr' ? 'Köprü Yönü' : 'Bridge Direction'}</Table.Th>
                  <Table.Th>{lang === 'tr' ? 'Gönderen' : 'Sender'}</Table.Th>
                  <Table.Th>{lang === 'tr' ? 'Alıcı / Hedef' : 'Receiver / Target'}</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>{lang === 'tr' ? 'Tutar (HMND)' : 'Amount'}</Table.Th>
                  <Table.Th style={{ width: 60, textAlign: 'center' }}>{lang === 'tr' ? 'Detay' : 'Info'}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {loading ? (
                  <Table.Tr>
                    <Table.Td colSpan={8} align="center" py="xl">
                      <Text size="sm" c="dimmed">
                        {t('loading') || 'Yükleniyor...'}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : data.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={8} align="center" py="xl">
                      <Text size="sm" c="dimmed">
                        {lang === 'tr' ? 'Kriterlere uygun köprü işlemi bulunamadı.' : 'No bridge transactions found.'}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  data.map((item, idx) => {
                    const isSubToEvm = item.direction === 'sub_to_evm';
                    return (
                      <Table.Tr key={`${item.tx_hash || item.block_number}-${idx}`}>
                        <Table.Td>
                          <Tooltip label={formatTimestamp(item.timestamp, locStr)} withArrow>
                            <Text size="xs" c="dimmed">
                              {timeAgo(item.timestamp, lang)}
                            </Text>
                          </Tooltip>
                        </Table.Td>

                        <Table.Td>
                          <Text
                            size="xs"
                            className="font-mono"
                            c="cyan"
                            style={{ cursor: onOpenBlock ? 'pointer' : 'default', textDecoration: onOpenBlock ? 'underline' : 'none' }}
                            onClick={() => onOpenBlock?.(item.block_number)}
                          >
                            #{item.block_number?.toLocaleString(locStr)}
                          </Text>
                        </Table.Td>

                        <Table.Td>
                          <Tooltip label={item.tx_hash} withArrow>
                            <Text
                              size="xs"
                              className="font-mono"
                              c="blue"
                              style={{ cursor: onOpenTx ? 'pointer' : 'default', textDecoration: onOpenTx ? 'underline' : 'none' }}
                              onClick={() => onOpenTx?.(item.tx_hash)}
                            >
                              {shortAddr(item.tx_hash, 6, 4)}
                            </Text>
                          </Tooltip>
                        </Table.Td>

                        <Table.Td>
                          <Badge
                            size="xs"
                            variant="light"
                            color={isSubToEvm ? 'cyan' : 'violet'}
                            styles={{ root: { fontSize: 10, fontWeight: 700 } }}
                          >
                            {isSubToEvm ? '⚡ Sub ➔ EVM' : '🌐 EVM ➔ Sub (0x0900)'}
                          </Badge>
                        </Table.Td>

                        <Table.Td>
                          <AddressBadge
                            address={item.from_address}
                            onSelectAddress={onSelectAddress}
                            onOpenLedger={onOpenLedger}
                            size="xs"
                          />
                        </Table.Td>

                        <Table.Td>
                          <AddressBadge
                            address={item.to_address}
                            onSelectAddress={onSelectAddress}
                            onOpenLedger={onOpenLedger}
                            size="xs"
                          />
                        </Table.Td>

                        <Table.Td style={{ textAlign: 'right' }}>
                          <AmountDisplay value={item.value_hmnd} amount={item.value_hmnd} size="xs" showUSD={false} />
                        </Table.Td>

                        <Table.Td style={{ textAlign: 'center' }}>
                          <ActionIcon
                            size="sm"
                            variant="subtle"
                            color="gray"
                            onClick={() => setSelectedTx(item)}
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

      {/* 4. İŞLEM DETAY MODALI */}
      <Modal
        opened={Boolean(selectedTx)}
        onClose={() => setSelectedTx(null)}
        title={
          <Group gap="xs">
            <Badge color={selectedTx?.direction === 'sub_to_evm' ? 'cyan' : 'violet'} variant="light">
              {selectedTx?.direction === 'sub_to_evm' ? 'Substrate ➔ EVM Köprüsü' : 'EVM ➔ Substrate (Precompile)'}
            </Badge>
            <Text fw={700} size="sm">
              {lang === 'tr' ? 'Köprü Geçiş Detayları' : 'Bridge Swap Details'}
            </Text>
          </Group>
        }
        size="lg"
        centered
      >
        {selectedTx && (
          <Stack gap="sm">
            <Paper p="sm" withBorder style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
                <div>
                  <Text size="xs" c="dimmed">
                    {lang === 'tr' ? 'Blok Numarası:' : 'Block Number:'}
                  </Text>
                  <Text size="sm" fw={700} className="font-mono">
                    #{selectedTx.block_number?.toLocaleString(locStr)}
                  </Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">
                    {lang === 'tr' ? 'Zaman:' : 'Timestamp:'}
                  </Text>
                  <Text size="sm">{formatTimestamp(selectedTx.timestamp, locStr)}</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">
                    {lang === 'tr' ? 'Aktarılan Miktar:' : 'Swapped Amount:'}
                  </Text>
                  <AmountDisplay amount={selectedTx.value_hmnd} size="sm" />
                </div>
                <div>
                  <Text size="xs" c="dimmed">
                    {lang === 'tr' ? 'İşlem Metodu:' : 'Method:'}
                  </Text>
                  <Badge variant="outline" size="xs">
                    {selectedTx.method || 'nativeToEvmSwap'}
                  </Badge>
                </div>
              </SimpleGrid>
            </Paper>

            <div>
              <Text size="xs" c="dimmed" mb={4}>
                {lang === 'tr' ? 'Gönderen Cüzdan:' : 'Sender Wallet:'}
              </Text>
              <AddressBadge
                address={selectedTx.from_address}
                onSelectAddress={onSelectAddress}
                onOpenLedger={onOpenLedger}
                size="sm"
              />
            </div>

            <div>
              <Text size="xs" c="dimmed" mb={4}>
                {lang === 'tr' ? 'Hedef / Alıcı Cüzdan:' : 'Receiver / Target:'}
              </Text>
              <AddressBadge
                address={selectedTx.to_address}
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
                    onOpenLedger(selectedTx.from_address);
                    setSelectedTx(null);
                  }}
                >
                  {lang === 'tr' ? 'Gönderen Defteri' : 'Sender Ledger'}
                </Button>
              )}
              {onOpenTrail && (
                <Button
                  size="xs"
                  variant="light"
                  color="teal"
                  leftSection={<IconGitFork size={14} />}
                  onClick={() => {
                    onOpenTrail(selectedTx.from_address);
                    setSelectedTx(null);
                  }}
                >
                  {lang === 'tr' ? 'Para İzi' : 'Money Trail'}
                </Button>
              )}
              {onOpenTx && selectedTx.tx_hash && (
                <Button
                  size="xs"
                  variant="filled"
                  color="blue"
                  leftSection={<IconExternalLink size={14} />}
                  onClick={() => {
                    onOpenTx(selectedTx.tx_hash);
                    setSelectedTx(null);
                  }}
                >
                  {lang === 'tr' ? 'İşleme Git' : 'View Tx'}
                </Button>
              )}
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}
