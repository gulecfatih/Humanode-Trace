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
import { useModuleFields } from './ModuleLayout';
import KpiStatCard from './ui/KpiStatCard';
import AddressBadge from './ui/AddressBadge';
import AmountDisplay from './ui/AmountDisplay';

export default function WhalesTab({ onSelectAddress, onOpenBlock, onOpenLedger }) {
  const { lang } = useLanguage();
  const { t, fields } = useModuleFields();
  const locStr = lang;

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
                {t('whales_whaleRadarWatchlist')}
              </Title>
              <Badge color="yellow" variant="light" size="sm">
                On-Chain Whale Alerts
              </Badge>
            </Group>
            <Text size="xs" c="dimmed" maw={820}>
              {t('whales_highValueTransactionAlerts')}
            </Text>
          </Box>

          <SegmentedControl
            value={activeSegment}
            onChange={setActiveSegment}
            color="yellow"
            size="xs"
            data={[
              { label: `🐋 ${t('whales_whaleRadar')}`, value: 'radar' },
              { label: `⭐ ${t('whales_watchlist')} (${watchlist.length})`, value: 'watchlist' },
            ]}
          />
        </Group>

        {/* 4 Ana KPI Kartı (Standardize Edilmiş) */}
        <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing="sm" mt="md">
          <KpiStatCard
            title={t('whales_activeWhaleThreshold')}
            value={`≥ ${Number(minHmnd).toLocaleString(locStr)}`}
            unit={assetFilter === 'usdc' ? 'USDC' : 'HMND'}
            color="yellow"
            icon={IconFilter}
            subtext={t('whales_filtersExtrinsicsMeetingOr')}
          />

          <KpiStatCard
            title={t('whales_detectedTransactions')}
            value={whales.length}
            unit={t('tokenColTransfers')}
            color="cyan"
            icon={IconRadar}
            subtext={
              assetFilter === 'hmnd'
                ? (t('whales_verifiedHmndWehmndTransfers'))
                : (t('whales_transfersInSelectedAsset'))
            }
          />

          <KpiStatCard
            title={t('whales_largestInList')}
            value={topTransfer ? Number(topTransfer.value_hmnd).toLocaleString(locStr, { maximumFractionDigits: 0 }) : '-'}
            unit={topTransfer?.symbol || 'HMND'}
            color="teal"
            icon={IconCoins}
            usdValue={topTransfer?.usd_est ? `$${Number(topTransfer.usd_est).toLocaleString(locStr, { maximumFractionDigits: 0 })}` : null}
            subtext={
              topTransfer?.usd_est
                ? `≈ $${Number(topTransfer.usd_est).toLocaleString(locStr, { maximumFractionDigits: 0 })} USD`
                : (t('whales_scanningRecords'))
            }
          />

          <KpiStatCard
            title={t('whales_savedWatchlistWallets')}
            value={watchlist.length}
            unit={t('whales_wallets')}
            color="violet"
            icon={IconStar}
            subtext={t('whales_storedLocallyInYour')}
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
                {t('whales_hmndWehmndRecommended')}
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
                {t('whales_allVerifiedAssets')}
              </Button>
            </Group>

            {/* Eşik Butonları */}
            <Group gap="xs" wrap="wrap">
              <Text size="xs" c="dimmed">
                {t('whales_minimumThreshold')}
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
                    {t('layer')}
                  </Table.Th>
                  <Table.Th style={{ width: '13%', minWidth: 85, padding: '10px 8px' }}>
                    {t('colBlock')}
                  </Table.Th>
                  <Table.Th style={{ width: '16%', minWidth: 110, padding: '10px 8px' }}>
                    {t('whales_timestamp')}
                  </Table.Th>
                  <Table.Th style={{ width: '18%', minWidth: 120, padding: '10px 8px' }}>
                    {t('whales_sender')}
                  </Table.Th>
                  <Table.Th style={{ width: '18%', minWidth: 120, padding: '10px 8px' }}>
                    {t('whales_target')}
                  </Table.Th>
                  <Table.Th style={{ width: '23%', minWidth: 165, textAlign: 'right', padding: '10px 8px' }}>
                    {t('whales_amountValue')}
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
                          {t('whales_scanningForWhaleExtrinsics')}
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
                        {t('whales_noWhaleTransactionsFound')}
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
                {t('whales_personalWatchlist')}
              </Text>
            </Group>

            {/* Adres Ekleme Girişi */}
            <Group gap="xs" style={{ flex: 1, maxWidth: 500 }}>
              <TextInput
                placeholder={t('whales_enter0xOrHm')}
                size="xs"
                style={{ flex: 1 }}
                value={newAddrInput}
                onChange={(e) => setNewAddrInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddWatchlist()}
              />
              <Button size="xs" color="yellow" leftSection={<IconPlus size={14} />} onClick={handleAddWatchlist}>
                {t('whales_add')}
              </Button>
            </Group>
          </Group>

          {watchlist.length === 0 ? (
            <Paper p="xl" bg="rgba(0,0,0,0.1)" style={{ textAlign: 'center' }}>
              <Text size="sm" c="dimmed">
                {t('whales_yourWatchlistIsEmpty')}
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
                        <Tooltip label={t('preview')}>
                          <ActionIcon
                            size="sm"
                            variant="light"
                            color="cyan"
                            onClick={() => onSelectAddress && onSelectAddress(addr)}
                          >
                            <IconEye size={14} />
                          </ActionIcon>
                        </Tooltip>

                        <Tooltip label={t('quickPeekOpenLedger')}>
                          <ActionIcon
                            size="sm"
                            variant="light"
                            color="teal"
                            onClick={() => onOpenLedger && onOpenLedger(addr)}
                          >
                            <IconExternalLink size={14} />
                          </ActionIcon>
                        </Tooltip>

                        <Tooltip label={t('whales_remove')}>
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
                      {t('whales_clickToInspectFull')}
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
