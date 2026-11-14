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
  Divider,
  Loader,
  Center,
} from '@mantine/core';
import {
  IconActivity,
  IconCheck,
  IconCopy,
  IconCube,
  IconArrowRight,
  IconBook,
  IconCoins,
} from '@tabler/icons-react';
import { formatHMND, formatFee, formatTimestamp, timeAgo, shortAddr, formatUSD, formatNumber, formatExtrinsicDetails, formatActionSummary } from './formatters';
import { useLanguage } from './LanguageContext';

export default function TransactionDetailModal({
  opened,
  onClose,
  txHash,
  onOpenBlock,
  onSelectAddress,
  onOpenLedger,
}) {
  const { lang, t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [txData, setTxData] = useState(null);

  useEffect(() => {
    if (!opened || !txHash) {
      setTxData(null);
      return;
    }

    setLoading(true);
    fetch(`/api/transactions?hash=${encodeURIComponent(txHash)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.found) {
          const sender = data.tx?.from_address || data.tx?.signer || '';
          const isEvm = (data.layer || data.tx?.layer || '').toUpperCase() === 'EVM' || (!data.layer && sender.startsWith('0x') && sender.length === 42);
          const resolvedLayer = isEvm ? 'EVM' : 'SUBSTRATE';
          const txObj = data.tx
            ? { ...data.tx, layer: resolvedLayer }
            : { ...data, layer: resolvedLayer };
          if (data.tokenTransfers) txObj.tokenTransfers = data.tokenTransfers;
          setTxData(txObj);
        } else {
          setTxData({
            hash: txHash,
            status: 0,
            value_hmnd: 0,
            fee_hmnd: 0,
            timestamp: Math.floor(Date.now() / 1000),
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Tx fetch error:', err);
        setTxData({
          hash: txHash,
          status: 0,
          value_hmnd: 0,
          fee_hmnd: 0,
          timestamp: Math.floor(Date.now() / 1000),
        });
        setLoading(false);
      });
  }, [opened, txHash]);

  const loc = lang || undefined;

  const isEvm = (txData?.layer || '').toUpperCase() === 'EVM' || (!txData?.layer && (txData?.from_address?.startsWith('0x') && txData?.from_address?.length === 42));
  const senderAddr = (txData?.from_address || txData?.signer || '').toLowerCase();
  const soldTransfer = txData?.tokenTransfers?.find((tt) => tt.from_address?.toLowerCase() === senderAddr);
  const boughtTransfer = txData?.tokenTransfers?.find((tt) => tt.to_address?.toLowerCase() === senderAddr);
  const isSwap = Boolean(isEvm && soldTransfer && boughtTransfer);
  const swapDetails = isSwap
    ? {
        soldAmount: formatNumber(soldTransfer.amount, { minDecimals: 0, maxDecimals: 4 }),
        soldSymbol: soldTransfer.token_symbol || 'TOKEN',
        boughtAmount: formatNumber(boughtTransfer.amount, { minDecimals: 0, maxDecimals: 6 }),
        boughtSymbol: boughtTransfer.token_symbol || 'TOKEN',
      }
    : null;
  const actionSummary = formatActionSummary(txData, t, lang);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      title={
        <Group gap={8}>
          <IconActivity size={22} color="#38bdf8" />
          <Title order={4}>
            {t('tx_detailedTransactionInformation')}
          </Title>
        </Group>
      }
      size="min(1120px, 95vw)"
      styles={{
        content: {
          maxWidth: '1120px',
          width: '95vw',
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
      ) : txData ? (
        <Stack gap="md">
          {/* Prominent Action Summary Banner */}
          <Paper
            p="md"
            style={{
              background: '#f5e6d8',
              border: '1px solid #d9cbbe',
              borderTop: '2px solid #111111',
              borderRadius: 0,
              color: '#111111',
            }}
          >
            <Group justify="space-between" mb="xs" align="center">
              <Group gap={8}>
                <IconActivity size={20} color="#111111" stroke={2} />
                <Title order={5} style={{ color: '#111111', fontSize: 15, fontWeight: 800 }}>
                  {t('tx_actionSummaryTitle')}
                </Title>
              </Group>
              {txData.to_label && (
                <span
                  className="neo-pill"
                  style={{
                    backgroundColor: '#e2d3c5',
                    color: '#111111',
                    border: '1px solid #c9b9aa',
                  }}
                >
                  {txData.to_label}
                </span>
              )}
            </Group>

            <Text size="sm" c="#111111" fw={700} style={{ lineHeight: 1.6 }}>
              {actionSummary || (txData.pallet ? `${txData.pallet}:${txData.method}` : txData.hash)}
            </Text>

            {/* Visual Swap Flow if it is a swap */}
            {isSwap && swapDetails && (
              <Paper mt="sm" p="xs" bg="#fff1e5" style={{ borderRadius: 0, border: '1px solid #d9cbbe' }}>
                <Group justify="space-around" align="center" wrap="wrap">
                  <Box style={{ textAlign: 'center' }}>
                    <Text size="11px" c="#666059" fw={600}>{t('tx_soldAmount')}</Text>
                    <Text size="sm" fw={800} c="#111111" className="font-mono">
                      {swapDetails.soldAmount} {swapDetails.soldSymbol}
                    </Text>
                  </Box>
                  <Text size="lg" c="#111111" fw={800}>➔</Text>
                  <Box style={{ textAlign: 'center' }}>
                    <Text size="11px" c="#666059" fw={600}>{txData.to_label || t('tx_dexRouter')}</Text>
                    <span className="neo-pill" style={{ background: '#f5e6d8', color: '#111', border: '1px solid #c9b9aa' }}>DEX Router</span>
                  </Box>
                  <Text size="lg" c="#111111" fw={800}>➔</Text>
                  <Box style={{ textAlign: 'center' }}>
                    <Text size="11px" c="#666059" fw={600}>{t('tx_boughtAmount')}</Text>
                    <Text size="sm" fw={800} c="#111111" className="font-mono">
                      {swapDetails.boughtAmount} {swapDetails.boughtSymbol}
                    </Text>
                  </Box>
                </Group>
              </Paper>
            )}
          </Paper>

          {/* Top Information Card */}
          <Paper p="sm" bg="#fff1e5" style={{ border: '1px solid #d9cbbe', borderTop: '2px solid #111111', borderRadius: 0 }}>
            <Group justify="space-between" align="center" wrap="wrap" mb="xs">
              <Group gap="xs">
                <span
                  className="neo-pill"
                  style={{
                    backgroundColor: txData.layer === 'EVM' ? '#bfdbfe' : '#fed7aa',
                    color: '#000000',
                    border: '1.5px solid #000000',
                    boxShadow: '2px 2px 0px #000000',
                  }}
                >
                  {txData.layer === 'EVM' ? t('txLayerEvm') : t('txLayerSub')}
                </span>
                <span
                  className="neo-pill"
                  style={{
                    backgroundColor: txData.status === 1 || txData.status === 'success' ? '#bbf7d0' : '#fecaca',
                    color: '#000000',
                    border: '1.5px solid #000000',
                    boxShadow: '2px 2px 0px #000000',
                  }}
                >
                  {txData.status === 1 || txData.status === 'success' ? t('txSuccess') : t('txFailed')}
                </span>
                {txData.pallet && (
                  <span
                    className="neo-pill"
                    style={{
                      backgroundColor: '#e9d5ff',
                      color: '#000000',
                      border: '1.5px solid #000000',
                      boxShadow: '2px 2px 0px #000000',
                    }}
                  >
                    {txData.pallet}:{txData.method}
                  </span>
                )}
              </Group>

              {txData.price_usd > 0 && (
                <span
                  className="neo-pill"
                  style={{
                    backgroundColor: '#fef08a',
                    color: '#000000',
                    border: '1.5px solid #000000',
                    boxShadow: '2px 2px 0px #000000',
                  }}
                >
                  {t('historicalRate', { rate: formatNumber(txData.price_usd, { minDecimals: 4, maxDecimals: 6 }) })}
                </span>
              )}
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
              <Box>
                <Text size="xs" c="dimmed">{t('colTxHash')}</Text>
                <Group gap={4} wrap="nowrap">
                  <Text size="xs" fw={700} className="font-mono" style={{ wordBreak: 'break-all' }}>
                    {txData.hash}
                  </Text>
                  <CopyButton value={txData.hash || ''}>
                    {({ copied, copy }) => (
                      <ActionIcon size="xs" variant="subtle" color={copied ? 'teal' : 'gray'} onClick={copy}>
                        {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                      </ActionIcon>
                    )}
                  </CopyButton>
                </Group>
              </Box>

              <Box>
                <Text size="xs" c="dimmed">{t('colBlockNumber')}</Text>
                <Group gap={6} align="center">
                  <Text
                    size="sm"
                    fw={700}
                    className="font-mono"
                    c="cyan"
                    style={{ cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => {
                      onClose();
                      onOpenBlock?.(txData.block_number);
                    }}
                    title={t('tx_clickToInspectBlock')}
                  >
                    #{txData.block_number?.toLocaleString(loc)}
                  </Text>
                  <Button
                    size="compact-xs"
                    variant="subtle"
                    color="cyan"
                    leftSection={<IconCube size={12} />}
                    onClick={() => {
                      onClose();
                      onOpenBlock?.(txData.block_number);
                    }}
                  >
                    {t('tx_viewBlock')}
                  </Button>
                </Group>
              </Box>

              <Box>
                <Text size="xs" c="dimmed">{t('colTimestamp')}</Text>
                <Text size="xs" fw={600} className="font-mono">
                  {formatTimestamp(txData.timestamp, lang)} ({timeAgo(txData.timestamp, lang)})
                </Text>
              </Box>

              <Box>
                <Text size="xs" c="dimmed">{t('tx_senderFromSigner')}</Text>
                <Group gap={6} wrap="nowrap" align="center">
                  {txData.from_label && (
                    <Badge size="xs" color="cyan" variant="outline" style={{ maxWidth: 160 }} lineClamp={1}>
                      {txData.from_label}
                    </Badge>
                  )}
                  <Text
                    size="xs"
                    fw={600}
                    className="font-mono"
                    c="cyan"
                    style={{ cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => onSelectAddress?.(txData.from_address || txData.signer)}
                  >
                    {shortAddr(txData.from_address || txData.signer, 8, 6)}
                  </Text>
                  <CopyButton value={txData.from_address || txData.signer || ''}>
                    {({ copied, copy }) => (
                      <ActionIcon size="xs" variant="subtle" color={copied ? 'teal' : 'gray'} onClick={copy}>
                        {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                      </ActionIcon>
                    )}
                  </CopyButton>
                </Group>
              </Box>

              <Box>
                <Text size="xs" c="dimmed">{t('tx_targetRecipientTo')}</Text>
                <Group gap={6} wrap="nowrap" align="center">
                  {txData.to_label && (
                    <Badge size="xs" color="teal" variant="light" style={{ maxWidth: 200 }} lineClamp={1}>
                      {txData.to_label}
                    </Badge>
                  )}
                  <Text
                    size="xs"
                    fw={600}
                    className="font-mono"
                    c={txData.to_address || txData.target ? 'teal' : 'dimmed'}
                    style={{
                      cursor: (txData.to_address || txData.target) ? 'pointer' : 'default',
                      textDecoration: (txData.to_address || txData.target) ? 'underline' : 'none',
                    }}
                    onClick={() => (txData.to_address || txData.target) && onSelectAddress?.(txData.to_address || txData.target)}
                  >
                    {txData.to_address || txData.target ? shortAddr(txData.to_address || txData.target, 8, 6) : (t('tx_contractSystem'))}
                  </Text>
                  {(txData.to_address || txData.target) && (
                    <CopyButton value={txData.to_address || txData.target}>
                      {({ copied, copy }) => (
                        <ActionIcon size="xs" variant="subtle" color={copied ? 'teal' : 'gray'} onClick={copy}>
                          {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                        </ActionIcon>
                      )}
                    </CopyButton>
                  )}
                </Group>
              </Box>

              <Box>
                <Text size="xs" c="dimmed">{t('colAmount')}</Text>
                <Text size="sm" fw={700} c="green" className="font-mono">
                  {formatHMND(txData.value_hmnd || txData.amount || 0, { locale: lang })}
                </Text>
                {txData.price_usd > 0 && Number(txData.value_hmnd || 0) > 0 && (
                  <Text size="11px" c="dimmed">
                    ≈ {formatUSD((Number(txData.value_hmnd || 0)) * txData.price_usd, lang)}
                  </Text>
                )}
              </Box>

              <Box>
                <Text size="xs" c="dimmed">{t('colFee')}</Text>
                <Text size="sm" fw={700} c="yellow" className="font-mono">
                  {formatFee(txData.fee_hmnd, true, lang)}
                </Text>
                {txData.price_usd > 0 && Number(txData.fee_hmnd || 0) > 0 && (
                  <Text size="11px" c="dimmed">
                    ≈ {formatUSD((Number(txData.fee_hmnd || 0)) * txData.price_usd, lang, 4)}
                  </Text>
                )}
              </Box>

              {txData.gas_used && (
                <Box>
                  <Text size="xs" c="dimmed">{t('txGasUsed')}</Text>
                  <Text size="xs" className="font-mono">
                    {Number(txData.gas_used).toLocaleString(loc)} Gas
                  </Text>
                </Box>
              )}
            </SimpleGrid>
          </Paper>

          {/* Call Details and Ecosystem Explanation */}
          {(txData.details || (txData.pallet && txData.pallet !== 'Ethereum')) && (
            <Paper p="sm" bg="rgba(0,0,0,0.3)" style={{ border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: 8 }}>
              <Group justify="space-between" mb="xs">
                <Group gap={6}>
                  <Badge color="violet" size="xs">
                    {txData.pallet}:{txData.method}
                  </Badge>
                  <Title order={6} style={{ color: '#38bdf8' }}>
                    {t('tx_callDetailsDetailedLog')}
                  </Title>
                </Group>
              </Group>
              <Text
                size="xs"
                c="white"
                className="font-mono"
                style={{
                  wordBreak: 'break-all',
                  background: '#080c14',
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {formatExtrinsicDetails(txData, t) || txData.details || t('tx_actionCalled', { pallet: txData.pallet, method: txData.method })}
              </Text>
            </Paper>
          )}

          {/* Token Transferleri ve Swaplar Tablosu */}
          {txData.tokenTransfers && txData.tokenTransfers.length > 0 && (
            <Paper p="sm" bg="rgba(0,0,0,0.25)" style={{ border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: 8 }}>
              <Group justify="space-between" mb="xs">
                <Group gap={6}>
                  <IconCoins size={18} color="#38bdf8" />
                  <Title order={6} style={{ color: '#38bdf8' }}>
                    {t('tx_internalTokenTransfersSwaps')}
                  </Title>
                </Group>
                <Badge color="cyan" size="xs">
                  {txData.tokenTransfers.length} {t('tokenColTransfers')}
                </Badge>
              </Group>

              <Box style={{ overflowX: 'auto' }}>
                <Table striped highlightOnHover verticalSpacing="xs">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>{t('tx_token')}</Table.Th>
                      <Table.Th>{t('tx_amount')}</Table.Th>
                      <Table.Th>{t('tx_from')}</Table.Th>
                      <Table.Th>{t('tx_to')}</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {txData.tokenTransfers.map((tt, idx) => (
                      <Table.Tr key={tt.id || idx}>
                        <Table.Td>
                          <Badge size="xs" color="indigo" variant="light">
                            {tt.token_symbol || 'TOKEN'}
                          </Badge>
                        </Table.Td>
                        <Table.Td className="font-mono" fw={700} c="cyan">
                          {Number(tt.amount || 0).toLocaleString(loc, { maximumFractionDigits: 6 })} {tt.token_symbol}
                        </Table.Td>
                        <Table.Td className="font-mono">
                          <Text
                            size="xs"
                            c="cyan"
                            style={{ cursor: 'pointer', textDecoration: 'underline' }}
                            onClick={() => onSelectAddress?.(tt.from_address)}
                          >
                            {shortAddr(tt.from_address, 6, 4)}
                          </Text>
                        </Table.Td>
                        <Table.Td className="font-mono">
                          <Text
                            size="xs"
                            c="teal"
                            style={{ cursor: 'pointer', textDecoration: 'underline' }}
                            onClick={() => onSelectAddress?.(tt.to_address)}
                          >
                            {shortAddr(tt.to_address, 6, 4)}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Box>
            </Paper>
          )}

          {/* Bottom Quick Action Buttons */}
          <Group justify="space-between" mt="xs">
            {Boolean(txData?.block_number) ? (
              <Button
                size="xs"
                variant="light"
                color="blue"
                leftSection={<IconCube size={14} />}
                onClick={() => {
                  onClose();
                  onOpenBlock?.(txData.block_number);
                }}
              >
                {t('inspectBlockNum', { number: txData.block_number })}
              </Button>
            ) : <Box />}

            <Group gap="xs">
              {(txData.from_address || txData.signer) && (
                <Button
                  size="xs"
                  variant="subtle"
                  color="green"
                  leftSection={<IconBook size={14} />}
                  onClick={() => {
                    onClose();
                    onOpenLedger?.(txData.from_address || txData.signer);
                  }}
                >
                  {t('tx_senderLedger')}
                </Button>
              )}
            </Group>
          </Group>
        </Stack>
      ) : null}
    </Modal>
  );
}
