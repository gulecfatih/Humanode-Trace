'use client';
import { useState, useEffect } from 'react';
import { Paper, Stack, Group, Title, Text, TextInput, Button, Badge, SimpleGrid, Box, Divider } from '@mantine/core';
import { IconScale, IconArrowRight, IconArrowLeft, IconEye, IconBook } from '@tabler/icons-react';
import { formatHMND, formatFee, formatUSD } from './formatters';
import { useLanguage } from './LanguageContext';
import { useModuleFields } from './ModuleLayout';
import AmountDisplay from './ui/AmountDisplay';

export default function CompareTab({ initialA, initialB, onSelectAddress, onOpenLedger }) {
  const { lang } = useLanguage();
  const { t, fields } = useModuleFields();
  const [addrA, setAddrA] = useState(initialA || '');
  const [addrB, setAddrB] = useState(initialB || '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCompare = (a, b) => {
    if (!a || !b) return;
    setLoading(true);
    fetch(`/api/compare-wallets?walletA=${encodeURIComponent(a)}&walletB=${encodeURIComponent(b)}`)
      .then((res) => res.json())
      .then((resData) => {
        setResult(resData);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (initialA) setAddrA(initialA);
    if (initialB) setAddrB(initialB);
    if (initialA && initialB) {
      fetchCompare(initialA, initialB);
    }
  }, [initialA, initialB]);

  const handleCompare = (e) => {
    e.preventDefault();
    fetchCompare(addrA, addrB);
  };

  const rel = result?.relationship;
  const wA = result?.walletA;
  const wB = result?.walletB;
  const locStr = lang || undefined;

  return (
    <Stack gap="md">
      <Paper p="md">
        <Title order={4} mb="xs">⚖️ {t('compareTitle')}</Title>
        <Text size="xs" c="dimmed" mb="md">
          {t('compareSubtitle')}
        </Text>

        <form onSubmit={handleCompare}>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            <TextInput
              label={t('compareAddrA')}
              placeholder="0x... veya hm..."
              value={addrA}
              onChange={(e) => setAddrA(e.target.value)}
            />
            <TextInput
              label={t('compareAddrB')}
              placeholder="0x... veya hm..."
              value={addrB}
              onChange={(e) => setAddrB(e.target.value)}
            />
          </SimpleGrid>

          <Group justify="flex-end" mt="md" wrap="wrap">
            <Button type="submit" color="grape" leftSection={<IconScale size={16} />} loading={loading}>
              {t('compareBtn')}
            </Button>
          </Group>
        </form>
      </Paper>

      {!result && !loading && (
        <Paper p="xl" ta="center">
          <Text size="sm" c="dimmed">
            {t('compare_enter2WalletAddresses')}
          </Text>
        </Paper>
      )}

      {result && (
        <>
          {/* Mutual Relationship Status Card */}
          <Paper p="md" style={{ background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
            <Title order={5} c="violet" mb="xs">{t('compare_onChainRelationshipMutual')}</Title>
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
              <Paper p="xs" bg="rgba(0,0,0,0.3)">
                <Text size="xs" c="dimmed">{t('compare_dualLayerLink')}</Text>
                <Badge size="md" color={rel?.isCrossLayerLinked ? 'violet' : 'gray'} mt={4}>
                  {rel?.isCrossLayerLinked ? (t('compare_verifiedDualLayerIdentity')) : (t('compare_noLink'))}
                </Badge>
                {rel?.crossLayerDetails && (
                  <Text size="10px" c="dimmed" mt={4}>
                    {rel.crossLayerDetails.swap_count} {t('compare_swaps')}, {t('compare_total')} {formatHMND(rel.crossLayerDetails.total_swapped_hmnd, lang)}
                  </Text>
                )}
              </Paper>

              <Paper p="xs" bg="rgba(0,0,0,0.3)">
                <Text size="xs" c="dimmed">{t('compare_directTransferAB')}</Text>
                <Text size="sm" fw={700} c="green" className="font-mono mt-1">
                  {rel?.directTransfersAToB?.count || 0} {t('unlocks_txs_3')} ({formatHMND(rel?.directTransfersAToB?.volume, lang)})
                </Text>
              </Paper>

              <Paper p="xs" bg="rgba(0,0,0,0.3)">
                <Text size="xs" c="dimmed">{t('compare_mutualCounterparties')}</Text>
                <Text size="sm" fw={700} c="cyan" className="font-mono mt-1">
                  {rel?.mutualCounterpartiesCount || 0} {t('compare_sharedAddresses')}
                </Text>
              </Paper>
            </SimpleGrid>
          </Paper>

          {/* Side-by-Side Comparison Cards */}
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {/* Wallet A Card */}
            <Paper p="md" style={{ borderTop: '3px solid #38bdf8' }}>
              <Group justify="space-between" mb="xs">
                <Badge color={wA?.isEvm ? 'cyan' : 'green'}>{wA?.isEvm ? 'EVM (0x)' : 'Substrate'}</Badge>
                <Button size="xs" variant="light" color="cyan" onClick={() => onOpenLedger(wA?.address)}>
                  {t('compare_openLedger_2')}
                </Button>
              </Group>
              <Text size="xs" fw={700} className="font-mono" c="cyan" mb="md" style={{ wordBreak: 'break-all' }}>
                {wA?.address}
              </Text>

              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">{t('ledgerNetBalance')}:</Text>
                  <AmountDisplay
                    value={formatHMND(wA?.netBalanceHmnd, { suffix: false, locale: lang })}
                    unit="HMND"
                    color="#10b981"
                    size="xs"
                  />
                </Group>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">{t('compare_totalVolumeIn_2')}</Text>
                  <AmountDisplay
                    value={formatHMND(wA?.totalVolumeIn, { suffix: false, locale: lang })}
                    unit="HMND"
                    sign="+"
                    color="#38bdf8"
                    size="xs"
                  />
                </Group>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">{t('compare_totalVolumeOut_2')}</Text>
                  <AmountDisplay
                    value={formatHMND(wA?.totalVolumeOut, { suffix: false, locale: lang })}
                    unit="HMND"
                    sign="-"
                    color="#f87171"
                    size="xs"
                  />
                </Group>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">{t('compare_paidFee_2')}</Text>
                  <AmountDisplay
                    value={formatFee(wA?.totalFeesPaid, false, lang)}
                    unit="HMND"
                    color="#f59e0b"
                    size="xs"
                  />
                </Group>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">{t('compare_validatorStatus_2')}</Text>
                  <Badge size="xs" color={wA?.isValidator ? 'teal' : 'gray'}>
                    {wA?.isValidator ? (t('compare_validator_2')) : (t('compare_user_2'))}
                  </Badge>
                </Group>
              </Stack>
            </Paper>

            {/* Wallet B Card */}
            <Paper p="md" className="glass-panel" style={{ borderTop: '3px solid #a855f7', borderRadius: 8 }}>
              <Group justify="space-between" mb="xs">
                <Badge color={wB?.isEvm ? 'cyan' : 'green'}>{wB?.isEvm ? 'EVM (0x)' : 'Substrate'}</Badge>
                <Button size="xs" variant="light" color="violet" onClick={() => onOpenLedger(wB?.address)}>
                  {t('compare_openLedger_2')}
                </Button>
              </Group>
              <Text size="xs" fw={700} className="font-mono" c="violet" mb="md" style={{ wordBreak: 'break-all' }}>
                {wB?.address}
              </Text>

              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">{t('ledgerNetBalance')}:</Text>
                  <AmountDisplay
                    value={formatHMND(wB?.netBalanceHmnd, { suffix: false, locale: lang })}
                    unit="HMND"
                    color="#10b981"
                    size="xs"
                  />
                </Group>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">{t('compare_totalVolumeIn_2')}</Text>
                  <AmountDisplay
                    value={formatHMND(wB?.totalVolumeIn, { suffix: false, locale: lang })}
                    unit="HMND"
                    sign="+"
                    color="#38bdf8"
                    size="xs"
                  />
                </Group>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">{t('compare_totalVolumeOut_2')}</Text>
                  <AmountDisplay
                    value={formatHMND(wB?.totalVolumeOut, { suffix: false, locale: lang })}
                    unit="HMND"
                    sign="-"
                    color="#f87171"
                    size="xs"
                  />
                </Group>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">{t('compare_paidFee_2')}</Text>
                  <AmountDisplay
                    value={formatFee(wB?.totalFeesPaid, false, lang)}
                    unit="HMND"
                    color="#f59e0b"
                    size="xs"
                  />
                </Group>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">{t('compare_validatorStatus_2')}</Text>
                  <Badge size="xs" color={wB?.isValidator ? 'teal' : 'gray'}>
                    {wB?.isValidator ? (t('compare_validator_2')) : (t('compare_user_2'))}
                  </Badge>
                </Group>
              </Stack>
            </Paper>
          </SimpleGrid>
        </>
      )}
    </Stack>
  );
}
