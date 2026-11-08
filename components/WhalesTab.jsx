'use client';
import { useState, useEffect } from 'react';
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
  TextInput,
  SegmentedControl,
  ActionIcon,
  Tooltip,
  Loader,
  Center,
  CopyButton,
} from '@mantine/core';
import {
  IconRadar,
  IconStar,
  IconStarFilled,
  IconTrash,
  IconPlus,
  IconExternalLink,
  IconCheck,
  IconCopy,
  IconEye,
  IconFilter,
  IconCoins,
} from '@tabler/icons-react';
import { shortAddr, formatTimestamp, formatHMND, formatUSD } from './formatters';
import { useLanguage } from './LanguageContext';
import KpiStatCard from './ui/KpiStatCard';
import AddressBadge from './ui/AddressBadge';
import AmountDisplay from './ui/AmountDisplay';

export default function WhalesTab({ onSelectAddress, onOpenBlock, onOpenLedger }) {
  const { lang, t } = useLanguage();
  const locStr = lang === 'tr' ? 'tr-TR' : 'en-US';

  const [activeSegment, setActiveSegment] = useState('radar');
  const [assetFilter, setAssetFilter] = useState('hmnd'); // 'hmnd' | 'usdc' | 'all'
  const [minHmnd, setMinHmnd] = useState('50000');
  const [whales, setWhales] = useState([]);
  const [loading, setLoading] = useState(true);

  // Watchlist (Kişisel Takip Listesi)
  const [watchlist, setWatchlist] = useState([]);
  const [newAddrInput, setNewAddrInput] = useState('');

  // LocalStorage'dan takip listesini yükle
  useEffect(() => {
    try {
      const saved = localStorage.getItem('humannode_watchlist');
      if (saved) {
        setWatchlist(JSON.parse(saved));
      } else {
        const defaultList = [
          '0x33e5b3e2a97ac39ca5',
          'hmpwhPbL5XJTYPWXPMkacfqGhJ3eoQRPLKphajpvcot5Q5zkk',
        ];
        setWatchlist(defaultList);
      }
    } catch (e) {
      console.error('Watchlist yüklenemedi:', e);
    }
  }, []);

  // Varlık türü değiştiğinde mantıklı varsayılan eşik ata
  const handleAssetChange = (newAsset) => {
    setAssetFilter(newAsset);
    if (newAsset === 'usdc') {
      setMinHmnd('10000');
    } else if (newAsset === 'hmnd') {
      setMinHmnd('50000');
    } else {
      setMinHmnd('50000');
    }
  };

  // Balina verilerini API'den çek
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch(`/api/whales?minHmnd=${minHmnd}&asset=${assetFilter}&limit=60`)
      .then((r) => r.json())
      .then((list) => {
        if (mounted) {
          setWhales(Array.isArray(list) ? list : []);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Whales yüklenemedi:', err);
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [minHmnd, assetFilter]);

  const handleAddWatchlist = () => {
    const clean = newAddrInput.trim();
    if (!clean || watchlist.includes(clean)) return;
    const updated = [clean, ...watchlist];
    setWatchlist(updated);
    localStorage.setItem('humannode_watchlist', JSON.stringify(updated));
    setNewAddrInput('');
  };

  const handleRemoveWatchlist = (addr) => {
    const updated = watchlist.filter((a) => a !== addr);
    setWatchlist(updated);
    localStorage.setItem('humannode_watchlist', JSON.stringify(updated));
  };

  // En yüksek transfer bilgisi
  const topTransfer = whales[0];

  return (
    <Stack gap="md">
      {/* Üst Başlık & Açıklama */}
      <Paper p="md" className="glass-panel" style={{ borderRadius: 8 }}>
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          <Box>
            <Group gap="xs" mb={4}>
              <IconRadar size={24} color="#f59e0b" />
              <Title order={2} size="h3" c="white">
                {lang === 'tr' ? 'Balina Radarı & Kişisel Takip Listesi' : 'Whale Radar & Watchlist'}
              </Title>
              <Badge color="yellow" variant="light" size="sm">
                On-Chain Whale Alerts
              </Badge>
            </Group>
            <Text size="xs" c="dimmed" maw={820}>
              {lang === 'tr'
                ? 'Humanode ağında gerçekleşen yüksek hacimli yerel HMND, WeHMND köprü ve USDC transferleri; net ve doğrulanmış tutarlarla anlık izleme merkezi.'
                : 'High-value transaction alerts across Substrate, EVM native, WeHMND bridged token and USDC with exact values and estimated USD equivalents.'}
            </Text>
          </Box>

          <SegmentedControl
            value={activeSegment}
            onChange={setActiveSegment}
            color="yellow"
            size="xs"
            data={[
              { label: `🐋 ${lang === 'tr' ? 'Balina Radarı' : 'Whale Radar'}`, value: 'radar' },
              { label: `⭐ ${lang === 'tr' ? 'Takip Listem' : 'Watchlist'} (${watchlist.length})`, value: 'watchlist' },
            ]}
          />
        </Group>

        {/* 4 Ana KPI Kartı (Standardize Edilmiş) */}
        <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing="sm" mt="md">
          <KpiStatCard
            title={lang === 'tr' ? 'Aktif Balina Eşiği' : 'Active Whale Threshold'}
            value={`≥ ${Number(minHmnd).toLocaleString(locStr)}`}
            unit={assetFilter === 'usdc' ? 'USDC' : 'HMND'}
            color="yellow"
            icon={IconFilter}
            subtext={lang === 'tr' ? 'Bu tutarın üzerindeki tüm transferler filtrelenir' : 'Filters extrinsics meeting or exceeding threshold'}
          />

          <KpiStatCard
            title={lang === 'tr' ? 'Yakalanan İşlem' : 'Detected Transactions'}
            value={whales.length}
            unit={lang === 'tr' ? 'Transfer' : 'Txs'}
            color="cyan"
            icon={IconRadar}
            subtext={
              assetFilter === 'hmnd'
                ? (lang === 'tr' ? 'Doğrulanmış HMND ve WeHMND transferleri' : 'Verified HMND & WeHMND transfers')
                : (lang === 'tr' ? 'Seçili varlık katman transferleri' : 'Transfers in selected asset tier')
            }
          />

          <KpiStatCard
            title={lang === 'tr' ? 'Listenin En Büyük Transferi' : 'Largest In List'}
            value={topTransfer ? Number(topTransfer.value_hmnd).toLocaleString(locStr, { maximumFractionDigits: 0 }) : '-'}
            unit={topTransfer?.symbol || 'HMND'}
            color="teal"
            icon={IconCoins}
            usdValue={topTransfer?.usd_est ? `$${Number(topTransfer.usd_est).toLocaleString(locStr, { maximumFractionDigits: 0 })}` : null}
            subtext={
              topTransfer?.usd_est
                ? `≈ $${Number(topTransfer.usd_est).toLocaleString(locStr, { maximumFractionDigits: 0 })} USD`
                : (lang === 'tr' ? 'Kayıt taranıyor' : 'Scanning records')
            }
          />

          <KpiStatCard
            title={lang === 'tr' ? 'Yıldızlı Cüzdanlarım' : 'Saved Watchlist Wallets'}
            value={watchlist.length}
            unit={lang === 'tr' ? 'Cüzdan' : 'Wallets'}
            color="violet"
            icon={IconStar}
            subtext={lang === 'tr' ? 'Tarayıcınızda kayıtlı özel portföy' : 'Stored locally in your browser'}
          />
        </SimpleGrid>
      </Paper>

      {/* 1. BÖLÜM: BALİNA RADARI */}
      {activeSegment === 'radar' && (
        <Paper p="md" className="glass-panel" style={{ borderRadius: 8 }}>
          {/* Filtre Çubuğu (Varlık Seçimi + Eşik Seçimi) */}
          <Group justify="space-between" mb="sm" wrap="wrap" gap="sm">
            {/* Varlık Seçici Butonları */}
            <Group gap="xs" wrap="wrap">
              <Button
                size="xs"
                variant={assetFilter === 'hmnd' ? 'filled' : 'light'}
                color="teal"
                leftSection={<IconCoins size={14} />}
                onClick={() => handleAssetChange('hmnd')}
              >
                {lang === 'tr' ? 'HMND & WeHMND (Önerilen)' : 'HMND & WeHMND (Recommended)'}
              </Button>
              <Button
                size="xs"
                variant={assetFilter === 'usdc' ? 'filled' : 'light'}
                color="blue"
                onClick={() => handleAssetChange('usdc')}
              >
                USDC (USD Coin)
              </Button>
              <Button
                size="xs"
                variant={assetFilter === 'all' ? 'filled' : 'light'}
                color="gray"
                onClick={() => handleAssetChange('all')}
              >
                {lang === 'tr' ? 'Tüm Doğrulanmış Varlıklar' : 'All Verified Assets'}
              </Button>
            </Group>

            {/* Eşik Butonları */}
            <Group gap="xs" wrap="wrap">
              <Text size="xs" c="dimmed">
                {lang === 'tr' ? 'Minimum Eşik:' : 'Minimum Threshold:'}
              </Text>
              {(assetFilter === 'usdc'
                ? ['5000', '10000', '25000', '50000']
                : ['25000', '50000', '100000', '250000', '1000000']
              ).map((val) => {
                const kLabel = Number(val) >= 1000000
                  ? `${Number(val) / 1000000}M`
                  : `${Number(val) / 1000}K`;
                const unit = assetFilter === 'usdc' ? 'USDC' : 'HMND';

                return (
                  <Button
                    key={val}
                    size="xs"
                    variant={minHmnd === val ? 'filled' : 'subtle'}
                    color="yellow"
                    onClick={() => setMinHmnd(val)}
                  >
                    ≥{kLabel} {unit}
                  </Button>
                );
              })}
            </Group>
          </Group>

          {/* Balina Listesi Tablosu */}
          <Box style={{ overflowX: 'auto', width: '100%' }}>
            <Table highlightOnHover verticalSpacing="xs" style={{ width: '100%', minWidth: 700, tableLayout: 'fixed' }}>
              <Table.Thead>
                <Table.Tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <Table.Th style={{ width: '12%', minWidth: 80, padding: '10px 8px' }}>
                    {lang === 'tr' ? 'Katman' : 'Layer'}
                  </Table.Th>
                  <Table.Th style={{ width: '13%', minWidth: 85, padding: '10px 8px' }}>
                    {lang === 'tr' ? 'Blok #' : 'Block #'}
                  </Table.Th>
                  <Table.Th style={{ width: '16%', minWidth: 110, padding: '10px 8px' }}>
                    {lang === 'tr' ? 'Tarih' : 'Timestamp'}
                  </Table.Th>
                  <Table.Th style={{ width: '18%', minWidth: 120, padding: '10px 8px' }}>
                    {lang === 'tr' ? 'Gönderici (Sender)' : 'Sender'}
                  </Table.Th>
                  <Table.Th style={{ width: '18%', minWidth: 120, padding: '10px 8px' }}>
                    {lang === 'tr' ? 'Alıcı (Target)' : 'Target'}
                  </Table.Th>
                  <Table.Th style={{ width: '23%', minWidth: 165, textAlign: 'right', padding: '10px 8px' }}>
                    {lang === 'tr' ? 'Transfer Tutarı & Değer ($)' : 'Amount & Value ($)'}
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {loading ? (
                  <Table.Tr>
                    <Table.Td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                      <Center>
                        <Loader size="sm" color="yellow" mr="xs" />
                        <Text size="sm" c="dimmed">
                          {lang === 'tr' ? 'Balina transferleri taranıyor...' : 'Scanning for whale extrinsics...'}
                        </Text>
                      </Center>
                    </Table.Td>
                  </Table.Tr>
                ) : whales.length > 0 ? (
                  whales.map((w, idx) => {
                    const valNum = Number(w.value_hmnd || 0);
                    const sym = w.symbol || (w.layer === 'EVM_TOKEN' ? w.method : 'HMND');
                    const isEvm = w.layer?.includes('EVM');
                    const usdEst = Number(w.usd_est || 0);

                    const formattedAmount = valNum.toLocaleString(locStr, {
                      minimumFractionDigits: valNum < 1000 ? 2 : 0,
                      maximumFractionDigits: 2,
                    });

                    let amountColor = '#10b981';
                    if (sym === 'USDC') amountColor = '#38bdf8';
                    else if (sym === 'WETH') amountColor = '#a855f7';
                    else if (sym === 'WBTC') amountColor = '#f59e0b';

                    return (
                      <Table.Tr
                        key={`${w.hash || idx}-${idx}`}
                        style={{
                          backgroundColor: idx % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                        }}
                      >
                        {/* Katman */}
                        <Table.Td style={{ padding: '8px 8px' }}>
                          <Badge
                            size="xs"
                            color={isEvm ? 'cyan' : 'teal'}
                            variant="light"
                          >
                            {w.layer || 'EVM'}
                          </Badge>
                        </Table.Td>

                        {/* Blok # */}
                        <Table.Td style={{ padding: '8px 8px' }} className="font-mono">
                          <Text
                            size="xs"
                            c="cyan"
                            fw={700}
                            style={{ cursor: 'pointer', textDecoration: 'underline' }}
                            onClick={() => onOpenBlock && onOpenBlock(w.block_number)}
                          >
                            #{w.block_number?.toLocaleString(locStr)}
                          </Text>
                        </Table.Td>

                        {/* Tarih */}
                        <Table.Td style={{ padding: '8px 8px' }}>
                          <Text size="xs" c="gray.3">
                            {formatTimestamp(w.timestamp, lang)}
                          </Text>
                        </Table.Td>

                        {/* Gönderici */}
                        <Table.Td style={{ padding: '8px 8px' }}>
                          <AddressBadge
                            address={w.sender}
                            showNetwork={false}
                            onSelectAddress={onSelectAddress}
                            head={5}
                            tail={4}
                          />
                        </Table.Td>

                        {/* Alıcı */}
                        <Table.Td style={{ padding: '8px 8px' }}>
                          {w.target ? (
                            <AddressBadge
                              address={w.target}
                              showNetwork={false}
                              onSelectAddress={onSelectAddress}
                              head={5}
                              tail={4}
                            />
                          ) : (
                            <Text size="xs" c="dimmed">-</Text>
                          )}
                        </Table.Td>

                        {/* Transfer Tutarı & Değer ($) */}
                        <Table.Td style={{ textAlign: 'right', padding: '8px 8px' }}>
                          <AmountDisplay
                            value={formattedAmount}
                            unit={sym}
                            color={amountColor}
                            size="xs"
                            usdValue={usdEst > 0 ? formatUSD(usdEst, lang) : null}
                          />
                        </Table.Td>
                      </Table.Tr>
                    );
                  })
                ) : (
                  <Table.Tr>
                    <Table.Td colSpan={6} style={{ textAlign: 'center', padding: '30px' }}>
                      <Text size="sm" c="dimmed">
                        {lang === 'tr' ? 'Belirtilen kriterde balina transferi bulunamadı.' : 'No whale transactions found matching criteria.'}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Box>
        </Paper>
      )}

      {/* 2. BÖLÜM: WATCHLIST (KİŞİSEL TAKİP LİSTESİ) */}
      {activeSegment === 'watchlist' && (
        <Paper p="md" className="glass-panel" style={{ borderRadius: 8 }}>
          <Group justify="space-between" mb="md" wrap="wrap" gap="xs">
            <Group gap={8}>
              <IconStarFilled size={18} color="#eab308" />
              <Text size="sm" fw={700} c="white">
                {lang === 'tr' ? 'Yıldızlı Özel Cüzdan Takip Listem' : 'Personal Watchlist'}
              </Text>
            </Group>

            {/* Adres Ekleme Girişi */}
            <Group gap="xs" style={{ flex: 1, maxWidth: 500 }}>
              <TextInput
                placeholder={lang === 'tr' ? 'Takip etmek istediğiniz adresi yapıştırın (0x... veya hm...)' : 'Enter 0x... or hm... address to watch'}
                size="xs"
                style={{ flex: 1 }}
                value={newAddrInput}
                onChange={(e) => setNewAddrInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddWatchlist()}
              />
              <Button size="xs" color="yellow" leftSection={<IconPlus size={14} />} onClick={handleAddWatchlist}>
                {lang === 'tr' ? 'Ekle' : 'Add'}
              </Button>
            </Group>
          </Group>

          {watchlist.length === 0 ? (
            <Paper p="xl" bg="rgba(0,0,0,0.1)" style={{ textAlign: 'center' }}>
              <Text size="sm" c="dimmed">
                {lang === 'tr'
                  ? 'Henüz izleme listenize cüzdan eklemediniz. Yukarıdaki alana adres yapıştırarak veya tablolardan cüzdanları yıldızlayarak takip edebilirsiniz.'
                  : 'Your watchlist is empty. Add addresses above or star them across the explorer to track them here.'}
              </Text>
            </Paper>
          ) : (
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
              {watchlist.map((addr) => {
                const isEvm = addr.startsWith('0x');

                return (
                  <Paper
                    key={addr}
                    p="sm"
                    className="glass-panel-subtle"
                    style={{ borderRadius: 8 }}
                  >
                    <Group justify="space-between" mb="xs">
                      <Group gap={6}>
                        <Badge size="xs" color={isEvm ? 'cyan' : 'teal'} variant="light">
                          {isEvm ? 'EVM Katmanı' : 'Substrate Katmanı'}
                        </Badge>
                      </Group>

                      <Group gap={4}>
                        <Tooltip label={lang === 'tr' ? 'Önizle' : 'Preview'}>
                          <ActionIcon
                            size="sm"
                            variant="light"
                            color="cyan"
                            onClick={() => onSelectAddress && onSelectAddress(addr)}
                          >
                            <IconEye size={14} />
                          </ActionIcon>
                        </Tooltip>

                        <Tooltip label={lang === 'tr' ? 'Hesap Defterini Aç' : 'Open Ledger'}>
                          <ActionIcon
                            size="sm"
                            variant="light"
                            color="teal"
                            onClick={() => onOpenLedger && onOpenLedger(addr)}
                          >
                            <IconExternalLink size={14} />
                          </ActionIcon>
                        </Tooltip>

                        <Tooltip label={lang === 'tr' ? 'Listeden Kaldır' : 'Remove'}>
                          <ActionIcon
                            size="sm"
                            variant="subtle"
                            color="red"
                            onClick={() => handleRemoveWatchlist(addr)}
                          >
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Group>

                    <AddressBadge
                      address={addr}
                      showNetwork={false}
                      onSelectAddress={onSelectAddress}
                      head={10}
                      tail={8}
                    />

                    <Text size="11px" c="dimmed" mt={6}>
                      {lang === 'tr'
                        ? 'Hesap Defteri veya Hızlı Önizleme ile işlem geçmişini ve net bakiyesini anında inceleyebilirsiniz.'
                        : 'Click to inspect full ledger history, net balance and money trail.'}
                    </Text>
                  </Paper>
                );
              })}
            </SimpleGrid>
          )}
        </Paper>
      )}
    </Stack>
  );
}
