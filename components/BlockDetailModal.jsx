'use client';
import { useState, useEffect } from 'react';
import {
  Modal,
  Stack,
  Group,
  Title,
  Text,
  Paper,
  SimpleGrid,
  Box,
  Table,
  Badge,
  Button,
  CopyButton,
  ActionIcon,
  Tooltip,
  Loader,
  Center,
} from '@mantine/core';
import { IconCube, IconCheck, IconCopy, IconEye, IconArrowRight, IconActivity } from '@tabler/icons-react';
import { formatHMND, formatFee, formatTimestamp, timeAgo, shortAddr, formatUSD, formatActionSummary } from './formatters';
import { useLanguage } from './LanguageContext';

export default function BlockDetailModal({
  opened,
  onClose,
  blockNumber,
  onOpenTx,
  onSelectAddress,
}) {
  const { lang, t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [blockData, setBlockData] = useState(null);

  useEffect(() => {
    if (!opened || !blockNumber) {
      setBlockData(null);
      return;
    }

    const cleanNum = parseInt(String(blockNumber).replace(/[^\d]/g, ''), 10);
    if (isNaN(cleanNum)) return;

    setLoading(true);
    fetch(`/api/block?number=${cleanNum}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.found) {
          setBlockData(data);
        } else {
          setBlockData({
            block_number: cleanNum,
            transactions: [],
            total_tx_count: 0,
            total_fees_hmnd: 0,
            timestamp: Math.floor(Date.now() / 1000),
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Block fetch error:', err);
        setBlockData({
          block_number: cleanNum,
          transactions: [],
          total_tx_count: 0,
          total_fees_hmnd: 0,
          timestamp: Math.floor(Date.now() / 1000),
        });
        setLoading(false);
      });
  }, [opened, blockNumber]);

  const loc = lang || undefined;
  const cleanNum = blockNumber ? parseInt(String(blockNumber).replace('#', ''), 10) : '';

  const activityCounts = (blockData?.transactions || []).reduce(
    (acc, tx) => {
      const isEvm = (tx.layer || '').toUpperCase() === 'EVM' || (!tx.layer && (tx.from_address?.startsWith('0x') && tx.from_address?.length === 42));
      if (isEvm) {
        if (tx.tokenTransfers && tx.tokenTransfers.length > 0) {
          const sender = (tx.from_address || tx.signer || '').toLowerCase();
          const sold = tx.tokenTransfers.find((tt) => tt.from_address?.toLowerCase() === sender);
          const bought = tx.tokenTransfers.find((tt) => tt.to_address?.toLowerCase() === sender);
          if (sold && bought) acc.swaps += 1;
          else acc.transfers += 1;
        } else if (Number(tx.value_hmnd || tx.amount || 0) > 0) {
          acc.transfers += 1;
        } else {
          acc.contracts += 1;
        }
      } else {
        const p = (tx.pallet || '').toLowerCase();
        if (p === 'bioauth') acc.bioauth += 1;
        else if (p === 'imonline') acc.heartbeats += 1;
        else if (p === 'balances') acc.transfers += 1;
        else acc.contracts += 1;
      }
      return acc;
    },
    { swaps: 0, transfers: 0, heartbeats: 0, bioauth: 0, contracts: 0 }
  );

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      title={
        <Group gap={8}>
          <IconCube size={22} color="#38bdf8" />
          <Title order={4}>
            {t('blockDetailsTitle', { number: cleanNum })}
          </Title>
          <CopyButton value={String(cleanNum)} timeout={1500}>
            {({ copied, copy }) => (
              <Tooltip label={copied ? (t('copied')) : (t('overview_copyBlock'))}>
                <ActionIcon size="xs" variant="subtle" color={copied ? 'teal' : 'gray'} onClick={copy}>
                  {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                </ActionIcon>
              </Tooltip>
            )}
          </CopyButton>
        </Group>
      }
      size="min(1240px, 96vw)"
      styles={{
        content: {
          maxWidth: '1240px',
          width: '96vw',
          border: '2px solid #111111',
          borderRadius: 0,
          background: '#fff1e5',
          boxShadow: '0 10px 35px rgba(0,0,0,0.15)',
          color: '#111111',
        },
        header: {
          background: '#f5e6d8',
          borderBottom: '2px solid #111111',
          padding: '14px 20px',
          color: '#111111',
        },
        body: {
          background: '#fff1e5',
          padding: '20px',
          color: '#111111',
        },
      }}
    >
      {loading ? (
        <Center py="xl">
          <Loader size="md" color="dark" />
        </Center>
      ) : blockData ? (
        <Stack gap="md">
          {/* 4-Column Summary Cards */}
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="sm">
            <Paper p="sm" bg="#f5e6d8" style={{ border: '1px solid #d9cbbe', borderTop: '2px solid #111111', borderRadius: 0 }}>
              <Text size="11px" c="#666059" tt="uppercase" fw={800} style={{ fontFamily: "var(--font-sans), 'Inter', sans-serif" }}>
                📅 {t('colTimestamp')}
              </Text>
              <Text size="sm" fw={800} c="#111111" className="font-mono mt-1" style={{ whiteSpace: 'nowrap' }}>
                {formatTimestamp(blockData.timestamp, lang)}
              </Text>
              <Text size="11px" c="#666059">{timeAgo(blockData.timestamp, lang)}</Text>
            </Paper>

            <Paper p="sm" bg="#f5e6d8" style={{ border: '1px solid #d9cbbe', borderTop: '2px solid #111111', borderRadius: 0 }}>
              <Text size="11px" c="#666059" tt="uppercase" fw={800} style={{ fontFamily: "var(--font-sans), 'Inter', sans-serif" }}>
                ⚡ {t('colTxCount')}
              </Text>
              <Text size="sm" fw={800} c="#111111" className="font-mono mt-1">
                {blockData.tx_count || blockData.transactions?.length || 0} {t('unlocks_txs_3')}
              </Text>
              <Group gap={4} mt={3}>
                <Badge size="xs" style={{ background: '#e2d3c5', color: '#4a453e', border: '1px solid #c9b9aa', borderRadius: 2 }}>
                  {blockData.evm_count || 0} EVM
                </Badge>
                <Badge size="xs" style={{ background: '#d1ded6', color: '#173f2a', border: '1px solid #b5ccbf', borderRadius: 2 }}>
                  {blockData.substrate_count || 0} Substrate
                </Badge>
              </Group>
            </Paper>

            <Paper p="sm" bg="#f5e6d8" style={{ border: '1px solid #d9cbbe', borderTop: '2px solid #111111', borderRadius: 0 }}>
              <Text size="11px" c="#666059" tt="uppercase" fw={800} style={{ fontFamily: "var(--font-sans), 'Inter', sans-serif" }}>
                🔥 {t('colBlockFee')}
              </Text>
              <Text size="sm" fw={800} c="#111111" className="font-mono mt-1" style={{ whiteSpace: 'nowrap' }}>
                {formatFee(blockData.total_fees_hmnd, true, lang, false)}
              </Text>
              {blockData.price_usd > 0 && Number(blockData.total_fees_hmnd || 0) > 0 && (
                <Text size="11px" c="#666059">
                  ≈ {formatUSD((Number(blockData.total_fees_hmnd) || 0) * blockData.price_usd, lang, 4)}
                </Text>
              )}
            </Paper>

            <Paper p="sm" bg="#f5e6d8" style={{ border: '1px solid #d9cbbe', borderTop: '2px solid #111111', borderRadius: 0 }}>
              <Text size="11px" c="#666059" tt="uppercase" fw={800} style={{ fontFamily: "var(--font-sans), 'Inter', sans-serif" }}>
                🎯 {t('block_activitySummary')}
              </Text>
              <Group gap={4} mt={4} wrap="wrap">
                {activityCounts.swaps > 0 && (
                  <Badge size="xs" style={{ background: '#f5e6d8', color: '#111', border: '1px solid #c9b9aa', borderRadius: 2 }}>
                    🔄 {t('block_activitySwaps', { count: activityCounts.swaps })}
                  </Badge>
                )}
                {activityCounts.transfers > 0 && (
                  <Badge size="xs" style={{ background: '#d1ded6', color: '#173f2a', border: '1px solid #b5ccbf', borderRadius: 2 }}>
                    💸 {t('block_activityTransfers', { count: activityCounts.transfers })}
                  </Badge>
                )}
                {activityCounts.heartbeats > 0 && (
                  <Badge size="xs" style={{ background: '#f5e6d8', color: '#990f3d', border: '1px solid #c9b9aa', borderRadius: 2 }}>
                    💓 {t('block_activityHeartbeats', { count: activityCounts.heartbeats })}
                  </Badge>
                )}
                {activityCounts.bioauth > 0 && (
                  <Badge size="xs" style={{ background: '#e0f0ef', color: '#0d7680', border: '1px solid #0d7680', borderRadius: 2 }}>
                    👤 {t('block_activityBioauth', { count: activityCounts.bioauth })}
                  </Badge>
                )}
                {activityCounts.contracts > 0 && (
                  <Badge size="xs" color="gray" variant="outline" style={{ borderRadius: 2 }}>
                    📜 {t('block_activityContractCalls', { count: activityCounts.contracts })}
                  </Badge>
                )}
                {activityCounts.swaps === 0 && activityCounts.transfers === 0 && activityCounts.heartbeats === 0 && activityCounts.bioauth === 0 && activityCounts.contracts === 0 && (
                  <Text size="xs" c="dimmed">-</Text>
                )}
              </Group>
            </Paper>
          </SimpleGrid>

          <div>
            <Group justify="space-between" mb="xs" align="center">
              <Group gap={6} align="center">
                <Text size="sm" fw={700} c="#111111">
                  {t('overview_allTransactionsInThis')}
                </Text>
                <Badge size="sm" color="cyan" variant="light" className="font-mono">
                  {blockData.transactions?.length || 0} {t('overview_records')}
                </Badge>
              </Group>
              <Text size="xs" c="dimmed">
                {t('overview_clickTransactionToView')}
              </Text>
            </Group>

            <Box style={{ overflowX: 'auto', maxHeight: 460 }}>
              <Table striped highlightOnHover verticalSpacing="sm" style={{ minWidth: 960 }}>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th style={{ width: 140, whiteSpace: 'nowrap' }}>{t('colTxHash')}</Table.Th>
                    <Table.Th style={{ width: 130, whiteSpace: 'nowrap' }}>{t('colLayerPallet')}</Table.Th>
                    <Table.Th style={{ minWidth: 260, whiteSpace: 'nowrap' }}>{t('overview_fromTo')}</Table.Th>
                    <Table.Th style={{ width: 120, whiteSpace: 'nowrap', textAlign: 'right' }}>{t('colAmount')}</Table.Th>
                    <Table.Th style={{ width: 120, whiteSpace: 'nowrap', textAlign: 'right' }}>{t('colFee')}</Table.Th>
                    <Table.Th style={{ minWidth: 260, whiteSpace: 'nowrap' }}>{t('overview_detailsSwaps')}</Table.Th>
                    <Table.Th style={{ width: 70, whiteSpace: 'nowrap', textAlign: 'center' }}>{t('colActions')}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {blockData.transactions && blockData.transactions.length > 0 ? (
                    blockData.transactions.map((tx, idx) => {
                      const fromAddr = tx.from_address || tx.signer || tx.sender;
                      const toAddr = tx.to_address || tx.target;
                      const isEvm = (tx.layer || '').toUpperCase() === 'EVM' || (!tx.layer && (fromAddr?.startsWith('0x') && fromAddr?.length === 42));
                      const layerLabel = isEvm
                        ? (tx.method ? `EVM: ${tx.method}` : 'EVM')
                        : (tx.pallet ? `${tx.pallet}:${tx.method || ''}` : 'SUBSTRATE');
                      const actionSummary = formatActionSummary(tx, t, lang);
                      return (
                        <Table.Tr key={tx.hash || idx}>
                          <Table.Td className="font-mono" style={{ whiteSpace: 'nowrap' }}>
                            <Group gap={4} wrap="nowrap">
                              <Text
                                size="xs"
                                style={{ cursor: 'pointer', textDecoration: 'underline', color: '#0d7680' }}
                                onClick={() => {
                                  onClose();
                                  onOpenTx?.(tx.hash);
                                }}
                                title={tx.hash}
                              >
                                {shortAddr(tx.hash, 8, 6)}
                              </Text>
                              <CopyButton value={tx.hash} timeout={1200}>
                                {({ copied, copy }) => (
                                  <ActionIcon size="xs" variant="subtle" color={copied ? 'teal' : 'gray'} onClick={copy}>
                                    {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                                  </ActionIcon>
                                )}
                              </CopyButton>
                            </Group>
                          </Table.Td>

                          <Table.Td style={{ whiteSpace: 'nowrap' }}>
                            <Badge size="xs" color={isEvm ? 'dark' : 'teal'} variant="outline" style={{ whiteSpace: 'nowrap', borderRadius: 2 }}>
                              {layerLabel}
                            </Badge>
                          </Table.Td>

                          <Table.Td className="font-mono" style={{ whiteSpace: 'nowrap' }}>
                            <Group gap={6} wrap="nowrap" align="center">
                              <Tooltip label={fromAddr} withArrow position="top">
                                <Stack gap={1} align="flex-start">
                                  {tx.from_label && (
                                    <Badge size="xs" color="gray" variant="outline" style={{ maxWidth: 130, borderRadius: 2 }} lineClamp={1}>
                                      {tx.from_label}
                                    </Badge>
                                  )}
                                  <Text
                                    size="xs"
                                    style={{ cursor: 'pointer', textDecoration: 'underline', color: '#0d7680' }}
                                    onClick={() => fromAddr && onSelectAddress?.(fromAddr)}
                                  >
                                    {shortAddr(fromAddr, 7, 5)}
                                  </Text>
                                </Stack>
                              </Tooltip>
                              <Text size="xs" c="dimmed">➔</Text>
                              <Tooltip label={toAddr || (t('overview_systemContract'))} withArrow position="top">
                                <Stack gap={1} align="flex-start">
                                  {tx.to_label && (
                                    <Badge size="xs" color="teal" variant="light" style={{ maxWidth: 170, borderRadius: 2 }} lineClamp={1}>
                                      {tx.to_label}
                                    </Badge>
                                  )}
                                  <Text
                                    size="xs"
                                    style={{ cursor: toAddr ? 'pointer' : 'default', textDecoration: toAddr ? 'underline' : 'none', color: toAddr ? '#0d7680' : '#666059' }}
                                    onClick={() => toAddr && onSelectAddress?.(toAddr)}
                                  >
                                    {toAddr ? shortAddr(toAddr, 7, 5) : (t('overview_contractSystem'))}
                                  </Text>
                                </Stack>
                              </Tooltip>
                            </Group>
                          </Table.Td>

                          <Table.Td className="font-mono" fw={700} style={{ whiteSpace: 'nowrap', textAlign: 'right', color: '#0d7680' }}>
                            {formatHMND(tx.value_hmnd || tx.amount || 0, { locale: lang, showScale: false })}
                          </Table.Td>

                          <Table.Td className="font-mono" c="dimmed" style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                            {formatFee(tx.fee_hmnd, true, lang, false)}
                          </Table.Td>

                          <Table.Td style={{ minWidth: 260, maxWidth: 360 }}>
                            <Text size="xs" c="#111111" fw={500} style={{ wordBreak: 'break-word', whiteSpace: 'normal', lineHeight: 1.4 }}>
                              {actionSummary || (tx.tokenTransfers && tx.tokenTransfers.length > 0 ? (
                                <Badge size="xs" color="indigo" variant="light">
                                  🔄 {tx.tokenTransfers.length} {t('overview_tokenTransfer')}
                                </Badge>
                              ) : tx.details ? tx.details : '-')}
                            </Text>
                          </Table.Td>

                          <Table.Td style={{ whiteSpace: 'nowrap', textAlign: 'center' }}>
                            <Tooltip label={t('overview_viewTransactionDetails')} withArrow position="top">
                              <ActionIcon
                                size="sm"
                                variant="outline"
                                color="dark"
                                style={{ borderRadius: 0, border: '1px solid #111' }}
                                onClick={() => {
                                  onClose();
                                  onOpenTx?.(tx.hash);
                                }}
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
                      <Table.Td colSpan={7} style={{ textAlign: 'center', padding: '30px' }}>
                        <Text size="sm" c="dimmed">
                          {t('block_noTransactionsRecordedIn')}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Box>
          </div>
        </Stack>
      ) : null}
    </Modal>
  );
}
