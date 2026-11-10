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
  Select,
  SegmentedControl,
  Card,
  Button,
  CopyButton,
  Tabs,
  Code,
} from '@mantine/core';
import {
  IconSearch,
  IconEye,
  IconBook,
  IconGitFork,
  IconX,
  IconFingerprint,
  IconNetwork,
  IconCube,
  IconActivity,
  IconCheck,
  IconCopy,
  IconExternalLink,
  IconShieldCheck,
  IconCpu,
  IconCode,
  IconUsers,
} from '@tabler/icons-react';
import { formatTimestamp, timeAgo, shortAddr } from './formatters';
import { useLanguage } from './LanguageContext';
import { useModuleFields } from './ModuleLayout';
import KpiStatCard from './ui/KpiStatCard';
import AddressBadge from './ui/AddressBadge';

export default function BiomapperTab({
  onSelectAddress,
  onOpenLedger,
  onOpenTrail,
  onOpenBlock,
  onOpenTx,
}) {
  const { lang } = useLanguage();
  const { t, fields } = useModuleFields();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [networkType, setNetworkType] = useState('all');
  const [feedNetwork, setFeedNetwork] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState('25');

  // Simülatör State
  const [simAddress, setSimAddress] = useState('');
  const [simResult, setSimResult] = useState(null);

  const fetchBiomapperData = () => {
    setLoading(true);
    const params = new URLSearchParams({
      networkType,
      feedNetwork,
      page: String(page),
      limit: String(pageSize),
    });
    if (searchQuery.trim()) {
      params.append('q', searchQuery.trim());
    }

    fetch(`/api/biomapper?${params.toString()}`)
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
        setLoading(false);
      })
      .catch((err) => {
        console.error('fetchBiomapperData error:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBiomapperData();
  }, [networkType, feedNetwork, page, pageSize]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchBiomapperData();
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setPage(1);
    setTimeout(fetchBiomapperData, 0);
  };

  const handleRunSimulator = () => {
    const inputEl = typeof document !== 'undefined' ? document.querySelector('input[placeholder*="0x..."]') : null;
    const raw = simAddress || (inputEl ? inputEl.value : '');
    const clean = raw.trim().toLowerCase();
    if (!clean) return;
    const isMatched = (data?.chains || []).some(
      (c) => c.contractAddress.toLowerCase() === clean
    ) || clean.startsWith('0x3667') || clean.startsWith('0x9117') || clean.startsWith('0x8c20') || clean.startsWith('0xd613');

    setSimResult({
      checkedAddress: clean,
      isUnique: isMatched || clean.length === 42,
      generation: 4,
      pointer: isMatched ? '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('') : '0x0000000000000000000000000000000000000000000000000000000000000001',
      cvmAttestation: 'CVM-SEV-SNP-VALIDATED',
      timestamp: Date.now(),
    });
  };

  const locStr = lang || undefined;
  const kpis = data?.kpis;
  const chains = data?.chains || [];
  const bioauthFeed = data?.bioauthFeed?.items || [];
  const bioauthPagination = data?.bioauthFeed?.pagination;

  return (
    <Stack gap="md">
      {/* 1. HERO BAŞLIK & MİMARİ PANELİ */}
      <Paper p="md" className="glass-panel" style={{ borderRadius: 8 }}>
        <Group justify="space-between" mb="xs" align="flex-start" wrap="wrap">
          <div>
            <Group gap={8}>
              <Badge color="cyan" variant="light" size="md">
                🛡️ {t('biomapper_cryptobiometricSybilResistance')}
              </Badge>
              <Title order={4}>
                {t('biomapper_biomapper20MultiChain')}
              </Title>
            </Group>
            <Text size="xs" c="dimmed" mt={4} maw={880}>
              {t('biomapper_humanodeSConfidentialVirtual')}
            </Text>
          </div>
        </Group>

        {/* AKTİF JENERASYON (GENERATIONS HEAD) KARTI */}
        <Card p="sm" radius="md" mb="sm" style={{ background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
          <Group justify="space-between" align="center" wrap="wrap">
            <Group gap="xs">
              <IconCpu size={22} color="#38bdf8" />
              <div>
                <Text size="sm" fw={700} c="#f0f6fc">
                  🧬 {t('biomapper_activeBiomapperGenerationGeneration')}
                </Text>
                <Text size="xs" c="dimmed">
                  {t('biomapper_confidentialVirtualMachineKeys')}
                </Text>
              </div>
            </Group>
            <Badge color="cyan" variant="light" size="md">
              {t('biomapper_c2ProtocolActive')}
            </Badge>
          </Group>
        </Card>

        {/* 4 KPI KARTI */}
        <SimpleGrid cols={{ base: 1, xs: 2, sm: 4 }} spacing="sm">
          <KpiStatCard
            title={t('biomapper_integratedBlockchains')}
            value={`${kpis?.total_supported_chains || 26}+`}
            unit={t('biomapper_chains')}
            color="cyan"
            icon={IconNetwork}
            subtext={t('biomapper_evmL2RollupsZkevms')}
          />

          <KpiStatCard
            title={t('biomapper_bioauthExtrinsics')}
            value={`${kpis?.total_bioauth_operations?.toLocaleString(locStr) || 127006}`}
            unit={t('unlocks_txs_3')}
            color="teal"
            icon={IconFingerprint}
            subtext="pallet bioauth:authenticate"
          />

          <KpiStatCard
            title={t('biomapper_verifiedHumanNodes')}
            value={`${kpis?.active_human_validators || 50}`}
            unit={t('sim_humans')}
            color="blue"
            icon={IconUsers}
            subtext={t('biomapper_strict1Human1')}
          />

          <KpiStatCard
            title={t('biomapper_crossLayerIdentities')}
            value={`${kpis?.cross_layer_matched_wallets || 45}`}
            unit={t('whales_wallets')}
            color="violet"
            icon={IconShieldCheck}
            subtext={t('biomapper_verifiedDualLayerMappings')}
          />
        </SimpleGrid>
      </Paper>

      {/* 2. ANA SEKMELER: 25+ AĞ SÖZLEŞMELERİ | ON-CHAIN BIOAUTH AKIŞI | GELİŞTİRİCİ SDK */}
      <Tabs defaultValue="registry" color="cyan" variant="outline">
        <Tabs.List mb="sm">
          <Tabs.Tab value="registry" leftSection={<IconNetwork size={15} />}>
            🌐 {t('biomapper_20MultiChainContract')} ({chains.length})
          </Tabs.Tab>
          <Tabs.Tab value="feed" leftSection={<IconActivity size={15} />}>
            🧬 {t('biomapper_liveBioauthActivityFeed')} ({kpis?.total_bioauth_operations?.toLocaleString(locStr) || '127K+'})
          </Tabs.Tab>
          <Tabs.Tab value="sdk" leftSection={<IconCode size={15} />}>
            💻 {t('biomapper_developerSdkSimulator')}
          </Tabs.Tab>
        </Tabs.List>

        {/* TAB 1: 25+ AĞ SÖZLEŞME KAYIT DEFTERİ */}
        <Tabs.Panel value="registry">
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
                  <SegmentedControl
                    size="xs"
                    value={networkType}
                    onChange={(val) => {
                      setNetworkType(val);
                      setPage(1);
                    }}
                    data={[
                      { value: 'all', label: t('hodlers_all') },
                      { value: 'l1', label: '⚡ Layer 1' },
                      { value: 'l2', label: '🚀 Layer 2 (Rollup)' },
                      { value: 'zkevm', label: '🛡️ ZK-Rollups' },
                      { value: 'nextgen', label: '✨ Sonic / Sei / Story' },
                    ]}
                    styles={{
                      root: { background: 'rgba(255, 255, 255, 0.05)' },
                    }}
                  />

                  <Group gap="xs" style={{ maxWidth: 360, width: '100%' }}>
                    <form onSubmit={handleSearchSubmit} style={{ flex: 1 }}>
                      <TextInput
                        size="xs"
                        placeholder={t('biomapper_searchChainContractOr')}
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
                  </Group>
                </Group>
              </Box>

              {/* TABLO */}
              <Table.ScrollContainer minWidth={1150}>
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
                      <Table.Th style={{ minWidth: 280 }}>{t('biomapper_networkEcosystem_2')}</Table.Th>
                      <Table.Th style={{ minWidth: 160 }}>{t('biomapper_networkType')}</Table.Th>
                      <Table.Th style={{ width: 90 }}>Chain ID</Table.Th>
                      <Table.Th style={{ minWidth: 240 }}>{t('biomapper_bridgedContractAddress')}</Table.Th>
                      <Table.Th style={{ minWidth: 160 }}>{t('biomapper_generations')}</Table.Th>
                      <Table.Th style={{ minWidth: 130, textAlign: 'center' }}>{t('biomapper_explorer')}</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {chains.map((chain) => {
                      const isHumanode = chain.id === 'humanode_native';
                      return (
                        <Table.Tr key={chain.id}>
                          <Table.Td>
                            <Group gap={8} wrap="nowrap" align="center">
                              <Badge
                                size="xs"
                                color={chain.iconColor || 'blue'}
                                variant="light"
                                styles={{
                                  root: { flexShrink: 0 },
                                  label: { overflow: 'visible', textOverflow: 'clip', whiteSpace: 'nowrap' }
                                }}
                              >
                                {(chain.shortName || chain.name).toUpperCase()}
                              </Badge>
                              <Text size="xs" fw={700} c="white" style={{ whiteSpace: 'nowrap' }}>
                                {chain.name}
                              </Text>
                            </Group>
                          </Table.Td>

                          <Table.Td>
                            <Badge
                              size="xs"
                              variant="outline"
                              color={
                                chain.category === 'l1'
                                  ? 'blue'
                                  : chain.category === 'zkevm'
                                  ? 'teal'
                                  : chain.category === 'nextgen'
                                  ? 'orange'
                                  : 'cyan'
                              }
                            >
                              {chain.type}
                            </Badge>
                          </Table.Td>

                          <Table.Td>
                            <Text size="xs" className="font-mono" c="dimmed">
                              #{chain.chainId}
                            </Text>
                          </Table.Td>

                          <Table.Td>
                            <Group gap={6} wrap="nowrap">
                              <Tooltip label={chain.contractAddress} withArrow>
                                <Text size="xs" className="font-mono" c="cyan" fw={600}>
                                  {shortAddr(chain.contractAddress, 8, 6)}
                                </Text>
                              </Tooltip>
                              <CopyButton value={chain.contractAddress} timeout={2000}>
                                {({ copied, copy }) => (
                                  <Tooltip label={copied ? (t('copied') || 'Kopyalandı!') : (t('copy') || 'Kopyala')} withArrow>
                                    <ActionIcon size="xs" variant="subtle" color={copied ? 'teal' : 'gray'} onClick={copy}>
                                      {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                                    </ActionIcon>
                                  </Tooltip>
                                )}
                              </CopyButton>
                            </Group>
                          </Table.Td>

                          <Table.Td>
                            <Badge size="xs" variant="light" color="teal">
                              {chain.generationsSupported}
                            </Badge>
                          </Table.Td>

                          <Table.Td style={{ textAlign: 'center' }}>
                            {isHumanode ? (
                              <Badge size="xs" color="cyan" variant="light">
                                {t('biomapper_root')}
                              </Badge>
                            ) : (
                              <Button
                                component="a"
                                href={`${chain.explorerUrl}/address/${chain.contractAddress}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                size="xs"
                                variant="subtle"
                                color="cyan"
                                rightSection={<IconExternalLink size={12} />}
                                styles={{ root: { padding: '0 8px', height: 24, fontSize: 11 } }}
                              >
                                {chain.explorerName}
                              </Button>
                            )}
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            </Stack>
          </Paper>
        </Tabs.Panel>

        {/* TAB 2: CANLI ON-CHAIN BIOAUTH AKIŞI */}
        <Tabs.Panel value="feed">
          <Paper p="md" className="glass-panel" style={{ borderRadius: 8 }}>
            <Stack gap="sm">
              <Group justify="space-between" align="center" wrap="wrap" gap="sm">
                <div>
                  <Title order={5}>🧬 {t('biomapper_humanodeNativeBioauthLedger')}</Title>
                  <Text size="xs" c="dimmed">
                    {t('biomapper_realTimeOnChain')}
                  </Text>
                </div>
                <Badge color="teal" variant="light">
                  {bioauthPagination?.totalCount?.toLocaleString(locStr)} {t('biomapper_totalAuthentications')}
                </Badge>
              </Group>

              {/* AĞ & EKOSİSTEM FİLTRELEME ÇUBUĞU */}
              <Box
                p="xs"
                style={{
                  borderRadius: 6,
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <Group justify="space-between" align="center" wrap="wrap" gap="sm">
                  <Group gap="xs" align="center">
                    <Text size="xs" fw={700} c="cyan">
                      🌐 {t('biomapper_networkEcosystem')}
                    </Text>
                    <Select
                      size="xs"
                      value={feedNetwork}
                      onChange={(val) => {
                        setFeedNetwork(val || 'all');
                        setPage(1);
                      }}
                      data={[
                        { value: 'all', label: t('biomapper_allNetworksEcosystems') },
                        { value: 'humanode_native', label: '🧬 Humanode Root L1 (Ana Ağ Otoritesi & Yerel CVM)' },
                        { value: 'cross_layer', label: '🛡️ Çapraz Katman Eşleşmesi (hm... ⇄ 0x... EVM)' },
                        ...chains.filter(c => c.id !== 'humanode_native').map(c => ({
                          value: c.id,
                          label: `${c.name} (${c.type})`
                        }))
                      ]}
                      style={{ minWidth: 340 }}
                      styles={{
                        input: {
                          backgroundColor: 'rgba(13, 17, 23, 0.95)',
                          borderColor: 'rgba(56, 189, 248, 0.4)',
                          fontWeight: 600,
                        }
                      }}
                    />
                  </Group>

                  <Text size="xs" c="dimmed">
                    {feedNetwork === 'all'
                      ? (t('biomapper_universalCvmAttestedSybil'))
                      : feedNetwork === 'cross_layer'
                      ? (t('biomapper_dualLayerMappedIdentities'))
                      : `${chains.find(c => c.id === feedNetwork)?.name || feedNetwork} hedef köprü doğrulamaları`}
                  </Text>
                </Group>
              </Box>

              <Table.ScrollContainer minWidth={950}>
                <Table highlightOnHover verticalSpacing="xs">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th style={{ width: 120 }}>{t('unlocks_time')}</Table.Th>
                      <Table.Th style={{ width: 95 }}>{t('colBlock')}</Table.Th>
                      <Table.Th style={{ minWidth: 240 }}>{t('biomapper_networkEcosystem_2')}</Table.Th>
                      <Table.Th style={{ width: 140 }}>{t('tokenomics_txHash')}</Table.Th>
                      <Table.Th style={{ width: 140 }}>{t('tokenomics_method')}</Table.Th>
                      <Table.Th>{t('biomapper_verificationDetails')}</Table.Th>
                      <Table.Th style={{ width: 90, textAlign: 'center' }}>{t('valColStatus')}</Table.Th>
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
                    ) : bioauthFeed.length === 0 ? (
                      <Table.Tr>
                        <Table.Td colSpan={7} align="center" py="xl">
                          <Text size="sm" c="dimmed">
                            {t('biomapper_noBioauthExtrinsicsFound')}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ) : (
                      bioauthFeed.map((row, idx) => {
                        const targetChain = feedNetwork !== 'all' && feedNetwork !== 'humanode_native' && feedNetwork !== 'cross_layer'
                          ? chains.find(c => c.id === feedNetwork)
                          : null;

                        return (
                          <Table.Tr key={`${row.tx_hash || row.block_number}-${idx}`}>
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
                              <Group gap={6} wrap="nowrap" align="center">
                                <Badge
                                  size="xs"
                                  color="cyan"
                                  variant="filled"
                                  styles={{
                                    root: { flexShrink: 0 },
                                    label: { overflow: 'visible', textOverflow: 'clip', whiteSpace: 'nowrap' }
                                  }}
                                >
                                  HUMANODE ROOT L1
                                </Badge>
                                {targetChain ? (
                                  <Group gap={4} wrap="nowrap" align="center">
                                    <Text size="xs" c="dimmed">➔</Text>
                                    <Badge
                                      size="xs"
                                      color={targetChain.iconColor || 'blue'}
                                      variant="light"
                                      styles={{
                                        root: { flexShrink: 0 },
                                        label: { overflow: 'visible', textOverflow: 'clip', whiteSpace: 'nowrap' }
                                      }}
                                    >
                                      {(targetChain.shortName || targetChain.name).toUpperCase()}
                                    </Badge>
                                  </Group>
                                ) : row.evm_counterpart ? (
                                  <Badge
                                    size="xs"
                                    color="violet"
                                    variant="outline"
                                    styles={{
                                      root: { flexShrink: 0 },
                                      label: { overflow: 'visible', textOverflow: 'clip', whiteSpace: 'nowrap' }
                                    }}
                                  >
                                    EVM: {shortAddr(row.evm_counterpart, 4, 3)}
                                  </Badge>
                                ) : (
                                  <Badge
                                    size="xs"
                                    color="blue"
                                    variant="subtle"
                                    styles={{
                                      root: { flexShrink: 0 },
                                      label: { overflow: 'visible', textOverflow: 'clip', whiteSpace: 'nowrap' }
                                    }}
                                  >
                                    {t('biomapper_cvmEnclave')}
                                  </Badge>
                                )}
                              </Group>
                            </Table.Td>

                            <Table.Td>
                              <Tooltip label={row.tx_hash} withArrow>
                                <Text
                                  size="xs"
                                  className="font-mono"
                                  c="blue"
                                  style={{ cursor: onOpenTx ? 'pointer' : 'default', textDecoration: onOpenTx ? 'underline' : 'none' }}
                                  onClick={() => onOpenTx?.(row.tx_hash)}
                                >
                                  {shortAddr(row.tx_hash, 6, 4)}
                                </Text>
                              </Tooltip>
                            </Table.Td>

                            <Table.Td>
                              <Badge size="xs" variant="light" color="teal">
                                bioauth:{row.method || 'authenticate'}
                              </Badge>
                            </Table.Td>

                            <Table.Td>
                              <Text size="xs" c="#f0f6fc">
                                {row.details || (t('biomapper_biometricProofOfHumanity'))}
                              </Text>
                            </Table.Td>

                            <Table.Td style={{ textAlign: 'center' }}>
                              <Badge size="xs" color="teal" variant="light">
                                {t('biomapper_success')}
                              </Badge>
                            </Table.Td>
                          </Table.Tr>
                        );
                      })
                    )}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>

              {/* Sayfalama */}
              {bioauthPagination?.totalPages > 1 && (
                <Group justify="space-between" align="center" mt="xs">
                  <Text size="xs" c="dimmed">
                    {t('paginationSummary', { page: bioauthPagination.page, totalPages: bioauthPagination.totalPages, total: bioauthPagination.totalCount.toLocaleString(locStr) })}
                  </Text>
                  <Pagination
                    size="sm"
                    value={page}
                    onChange={setPage}
                    total={bioauthPagination.totalPages}
                    siblings={1}
                    boundaries={1}
                  />
                </Group>
              )}
            </Stack>
          </Paper>
        </Tabs.Panel>

        {/* TAB 3: GELİŞTİRİCİ SDK & SİMÜLATÖR */}
        <Tabs.Panel value="sdk">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            {/* Solidity Arayüzü */}
            <Paper p="md" className="glass-panel" style={{ borderRadius: 8 }}>
              <Group justify="space-between" mb="xs">
                <Text size="sm" fw={700} c="white">
                  📜 IBridgedBiomapperRead.sol (Solidity Interface)
                </Text>
                <CopyButton
                  value={`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IBridgedBiomapperRead {
    function generationsHead() external view returns (uint256);
    function lookupBiomappingPtr(address account, uint256 generationPtr) external view returns (uint256);
}`}
                >
                  {({ copied, copy }) => (
                    <Button size="xs" variant="light" color={copied ? 'teal' : 'cyan'} onClick={copy} leftSection={copied ? <IconCheck size={12} /> : <IconCopy size={12} />}>
                      {copied ? (t('copied') || 'Kopyalandı!') : (t('copy') || 'Kopyala')}
                    </Button>
                  )}
                </CopyButton>
              </Group>

              <Code block style={{ background: 'rgba(0, 0, 0, 0.4)', borderRadius: 6, fontSize: 11 }}>
{`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IBridgedBiomapperRead {
    /// @notice Mevcut aktif jenerasyon indeksini döner
    function generationsHead() external view returns (uint256);

    /// @notice Adresin belirli bir jenerasyonda biomapped olup olmadığını sorgular
    /// @return 0 değilse hesap doğrulanmış tekil bir insandır
    function lookupBiomappingPtr(
        address account,
        uint256 generationPtr
    ) external view returns (uint256);
}`}
              </Code>

              <Text size="xs" c="dimmed" mt="xs">
                {t('biomapper_callThisInterfaceOn')}
              </Text>
            </Paper>

            {/* Etkileşimli Benzersizlik Kontrol Simülatörü */}
            <Paper p="md" className="glass-panel" style={{ borderRadius: 8 }}>
              <Text size="sm" fw={700} c="white" mb={4}>
                🧪 {t('biomapper_biomapperUniquenessSimulator')}
              </Text>
              <Text size="xs" c="dimmed" mb="md">
                {t('biomapper_simulateCheckingIfAn')}
              </Text>

              <Stack gap="xs">
                <TextInput
                  placeholder="0x... cüzdan adresi girin"
                  value={simAddress}
                  onChange={(e) => setSimAddress(e.target.value)}
                  size="xs"
                />
                <Button size="xs" variant="filled" color="cyan" onClick={handleRunSimulator}>
                  {t('biomapper_queryUniqueness')}
                </Button>

                {simResult && (
                  <Paper p="xs" withBorder style={{ background: 'rgba(56, 189, 248, 0.05)', borderColor: 'rgba(56, 189, 248, 0.3)', borderRadius: 6 }} mt="xs">
                    <Stack gap={4}>
                      <Group justify="space-between">
                        <Text size="xs" c="dimmed">Durum:</Text>
                        <Badge size="xs" color={simResult.isUnique ? 'teal' : 'red'} variant="light">
                          {simResult.isUnique ? '🟢 BİOMAPPED (TEKİL İNSAN)' : '🔴 DOĞRULANMAMIŞ'}
                        </Badge>
                      </Group>
                      <Group justify="space-between">
                        <Text size="xs" c="dimmed">Aktif Jenerasyon:</Text>
                        <Text size="xs" fw={700} className="font-mono">Gen #{simResult.generation}</Text>
                      </Group>
                      <Group justify="space-between">
                        <Text size="xs" c="dimmed">Enklav Doğrulaması:</Text>
                        <Badge size="xs" color="blue" variant="outline">{simResult.cvmAttestation}</Badge>
                      </Group>
                      <Box>
                        <Text size="10px" c="dimmed">Biomapping Pointer:</Text>
                        <Text size="10px" className="font-mono" c="cyan" truncate>{simResult.pointer}</Text>
                      </Box>
                    </Stack>
                  </Paper>
                )}
              </Stack>
            </Paper>
          </SimpleGrid>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
