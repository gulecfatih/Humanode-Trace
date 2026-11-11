'use client';
import { useState, useEffect, useMemo } from 'react';
import {
  Paper,
  Stack,
  Title,
  Text,
  Badge,
  Group,
  Box,
  SimpleGrid,
  Table,
  Progress,
  TextInput,
  Button,
  Select,
  NumberInput,
  ThemeIcon,
  Divider,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconBuildingBank,
  IconCoins,
  IconCode,
  IconArrowsExchange,
  IconAlertTriangle,
  IconTrendingDown,
  IconCheck,
  IconSearch,
} from '@tabler/icons-react';
import { formatHMND, formatUSD, formatNumber } from './formatters';
import { useLanguage } from './LanguageContext';
import { useModuleFields } from './ModuleLayout';
import KpiStatCard from './ui/KpiStatCard';
import AmountDisplay from './ui/AmountDisplay';

export default function DexDepthTab() {
  const { lang } = useLanguage();
  const { t, fields } = useModuleFields();
  const locStr = t('whales_enUs');

  // Pool State
  const [pools, setPools] = useState([]);
  const [selectedPoolIndex, setSelectedPoolIndex] = useState('0');
  const [depthData, setDepthData] = useState(null);
  const [depthLoading, setDepthLoading] = useState(true);

  // Custom Swap Slippage Input
  const [swapAmount, setSwapAmount] = useState(25000);

  // 4-Byte Method Decoder State
  const [calldataInput, setCalldataInput] = useState(
    '0xa9059cbb0000000000000000000000002f30000000000000000000000000000000001cc90000000000000000000000000000000000000000000000056bc75e2d63100000'
  );
  const [decodedMethod, setDecodedMethod] = useState(null);
  const [decoding, setDecoding] = useState(false);

  // Fetch Pools & Depth
  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetch('/api/dex-pools').then((r) => r.json()),
      fetch('/api/dex-depth').then((r) => r.json()),
    ])
      .then(([poolsRes, depthRes]) => {
        if (mounted) {
          setPools(poolsRes);
          setDepthData(depthRes);
          setDepthLoading(false);
        }
      })
      .catch((err) => {
        console.error('Dex fetch error:', err);
        if (mounted) setDepthLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Fetch Decoder on initial or submit
  const decodeCalldata = (inputStr) => {
    if (!inputStr) return;
    setDecoding(true);
    fetch(`/api/decode-method?input=${encodeURIComponent(inputStr)}`)
      .then((r) => r.json())
      .then((res) => {
        setDecodedMethod(res);
        setDecoding(false);
      })
      .catch((err) => {
        console.error('Decoder error:', err);
        setDecoding(false);
      });
  };

  useEffect(() => {
    decodeCalldata(calldataInput);
  }, []);

  // Dynamic Custom Slippage calculation
  const customSlippage = useMemo(() => {
    if (!depthData || !swapAmount || swapAmount <= 0) return null;
    const rHmnd = depthData.reserveToken0; // HMND
    const rUsdc = depthData.reserveToken1; // USDC
    const spot = depthData.spotPriceUsd;

    // AMM constant product: (x + dx) * (y - dy) = x * y
    // dy = (y * dx) / (x + dx) * 0.997 (0.3% LP fee)
    const dy = (rUsdc * swapAmount * 0.997) / (rHmnd + swapAmount * 0.997);
    const effectivePrice = dy / swapAmount;
    const priceImpactPct = Math.max(0, ((spot - effectivePrice) / spot) * 100);

    return {
      outputUsdc: dy,
      effectivePrice,
      priceImpactPct,
    };
  }, [depthData, swapAmount]);

  return (
    <Stack gap="lg">
      {/* Header */}
      <Paper
        p="md"
        radius="md"
        style={{
          background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%)',
          border: '1px solid rgba(20, 184, 166, 0.2)',
        }}
      >
        <Group justify="space-between" align="center">
          <Group gap="sm">
            <ThemeIcon size={38} radius="md" color="teal" variant="light">
              <IconCoins size={22} />
            </ThemeIcon>
            <div>
              <Title order={3} fw={700} c="white">
                {t('dexdepth_dexLiquidityDepthSlippage')}
              </Title>
              <Text size="xs" c="dimmed">
                {t('dexdepth_impossibleFinanceAmmConstant')}
              </Text>
            </div>
          </Group>
          <Badge size="lg" color="teal" variant="light">
            CONSTANT PRODUCT (x · y = k)
          </Badge>
        </Group>
      </Paper>

      {/* AMM Depth Metrics */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
        <KpiStatCard
          title={t('dexdepth_totalValueLockedTvl')}
          value={formatUSD(depthData?.totalTvlUsd || 215340)}
          color="teal"
          icon={IconCoins}
          subtext={`${depthData?.pairName || 'HMND/USDC'} (${depthData?.dexName || 'Impossible Finance'})`}
        />

        <KpiStatCard
          title={t('dexdepth_reserveBalances')}
          value={formatHMND(depthData?.reserveToken0 || 2400000, { suffix: false, locale: lang })}
          unit="HMND"
          color="cyan"
          icon={IconArrowsExchange}
          subtext={`+ ${formatUSD(depthData?.reserveToken1 || 108000)} USDC`}
        />

        <KpiStatCard
          title={t('dexdepth_24hVolumeFees')}
          value={formatUSD(depthData?.volume24hUsd || 34820)}
          color="violet"
          icon={IconCoins}
          subtext={`LP Ücreti: ${formatUSD(depthData?.fees24hUsd || 104.46)}`}
        />

        <KpiStatCard
          title={t('dexdepth_spotAmmPrice')}
          value={formatUSD(depthData?.spotPriceUsd || 0, null, 4)}
          color="yellow"
          icon={IconCoins}
          badge="x · y = k"
          badgeColor="yellow"
          subtext={`1 HMND = ${formatUSD(depthData?.spotPriceUsd || 0, null, 4)} USDC`}
        />
      </SimpleGrid>

      {/* Slippage & Price Impact Simulator */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        {/* Tier Table */}
        <Paper p="md" radius="md" style={{ background: '#121824', border: '1px solid rgba(255,255,255,0.07)' }}>
          <Group justify="space-between" mb="xs">
            <Group gap="xs">
              <IconTrendingDown size={18} color="#ef4444" />
              <Text fw={700} size="sm" c="white">
                {t('dexdepth_priceImpactSlippageTiers')}
              </Text>
            </Group>
            <Badge size="xs" color="red" variant="light">
              WeHMND/USDC
            </Badge>
          </Group>

          <Table verticalSpacing="xs" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ color: '#94a3b8', fontSize: 12 }}>{t('dexdepth_sellAmount')}</Table.Th>
                <Table.Th style={{ color: '#94a3b8', fontSize: 12 }}>{t('dexdepth_priceImpact')}</Table.Th>
                <Table.Th style={{ color: '#94a3b8', fontSize: 12 }}>{t('dexdepth_estOutput')}</Table.Th>
                <Table.Th style={{ color: '#94a3b8', fontSize: 12 }}>{t('dexdepth_effPrice')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {depthData?.slippageTiers?.map((tier, idx) => {
                const amount = tier.tradeSizeHmnd || tier.sellAmountHmnd || 0;
                const output = tier.outputToken1 || tier.expectedOutputUsdc || 0;
                const impact = tier.priceImpactPercent || 0;
                const effPrice = tier.effectivePriceUsd || 0;

                return (
                  <Table.Tr key={idx}>
                    <Table.Td>
                      <Text size="xs" fw={700} c="white">
                        {amount.toLocaleString(locStr)} HMND
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        size="xs"
                        color={
                          impact < 1.0
                            ? 'green'
                            : impact < 3.0
                            ? 'yellow'
                            : impact < 6.0
                            ? 'orange'
                            : 'red'
                        }
                        variant="light"
                      >
                        -%{formatNumber(impact, { minDecimals: 2, maxDecimals: 2 })}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" fw={600} c="teal">
                        {formatUSD(output)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" c="dimmed">
                        {formatUSD(effPrice, null, 4)}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Paper>

        {/* Custom Slippage Calculator */}
        <Paper p="md" radius="md" style={{ background: '#121824', border: '1px solid rgba(255,255,255,0.07)' }}>
          <Group justify="space-between" mb="xs">
            <Group gap="xs">
              <IconArrowsExchange size={18} color="#38bdf8" />
              <Text fw={700} size="sm" c="white">
                {t('dexdepth_customSwapSlippageCalculator')}
              </Text>
            </Group>
            <Badge size="xs" color="cyan" variant="outline">
              ANLIK HESAPLAMA
            </Badge>
          </Group>

          <Stack gap="sm" mt="md">
            <div>
              <Text size="xs" c="dimmed" mb={4}>
                {t('dexdepth_hmndAmountToSell')}
              </Text>
              <NumberInput
                value={swapAmount}
                onChange={(val) => setSwapAmount(Number(val) || 0)}
                min={100}
                max={2000000}
                step={5000}
                thousandSeparator="."
                decimalSeparator=","
              />
            </div>

            <Paper p="sm" radius="sm" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed">
                  {t('dexdepth_expectedUsdcOutput')}
                </Text>
                <Title order={3} fw={700} c="teal">
                  {formatUSD(customSlippage?.outputUsdc || 0)}
                </Title>
              </Group>

              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed">
                  {t('dexdepth_priceImpactSlippage')}
                </Text>
                <Badge
                  size="md"
                  color={
                    (customSlippage?.priceImpactPct || 0) < 1.0
                      ? 'green'
                      : (customSlippage?.priceImpactPct || 0) < 3.0
                      ? 'yellow'
                      : 'red'
                  }
                  variant="light"
                >
                  -%{formatNumber(customSlippage?.priceImpactPct || 0, { minDecimals: 2, maxDecimals: 2 })}
                </Badge>
              </Group>

              <Group justify="space-between">
                <Text size="xs" c="dimmed">
                  {t('dexdepth_effectiveSwapPrice')}
                </Text>
                <Text size="xs" fw={700} c="white">
                  {formatUSD(customSlippage?.effectivePrice || 0, null, 4)} / HMND
                </Text>
              </Group>
            </Paper>

            {/* Warning if slippage > 5% */}
            {(customSlippage?.priceImpactPct || 0) > 5.0 && (
              <Group gap="xs" p="xs" style={{ background: 'rgba(239, 68, 68, 0.1)', borderRadius: 6 }}>
                <IconAlertTriangle size={16} color="#ef4444" />
                <Text size="xs" c="red" fw={600}>
                  {t('dexdepth_highSlippageWarningSelling')}
                </Text>
              </Group>
            )}
          </Stack>
        </Paper>
      </SimpleGrid>

      {/* EVM 4-Byte Method Decoder & Signature Inspector */}
      <Paper
        p="md"
        radius="md"
        style={{
          background: '#0d131f',
          border: '1px solid rgba(99, 102, 241, 0.25)',
        }}
      >
        <Group justify="space-between" align="center" mb="sm">
          <Group gap="sm">
            <ThemeIcon size={34} radius="md" color="indigo" variant="light">
              <IconCode size={20} />
            </ThemeIcon>
            <div>
              <Title order={4} fw={700} c="white">
                {t('dexdepth_evm4ByteMethod')}
              </Title>
              <Text size="xs" c="dimmed">
                {t('dexdepth_decodeRawTransactionInput')}
              </Text>
            </div>
          </Group>
          <Badge size="md" color="indigo" variant="outline">
            100.000+ İMZA SÖZLÜĞÜ
          </Badge>
        </Group>

        {/* Input & Quick Presets */}
        <Stack gap="xs">
          <Group gap="xs">
            <TextInput
              placeholder="0x... hex calldata veya 4-byte metot seçici girin"
              value={calldataInput}
              onChange={(e) => setCalldataInput(e.target.value)}
              style={{ flex: 1 }}
              styles={{ input: { fontFamily: 'monospace', fontSize: 12 } }}
            />
            <Button
              color="indigo"
              loading={decoding}
              leftSection={<IconSearch size={14} />}
              onClick={() => decodeCalldata(calldataInput)}
            >
              {t('dexdepth_decode')}
            </Button>
          </Group>

          {/* Quick preset buttons */}
          <Group gap="xs">
            <Text size="11px" c="dimmed">
              {t('dexdepth_quickSelectors')}
            </Text>
            <Badge
              size="xs"
              variant="light"
              color="cyan"
              style={{ cursor: 'pointer' }}
              onClick={() => {
                const s = '0xa9059cbb0000000000000000000000002f30000000000000000000000000000000001cc90000000000000000000000000000000000000000000000056bc75e2d63100000';
                setCalldataInput(s);
                decodeCalldata(s);
              }}
            >
              transfer(...) [0xa9059cbb]
            </Badge>
            <Badge
              size="xs"
              variant="light"
              color="teal"
              style={{ cursor: 'pointer' }}
              onClick={() => {
                const s = '0x095ea7b300000000000000000000000068b3465833fb72a70ecdf485e0e4c7bd8665fc45ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
                setCalldataInput(s);
                decodeCalldata(s);
              }}
            >
              approve(...) [0x095ea7b3]
            </Badge>
            <Badge
              size="xs"
              variant="light"
              color="orange"
              style={{ cursor: 'pointer' }}
              onClick={() => {
                const s = '0x38ed1739';
                setCalldataInput(s);
                decodeCalldata(s);
              }}
            >
              swapExactTokensForTokens(...) [0x38ed1739]
            </Badge>
          </Group>

          {/* Decoded Result Box */}
          {decodedMethod && (
            <Paper
              p="md"
              radius="sm"
              mt="xs"
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <Group justify="space-between" mb="xs">
                <Group gap="xs">
                  <Badge size="sm" color="indigo" variant="filled">
                    {decodedMethod.selector}
                  </Badge>
                  <Title order={5} c="white" className="font-mono">
                    {decodedMethod.functionName}
                  </Title>
                  <Badge size="xs" color="violet">
                    {decodedMethod.category}
                  </Badge>
                </Group>
              </Group>

              <Text size="xs" className="font-mono" c="cyan" mb="xs">
                {decodedMethod.signature}
              </Text>
              <Text size="xs" c="dimmed" mb="md">
                {decodedMethod.description}
              </Text>

              {/* Decoded Parameters Table */}
              {decodedMethod.parameters?.length > 0 && (
                <Table verticalSpacing="xs">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th style={{ color: '#94a3b8', fontSize: 12 }}>Parametre</Table.Th>
                      <Table.Th style={{ color: '#94a3b8', fontSize: 12 }}>Tür (Type)</Table.Th>
                      <Table.Th style={{ color: '#94a3b8', fontSize: 12 }}>Ayrıştırılmış Değer (Decoded Value)</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {decodedMethod.parameters.map((p, idx) => (
                      <Table.Tr key={idx}>
                        <Table.Td>
                          <Text size="xs" fw={700} c="white" className="font-mono">
                            {p.name}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge size="xs" color="gray">
                            {p.type}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs" c="teal" className="font-mono" style={{ wordBreak: 'break-all' }}>
                            {p.value}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </Paper>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}
