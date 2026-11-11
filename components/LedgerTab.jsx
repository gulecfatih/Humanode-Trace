'use client';
import { useState, useEffect } from 'react';
import {
  Paper,
  Stack,
  Group,
  Title,
  Text,
  TextInput,
  Button,
  Badge,
  SimpleGrid,
  Tabs,
  Table,
  Box,
  CopyButton,
  ActionIcon,
  Tooltip,
  Pagination,
  Progress,
  Switch,
} from '@mantine/core';
import {
  IconSearch,
  IconArrowUpRight,
  IconArrowDownLeft,
  IconCoins,
  IconGitFork,
  IconCopy,
  IconCheck,
  IconDownload,
  IconExternalLink,
  IconCube,
  IconActivity,
} from '@tabler/icons-react';
import {
  formatHMND,
  formatFee,
  formatUSD,
  formatHMNDWithUSD,
  formatCompact,
  formatTimestamp,
  formatNumber,
  timeAgo,
  shortAddr,
} from './formatters';
import { useLanguage } from './LanguageContext';
import { useModuleFields } from './ModuleLayout';
import KpiStatCard from './ui/KpiStatCard';
import AddressBadge from './ui/AddressBadge';
import AmountDisplay from './ui/AmountDisplay';
import DirectionBadge from './ui/DirectionBadge';

