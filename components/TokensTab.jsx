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
  TextInput,
  CopyButton,
  ActionIcon,
  Tooltip,
  Loader,
  Center,
} from '@mantine/core';
import {
  IconCoins,
  IconEye,
  IconCopy,
  IconCheck,
  IconSearch,
  IconArrowsExchange,
  IconTrendingUp,
  IconShieldLock,
  IconLayersLinked,
} from '@tabler/icons-react';
import { shortAddr } from './formatters';
import { useLanguage } from './LanguageContext';
import KpiStatCard from './ui/KpiStatCard';
import AddressBadge from './ui/AddressBadge';

// Astronomik veya taşan (uint256 max) token hacimlerinin tabloyu patlatmasını önler
function formatTokenVolume(vol, locStr) {
  const num = Number(vol);
  if (isNaN(num) || num === 0) return '0,00';
  if (num >= 1e15) {
    return num.toExponential(4);
  }
  return num.toLocaleString(locStr, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function TokensTab({ onSelectAddress }) {
  const { t, lang } = useLanguage();
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    setLoading(true);
    fetch('/api/tokens')
      .then((res) => res.json())
      .then((resData) => {
        setTokens(resData.tokens || resData || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const locStr = lang === 'en' ? 'en-US' : 'tr-TR';

  // KPI Hesaplamaları
  const totalTokensCount = tokens.length;
  const totalTransfers = useMemo(() => {
    return tokens.reduce((sum, tk) => sum + (Number(tk.transfer_count) || 0), 0);
  }, [tokens]);

  const topTransferredToken = useMemo(() => {
    if (tokens.length === 0) return null;
    return [...tokens].sort((a, b) => (b.transfer_count || 0) - (a.transfer_count || 0))[0];
  }, [tokens]);

  const dexPoolsCount = useMemo(() => {
    return tokens.filter((tk) => (tk.symbol || '').startsWith('IF-LP') || (tk.category || '').toLowerCase().includes('havuz') || (tk.category || '').toLowerCase().includes('lp')).length;
  }, [tokens]);

  // Filtreleme
  const filteredTokens = useMemo(() => {
    let list = tokens;

    if (categoryFilter !== 'all') {
      if (categoryFilter === 'dex') {
        list = list.filter((tk) => (tk.symbol || '').startsWith('IF-LP') || (tk.category || '').toLowerCase().includes('lp') || (tk.category || '').toLowerCase().includes('havuz'));
      } else if (categoryFilter === 'stable_wrapped') {
        list = list.filter((tk) => {
          const s = (tk.symbol || '').toUpperCase();
          return s === 'USDC' || s === 'USDT' || s === 'WETH' || s === 'WBTC' || s === 'HBTC';
        });
      } else if (categoryFilter === 'meme') {
        list = list.filter((tk) => {
          const s = (tk.symbol || '').toUpperCase();
          const cat = (tk.category || '').toLowerCase();
          return s.includes('PEPE') || s.includes('WOOF') || s.includes('HOOMAN') || cat.includes('meme');
        });
      } else if (categoryFilter === 'eco') {
        list = list.filter((tk) => {
          const s = (tk.symbol || '').toUpperCase();
          return s === 'WEHMND' || s === 'HMP' || s === 'MBG' || s === 'BOTK' || s === 'RBCP' || s === 'PORTX' || s === 'CGPT' || s === 'OCX' || s === 'IDT';
        });
      }
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((tk) => {
        const sym = (tk.symbol || tk.token_symbol || '').toLowerCase();
        const nm = (tk.name || tk.token_name || '').toLowerCase();
        const addr = (tk.token_address || '').toLowerCase();
        const cat = (tk.category || '').toLowerCase();
        return sym.includes(q) || nm.includes(q) || addr.includes(q) || cat.includes(q);
      });
    }

    return list;
  }, [tokens, search, categoryFilter]);

  return (
    <Stack gap="md">
      {/* Başlık ve Açıklama */}
      <Paper p="md" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
        <Group justify="space-between" align="flex-start" mb="sm" wrap="wrap">
          <div>
            <Title order={3} mb={4}>
              {t('tokensTitle')}
            </Title>
            <Text size="xs" c="dimmed">
              {t('tokensSubtitle')}
            </Text>
          </div>
        </Group>

        {/* KPI Kartları */}
        <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing="sm">
          <KpiStatCard
            title={t('tokensTotalCount')}
            value={totalTokensCount.toLocaleString(locStr)}
            unit={lang === 'tr' ? 'Varlık' : 'Assets'}
            color="teal"
            icon={IconCoins}
            subtext={lang === 'tr' ? 'Ağda transfer edilen ERC-20 sözleşmeleri' : 'Transacted ERC-20 contracts on EVM'}
          />

          <KpiStatCard
            title={t('tokensTotalTransfers')}
            value={totalTransfers.toLocaleString(locStr)}
            unit={lang === 'tr' ? 'İşlem' : 'Txs'}
            color="cyan"
            icon={IconTrendingUp}
            subtext={lang === 'tr' ? 'İndekslenen toplam token transfer adedi' : 'Cumulative indexed token transfer count'}
          />

          <KpiStatCard
            title={lang === 'tr' ? 'DEX LP Likidite Havuzları' : 'DEX LP Liquidity Pools'}
            value={dexPoolsCount.toLocaleString(locStr)}
            unit={lang === 'tr' ? 'Havuz' : 'Pools'}
            color="violet"
            icon={IconArrowsExchange}
            subtext={lang === 'tr' ? 'Impossible Finance işlem çiftleri' : 'Impossible Finance liquidity pairs'}
          />

          <KpiStatCard
            title={t('tokensTopVolumeToken')}
            value={topTransferredToken ? topTransferredToken.symbol : 'WeHMND'}
            unit="TOKEN"
            color="yellow"
            icon={IconLayersLinked}
            subtext={topTransferredToken ? `${topTransferredToken.transfer_count?.toLocaleString(locStr)} ${lang === 'tr' ? 'transfer' : 'transfers'}` : ''}
          />
        </SimpleGrid>
      </Paper>

      {/* Arama ve Kategori Filtre Butonları */}
      <Paper p="xs" bg="rgba(0,0,0,0.2)" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
        <Group justify="space-between" wrap="wrap" gap="sm">
          <Group gap="xs" wrap="wrap">
            <Button
              size="xs"
              variant={categoryFilter === 'all' ? 'filled' : 'light'}
              color="gray"
              onClick={() => setCategoryFilter('all')}
            >
              {t('tokenCategoryAll')} ({tokens.length})
            </Button>
            <Button
              size="xs"
              variant={categoryFilter === 'dex' ? 'filled' : 'light'}
              color="violet"
              leftSection={<IconArrowsExchange size={14} />}
              onClick={() => setCategoryFilter('dex')}
            >
              {t('tokenCategoryDEX')} ({dexPoolsCount})
            </Button>
            <Button
              size="xs"
              variant={categoryFilter === 'stable_wrapped' ? 'filled' : 'light'}
              color="blue"
              onClick={() => setCategoryFilter('stable_wrapped')}
            >
              {t('tokenCategoryStable')}
            </Button>
            <Button
              size="xs"
              variant={categoryFilter === 'meme' ? 'filled' : 'light'}
              color="green"
              onClick={() => setCategoryFilter('meme')}
            >
              {t('tokenCategoryMeme')}
            </Button>
            <Button
              size="xs"
              variant={categoryFilter === 'eco' ? 'filled' : 'light'}
              color="teal"
              onClick={() => setCategoryFilter('eco')}
            >
              {t('tokenCategoryEco')}
            </Button>
          </Group>

          <TextInput
            placeholder={t('tokensSearchPlaceholder')}
            leftSection={<IconSearch size={14} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="xs"
            style={{ minWidth: 240, maxWidth: 360, flex: 1 }}
          />
        </Group>
      </Paper>

      {/* Token Listesi Tablosu */}
      <Paper p="md" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
        <Box style={{ overflowX: 'auto', width: '100%' }}>
          <Table highlightOnHover verticalSpacing="xs" style={{ width: '100%', minWidth: 620, tableLayout: 'fixed' }}>
            <Table.Thead>
              <Table.Tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <Table.Th style={{ width: '32%', minWidth: 170, padding: '10px 8px' }}>
                  {t('tokenColAsset') || (lang === 'tr' ? 'Varlık (Token)' : 'Asset (Token)')}
                </Table.Th>
                <Table.Th style={{ width: '18%', minWidth: 110, whiteSpace: 'nowrap', padding: '10px 8px' }}>
                  {t('tokenColContract')}
                </Table.Th>
                <Table.Th style={{ width: '12%', minWidth: 70, textAlign: 'right', whiteSpace: 'nowrap', padding: '10px 8px' }}>
                  {t('tokenColTransfers')}
                </Table.Th>
                <Table.Th style={{ width: '20%', minWidth: 130, textAlign: 'right', whiteSpace: 'nowrap', padding: '10px 8px' }}>
                  {t('tokenColVolume')}
                </Table.Th>
                <Table.Th style={{ width: '12%', minWidth: 90, textAlign: 'center', whiteSpace: 'nowrap', padding: '10px 8px' }}>
                  {t('tokenColHolders')}
                </Table.Th>
                <Table.Th style={{ width: '6%', minWidth: 40, textAlign: 'center', whiteSpace: 'nowrap', padding: '10px 8px' }}>
                  {t('tokenColActions')}
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
                        {lang === 'tr' ? 'Token ve DEX verileri yükleniyor...' : 'Loading tokens & DEX directory...'}
                      </Text>
                    </Center>
                  </Table.Td>
                </Table.Tr>
              ) : filteredTokens.length > 0 ? (
                filteredTokens.map((tk, idx) => {
                  const sym = tk.symbol || tk.token_symbol || 'TOKEN';
                  const nm = tk.name || tk.token_name || `${sym} Token`;
                  const cat = tk.category || (sym.startsWith('IF-LP:') ? (lang === 'tr' ? 'DEX LP Havuzu' : 'DEX LP Pool') : 'ERC-20 Token');
                  const badgeColor = tk.color || 'violet';
                  const vol = Number(tk.total_volume || 0);

                  return (
                    <Table.Tr
                      key={tk.token_address || idx}
                      style={{
                        backgroundColor: idx % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                      }}
                    >
                      {/* Varlık (Sembol Rozeti + İsim + Kategori) */}
                      <Table.Td style={{ padding: '8px 8px', overflow: 'hidden' }}>
                        <Group gap={8} wrap="nowrap" align="center" style={{ minWidth: 0 }}>
                          <Badge
                            color={badgeColor}
                            size="sm"
                            variant="light"
                            radius="sm"
                            style={{
                              flexShrink: 0,
                              whiteSpace: 'nowrap',
                              fontWeight: 700,
                              letterSpacing: '0.2px',
                              textTransform: 'none',
                              padding: '0 8px',
                              height: 22,
                              lineHeight: '22px',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                            }}
                          >
                            {sym}
                          </Badge>
                          <Box style={{ minWidth: 0, overflow: 'hidden', flex: 1 }}>
                            <Text size="xs" fw={700} c="white" truncate title={nm}>
                              {nm}
                            </Text>
                            <Text size="10px" c="dimmed" truncate title={cat}>
                              {cat}
                            </Text>
                          </Box>
                        </Group>
                      </Table.Td>

                      {/* Sözleşme Adresi */}
                      <Table.Td style={{ whiteSpace: 'nowrap', padding: '8px 8px' }}>
                        <Group gap={4} wrap="nowrap">
                          <Text
                            size="xs"
                            className="font-mono"
                            c="cyan"
                            style={{ cursor: 'pointer', textDecoration: 'underline' }}
                            onClick={() => onSelectAddress && onSelectAddress(tk.token_address)}
                            title={`${tk.token_address} - ${lang === 'tr' ? 'Cüzdan/Sözleşme önizlemesini aç' : 'Open address quick peek'}`}
                          >
                            {shortAddr(tk.token_address, 5, 4)}
                          </Text>
                          <CopyButton value={tk.token_address} timeout={2000}>
                            {({ copied, copy }) => (
                              <Tooltip label={copied ? (lang === 'tr' ? 'Kopyalandı!' : 'Copied!') : (lang === 'tr' ? 'Sözleşme Adresini Kopyala' : 'Copy Contract Address')} withArrow position="top">
                                <ActionIcon
                                  size="xs"
                                  color={copied ? 'teal' : 'gray'}
                                  variant="subtle"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copy();
                                  }}
                                >
                                  {copied ? <IconCheck size={11} /> : <IconCopy size={11} />}
                                </ActionIcon>
                              </Tooltip>
                            )}
                          </CopyButton>
                        </Group>
                      </Table.Td>

                      {/* Transfer Sayısı */}
                      <Table.Td style={{ textAlign: 'right', whiteSpace: 'nowrap', padding: '8px 8px' }} className="font-mono">
                        <Badge variant="light" color="cyan" size="sm">
                          {(Number(tk.transfer_count) || 0).toLocaleString(locStr)}
                        </Badge>
                      </Table.Td>

                      {/* Kümülatif Hacim */}
                      <Table.Td style={{ textAlign: 'right', whiteSpace: 'nowrap', padding: '8px 8px' }} className="font-mono">
                        <Text size="xs" fw={700} c="teal" truncate>
                          {formatTokenVolume(vol, locStr)}
                        </Text>
                        <Text size="10px" c="dimmed" fw={500} truncate title={sym}>
                          {sym}
                        </Text>
                      </Table.Td>

                      {/* Gönderici / Alıcı Dağılımı */}
                      <Table.Td style={{ textAlign: 'center', whiteSpace: 'nowrap', padding: '8px 8px' }}>
                        <Text size="xs" className="font-mono" c="gray.2" fw={600}>
                          {Number(tk.unique_senders || 0).toLocaleString(locStr)} / {Number(tk.unique_holders || 0).toLocaleString(locStr)}
                        </Text>
                        <Text size="10px" c="dimmed">
                          {lang === 'tr' ? 'gönderici / alıcı' : 'senders / holders'}
                        </Text>
                      </Table.Td>

                      {/* İncele Butonu */}
                      <Table.Td style={{ textAlign: 'center', whiteSpace: 'nowrap', padding: '8px 8px' }}>
                        <Tooltip label={t('preview')} withArrow position="left">
                          <ActionIcon
                            size="sm"
                            variant="light"
                            color="cyan"
                            onClick={() => onSelectAddress && onSelectAddress(tk.token_address)}
                          >
                            <IconEye size={14} />
                          </ActionIcon>
                        </Tooltip>
                      </Table.Td>
                    </Table.Tr>
                  );
                })
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={6} style={{ textAlign: 'center', padding: '30px' }}>
                    <Text size="sm" c="dimmed">
                      {lang === 'tr' ? 'Arama kriterine uygun token bulunamadı.' : 'No tokens found matching the search.'}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Box>
      </Paper>
    </Stack>
  );
}
