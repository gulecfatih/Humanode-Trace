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
import { formatHMND, formatFee, formatTimestamp, timeAgo, shortAddr, formatUSD } from './formatters';
import { useLanguage } from './LanguageContext';
import { useModuleFields } from './ModuleLayout';

export default function BlockDetailModal({
  opened,
  onClose,
  blockNumber,
  onOpenTx,
  onSelectAddress,
}) {
  const { lang } = useLanguage();
  const { t, fields } = useModuleFields();
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

  return (
    <Modal
      opened={opened}
      onClose={onClose}
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
      size="xl"
      styles={{
        content: {
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 12,
        },
      }}
    >
      {loading ? (
        <Center py="xl">
          <Loader size="md" color="cyan" />
        </Center>
      ) : blockData ? (
        <Stack gap="md">
          {/* 3-Column Summary Cards */}
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
            <Paper p="sm" bg="rgba(0,0,0,0.3)" style={{ borderLeft: '3px solid #38bdf8', borderRadius: 8 }}>
              <Text size="11px" c="dimmed" tt="uppercase" fw={700}>
                📅 {t('colTimestamp')}
              </Text>
              <Text size="sm" fw={700} className="font-mono mt-1" style={{ whiteSpace: 'nowrap' }}>
                {formatTimestamp(blockData.timestamp, lang)}
              </Text>
              <Text size="11px" c="dimmed">{timeAgo(blockData.timestamp, lang)}</Text>
            </Paper>

            <Paper p="sm" bg="rgba(0,0,0,0.3)" style={{ borderLeft: '3px solid #10b981', borderRadius: 8 }}>
              <Text size="11px" c="dimmed" tt="uppercase" fw={700}>
                ⚡ {t('colTxCount')}
              </Text>
              <Text size="sm" fw={700} c="cyan" className="font-mono mt-1">
                {blockData.tx_count || blockData.transactions?.length || 0} {t('unlocks_txs_3')}
              </Text>
              <Group gap={4} mt={3}>
                <Badge size="xs" color="cyan" variant="light">
                  {blockData.evm_count || 0} EVM
                </Badge>
                <Badge size="xs" color="green" variant="light">
                  {blockData.substrate_count || 0} Substrate
                </Badge>
              </Group>
            </Paper>

            <Paper p="sm" bg="rgba(0,0,0,0.3)" style={{ borderLeft: '3px solid #f59e0b', borderRadius: 8 }}>
              <Text size="11px" c="dimmed" tt="uppercase" fw={700}>
                🔥 {t('colBlockFee')}
              </Text>
              <Text size="sm" fw={800} c="yellow" className="font-mono mt-1" style={{ whiteSpace: 'nowrap' }}>
                {formatFee(blockData.total_fees_hmnd, true, lang, false)}
              </Text>
              {blockData.price_usd > 0 && Number(blockData.total_fees_hmnd || 0) > 0 && (
                <Text size="11px" c="dimmed">
                  ≈ ${((Number(blockData.total_fees_hmnd) || 0) * blockData.price_usd).toFixed(4)} USD
                </Text>
              )}
            </Paper>
          </SimpleGrid>

          <div>
            <Group justify="space-between" mb="xs" align="center">
              <Group gap={6} align="center">
                <Text size="sm" fw={700} c="white">
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

            <Box style={{ overflowX: 'auto', maxHeight: 420 }}>
              <Table striped highlightOnHover verticalSpacing="xs">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th style={{ width: 140, whiteSpace: 'nowrap' }}>{t('colTxHash')}</Table.Th>
                    <Table.Th style={{ width: 130, whiteSpace: 'nowrap' }}>{t('colLayerPallet')}</Table.Th>
                    <Table.Th style={{ minWidth: 220, whiteSpace: 'nowrap' }}>{t('overview_fromTo')}</Table.Th>
                    <Table.Th style={{ width: 120, whiteSpace: 'nowrap', textAlign: 'right' }}>{t('colAmount')}</Table.Th>
                    <Table.Th style={{ width: 130, whiteSpace: 'nowrap', textAlign: 'right' }}>{t('colFee')}</Table.Th>
                    <Table.Th style={{ width: 140, whiteSpace: 'nowrap' }}>{t('overview_detailsSwaps')}</Table.Th>
                    <Table.Th style={{ width: 70, whiteSpace: 'nowrap', textAlign: 'center' }}>{t('colActions')}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {blockData.transactions && blockData.transactions.length > 0 ? (
                    blockData.transactions.map((tx, idx) => {
                      const fromAddr = tx.from_address || tx.signer || tx.sender;
                      const toAddr = tx.to_address || tx.target;
                      const isEvm = tx.layer === 'EVM' || tx.hash?.startsWith('0x');
                      return (
                        <Table.Tr key={tx.hash || idx}>
                          <Table.Td className="font-mono" style={{ whiteSpace: 'nowrap' }}>
                            <Group gap={4} wrap="nowrap">
                              <Text
                                size="xs"
                                c="cyan"
                                style={{ cursor: 'pointer', textDecoration: 'underline' }}
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
                            <Badge size="xs" color={isEvm ? 'cyan' : 'green'} variant="light" style={{ whiteSpace: 'nowrap' }}>
                              {isEvm ? (tx.method ? `EVM: ${tx.method}` : 'EVM') : (tx.pallet ? `${tx.pallet}:${tx.method}` : 'Substrate')}
                            </Badge>
                          </Table.Td>

                          <Table.Td className="font-mono" style={{ whiteSpace: 'nowrap' }}>
                            <Group gap={6} wrap="nowrap" align="center">
                              <Tooltip label={fromAddr} withArrow position="top">
                                <Text
                                  size="xs"
                                  style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                  c="cyan"
                                  onClick={() => fromAddr && onSelectAddress?.(fromAddr)}
                                >
                                  {shortAddr(fromAddr, 6, 4)}
                                </Text>
                              </Tooltip>
                              <Text size="xs" c="dimmed">➔</Text>
                              <Tooltip label={toAddr || (t('overview_systemContract'))} withArrow position="top">
                                <Text
                                  size="xs"
                                  style={{ cursor: 'pointer', textDecoration: toAddr ? 'underline' : 'none' }}
                                  c={toAddr ? 'teal' : 'dimmed'}
                                  onClick={() => toAddr && onSelectAddress?.(toAddr)}
                                >
                                  {toAddr ? shortAddr(toAddr, 6, 4) : (t('overview_contractSystem'))}
                                </Text>
                              </Tooltip>
                            </Group>
                          </Table.Td>

                          <Table.Td className="font-mono" fw={700} c="green" style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                            {formatHMND(tx.value_hmnd || tx.amount || 0, { locale: lang, showScale: false })}
                          </Table.Td>

                          <Table.Td className="font-mono" c="dimmed" style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                            {formatFee(tx.fee_hmnd, true, lang, false)}
                          </Table.Td>

                          <Table.Td style={{ whiteSpace: 'nowrap' }}>
                            {tx.tokenTransfers && tx.tokenTransfers.length > 0 ? (
                              <Badge size="xs" color="indigo" variant="light">
                                🔄 {tx.tokenTransfers.length} {t('overview_tokenTransfer')}
                              </Badge>
                            ) : tx.details ? (
                              <Text size="xs" c="dimmed" lineClamp={1}>
                                {tx.details}
                              </Text>
                            ) : (
                              <Text size="xs" c="dimmed">-</Text>
                            )}
                          </Table.Td>

                          <Table.Td style={{ whiteSpace: 'nowrap', textAlign: 'center' }}>
                            <Tooltip label={t('overview_viewTransactionDetails')} withArrow position="top">
                              <ActionIcon
                                size="sm"
                                variant="light"
                                color="cyan"
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
