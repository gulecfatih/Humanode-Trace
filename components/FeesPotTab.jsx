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
import KpiStatCard from './ui/KpiStatCard';
import AmountDisplay from './ui/AmountDisplay';
import AddressBadge from './ui/AddressBadge';
import DirectionBadge from './ui/DirectionBadge';

export default function FeesPotTab({ onOpenBlock, onSelectAddress }) {
  const { lang, t } = useLanguage();
  const locStr = lang === 'tr' ? 'tr-TR' : 'en-US';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Görünüm seçimi: 'payouts' (Çıkış turları) veya 'inflows' (Kasaya giren paralar)
  const [activeView, setActiveView] = useState('payouts');

  // Canlı geri sayım için saniye
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

    // Her saniye geri sayımı güncelle
    const timer = setInterval(() => {
      setNowSec(Math.floor(Date.now() / 1000));
    }, 1000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  // Geri sayım hesaplama
  const nextTargetTs = data?.nextEstimatedTs || (1793211744 + 14 * 86400);
  const diffSec = Math.max(0, nextTargetTs - nowSec);
  const cdDays = Math.floor(diffSec / 86400);
  const cdHours = Math.floor((diffSec % 86400) / 3600);
  const cdMins = Math.floor((diffSec % 3600) / 60);
  const cdSecs = diffSec % 60;
  const countdownFormatted = `${cdDays}g ${String(cdHours).padStart(2, '0')}:${String(cdMins).padStart(2, '0')}:${String(cdSecs).padStart(2, '0')}`;

  // Sayfalanmış tarihçe listesi
  const historyList = data?.history || [];
  const totalPages = Math.ceil(historyList.length / pageSize) || 1;
  const paginatedHistory = historyList.slice((page - 1) * pageSize, page * pageSize);

  const poolAddress = data?.feesPotAddress || 'hmpwhPbL5XJTYPWXPMkacfqGhJ3eoQRPLKphajpvcot5Q5zkk';

  return (
    <Stack gap="md">
      {/* Üst Başlık & Açıklama */}
      <Paper p="md" className="glass-panel" style={{ borderRadius: 8 }}>
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          <Box>
            <Group gap="xs" mb={4}>
              <IconCoins size={24} color="#14b8a6" />
              <Title order={2} size="h3" c="white">
                {lang === 'tr' ? 'FeesPot Havuzu & Validatör Ödül Runway’i' : 'FeesPot Rewards Pool & Validator Runway'}
              </Title>
              <Badge color="teal" variant="light" size="sm">
                Pallet feesPot (py/humfe)
              </Badge>
            </Group>
            <Text size="xs" c="dimmed" maw={800}>
              {lang === 'tr'
                ? 'Humanode ağında toplanan gas ücretlerinin depolandığı resmi havuz adresi, 112 turun tarihsel dağıtım dökümü, kasaya giren transferler ve bir sonraki tur geri sayımı.'
                : 'Official Humanode fee pool reserve, 112 historical payout batches, treasury inflow transfers, and next epoch reward countdown.'}
            </Text>
          </Box>

          <Group gap="sm" wrap="wrap" align="center">
            <Group gap="xs">
              <Text size="xs" c="dimmed">
                {lang === 'tr' ? 'Havuz Sözleşmesi:' : 'Pool Address:'}
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
              {lang === 'tr' ? 'Cüzdan Defterinde Aç' : 'Open in Ledger'}
            </Button>
          </Group>
        </Group>

        {/* 5 Ana KPI Kartı (Standardize Edilmiş, Satır Bölünmez) */}
        <SimpleGrid cols={{ base: 1, xs: 2, sm: 3, md: 5 }} spacing="sm" mt="md">
          {/* 1. Güncel Havuz Bakiyesi */}
          <KpiStatCard
            title={lang === 'tr' ? 'Havuz Rezervi (FeesPot)' : 'Pool Balance (FeesPot)'}
            value={data ? Number(data.currentBalance).toLocaleString(locStr, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '403.719,23'}
            unit="HMND"
            color="teal"
            icon={IconCoins}
            subtext={lang === 'tr' ? 'Kasada mevcut aktif bakiye' : 'Current unspent treasury reserve'}
            tooltip={lang === 'tr' ? `Aktif Bakiye: ${data?.currentBalance || 403719.23} HMND` : `Unspent Balance: ${data?.currentBalance || 403719.23} HMND`}
          />

          {/* 2. Kasaya Şimdiye Kadar Giren Toplam Para (INFLOW) */}
          <KpiStatCard
            title={lang === 'tr' ? 'Kasaya Toplam Giriş' : 'Total Treasury Inflow'}
            value={data?.totalInflowHmnd ? Number(data.totalInflowHmnd).toLocaleString(locStr, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '1.094.941,16'}
            sign="+"
            unit="HMND"
            color="teal"
            icon={IconArrowDownLeft}
            subtext={
              lang === 'tr'
                ? `${Number(data?.burnedTotal || 691222).toLocaleString(locStr, { maximumFractionDigits: 0 })} Gas + ${Number(data?.genesisReserveHmnd || 403662).toLocaleString(locStr, { maximumFractionDigits: 0 })} Rezerv`
                : `${Number(data?.burnedTotal || 691222).toLocaleString(locStr, { maximumFractionDigits: 0 })} Gas + ${Number(data?.genesisReserveHmnd || 403662).toLocaleString(locStr, { maximumFractionDigits: 0 })} Seed`
            }
            tooltip={
              lang === 'tr'
                ? `691.221,93 HMND Gas Komisyonu + 403.661,73 HMND Genesis Rezervi + 57,50 HMND Doğrudan Transfer`
                : `691,221.93 HMND Gas Fees + 403,661.73 HMND Genesis Reserve + 57.50 HMND Direct Transfers`
            }
          />

          {/* 3. Runway Dayanma Süresi */}
          <KpiStatCard
            title={lang === 'tr' ? 'Tahmini Runway' : 'Runway Estimate'}
            value={`~${data?.runwayDays || 113}`}
            unit={lang === 'tr' ? 'Gün' : 'Days'}
            color="cyan"
            icon={IconClock}
            subtext={`~${data?.runwayRounds || 8.1} ${lang === 'tr' ? 'tur kesintisiz dağıtım garantisi' : 'consecutive distribution rounds'}`}
            tooltip={lang === 'tr' ? 'Mevcut bakiye ve ortalama tur harcamasına göre havuzun dayanacağı gün sayısı' : 'Estimated days until reserve exhaustion based on recent payout rates'}
          />

          {/* 4. Son Tur Ödülü */}
          <KpiStatCard
            title={lang === 'tr' ? 'Son Dağıtım (Tur #112)' : 'Last Batch (#112)'}
            value={Number(data?.lastBatch?.samplePerValidator || 613.48).toFixed(2)}
            unit="HMND"
            color="yellow"
            icon={IconShieldCheck}
            subtext={`${data?.lastBatch?.recipientCount || 62} ${lang === 'tr' ? 'validatöre 47.914 HMND' : 'validators received share'}`}
            tooltip={lang === 'tr' ? 'Son turda doğrulayıcı başına ödenen net ödül miktarı' : 'Per-validator net reward amount distributed in the most recent batch'}
          />

          {/* 5. Sonraki Dağıtım Geri Sayımı */}
          <KpiStatCard
            title={lang === 'tr' ? 'Gelecek Tur Geri Sayımı' : 'Next Batch Countdown'}
            value={countdownFormatted}
            color="violet"
            icon={IconCalendar}
            subtext={`~10-14 ${lang === 'tr' ? 'Kasım (~620 HMND/düğüm)' : 'Nov (~620 HMND/node)'}`}
            tooltip={lang === 'tr' ? 'Tahmini sonraki blok hedefi: 14 günlük periyot tamamlandığında otomatik tetiklenir' : 'Estimated next payout batch block'}
          />
        </SimpleGrid>
      </Paper>

      {/* Tablo Alanı: Dağıtım Turları (Çıkış) vs Kasaya Giren Transferler & Fon Kaynakları (Giriş) */}
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
                label: lang === 'tr' ? '💸 Validatör Dağıtım Turları (112 Tur)' : '💸 Payout Batches (112 Batches)',
              },
              {
                value: 'inflows',
                label: lang === 'tr' ? '📥 Kasaya Giren Transferler & Fon Kaynakları' : '📥 Treasury Inflow & Funding Sources',
              },
            ]}
          />
          {activeView === 'payouts' ? (
            <Text size="xs" c="dimmed">
              {lang === 'tr' ? `Sayfa ${page} / ${totalPages} (Toplam ${historyList.length} Tur Kayıtlı)` : `Page ${page} / ${totalPages} (${historyList.length} Total Batches)`}
            </Text>
          ) : (
            <Badge color="green" variant="light" size="sm">
              {lang === 'tr' ? 'Toplam Giriş: ' : 'Total Inflow: '}
              +{data ? formatHMND(data.totalInflowHmnd || 1094941.16, { locale: lang }) : '1.094.941 HMND'}
            </Badge>
          )}
        </Group>

        {activeView === 'inflows' ? (
          <Stack gap="md">
            {/* Giriş Kaynakları 3'lü Dağılım Kartları */}
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
              <KpiStatCard
                title={lang === 'tr' ? '1. Ağ İşlem Gas Komisyonları' : '1. Network Gas Transaction Fees'}
                value={Number(data?.burnedTotal || 691221.93).toLocaleString(locStr, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                unit="HMND"
                sign="+"
                color="teal"
                badge={lang === 'tr' ? 'Protokol Havuzu' : 'Protocol Pot'}
                badgeColor="teal"
                subtext={
                  lang === 'tr'
                    ? 'Ağ genelinde 120.000+ transfer ve çağrıdan toplanan resmi gas ücreti'
                    : 'Official fee pot collected from 120,000+ network transactions and calls'
                }
              />

              <KpiStatCard
                title={lang === 'tr' ? '2. Genesis & Başlangıç Rezervi' : '2. Genesis & Seed Reserve'}
                value={Number(data?.genesisReserveHmnd || 403661.73).toLocaleString(locStr, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                unit="HMND"
                sign="+"
                color="cyan"
                badge="Genesis #0"
                badgeColor="cyan"
                subtext={
                  lang === 'tr'
                    ? 'Blok #0 Genesis başlangıç vesting ve sistem tahsisi rezervi'
                    : 'Block #0 genesis allocation and initial validator rewards treasury seed'
                }
              />

              <KpiStatCard
                title={lang === 'tr' ? '3. Doğrudan Cüzdan Transferleri' : '3. Direct Wallet Transfers'}
                value={Number(data?.directTransfersHmnd || 57.50).toLocaleString(locStr, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                unit="HMND"
                sign="+"
                color="yellow"
                badge="balances"
                badgeColor="yellow"
                subtext={
                  lang === 'tr'
                    ? 'Cüzdanlardan doğrudan kasaya gönderilen zincir üstü transferler'
                    : 'Direct balance transfers sent directly from network wallets to the treasury'
                }
              />
            </SimpleGrid>

            {/* Giriş İşlemleri Tablosu */}
            <Box style={{ overflowX: 'auto', width: '100%' }}>
              <Table highlightOnHover verticalSpacing="xs" style={{ width: '100%', minWidth: 680, tableLayout: 'fixed' }}>
                <Table.Thead>
                  <Table.Tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <Table.Th style={{ width: '22%', minWidth: 140, padding: '10px 8px' }}>
                      {lang === 'tr' ? 'Fon Kaynağı / Gönderen' : 'Funding Source / Sender'}
                    </Table.Th>
                    <Table.Th style={{ width: '18%', minWidth: 110, padding: '10px 8px' }}>
                      {lang === 'tr' ? 'Giriş Tipi & Metot' : 'Inflow Type & Method'}
                    </Table.Th>
                    <Table.Th style={{ width: '15%', minWidth: 95, padding: '10px 8px' }}>
                      {lang === 'tr' ? 'Blok #' : 'Block #'}
                    </Table.Th>
                    <Table.Th style={{ width: '18%', minWidth: 110, padding: '10px 8px' }}>
                      {lang === 'tr' ? 'Tarih & Zaman' : 'Timestamp'}
                    </Table.Th>
                    <Table.Th style={{ width: '15%', minWidth: 110, textAlign: 'right', padding: '10px 8px' }}>
                      {lang === 'tr' ? 'İçeri Giren Tutar' : 'Inflow Amount'}
                    </Table.Th>
                    <Table.Th style={{ width: '12%', minWidth: 80, textAlign: 'right', padding: '10px 8px' }}>
                      {lang === 'tr' ? 'Yön' : 'Direction'}
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {/* Kayıt 1: Doğrudan Cüzdan Transferleri */}
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

                  {/* Kayıt 2: Genesis / Sistem Rezerv Girişi */}
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
                        {lang === 'tr' ? '14 Eki 2022 17:00' : 'Oct 14, 2022'}
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
                        {lang === 'tr' ? 'Rezerv' : 'Seed'}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>

                  {/* Kayıt 3: Ağ İşlem Gas Havuzu Girişi */}
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
                        {lang === 'tr' ? 'Tüm Bloklar (#0 → Güncel)' : 'All Blocks (#0 → Now)'}
                      </Text>
                    </Table.Td>

                    <Table.Td style={{ padding: '8px 8px' }}>
                      <Text size="xs" c="gray.3">
                        {lang === 'tr' ? 'Sürekli (Her Blokta)' : 'Continuous (On Block)'}
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
                      {lang === 'tr' ? 'Tur #' : 'Batch #'}
                    </Table.Th>
                    <Table.Th style={{ width: '18%', minWidth: 110, padding: '10px 8px' }}>
                      {lang === 'tr' ? 'Dağıtım Bloğu' : 'Block #'}
                    </Table.Th>
                    <Table.Th style={{ width: '22%', minWidth: 130, padding: '10px 8px' }}>
                      {lang === 'tr' ? 'Tarih & Zaman' : 'Timestamp'}
                    </Table.Th>
                    <Table.Th style={{ width: '18%', minWidth: 110, textAlign: 'center', padding: '10px 8px' }}>
                      {lang === 'tr' ? 'Hak Eden Validatör' : 'Recipients'}
                    </Table.Th>
                    <Table.Th style={{ width: '18%', minWidth: 110, textAlign: 'right', padding: '10px 8px' }}>
                      {lang === 'tr' ? 'Toplam Dağıtılan' : 'Total Distributed'}
                    </Table.Th>
                    <Table.Th style={{ width: '12%', minWidth: 80, textAlign: 'right', padding: '10px 8px' }}>
                      {lang === 'tr' ? 'Düğüm Başına' : 'Per Node'}
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
                            {lang === 'tr' ? 'FeesPot tarihsel turları yükleniyor...' : 'Loading payout history...'}
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
                              #{batchNum} {isLatest ? (lang === 'tr' ? 'Son' : 'Latest') : ''}
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
                              title={`${item.block} - ${lang === 'tr' ? 'Bloğu incele' : 'Inspect block'}`}
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

                          {/* Hak Eden Validatör Sayısı */}
                          <Table.Td style={{ textAlign: 'center', padding: '8px 8px' }}>
                            <Badge variant="dot" color="blue" size="sm">
                              {item.recipientCount} {lang === 'tr' ? 'Düğüm' : 'Nodes'}
                            </Badge>
                          </Table.Td>

                          {/* Toplam Dağıtılan */}
                          <Table.Td style={{ textAlign: 'right', padding: '8px 8px' }}>
                            <AmountDisplay
                              value={Number(item.totalDistributed || 0).toLocaleString(locStr)}
                              unit="HMND"
                              color="#10b981"
                              size="xs"
                            />
                          </Table.Td>

                          {/* Düğüm Başına */}
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
                          {lang === 'tr' ? 'Dağıtım geçmişi bulunamadı.' : 'No payout records found.'}
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
