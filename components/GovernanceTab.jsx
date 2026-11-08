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
  CopyButton,
  ActionIcon,
  Tooltip,
  Loader,
  Center,
  SegmentedControl,
} from '@mantine/core';
import {
  IconBuildingBank,
  IconShieldLock,
  IconUsers,
  IconCpu,
  IconCheck,
  IconCopy,
  IconExternalLink,
  IconAlertTriangle,
  IconGitPullRequest,
  IconLock,
} from '@tabler/icons-react';
import { shortAddr, formatTimestamp, formatHMND } from './formatters';
import { useLanguage } from './LanguageContext';
import KpiStatCard from './ui/KpiStatCard';
import AddressBadge from './ui/AddressBadge';

export default function GovernanceTab({ onOpenBlock, onSelectAddress }) {
  const { lang, t } = useLanguage();
  const locStr = lang === 'tr' ? 'tr-TR' : 'en-US';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSegment, setActiveSegment] = useState('multisig');

  useEffect(() => {
    let mounted = true;
    fetch('/api/governance')
      .then((res) => res.json())
      .then((json) => {
        if (mounted) {
          setData(json);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Governance verisi yüklenemedi:', err);
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Stack gap="md">
      {/* Üst Başlık & Açıklama */}
      <Paper p="md" bg="rgba(0,0,0,0.3)" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          <Box>
            <Group gap="xs" mb={4}>
              <IconBuildingBank size={24} color="#8b5cf6" />
              <Title order={2} size="h3" c="white">
                {lang === 'tr' ? 'DAO, Çoklu İmza (Multisig) & Sudo Yönetişim Masası' : 'DAO, Multisig & Sudo Governance Hub'}
              </Title>
              <Badge color="violet" variant="light" size="sm">
                Humanode Spec v{data?.specVersion || 135}
              </Badge>
            </Group>
            <Text size="xs" c="dimmed" maw={820}>
              {lang === 'tr'
                ? 'Humanode ağının en kritik acil durum anahtarı (Sudo), protokol yükseltmeleri ve 13 imza sahibi tarafından vakıf/hazine fonlarını yöneten 1.076 çoklu imza (multisig) operasyonunun şeffaf kaydı.'
                : 'Transparent log of Humanode emergency Sudo key actions, runtime upgrades, and 1,076 multisig treasury operations across 13 signers.'}
            </Text>
          </Box>

          <Group gap="xs">
            <Text size="xs" c="dimmed">
              {lang === 'tr' ? 'Sudo Anahtarı:' : 'Sudo Key:'}
            </Text>
            <Group gap={4}>
              <Text
                size="xs"
                fw={700}
                className="font-mono"
                c="red.3"
                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => onSelectAddress && onSelectAddress(data?.sudoKey)}
              >
                {shortAddr(data?.sudoKey || 'hmt3zuFmJpA9ohqFqbuRskS7bSKkxBtkddk6WySqwsNcYxFcY', 6, 4)}
              </Text>
              <CopyButton value={data?.sudoKey || 'hmt3zuFmJpA9ohqFqbuRskS7bSKkxBtkddk6WySqwsNcYxFcY'} timeout={2000}>
                {({ copied, copy }) => (
                  <Tooltip label={copied ? (lang === 'tr' ? 'Kopyalandı!' : 'Copied!') : (lang === 'tr' ? 'Sudo Adresini Kopyala' : 'Copy Sudo Address')}>
                    <ActionIcon size="xs" color={copied ? 'teal' : 'gray'} variant="subtle" onClick={copy}>
                      {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                    </ActionIcon>
                  </Tooltip>
                )}
              </CopyButton>
            </Group>
          </Group>
        </Group>

        {/* 4 Ana KPI Kartı */}
        <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing="sm" mt="md">
          <KpiStatCard
            title={lang === 'tr' ? 'Sudo Acil Müdahaleleri' : 'Sudo Interventions'}
            value={`${data?.totalSudoCalls || 20}`}
            unit={lang === 'tr' ? 'İşlem' : 'Txs'}
            color="orange"
            icon={IconShieldLock}
            subtext={lang === 'tr' ? 'Ağ genelinde yürütülen süper-yetkili çağrılar' : 'Super-user calls executed on runtime'}
          />

          <KpiStatCard
            title={lang === 'tr' ? 'Çoklu İmza (Multisig)' : 'Multisig Extrinsics'}
            value={(data?.multisigStats?.totalTxs || 1076).toLocaleString(locStr)}
            unit={lang === 'tr' ? 'İşlem' : 'Txs'}
            color="violet"
            icon={IconUsers}
            subtext={`${data?.multisigStats?.uniqueSigners || 13} ${lang === 'tr' ? 'farklı onaylayıcı cüzdan' : 'distinct authorized signers'}`}
          />

          <KpiStatCard
            title={lang === 'tr' ? 'Protokol Runtime' : 'Active Runtime'}
            value={`Spec v${data?.specVersion || 135}`}
            color="teal"
            icon={IconCpu}
            subtext={lang === 'tr' ? 'Substrate tabanlı Proof-of-Humanity çekirdeği' : 'Substrate PoH consensus core'}
          />

          <KpiStatCard
            title={lang === 'tr' ? 'Yönetişim Modeli' : 'Governance Model'}
            value="1 Human"
            unit="= 1 Vote"
            color="cyan"
            icon={IconGitPullRequest}
            subtext={lang === 'tr' ? 'Paraya değil, insan biyometrisine dayalı' : 'Biometric sybil-resistant voting'}
          />
        </SimpleGrid>
      </Paper>

      {/* Segment Seçici */}
      <Paper p="xs" bg="rgba(0,0,0,0.2)" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
        <SegmentedControl
          value={activeSegment}
          onChange={setActiveSegment}
          color="violet"
          size="xs"
          data={[
            {
              label: `${lang === 'tr' ? 'Çoklu İmza İşlemleri' : 'Multisig Extrinsics'} (${data?.multisigStats?.totalTxs || 1076})`,
              value: 'multisig',
            },
            {
              label: `${lang === 'tr' ? 'Sudo & Acil Durum Müdahaleleri' : 'Sudo Calls'} (${data?.totalSudoCalls || 20})`,
              value: 'sudo',
            },
            {
              label: lang === 'tr' ? 'Güvenlik Mimarisi & Yetki Matrisi' : 'Security Architecture & Matrix',
              value: 'security',
            },
          ]}
        />
      </Paper>

      {/* 1. Multisig Tablosu */}
      {activeSegment === 'multisig' && (
        <Paper p="md" bg="rgba(0,0,0,0.2)" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <Group justify="space-between" mb="sm">
            <Group gap={8}>
              <IconUsers size={18} color="#8b5cf6" />
              <Text size="sm" fw={700} c="white">
                {lang === 'tr' ? 'En Son Çoklu İmza (Pallet multisig) İşlemleri' : 'Recent Multisig Extrinsics'}
              </Text>
            </Group>
            <Badge variant="light" color="violet" size="sm">
              {data?.multisigStats?.uniqueSigners || 13} {lang === 'tr' ? 'İmza Sahibi Cüzdan' : 'Signers'}
            </Badge>
          </Group>

          <Box style={{ overflowX: 'auto', width: '100%' }}>
            <Table highlightOnHover verticalSpacing="xs" style={{ width: '100%', minWidth: 640, tableLayout: 'fixed' }}>
              <Table.Thead>
                <Table.Tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <Table.Th style={{ width: '14%', minWidth: 90, padding: '10px 8px' }}>
                    {lang === 'tr' ? 'Blok #' : 'Block #'}
                  </Table.Th>
                  <Table.Th style={{ width: '18%', minWidth: 120, padding: '10px 8px' }}>
                    {lang === 'tr' ? 'Tarih' : 'Timestamp'}
                  </Table.Th>
                  <Table.Th style={{ width: '22%', minWidth: 140, padding: '10px 8px' }}>
                    {lang === 'tr' ? 'İmzalayan (Signer)' : 'Signer'}
                  </Table.Th>
                  <Table.Th style={{ width: '16%', minWidth: 110, padding: '10px 8px' }}>
                    {lang === 'tr' ? 'Metod' : 'Method'}
                  </Table.Th>
                  <Table.Th style={{ width: '30%', minWidth: 180, padding: '10px 8px' }}>
                    {lang === 'tr' ? 'Detay / Operasyon' : 'Details'}
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {loading ? (
                  <Table.Tr>
                    <Table.Td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>
                      <Center>
                        <Loader size="sm" color="violet" mr="xs" />
                        <Text size="sm" c="dimmed">
                          {lang === 'tr' ? 'Multisig kayıtları yükleniyor...' : 'Loading multisig records...'}
                        </Text>
                      </Center>
                    </Table.Td>
                  </Table.Tr>
                ) : (data?.recentMultisigCalls || []).length > 0 ? (
                  data.recentMultisigCalls.map((tx, idx) => (
                    <Table.Tr
                      key={`${tx.block_number}-${idx}`}
                      style={{
                        backgroundColor: idx % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                      }}
                    >
                      {/* Blok # */}
                      <Table.Td style={{ padding: '8px 8px' }} className="font-mono">
                        <Text
                          size="xs"
                          c="cyan"
                          fw={700}
                          style={{ cursor: 'pointer', textDecoration: 'underline' }}
                          onClick={() => onOpenBlock && onOpenBlock(tx.block_number)}
                        >
                          #{tx.block_number?.toLocaleString(locStr)}
                        </Text>
                      </Table.Td>

                      {/* Tarih */}
                      <Table.Td style={{ padding: '8px 8px' }}>
                        <Text size="xs" c="gray.3">
                          {formatTimestamp(tx.timestamp, lang)}
                        </Text>
                      </Table.Td>

                      {/* İmzalayan */}
                      <Table.Td style={{ padding: '8px 8px' }} className="font-mono">
                        <Group gap={4} wrap="nowrap">
                          <Text
                            size="xs"
                            c="violet"
                            fw={600}
                            style={{ cursor: 'pointer', textDecoration: 'underline' }}
                            onClick={() => onSelectAddress && onSelectAddress(tx.signer)}
                          >
                            {shortAddr(tx.signer, 6, 4)}
                          </Text>
                          <CopyButton value={tx.signer} timeout={2000}>
                            {({ copied, copy }) => (
                              <ActionIcon size="xs" color={copied ? 'teal' : 'gray'} variant="subtle" onClick={copy}>
                                {copied ? <IconCheck size={11} /> : <IconCopy size={11} />}
                              </ActionIcon>
                            )}
                          </CopyButton>
                        </Group>
                      </Table.Td>

                      {/* Metod */}
                      <Table.Td style={{ padding: '8px 8px' }}>
                        <Badge size="xs" color="violet" variant="light">
                          {tx.method || 'as_multi'}
                        </Badge>
                      </Table.Td>

                      {/* Detay */}
                      <Table.Td style={{ padding: '8px 8px' }}>
                        <Text size="xs" c="dimmed" truncate title={tx.details}>
                          {tx.details || 'Çoklu imza yürütme çağrısı'}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ))
                ) : (
                  <Table.Tr>
                    <Table.Td colSpan={5} style={{ textAlign: 'center', padding: '30px' }}>
                      <Text size="sm" c="dimmed">
                        {lang === 'tr' ? 'Multisig işlemi bulunamadı.' : 'No multisig transactions found.'}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Box>
        </Paper>
      )}

      {/* 2. Sudo Tablosu */}
      {activeSegment === 'sudo' && (
        <Paper p="md" bg="rgba(0,0,0,0.2)" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <Group justify="space-between" mb="sm">
            <Group gap={8}>
              <IconShieldLock size={18} color="#ef4444" />
              <Text size="sm" fw={700} c="white">
                {lang === 'tr' ? 'Sudo Protokol Acil Durum & Yükseltme Çağrıları' : 'Sudo Runtime Interventions'}
              </Text>
            </Group>
            <Badge color="red" variant="filled" size="sm">
              {lang === 'tr' ? 'Kritik Yetki' : 'Root Access'}
            </Badge>
          </Group>

          <Box style={{ overflowX: 'auto', width: '100%' }}>
            <Table highlightOnHover verticalSpacing="xs" style={{ width: '100%', minWidth: 640, tableLayout: 'fixed' }}>
              <Table.Thead>
                <Table.Tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <Table.Th style={{ width: '15%', minWidth: 90, padding: '10px 8px' }}>
                    {lang === 'tr' ? 'Blok #' : 'Block #'}
                  </Table.Th>
                  <Table.Th style={{ width: '20%', minWidth: 130, padding: '10px 8px' }}>
                    {lang === 'tr' ? 'Tarih' : 'Timestamp'}
                  </Table.Th>
                  <Table.Th style={{ width: '25%', minWidth: 150, padding: '10px 8px' }}>
                    {lang === 'tr' ? 'Sudo İmzacısı' : 'Sudo Signer'}
                  </Table.Th>
                  <Table.Th style={{ width: '15%', minWidth: 90, padding: '10px 8px' }}>
                    {lang === 'tr' ? 'Metod' : 'Method'}
                  </Table.Th>
                  <Table.Th style={{ width: '25%', minWidth: 160, padding: '10px 8px' }}>
                    {lang === 'tr' ? 'Çağrı Amacı' : 'Details'}
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(data?.recentSudoCalls || []).map((tx, idx) => (
                  <Table.Tr
                    key={`${tx.block_number}-${idx}`}
                    style={{
                      backgroundColor: idx % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    <Table.Td style={{ padding: '8px 8px' }} className="font-mono">
                      <Text
                        size="xs"
                        c="cyan"
                        fw={700}
                        style={{ cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => onOpenBlock && onOpenBlock(tx.block_number)}
                      >
                        #{tx.block_number?.toLocaleString(locStr)}
                      </Text>
                    </Table.Td>

                    <Table.Td style={{ padding: '8px 8px' }}>
                      <Text size="xs" c="gray.3">
                        {formatTimestamp(tx.timestamp, lang)}
                      </Text>
                    </Table.Td>

                    <Table.Td style={{ padding: '8px 8px' }} className="font-mono">
                      <Group gap={4} wrap="nowrap">
                        <Text
                          size="xs"
                          c="red.3"
                          fw={600}
                          style={{ cursor: 'pointer', textDecoration: 'underline' }}
                          onClick={() => onSelectAddress && onSelectAddress(tx.signer)}
                        >
                          {shortAddr(tx.signer, 6, 4)}
                        </Text>
                        <CopyButton value={tx.signer} timeout={2000}>
                          {({ copied, copy }) => (
                            <ActionIcon size="xs" color={copied ? 'teal' : 'gray'} variant="subtle" onClick={copy}>
                              {copied ? <IconCheck size={11} /> : <IconCopy size={11} />}
                            </ActionIcon>
                          )}
                        </CopyButton>
                      </Group>
                    </Table.Td>

                    <Table.Td style={{ padding: '8px 8px' }}>
                      <Badge size="xs" color="red" variant="light">
                        {tx.method || 'sudo'}
                      </Badge>
                    </Table.Td>

                    <Table.Td style={{ padding: '8px 8px' }}>
                      <Text size="xs" c="dimmed" truncate title={tx.details}>
                        {tx.details || 'Root yetkili protokol çağrısı'}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Box>
        </Paper>
      )}

      {/* 3. Güvenlik Mimarisi & Yetki Matrisi */}
      {activeSegment === 'security' && (
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <Paper p="md" bg="rgba(0,0,0,0.25)" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
            <Group gap={8} mb="xs">
              <IconShieldLock size={18} color="#ef4444" />
              <Text size="sm" fw={700} c="white">
                {lang === 'tr' ? 'Sudo Anahtarı ve Acil Durum Yetkileri' : 'Sudo Key & Emergency Powers'}
              </Text>
            </Group>
            <Text size="xs" c="dimmed" mb="sm">
              {lang === 'tr'
                ? 'Humanode Mainnet başlangıç aşamasında kritik güvenlik açıklarını engellemek ve runtime güncellemelerini sorunsuz dağıtmak amacıyla Sudo modülünü aktif tutmaktadır. Anahtar yetkileri:'
                : 'Humanode retains root Sudo key to ensure smooth runtime upgrades and network emergency actions:'}
            </Text>
            <Stack gap={8}>
              <Paper p="xs" bg="rgba(0,0,0,0.3)" style={{ borderLeft: '3px solid #ef4444' }}>
                <Text size="xs" fw={700} c="white">Runtime Upgrade (Forksuz Güncelleme)</Text>
                <Text size="11px" c="dimmed">
                  {lang === 'tr' ? 'Ağda hard-fork gerekmeden tüm düğümlere yeni WASM kodunu yükler.' : 'Deploys on-chain WASM runtime without hard forks.'}
                </Text>
              </Paper>
              <Paper p="xs" bg="rgba(0,0,0,0.3)" style={{ borderLeft: '3px solid #f59e0b' }}>
                <Text size="xs" fw={700} c="white">Pallet & Modül Parametreleri</Text>
                <Text size="11px" c="dimmed">
                  {lang === 'tr' ? 'Bioauth süreleri, validatör slotları ve fee çarpanlarını acil durumda revize eder.' : 'Revises bioauth durations and consensus parameters.'}
                </Text>
              </Paper>
            </Stack>
          </Paper>

          <Paper p="md" bg="rgba(0,0,0,0.25)" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
            <Group gap={8} mb="xs">
              <IconUsers size={18} color="#8b5cf6" />
              <Text size="sm" fw={700} c="white">
                {lang === 'tr' ? 'Çoklu İmza (Multisig) Hazine Yönetimi' : 'Multisig Treasury & Vault Governance'}
              </Text>
            </Group>
            <Text size="xs" c="dimmed" mb="sm">
              {lang === 'tr'
                ? 'Vakıf kilit açılımları, köprü likiditesi ve ekosistem hibeleri 13 yetkili imza sahibinin onayıyla (m/n eşiği) yürütülmektedir.'
                : 'Foundation unlock schedules, bridge liquidity, and ecosystem grants require m/n consensus across 13 signers.'}
            </Text>
            <Stack gap={8}>
              <Paper p="xs" bg="rgba(0,0,0,0.3)" style={{ borderLeft: '3px solid #8b5cf6' }}>
                <Text size="xs" fw={700} c="white">as_multi & approve_as_multi</Text>
                <Text size="11px" c="dimmed">
                  {lang === 'tr' ? 'İşlemler tek bir tarafça değil, en az belirlenen eşik kadar onay toplanınca otomatik tetiklenir.' : 'Requires m-of-n threshold approvals to execute on-chain extrinsics.'}
                </Text>
              </Paper>
              <Paper p="xs" bg="rgba(0,0,0,0.3)" style={{ borderLeft: '3px solid #06b6d4' }}>
                <Text size="xs" fw={700} c="white">1.076 Başarılı Yürütme</Text>
                <Text size="11px" c="dimmed">
                  {lang === 'tr' ? 'Genesis bloktan bu yana vakıf ve topluluk kasaları güvenle yönetilmiştir.' : 'All vault transfers have operated strictly through multisig since genesis.'}
                </Text>
              </Paper>
            </Stack>
          </Paper>
        </SimpleGrid>
      )}
    </Stack>
  );
}
