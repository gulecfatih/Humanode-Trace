'use client';
import { useState, useEffect } from 'react';
import { Paper, Stack, Group, Title, Text, TextInput, Button, Badge, SimpleGrid, Box, Divider } from '@mantine/core';
import { IconScale, IconArrowRight, IconArrowLeft, IconEye, IconBook } from '@tabler/icons-react';
import { formatHMND, formatFee, formatUSD } from './formatters';
import { useLanguage } from './LanguageContext';
import AmountDisplay from './ui/AmountDisplay';

export default function CompareTab({ initialA, initialB, onSelectAddress, onOpenLedger }) {
  const { t, lang } = useLanguage();
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
  const locStr = lang === 'en' ? 'en-US' : 'tr-TR';

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
            {lang === 'tr'
              ? 'Karşılaştırmak istediğiniz 2 cüzdan adresini yukarıdaki alanlara girin veya Borsa & Önemli Cüzdanlar sekmesinden seçin.'
              : 'Enter 2 wallet addresses above to compare or select them from the Exchange & Major Wallets tab.'}
          </Text>
        </Paper>
      )}

      {result && (
        <>
          {/* Karşılıklı İlişki Durum Kartı */}
          <Paper p="md" style={{ background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
            <Title order={5} c="violet" mb="xs">{lang === 'tr' ? 'Zincir Üstü İlişki & Karşılıklı Etkileşim' : 'On-Chain Relationship & Mutual Flow'}</Title>
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
              <Paper p="xs" bg="rgba(0,0,0,0.3)">
                <Text size="xs" c="dimmed">{lang === 'tr' ? 'ÇİFT KATMAN BAĞLANTISI' : 'DUAL-LAYER LINK'}</Text>
                <Badge size="md" color={rel?.isCrossLayerLinked ? 'violet' : 'gray'} mt={4}>
                  {rel?.isCrossLayerLinked ? (lang === 'tr' ? '🔗 Doğrulanmış Çift Katman Kimliği' : '🔗 Verified Dual-Layer Identity') : (lang === 'tr' ? 'Bağlantı Yok' : 'No Link')}
                </Badge>
                {rel?.crossLayerDetails && (
                  <Text size="10px" c="dimmed" mt={4}>
                    {rel.crossLayerDetails.swap_count} {lang === 'tr' ? 'Takas' : 'Swaps'}, {lang === 'tr' ? 'Toplam' : 'Total'} {formatHMND(rel.crossLayerDetails.total_swapped_hmnd, lang)}
                  </Text>
                )}
              </Paper>

              <Paper p="xs" bg="rgba(0,0,0,0.3)">
                <Text size="xs" c="dimmed">{lang === 'tr' ? 'DOĞRUDAN TRANSFER (A ➔ B)' : 'DIRECT TRANSFER (A ➔ B)'}</Text>
                <Text size="sm" fw={700} c="green" className="font-mono mt-1">
                  {rel?.directTransfersAToB?.count || 0} {lang === 'tr' ? 'İşlem' : 'Txs'} ({formatHMND(rel?.directTransfersAToB?.volume, lang)})
                </Text>
              </Paper>

              <Paper p="xs" bg="rgba(0,0,0,0.3)">
                <Text size="xs" c="dimmed">{lang === 'tr' ? 'ORTAK KARŞI TARAFLAR' : 'MUTUAL COUNTERPARTIES'}</Text>
                <Text size="sm" fw={700} c="cyan" className="font-mono mt-1">
                  {rel?.mutualCounterpartiesCount || 0} {lang === 'tr' ? 'Ortak Adres' : 'Shared Addresses'}
                </Text>
              </Paper>
            </SimpleGrid>
          </Paper>

          {/* Yan Yana Kıyaslama Kartları */}
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {/* Cüzdan A */}
            <Paper p="md" style={{ borderTop: '3px solid #38bdf8' }}>
              <Group justify="space-between" mb="xs">
                <Badge color={wA?.isEvm ? 'cyan' : 'green'}>{wA?.isEvm ? 'EVM (0x)' : 'Substrate'}</Badge>
                <Button size="xs" variant="light" color="cyan" onClick={() => onOpenLedger(wA?.address)}>
                  {lang === 'tr' ? 'Defterini Aç' : 'Open Ledger'}
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
                  <Text size="xs" c="dimmed">{lang === 'tr' ? 'Toplam Gelen Hacim:' : 'Total Volume In:'}</Text>
                  <AmountDisplay
                    value={formatHMND(wA?.totalVolumeIn, { suffix: false, locale: lang })}
                    unit="HMND"
                    sign="+"
                    color="#38bdf8"
                    size="xs"
                  />
                </Group>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">{lang === 'tr' ? 'Toplam Giden Hacim:' : 'Total Volume Out:'}</Text>
                  <AmountDisplay
                    value={formatHMND(wA?.totalVolumeOut, { suffix: false, locale: lang })}
                    unit="HMND"
                    sign="-"
                    color="#f87171"
                    size="xs"
                  />
                </Group>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">{lang === 'tr' ? 'Harcanan Fee:' : 'Paid Fee:'}</Text>
                  <AmountDisplay
                    value={formatFee(wA?.totalFeesPaid, false, lang)}
                    unit="HMND"
                    color="#f59e0b"
                    size="xs"
                  />
                </Group>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">{lang === 'tr' ? 'Validatör Durumu:' : 'Validator Status:'}</Text>
                  <Badge size="xs" color={wA?.isValidator ? 'teal' : 'gray'}>
                    {wA?.isValidator ? (lang === 'tr' ? 'Doğrulayıcı' : 'Validator') : (lang === 'tr' ? 'Kullanıcı' : 'User')}
                  </Badge>
                </Group>
              </Stack>
            </Paper>

            {/* Cüzdan B */}
            <Paper p="md" className="glass-panel" style={{ borderTop: '3px solid #a855f7', borderRadius: 8 }}>
              <Group justify="space-between" mb="xs">
                <Badge color={wB?.isEvm ? 'cyan' : 'green'}>{wB?.isEvm ? 'EVM (0x)' : 'Substrate'}</Badge>
                <Button size="xs" variant="light" color="violet" onClick={() => onOpenLedger(wB?.address)}>
                  {lang === 'tr' ? 'Defterini Aç' : 'Open Ledger'}
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
                  <Text size="xs" c="dimmed">{lang === 'tr' ? 'Toplam Gelen Hacim:' : 'Total Volume In:'}</Text>
                  <AmountDisplay
                    value={formatHMND(wB?.totalVolumeIn, { suffix: false, locale: lang })}
                    unit="HMND"
                    sign="+"
                    color="#38bdf8"
                    size="xs"
                  />
                </Group>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">{lang === 'tr' ? 'Toplam Giden Hacim:' : 'Total Volume Out:'}</Text>
                  <AmountDisplay
                    value={formatHMND(wB?.totalVolumeOut, { suffix: false, locale: lang })}
                    unit="HMND"
                    sign="-"
                    color="#f87171"
                    size="xs"
                  />
                </Group>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">{lang === 'tr' ? 'Harcanan Fee:' : 'Paid Fee:'}</Text>
                  <AmountDisplay
                    value={formatFee(wB?.totalFeesPaid, false, lang)}
                    unit="HMND"
                    color="#f59e0b"
                    size="xs"
                  />
                </Group>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">{lang === 'tr' ? 'Validatör Durumu:' : 'Validator Status:'}</Text>
                  <Badge size="xs" color={wB?.isValidator ? 'teal' : 'gray'}>
                    {wB?.isValidator ? (lang === 'tr' ? 'Doğrulayıcı' : 'Validator') : (lang === 'tr' ? 'Kullanıcı' : 'User')}
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