export default function LedgerTab({
  initialAddress,
  onSelectAddress,
  onOpenTrail,
  onOpenBlock,
  onOpenTx,
}) {
  const { lang } = useLanguage();
  const loc = lang || undefined;
  const { t, fields } = useModuleFields();
  const [address, setAddress] = useState(initialAddress || '');
  const [searchInput, setSearchInput] = useState(initialAddress || '');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeSubtab, setActiveSubtab] = useState('statement');
  const [ledgerPage, setLedgerPage] = useState(1);
  const [hideBioauth, setHideBioauth] = useState(true);
  const [showZeroBalances, setShowZeroBalances] = useState(false);

  const fetchLedger = (targetAddr, pageNum = 1) => {
    if (!targetAddr) return;
    setLoading(true);
    fetch(`/api/wallet-ledger?address=${encodeURIComponent(targetAddr)}&ledgerPage=${pageNum}&ledgerLimit=25&hideBioauth=${hideBioauth ? 'true' : 'false'}`)
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
        setAddress(targetAddr);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (initialAddress) {
      setSearchInput(initialAddress);
      fetchLedger(initialAddress, 1);
    }
  }, [initialAddress]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setLedgerPage(1);
      fetchLedger(searchInput.trim(), 1);
    }
  };

  const sum = data?.summary || {};
  const inVal = sum.totalInHmnd || 0;
  const outVal = sum.totalOutHmnd || 0;
  const totalFlow = inVal + outVal;
  const inPercent = totalFlow > 0 ? Math.round((inVal / totalFlow) * 100) : 50;
  const outPercent = 100 - inPercent;
  const isEvm = data?.addressType === 'EVM' || data?.address?.startsWith('0x') || data?.address?.startsWith('0X');

  return (
    <Stack gap="md">
      {/* Search Card */}
      <Paper p="md">
        <form onSubmit={handleSearch}>
          <Group justify="space-between" align="center" gap="sm">
            <TextInput
              placeholder={t('ledgerSearchPlaceholder')}
              leftSection={<IconSearch size={16} />}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ flex: 1 }}
            />
            <Button type="submit" color="green">
              {t('ledgerInspectBtn')}
            </Button>
          </Group>
        </form>

        <Group justify="flex-end" align="center" mt="xs">
          <Switch
            label={t('ledgerHideZero')}
            size="xs"
            checked={hideBioauth}
            onChange={(e) => {
              const val = e.currentTarget.checked;
              setHideBioauth(val);
              if (address) {
                setLoading(true);
                fetch(`/api/wallet-ledger?address=${encodeURIComponent(address)}&ledgerPage=1&ledgerLimit=25&hideBioauth=${val ? 'true' : 'false'}`)
                  .then((res) => res.json())
                  .then((resData) => {
                    setData(resData);
                    setLoading(false);
                  })
                  .catch(() => setLoading(false));
              }
            }}
          />
        </Group>
      </Paper>

      {data?.found && (
        <>
          {/* Wallet Header Ribbon */}
          <Paper p="md">
            <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
              <div>
                <Group gap="xs" align="center">
                  <Badge color={isEvm ? 'cyan' : 'teal'} variant="light">
                    {isEvm ? 'EVM (0x...)' : 'Substrate (hm...)'}
                  </Badge>
                  <Text fw={700} className="font-mono" size="md">
                    {data.address}
                  </Text>
                  <CopyButton value={data.address}>
                    {({ copied, copy }) => (
                      <ActionIcon size="sm" color={copied ? 'teal' : 'gray'} variant="subtle" onClick={copy}>
                        {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                      </ActionIcon>
                    )}
                  </CopyButton>
                </Group>

                {(data?.validatorStats?.blocksAuthored > 0 || data?.isValidator) && (
                  <Group gap={6} mt="xs">
                    <Badge color="cyan" variant="outline" size="sm">
                      🧬 {t('ledger_activeValidator')} • {data.validatorStats?.blocksAuthored || 0} {t('ledger_blocksAuthored')} • {t('valColLastActive')}: {timeAgo(data.validatorStats?.lastActiveTs, lang)}
                    </Badge>
                  </Group>
                )}

                {data?.persona?.badges && (
                  <Group gap={6} mt="xs">
                    {data.persona.badges.map((b) => (
                      <Badge key={b.id} size="sm" variant="light" style={{ color: b.color, borderColor: b.color }}>
                        {b.icon} {b.label}
                      </Badge>
                    ))}
                  </Group>
                )}
              </div>

              <Group gap="xs">
                <Button
                  size="xs"
                  variant="light"
                  color="violet"
                  leftSection={<IconGitFork size={14} />}
                  onClick={() => onOpenTrail(data.address)}
                >
                  {t('trailTraceBtn')}
                </Button>
                <Button
                  size="xs"
                  variant="default"
                  component="a"
                  href={`/api/wallet-ledger/export?address=${encodeURIComponent(data.address)}`}
                  target="_blank"
                  leftSection={<IconDownload size={14} />}
                >
                  {t('ledgerDownloadCsv')}
                </Button>
              </Group>
            </Group>
          </Paper>

          {/* Çift Katman Eşleşme Bildirimi */}
          {data?.crossLayer?.hasLink && (
            <Paper p="md" style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.35)' }}>
              <Group justify="space-between" align="center">
                <div>
                  <Group gap="xs">
                    <Text fw={700} c="violet">🔗 {t('ledger_verifiedDualLayerIdentity')}</Text>
                    <Badge color="violet" size="sm">
                      {data.crossLayer.linkedAddresses?.[0]?.swapCount} {t('peek_bridgeSwaps')}
                    </Badge>
                  </Group>
                  <Text size="xs" c="dimmed" mt={4}>
                    {t('ledger_thisAddressIsLinked')}
                    <strong className="font-mono" style={{ color: '#c4b5fd' }}>
                      {data.crossLayer.linkedAddresses?.[0]?.linkedAddress}
                    </strong>
                  </Text>
                </div>
                <Button
                  size="xs"
                  color="violet"
                  onClick={() => {
                    const linked = data.crossLayer.linkedAddresses?.[0]?.linkedAddress;
                    setSearchInput(linked);
                    fetchLedger(linked, 1);
                  }}
                >
                  {t('ledger_openLinkedLedger')}
                </Button>
              </Group>
            </Paper>
          )}

          {/* Bilanço KPI Kartları */}
          <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing="sm">
            <KpiStatCard
              title={`${t('ledgerNetBalance')} (HMND)`}
              value={formatHMND(sum.netBalanceHmnd, { suffix: false, locale: lang })}
              unit="HMND"
              color="teal"
              icon={IconCoins}
              usdValue={formatUSD(sum.netBalanceCurrentUsd, lang)}
              subtext={`${t('ledger_inflow')} %${inPercent} • ${t('ledger_outflow')} %${outPercent}`}
            />

            <KpiStatCard
              title={t('ledgerInflow')}
              value={formatHMND(sum.totalInHmnd, { suffix: false, locale: lang })}
              unit="HMND"
              sign="+"
              color="cyan"
              icon={IconArrowDownLeft}
              subtext={`${sum.totalInCount || 0} ${t('ledger_incomingTransfers')}`}
            />

            <KpiStatCard
              title={t('ledgerOutflow')}
              value={formatHMND(sum.totalOutHmnd, { suffix: false, locale: lang })}
              unit="HMND"
              sign="-"
              color="orange"
              icon={IconArrowUpRight}
              subtext={`${sum.totalOutCount || 0} ${t('ledger_outgoingTransfers')}`}
            />

            <KpiStatCard
              title={t('ledgerBurnedFee')}
              value={formatFee(sum.totalFeesHmnd, false, lang)}
              unit="HMND"
              color="yellow"
              icon={IconCoins}
              subtext={t('ledger_burnedNetworkGas')}
            />
          </SimpleGrid>

          {/* Alt Sekmeler */}
          <Paper p="md">
            <Tabs value={activeSubtab} onChange={setActiveSubtab} color="cyan">
              <Tabs.List mb="md">
                <Tabs.Tab value="statement" leftSection={<IconCoins size={14} />}>
                  {t('ledgerTabStatement')} ({data.ledger?.pagination?.totalCount || 0})
                </Tabs.Tab>
                <Tabs.Tab value="sources" leftSection={<IconArrowDownLeft size={14} />}>
                  {t('ledger_inflowSources')} ({data.sources?.items?.length || 0})
                </Tabs.Tab>
                <Tabs.Tab value="destinations" leftSection={<IconArrowUpRight size={14} />}>
                  {t('ledger_outflowDestinations')} ({data.destinations?.items?.length || 0})
                </Tabs.Tab>
                <Tabs.Tab value="tokens" leftSection={<IconCoins size={14} />}>
                  {t('ledgerTabTokens')} ({data.tokens?.length || 0})
                </Tabs.Tab>
              </Tabs.List>

              {/* Ekstre Sekmesi */}
              <Tabs.Panel value="statement">
                <Box style={{ overflowX: 'auto' }}>
                  <Table striped highlightOnHover verticalSpacing="xs">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>{t('colBlock')}</Table.Th>
                        <Table.Th>{t('moneytrail_direction')}</Table.Th>
                        <Table.Th>{t('colLayerPallet')}</Table.Th>
                        <Table.Th>{t('ledger_counterparty')}</Table.Th>
                        <Table.Th>{t('colAmount')}</Table.Th>
                        <Table.Th>{t('ledger_historicalValueUsd')}</Table.Th>
                        <Table.Th>{t('colFee')}</Table.Th>
                        <Table.Th>{t('colActions')}</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {data.ledger?.items?.map((item, idx) => (
                        <Table.Tr key={item.hash || idx}>
                          <Table.Td className="font-mono">
                            <Text
                              size="xs"
                              fw={700}
                              c="cyan"
                              style={{ cursor: 'pointer', textDecoration: 'underline' }}
                              onClick={() => onOpenBlock?.(item.block_number)}
                            >
                              #{item.block_number}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <DirectionBadge type={item.direction?.toLowerCase() === 'in' ? 'in' : 'out'} size="xs" />
                          </Table.Td>
                          <Table.Td>
                            <Badge size="xs" color="gray" variant="light">{item.method || item.layer}</Badge>
                          </Table.Td>
                          <Table.Td>
                            {item.counterparty ? (
                              <AddressBadge
                                address={item.counterparty}
                                showNetwork={false}
                                onSelectAddress={(addr) => {
                                  setSearchInput(addr);
                                  fetchLedger(addr, 1);
                                }}
                                head={6}
                                tail={4}
                              />
                            ) : (
                              <Text size="xs" c="dimmed">-</Text>
                            )}
                          </Table.Td>
                          <Table.Td>
                            <AmountDisplay
                              value={formatHMND(item.amount, { suffix: false, locale: lang })}
                              unit="HMND"
                              sign={item.direction === 'IN' ? '+' : '-'}
                              color={item.direction === 'IN' ? '#10b981' : '#f85149'}
                              size="xs"
                            />
                          </Table.Td>
                          <Table.Td className="font-mono" c="dimmed">
                            {formatUSD(item.value_usd, lang)}
                          </Table.Td>
                          <Table.Td>
                            <AmountDisplay
                              value={formatFee(item.fee, false, lang)}
                              unit="HMND"
                              color="#f59e0b"
                              size="xs"
                            />
                          </Table.Td>
                          <Table.Td>
                            <Group gap={4} wrap="nowrap">
                              <Button
                                size="compact-xs"
                                variant="light"
                                color="blue"
                                leftSection={<IconCube size={12} />}
                                onClick={() => onOpenBlock?.(item.block_number)}
                              >
                                {t('overview_blocks_2')}
                              </Button>
                              {item.hash && (
                                <Button
                                  size="compact-xs"
                                  variant="light"
                                  color="orange"
                                  leftSection={<IconActivity size={12} />}
                                  onClick={() => onOpenTx?.(item.hash)}
                                >
                                  {t('unlocks_txs_3')}
                                </Button>
                              )}
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Box>
                <Group justify="center" mt="md">
                  <Pagination
                    value={ledgerPage}
                    onChange={(p) => {
                      setLedgerPage(p);
                      fetchLedger(address, p);
                    }}
                    total={data.ledger?.pagination?.totalPages || 1}
                    size="sm"
                    color="cyan"
                  />
                </Group>
              </Tabs.Panel>

              {/* Kaynaklar Sekmesi */}
              <Tabs.Panel value="sources">
                <Table striped highlightOnHover verticalSpacing="xs">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>{t('ledger_senderWallet')}</Table.Th>
                      <Table.Th>{t('dirColTxCount')}</Table.Th>
                      <Table.Th>{t('ledger_totalIncomingHmnd')}</Table.Th>
                      <Table.Th>{t('inspect')}</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {data.sources?.items?.map((s, idx) => (
                      <Table.Tr key={s.counterparty || idx}>
                        <Table.Td className="font-mono" c="cyan">
                          {s.counterparty}
                        </Table.Td>
                        <Table.Td className="font-mono">{s.tx_count}</Table.Td>
                        <Table.Td className="font-mono" c="green" fw={700}>
                          {formatHMND(s.total_amount, { sign: true, locale: lang })}
                        </Table.Td>
                        <Table.Td>
                          <Button size="xs" variant="light" color="cyan" onClick={() => onSelectAddress(s.counterparty)}>
                            {t('preview')}
                          </Button>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Tabs.Panel>

              {/* Hedefler Sekmesi */}
              <Tabs.Panel value="destinations">
                <Table striped highlightOnHover verticalSpacing="xs">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>{t('ledger_recipientWallet')}</Table.Th>
                      <Table.Th>{t('dirColTxCount')}</Table.Th>
                      <Table.Th>{t('ledger_totalOutgoingHmnd')}</Table.Th>
                      <Table.Th>{t('inspect')}</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {data.destinations?.items?.map((d, idx) => (
                      <Table.Tr key={d.counterparty || idx}>
                        <Table.Td className="font-mono" c="cyan">
                          {d.counterparty}
                        </Table.Td>
                        <Table.Td className="font-mono">{d.tx_count}</Table.Td>
                        <Table.Td className="font-mono" c="red" fw={700}>
                          {formatHMND(d.total_amount, { sign: true, locale: lang })}
                        </Table.Td>
                        <Table.Td>
                          <Button size="xs" variant="light" color="cyan" onClick={() => onSelectAddress(d.counterparty)}>
                            {t('preview')}
                          </Button>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Tabs.Panel>

              {/* Tokenlar Sekmesi */}
              <Tabs.Panel value="tokens">
                {(() => {
                  const activeTokens = (data.tokens || []).filter(tk => (tk.balance ?? tk.netBalance ?? 0) > 0.000001);
                  const displayedTokens = showZeroBalances ? (data.tokens || []) : activeTokens;
                  return (
                    <>
                      {/* Cüzdan ve Portföy Bilgi Şeridi */}
                      <Paper
                        p="sm"
                        mb="md"
                        style={{
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.07)',
                          borderRadius: 8,
                        }}
                      >
                        <Group justify="space-between" align="center" wrap="wrap" gap="md">
                          <Group gap="md" align="center" wrap="wrap">
                            <div>
                              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                                {t('ledger_walletInfoPortfolioOwner')}
                              </Text>
                              <Group gap="xs" mt={3} align="center">
                                <AddressBadge address={data.address} network={isEvm ? 'EVM' : 'SUBSTRATE'} showNetwork={true} />
                              </Group>
                            </div>

                            {data?.crossLayer?.hasLink && data.crossLayer.linkedAddresses?.[0] && (
                              <Box style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.1)', paddingLeft: 12 }}>
                                <Text size="xs" c="violet" tt="uppercase" fw={700}>
                                  🔗 {t('ledger_linkedDualIdentity')}
                                </Text>
                                <Group gap="xs" mt={3} align="center">
                                  <AddressBadge
                                    address={data.crossLayer.linkedAddresses[0].linkedAddress}
                                    network={isEvm ? 'SUBSTRATE' : 'EVM'}
                                    showNetwork={true}
                                  />
                                </Group>
                              </Box>
                            )}
                          </Group>

                          <Group gap="lg" align="center" wrap="wrap">
                            <Box style={{ textAlign: 'right' }}>
                              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                                {t('ledger_totalPortfolioUsd')}
                              </Text>
                              <Text size="lg" fw={800} c="teal" className="font-mono">
                                {formatUSD(data.summary?.totalPortfolioUsd ?? (data.summary?.netBalanceCurrentUsd || 0), lang)}
                              </Text>
                            </Box>
                            <Box style={{ textAlign: 'right' }}>
                              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                                {t('ledger_totalAssetTypes')}
                              </Text>
                              <Badge size="lg" color="cyan" variant="light">
                                {activeTokens.length} {t('tokens_assets')}
                              </Badge>
                            </Box>
                            <Switch
                              label={t('ledgerShowZeroBalances')}
                              size="xs"
                              checked={showZeroBalances}
                              onChange={(e) => setShowZeroBalances(e.currentTarget.checked)}
                            />
                          </Group>
                        </Group>
                      </Paper>

                      <Box style={{ overflowX: 'auto' }}>
                        <Table striped highlightOnHover verticalSpacing="sm">
                          <Table.Thead>
                            <Table.Tr>
                              <Table.Th>{t('ledger_assetSymbol')}</Table.Th>
                              <Table.Th>{t('ledger_tokenCoinName')}</Table.Th>
                              <Table.Th>{t('ledger_assetType')}</Table.Th>
                              <Table.Th>{t('ledger_walletBalanceAmount')}</Table.Th>
                              <Table.Th>{t('ledger_estimatedValue')}</Table.Th>
                              <Table.Th>{t('ledger_totalInflowOutflow')}</Table.Th>
                              <Table.Th>{t('ledger_contractLayerInfo')}</Table.Th>
                              <Table.Th>{t('ledger_transferCount')}</Table.Th>
                            </Table.Tr>
                          </Table.Thead>
                          <Table.Tbody>
                            {displayedTokens && displayedTokens.length > 0 ? (
                              displayedTokens.map((tk, idx) => {
                                const sym = tk.symbol || 'TOKEN';
                                const isNative = tk.isNative || sym === 'HMND';
                                const balance = tk.netBalance ?? tk.balance ?? 0;
                                const valUsd = tk.valueUsd ?? tk.value_usd ?? 0;
                                const contractAddr = tk.address && tk.address !== 'NATIVE' ? tk.address : tk.token_address;

                                return (
                                  <Table.Tr key={contractAddr || sym || idx}>
                                    <Table.Td>
                                      <Group gap={6} wrap="nowrap">
                                        <Badge
                                          size="sm"
                                          variant="light"
                                          radius="sm"
                                          style={{
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            fontWeight: 800,
                                            padding: '0 8px',
                                          }}
                                          color={
                                            isNative
                                              ? 'teal'
                                              : sym === 'USDC' || sym === 'USDT'
                                              ? 'blue'
                                              : sym.toUpperCase().includes('HMND')
                                              ? 'cyan'
                                              : 'violet'
                                          }
                                        >
                                          {sym}
                                        </Badge>
                                      </Group>
                                    </Table.Td>

                                    <Table.Td>
                                      <div>
                                        <Text size="sm" fw={600} style={{ color: '#f1f5f9', whiteSpace: 'nowrap' }}>
                                          {tk.name || sym}
                                        </Text>
                                        <Text size="xs" c="dimmed">
                                          {isNative
                                            ? (t('ledger_humanodeL1NativeCrypto'))
                                            : (t('erc20Decimals', { decimals: tk.decimals || 18 }))}
                                        </Text>
                                      </div>
                                    </Table.Td>

                                    <Table.Td>
                                      <Badge
                                        size="sm"
                                        variant="light"
                                        color={isNative ? 'teal' : tk.isLinked ? 'violet' : 'cyan'}
                                      >
                                        {isNative
                                          ? (t('ledger_nativeCoinL1'))
                                          : (t('ledger_erc20Token'))}
                                      </Badge>
                                    </Table.Td>

                                    <Table.Td>
                                      <AmountDisplay
                                        value={formatNumber(balance, {
                                          minDecimals: Number(balance) % 1 === 0 ? 0 : 2,
                                          maxDecimals: 4,
                                        })}
                                        unit={sym}
                                        color={Number(balance) > 0 ? (isNative ? 'teal' : 'white') : 'dimmed'}
                                        fw={700}
                                        size="sm"
                                      />
                                    </Table.Td>

                                    <Table.Td>
                                      <div>
                                        <Text
                                          size="sm"
                                          fw={700}
                                          className="font-mono"
                                          c={Number(valUsd) > 0 ? 'teal' : 'dimmed'}
                                        >
                                          {formatUSD(valUsd, lang)}
                                        </Text>
                                        {Number(tk.priceUsd || 0) > 0 && (
                                          <Text size="xs" c="dimmed">
                                            @ ${formatNumber(tk.priceUsd, { minDecimals: 2, maxDecimals: 6 })}
                                          </Text>
                                        )}
                                      </div>
                                    </Table.Td>

                                    <Table.Td>
                                      <Group gap={6} wrap="nowrap">
                                        <Tooltip label={t('ledger_totalInflow')}>
                                          <Text size="xs" c="cyan" className="font-mono">
                                            +{formatCompact(tk.totalIn || 0, lang)}
                                          </Text>
                                        </Tooltip>
                                        <Text size="xs" c="dimmed">/</Text>
                                        <Tooltip label={t('ledger_totalOutflow')}>
                                          <Text size="xs" c="orange" className="font-mono">
                                            -{formatCompact(tk.totalOut || 0, lang)}
                                          </Text>
                                        </Tooltip>
                                      </Group>
                                    </Table.Td>

                                    <Table.Td>
                                      {isNative ? (
                                        <Group gap={6} wrap="nowrap">
                                          <Badge size="xs" variant="outline" color="teal">
                                            {t('ledger_nativeL1Layer')}
                                          </Badge>
                                          <AddressBadge
                                            address={tk.walletAddress || data.address}
                                            network={isEvm ? 'EVM' : 'SUBSTRATE'}
                                            showNetwork={false}
                                          />
                                        </Group>
                                      ) : contractAddr ? (
                                        <Group gap={6} wrap="nowrap">
                                          <AddressBadge
                                            address={contractAddr}
                                            network="EVM"
                                            showNetwork={false}
                                          />
                                          {tk.isLinked && (
                                            <Badge size="xs" color="violet" variant="light">
                                              {t('ledger_bridgeLinked')}
                                            </Badge>
                                          )}
                                        </Group>
                                      ) : (
                                        <Text size="xs" c="dimmed">-</Text>
                                      )}
                                    </Table.Td>

                                    <Table.Td className="font-mono">
                                      <Badge size="sm" variant="default">
                                        {formatNumber(tk.txCount ?? tk.transfer_count ?? 0, { maxDecimals: 0 })} {t('ledger_tx_2')}
                                      </Badge>
                                    </Table.Td>
                                  </Table.Tr>
                                );
                              })
                            ) : (
                              <Table.Tr>
                                <Table.Td colSpan={8} style={{ textAlign: 'center', color: '#94a3b8', padding: '24px' }}>
                                  {t('ledger_noTokenOrCrypto')}
                                </Table.Td>
                              </Table.Tr>
                            )}
                          </Table.Tbody>
                        </Table>
                      </Box>
                    </>
                  );
                })()}
              </Tabs.Panel>
            </Tabs>
          </Paper>
        </>
      )}
    </Stack>
  );
}
