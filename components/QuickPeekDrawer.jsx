'use client';
import { useState, useEffect } from 'react';
import { Drawer, Stack, Group, Title, Text, Badge, Button, Paper, CopyButton, ActionIcon, Tooltip, Box, SimpleGrid, Divider } from '@mantine/core';
import { IconCopy, IconCheck, IconBook, IconGitFork, IconExternalLink } from '@tabler/icons-react';
import { formatHMND, formatUSD, formatFee, formatCompact, shortAddr } from './formatters';
import { useLanguage } from './LanguageContext';

export default function QuickPeekDrawer({ opened, onClose, address, onOpenLedger, onOpenTrail }) {
  const { t, lang } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address || !opened) return;
    setLoading(true);
    fetch(`/api/address?addr=${encodeURIComponent(address)}`)
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [address, opened]);

  if (!address) return null;

  const isEvm = address.startsWith('0x') || address.startsWith('0X');
  const locStr = lang === 'en' ? 'en-US' : 'tr-TR';

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size="md"
      title={
        <Group gap="xs">
          <Badge color={isEvm ? 'cyan' : 'teal'} variant="light">
            {isEvm ? t('quickPeekEvm') : t('quickPeekSub')}
          </Badge>
          <Text fw={700} size="sm">{t('quickPeekTitle')}</Text>
        </Group>
      }
      styles={{
        content: {
          background: '#161b22',
          borderLeft: '1px solid rgba(56, 189, 248, 0.25)',
        },
        header: {
          background: '#0d1117',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        },
      }}
    >
      <Stack gap="md" p="xs">
        {/* Adres ve Kopyalama */}
        <Paper p="sm" bg="rgba(0, 0, 0, 0.3)">
          <Group justify="space-between" align="center">
            <Box style={{ maxWidth: '85%' }}>
              <Text size="xs" c="dimmed">{t('quickPeekAddress')}</Text>
              <Text size="xs" fw={700} className="font-mono" style={{ wordBreak: 'break-all' }}>
                {address}
              </Text>
            </Box>
            <CopyButton value={address}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? t('copied') : t('copy')}>
                  <ActionIcon color={copied ? 'teal' : 'gray'} variant="subtle" onClick={copy}>
                    {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
          </Group>

          {data?.persona?.badges && (
            <Group gap={6} mt="xs">
              {data.persona.badges.map((b) => (
                <Badge key={b.id} size="sm" variant="light" style={{ color: b.color, borderColor: b.color }}>
                  {b.icon} {b.label}
                </Badge>
              ))}
            </Group>
          )}
        </Paper>

        {/* Bakiye & Hacim KPI Grid */}
        <SimpleGrid cols={2} spacing="xs">
          <Paper p="sm" style={{ borderLeft: '3px solid #10b981' }}>
            <Text size="xs" c="dimmed">{t('quickPeekNetBalance')}</Text>
            <Text size="lg" fw={800} c="green" className="font-mono">
              {formatHMND(data?.netBalanceHmnd, lang)}
            </Text>
            <Text size="xs" c="dimmed">
              ≈ {formatUSD(data?.valueUsd, lang)} USD
            </Text>
          </Paper>

          <Paper p="sm" style={{ borderLeft: '3px solid #38bdf8' }}>
            <Text size="xs" c="dimmed">{t('quickPeekTotalTxs')}</Text>
            <Text size="lg" fw={800} c="cyan" className="font-mono">
              {((data?.evm?.sentCount || 0) + (data?.evm?.receivedCount || 0) + (data?.substrate?.signedCount || 0) + (data?.substrate?.targetCount || 0)).toLocaleString(locStr)}
            </Text>
            <Text size="xs" c="dimmed">{lang === 'tr' ? 'Ağ Hareketi' : 'Network Activity'}</Text>
          </Paper>
        </SimpleGrid>

        {/* Çoklu Varlık & Token Portföyü (Varsa) */}
        {data?.tokens && data.tokens.length > 1 && (
          <Paper p="sm" style={{ background: 'rgba(20, 184, 166, 0.08)', border: '1px solid rgba(20, 184, 166, 0.3)' }}>
            <Group justify="space-between" mb={6}>
              <Text size="xs" fw={700} c="teal">🪙 {lang === 'tr' ? 'Cüzdandaki Ek Varlıklar & Tokenlar:' : 'Additional Wallet Assets:'}</Text>
              <Badge size="xs" color="teal">
                {data.tokens.length} {lang === 'tr' ? 'Varlık' : 'Assets'} (≈ {formatUSD(data?.totalPortfolioUsd || data?.valueUsd, lang)})
              </Badge>
            </Group>
            <Group gap={6} wrap="wrap">
              {data.tokens.filter(t => !t.isNative).map((tk, idx) => (
                <Badge
                  key={tk.token_address || tk.symbol || idx}
                  size="sm"
                  variant="light"
                  color={tk.symbol === 'USDC' || tk.symbol === 'USDT' ? 'blue' : tk.symbol?.includes('HMND') ? 'cyan' : 'violet'}
                  style={{ fontWeight: 700 }}
                >
                  {tk.symbol}: {Number(tk.balance).toLocaleString(locStr, { maximumFractionDigits: 4 })}
                </Badge>
              ))}
            </Group>
          </Paper>
        )}

        {/* Çift Katman Eşleşmesi (Varsa) */}
        {data?.crossLayer?.hasLink && (
          <Paper p="sm" style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
            <Group justify="space-between" mb={4}>
              <Text size="xs" fw={700} c="violet">🔗 {lang === 'tr' ? 'Bağlı Çift Katman Kimliği:' : 'Linked Dual-Layer Address:'}</Text>
              <Badge size="xs" color="violet">
                {data.crossLayer.linkedAddresses?.[0]?.swapCount || 0} {lang === 'tr' ? 'Köprü Takası' : 'Bridge Swaps'}
              </Badge>
            </Group>
            <Text size="xs" fw={700} className="font-mono" c="indigo" style={{ wordBreak: 'break-all' }}>
              {data.crossLayer.linkedAddresses?.[0]?.linkedAddress}
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              {lang === 'tr'
                ? `Toplam ${formatHMND(data.crossLayer.linkedAddresses?.[0]?.totalSwappedHmnd, lang)} köprü transferi yapılmıştır.`
                : `Total ${formatHMND(data.crossLayer.linkedAddresses?.[0]?.totalSwappedHmnd, lang)} transferred across bridge.`}
            </Text>
          </Paper>
        )}

        {/* Validatör Rozeti */}
        {data?.isValidator && (
          <Paper p="sm" style={{ background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
            <Text size="xs" fw={700} c="cyan">🧬 {lang === 'tr' ? 'Aktif Biyometrik Doğrulayıcı (Proof-of-Humanity)' : 'Active Biometric Validator (Proof-of-Humanity)'}</Text>
            <Text size="xs" c="dimmed" mt={4}>
              {lang === 'tr'
                ? `Üretilen Blok: ${data?.validatorStats?.blocksAuthored || 0} | Biyometri Onayı: ${data?.validatorStats?.bioauthCount || 0}`
                : `Blocks Authored: ${data?.validatorStats?.blocksAuthored || 0} | Bioauth Count: ${data?.validatorStats?.bioauthCount || 0}`}
            </Text>
            <Group gap="xs" mt={6}>
              <Badge size="xs" color="cyan" variant="light">
                FeesPot: {formatHMND(data?.validatorStats?.totalPayoutHmnd || 0, lang)} ({data?.validatorStats?.payoutRounds || 0} {lang === 'tr' ? 'tur' : 'rounds'})
              </Badge>
            </Group>
          </Paper>
        )}

        <Divider my="xs" />

        {/* Eylem Butonları */}
        <Stack gap="xs">
          <Button
            color="green"
            leftSection={<IconBook size={16} />}
            onClick={() => {
              onOpenLedger(address);
              onClose();
            }}
          >
            {t('quickPeekOpenLedger')} ↗
          </Button>

          <Button
            variant="light"
            color="violet"
            leftSection={<IconGitFork size={16} />}
            onClick={() => {
              onOpenTrail(address);
              onClose();
            }}
          >
            {t('quickPeekTraceMoney')}
          </Button>
        </Stack>
      </Stack>
    </Drawer>
  );
}
