'use client';
import { useState, useEffect, useMemo } from 'react';
import {
  Paper,
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
  CopyButton,
  ActionIcon,
  Tooltip,
  Pagination,
  Loader,
  Center,
} from '@mantine/core';
import {
  IconDna,
  IconEye,
  IconBook,
  IconSearch,
  IconCopy,
  IconCheck,
  IconInfoCircle,
  IconUsers,
  IconUserCheck,
  IconUserOff,
  IconActivity,
  IconCube,
  IconDownload,
} from '@tabler/icons-react';
import { formatHMND, formatHMS, shortAddr, timeAgo, formatTimestamp, exportToCsv } from './formatters';
import { useLanguage } from './LanguageContext';
import KpiStatCard from './ui/KpiStatCard';
import AddressBadge from './ui/AddressBadge';
import AmountDisplay from './ui/AmountDisplay';

export default function ValidatorsTab({ onSelectAddress, onOpenLedger }) {
  const { t, lang } = useLanguage();
  const [validators, setValidators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [statusFilter, setStatusFilter] = useState('active'); // 'active' | 'passive' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const [nowMs, setNowMs] = useState(Date.now());
  const [fetchBaseTime, setFetchBaseTime] = useState(Date.now());

  // Canlı saniye geri sayımı sayacı (drift yapmayan saat)
  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch('/api/validators')
      .then((res) => res.json())
      .then((resData) => {
        setValidators(resData.validators || []);
        setStats(resData);
        setFetchBaseTime(Date.now());
        setNowMs(Date.now());
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const loc = lang === 'en' ? 'en-US' : 'tr-TR';

  // Aktif ve Pasif listeler
  const activeValidators = useMemo(() => {
    return validators.filter((v) => v.is_active);
  }, [validators]);

  const passiveValidators = useMemo(() => {
    return validators.filter((v) => !v.is_active);
  }, [validators]);

  // Arama ve Filtreleme
  const filteredValidators = useMemo(() => {
    let list = validators;
    if (statusFilter === 'active') {
      list = activeValidators;
    } else if (statusFilter === 'passive') {
      list = passiveValidators;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((v) => {
        const addr = (v.address || '').toLowerCase();
        return addr.includes(q);
      });
    }

    return list;
  }, [validators, activeValidators, passiveValidators, statusFilter, searchQuery]);

  const totalPages = Math.ceil(filteredValidators.length / pageSize) || 1;
  const paginatedList = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredValidators.slice(start, start + pageSize);
  }, [filteredValidators, page, pageSize]);

  const totalHistoricalCount = stats?.totalValidators || 4769;
  const activeCount = stats?.activeValidators || activeValidators.length || 90;
  const offlineCount = Math.max(0, totalHistoricalCount - activeCount);
  const totalBioauthCount = stats?.totalBioauth || 126968;

  return (
    <Paper p="md" className="glass-panel" style={{ borderRadius: 8 }}>
      {/* Başlık */}
      <Group justify="space-between" align="flex-start" mb="sm" wrap="wrap">
        <div>
          <Title order={3} mb={4} c="white">
            🧬 {t('valTitle')}
          </Title>
          <Text size="xs" c="dimmed">
            {t('valSubtitle')}
          </Text>
        </div>
      </Group>

      {/* 4 Özet Bilgi Kartı (En Tepede Bilgiler) */}
      <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing="sm" mb="md">
        <KpiStatCard
          title={t('valActiveCard')}
          value={activeCount.toLocaleString(loc)}
          unit={lang === 'tr' ? 'Düğüm' : 'Nodes'}
          color="teal"
          icon={IconUserCheck}
          subtext={t('valActiveCardSub')}
        />

        <KpiStatCard
          title={t('valHistoricalCard')}
          value={totalHistoricalCount.toLocaleString(loc)}
          unit={lang === 'tr' ? 'Kişi' : 'Total'}
          color="cyan"
          icon={IconUsers}
          subtext={t('valHistoricalCardSub')}
        />

        <KpiStatCard
          title={t('valPassiveCard')}
          value={offlineCount.toLocaleString(loc)}
          unit={lang === 'tr' ? 'Pasif' : 'Inactive'}
          color="gray"
          icon={IconUserOff}
          subtext={t('valPassiveCardSub')}
        />

        <KpiStatCard
          title={t('valBioauthCard')}
          value={totalBioauthCount.toLocaleString(loc)}
          unit={lang === 'tr' ? 'Onay' : 'Bioauths'}
          color="violet"
          icon={IconDna}
          subtext={t('valBioauthCardSub')}
        />
      </SimpleGrid>

      {/* Validatör Kazanç & Ekonomi Kılavuzu */}
      <Paper p="xs" mb="md" style={{ background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.2)', borderRadius: '8px' }}>
        <Group align="flex-start" gap="xs">
          <IconInfoCircle size={18} color="#06b6d4" style={{ marginTop: '2px', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <Text size="xs" fw={700} c="cyan">
              💡 {t('valExplainerTitle')}
            </Text>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="xs" mt={4}>
              <Box p={8} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                <Text size="11px" fw={600} c="gray.3">{t('valRule1')}</Text>
                <Text size="10px" c="dimmed">
                  {t('valRule1Desc')}
                </Text>
              </Box>
              <Box p={8} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                <Text size="11px" fw={600} c="cyan.3">{t('valRule2')}</Text>
                <Text size="10px" c="dimmed">
                  {t('valRule2Desc')}
                </Text>
              </Box>
              <Box p={8} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                <Text size="11px" fw={600} c="green.3">{t('valRule3')}</Text>
                <Text size="10px" c="dimmed">
                  {t('valRule3Desc')}
                </Text>
              </Box>
              <Box p={8} style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '6px' }}>
                <Group justify="space-between" wrap="nowrap" mb={2}>
                  <Text size="11px" fw={700} c="teal">
                    🏛️ {lang === 'tr' ? 'FeesPot Havuzu' : 'FeesPot Pool'}
                  </Text>
                  <Badge size="xs" color="teal" variant="light">
                    {stats?.fees_pot_balance_hmnd ? `${Math.round(stats.fees_pot_balance_hmnd).toLocaleString(loc)} HMND` : '402.744 HMND'}
                  </Badge>
                </Group>
                <Text size="10px" c="dimmed">
                  {lang === 'tr'
                    ? 'Son tur: 613,48 HMND • Gelecek tur tahmini: ~610-650 HMND / kişi'
                    : 'Last batch: 613.48 HMND • Next round est: ~610-650 HMND / node'}
                </Text>
              </Box>
            </SimpleGrid>
          </div>
        </Group>
      </Paper>

      {/* Arama ve 2 Ayrı Görünüm Seçici (Aktif vs Pasif) */}
      <Paper p="xs" bg="rgba(15, 23, 42, 0.7)" mb="sm" style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}>
        <Group justify="space-between" wrap="wrap" gap="sm">
          {/* Liderlik Tablosu Tarzı 2 Ayrı Görünüm Sekmesi */}
          <SegmentedControl
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
            size="xs"
            radius="md"
            data={[
              {
                value: 'active',
                label: (
                  <Group gap={6} align="center" wrap="nowrap" style={{ padding: '2px 4px' }}>
                    <span style={{ color: '#10b981', fontSize: '13px' }}>●</span>
                    <Text size="xs" fw={700}>
                      {t('valTabActive', { count: activeValidators.length })}
                    </Text>
                  </Group>
                ),
              },
              {
                value: 'passive',
                label: (
                  <Group gap={6} align="center" wrap="nowrap" style={{ padding: '2px 4px' }}>
                    <span style={{ color: '#64748b', fontSize: '13px' }}>○</span>
                    <Text size="xs" fw={700}>
                      {t('valTabPassive', { count: passiveValidators.length })}
                    </Text>
                  </Group>
                ),
              },
              {
                value: 'all',
                label: (
                  <Group gap={6} align="center" wrap="nowrap" style={{ padding: '2px 4px' }}>
                    <Text size="xs" fw={700}>
                      {t('valTabAll', { count: validators.length })}
                    </Text>
                  </Group>
                ),
              },
            ]}
          />

          <Group gap="xs">
            <TextInput
              placeholder={t('valSearchPlaceholder') || 'Validatör ara...'}
              leftSection={<IconSearch size={14} />}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              size="xs"
              style={{ width: 220 }}
            />
            <Tooltip label="Filtrelenmiş validatör listesini CSV olarak indir">
              <Button
                variant="default"
                size="xs"
                leftSection={<IconDownload size={14} />}
                onClick={() => {
                  const cols = [
                    { key: 'validator_id', label: 'Validator ID' },
                    { key: 'is_active', label: 'Durum' },
                    { key: 'blocks_produced', label: 'Uretilen Blok' },
                    { key: 'uptime_percent', label: 'Uptime %' },
                    { key: 'bioauth_remaining_seconds', label: 'Bioauth Kalan Sure (Sn)' },
                  ];
                  exportToCsv('humanode_validators.csv', filteredValidators, cols);
                }}
              >
                CSV
              </Button>
            </Tooltip>
          </Group>
        </Group>
      </Paper>

      {/* Tablo */}
      <Box style={{ overflowX: 'auto' }}>
        <Table striped highlightOnHover verticalSpacing="xs">
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ width: 50, whiteSpace: 'nowrap' }}>{t('valColRank')}</Table.Th>
              <Table.Th style={{ whiteSpace: 'nowrap' }}>{t('valColAddress')}</Table.Th>
              <Table.Th style={{ whiteSpace: 'nowrap' }}>{t('valColStatus')}</Table.Th>
              <Table.Th style={{ whiteSpace: 'nowrap' }}>{t('valColBlocks')}</Table.Th>
              <Table.Th style={{ whiteSpace: 'nowrap' }}>
                {statusFilter === 'passive' ? t('valColLastActive') : (lang === 'tr' ? 'FeesPot Havuz Ödülü' : 'FeesPot Payout')}
              </Table.Th>
              <Table.Th style={{ whiteSpace: 'nowrap' }}>
                {statusFilter === 'passive' ? (lang === 'tr' ? 'Geçmiş Biyometri' : 'Historical Bioauth') : t('valColEpochTime')}
              </Table.Th>
              <Table.Th style={{ whiteSpace: 'nowrap' }}>{lang === 'tr' ? 'Bakiye' : 'Balance'}</Table.Th>
              <Table.Th style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{t('valColActions')}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {paginatedList.length > 0 ? (
              paginatedList.map((v, idx) => {
                const rank = (page - 1) * pageSize + idx + 1;
                const isActiveNode = v.is_active;

                return (
                  <Table.Tr key={v.address || idx}>
                    {/* Sıra */}
                    <Table.Td>
                      <Badge
                        size="xs"
                        variant={rank <= 3 ? 'filled' : 'light'}
                        color={rank === 1 ? 'yellow' : rank === 2 ? 'gray' : rank === 3 ? 'orange' : 'dark'}
                      >
                        #{rank}
                      </Badge>
                    </Table.Td>

                    {/* Cüzdan Adresi */}
                    <Table.Td>
                      <AddressBadge
                        address={v.address}
                        showNetwork={false}
                        onSelectAddress={onSelectAddress}
                        head={8}
                        tail={6}
                      />
                    </Table.Td>

                    {/* Durum Rozeti */}
                    <Table.Td>
                      {isActiveNode ? (
                        <Badge size="sm" color="teal" variant="dot" style={{ flexShrink: 0 }}>
                          {(v.is_bio_valid ?? ((v.seconds_left ?? v.bio_remaining_seconds ?? 0) > 0))
                            ? t('valStatusActive')
                            : `${t('valStatusActive')} (${lang === 'tr' ? 'Süre Doldu' : 'Expired'})`}
                        </Badge>
                      ) : (
                        <Badge size="sm" color="gray" variant="light" style={{ flexShrink: 0 }}>
                          {t('valStatusPassive')}
                        </Badge>
                      )}
                    </Table.Td>

                    {/* Blok Üretimi */}
                    <Table.Td className="font-mono">
                      <Text size="xs" fw={700} style={{ whiteSpace: 'nowrap' }}>
                        {(v.total_blocks ?? v.blocks_authored ?? 0).toLocaleString(loc)} {lang === 'tr' ? 'blok' : 'blocks'}
                      </Text>
                      {isActiveNode ? (
                        <Text size="10px" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                          {v.cadence_hours ? `~${v.cadence_hours} sa/blok • 30g: ${v.recent_blocks ?? 0}` : `30g: ${v.recent_blocks || 0} blok`}
                        </Text>
                      ) : (
                        <Text size="10px" c="dimmed">
                          {lang === 'tr' ? 'Geçmiş blok üretimi' : 'Historical authoring'}
                        </Text>
                      )}
                    </Table.Td>

                    {/* FeesPot Ödülü veya Son Görülme */}
                    <Table.Td className="font-mono">
                      {statusFilter === 'passive' ? (
                        <div>
                          <Text size="xs" c="dimmed">
                            {formatTimestamp(v.last_seen, lang)}
                          </Text>
                          <Text size="10px" c="gray.6">
                            {timeAgo(v.last_seen, lang)}
                          </Text>
                        </div>
                      ) : (
                        <div>
                          <Text size="xs" fw={700} c={v.payout_rounds > 0 ? 'teal' : 'dimmed'} style={{ whiteSpace: 'nowrap' }}>
                            {formatHMND(v.total_earned_hmnd || 0, lang)}
                          </Text>
                          <Text size="10px" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                            {v.payout_rounds > 0
                              ? `${v.payout_rounds} tur • Son: ${v.last_payout_hmnd} HMND`
                              : `0 tur (Tur tahmini: ~${v.est_round_hmnd || 585} HMND)`}
                          </Text>
                        </div>
                      )}
                    </Table.Td>

                    {/* 168s Döngü (42 Epoch Sayacı: SS:DD:SN Canlı Geri Sayım) */}
                    <Table.Td className="font-mono">
                      {statusFilter === 'passive' ? (
                        <div>
                          <Text size="xs" fw={600} c="dimmed">
                            {v.total_bioauth ?? v.total_ops ?? 0} {lang === 'tr' ? 'biyometrik onay' : 'bioauths'}
                          </Text>
                          <Text size="10px" c="dimmed">
                            {lang === 'tr' ? 'Bioauth süresi doldu' : 'Session expired'}
                          </Text>
                        </div>
                      ) : (() => {
                        const nowWallSec = Math.floor(nowMs / 1000);
                        let liveRemSec = 0;
                        const expSec = v.bio_expires_at ?? v.expires_at_sec;
                        if (expSec && expSec > 0) {
                          liveRemSec = Math.max(0, expSec - nowWallSec);
                        } else {
                          const elapsedSeconds = Math.max(0, Math.floor((nowMs - fetchBaseTime) / 1000));
                          const baseSec = Number(v.bio_remaining_seconds ?? v.seconds_left) || (Number(v.bio_remaining_hours) * 3600) || 0;
                          liveRemSec = Math.max(0, baseSec - elapsedSeconds);
                        }
                        const isExp = liveRemSec <= 0;
                        const isUrgent = liveRemSec > 0 && liveRemSec < 4 * 3600; // Son 4 saat kalmışsa turuncu ikaz
                        const displayEpoch = v.bio_current_epoch || (liveRemSec > 0 ? Math.min(42, Math.max(1, 42 - Math.floor(liveRemSec / 14400))) : 0);
                        const bioCount = v.total_bioauth ?? v.total_ops ?? 0;

                        return (
                          <div>
                            <Text
                              size="xs"
                              c={isExp ? 'dimmed' : isUrgent ? 'orange' : 'cyan'}
                              fw={700}
                              style={{ whiteSpace: 'nowrap' }}
                            >
                              {!isExp
                                ? `${displayEpoch} / 42 Epoch (${formatHMS(liveRemSec)} ${lang === 'tr' ? 'kaldı' : 'remaining'})`
                                : (lang === 'tr' ? 'Süresi doldu' : 'Expired')}
                            </Text>
                            <Text size="10px" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                              {lang === 'tr' ? `Toplam ${bioCount} biyometrik onay` : `Total ${bioCount} bioauths`}
                            </Text>
                          </div>
                        );
                      })()}
                    </Table.Td>

                    {/* Bakiye */}
                    <Table.Td className="font-mono" c="green" fw={700} style={{ whiteSpace: 'nowrap' }}>
                      {formatHMND(v.balance_hmnd, lang)}
                    </Table.Td>

                    {/* Eylemler */}
                    <Table.Td style={{ whiteSpace: 'nowrap', textAlign: 'center' }}>
                      <Group gap={4} wrap="nowrap" justify="center">
                        <Tooltip label={lang === 'tr' ? 'Cüzdan Önizlemesi' : 'Quick Peek'} withArrow position="top">
                          <ActionIcon
                            size="sm"
                            variant="light"
                            color="cyan"
                            onClick={() => onSelectAddress(v.address)}
                          >
                            <IconEye size={14} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label={lang === 'tr' ? 'Hesap Defteri' : 'Wallet Ledger'} withArrow position="top">
                          <ActionIcon
                            size="sm"
                            variant="light"
                            color="green"
                            onClick={() => onOpenLedger(v.address)}
                          >
                            <IconBook size={14} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })
            ) : (
              <Table.Tr>
                <Table.Td colSpan={8} style={{ textAlign: 'center', padding: '30px' }}>
                  <Text size="sm" c="dimmed">
                    {lang === 'tr' ? 'Arama kriterine uygun validatör kaydı bulunamadı.' : 'No validators found matching your search.'}
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Box>

      {/* Sayfalama Kontrolleri */}
      {totalPages > 1 && (
        <Group justify="space-between" align="center" mt="md" wrap="wrap">
          <Text size="xs" c="dimmed">
            {lang === 'tr'
              ? `Toplam ${filteredValidators.length} validatörden ${(page - 1) * pageSize + 1} - ${Math.min(page * pageSize, filteredValidators.length)} arası gösteriliyor`
              : `Showing ${(page - 1) * pageSize + 1} - ${Math.min(page * pageSize, filteredValidators.length)} of ${filteredValidators.length} validators`}
          </Text>
          <Pagination
            total={totalPages}
            value={page}
            onChange={setPage}
            size="sm"
            color="cyan"
          />
        </Group>
      )}
    </Paper>
  );
}
