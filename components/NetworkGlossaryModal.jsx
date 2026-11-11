'use client';
import {
  Modal,
  Title,
  Text,
  Group,
  Stack,
  Card,
  ThemeIcon,
  Badge,
  SimpleGrid,
  Tabs,
  Divider,
  Code,
  Box,
} from '@mantine/core';
import {
  IconDna,
  IconCoins,
  IconFingerprint,
  IconArrowsExchange,
  IconShieldCheck,
  IconClock,
  IconFlame,
  IconHelpCircle,
} from '@tabler/icons-react';
import { useLanguage } from './LanguageContext';

export default function NetworkGlossaryModal({ opened, onClose }) {
  const { t } = useLanguage();

  const GLOSSARY_ITEMS = [
    {
      id: 'poh',
      title: 'Proof-of-Humanity (1 İnsan = 1 Düğüm)',
      badge: 'Konsensüs',
      color: 'cyan',
      icon: IconDna,
      summary: 'Stake miktarı ne kadar büyük olursa olsun kimsenin ağda fazladan oy veya blok hakkı elde edemediği eşitlikçi konsensüs modelidir.',
      details: 'Humanode ağında her validatör tekil bir insana aittir. Zenginlik (PoS) veya saf işlem gücü (PoW) değil, kriptografik olarak kanıtlanmış tekil insan varlığı doğrulama yetkisini belirler.',
    },
    {
      id: 'bioauth',
      title: 'Biyometrik Doğrulama & 168 Saat (42 Epoch)',
      badge: 'Doğrulama',
      color: 'blue',
      icon: IconClock,
      summary: 'Validatörlerin insan olduklarını ve aktifliklerini ispatladıkları periyodik biyometrik döngüdür.',
      details: 'Her validatörün bioauth süresi 168 saat (yaklaşık 7 gün / 42 Epoch) olarak geri sayar. Bu süre dolmadan validatör yüz canlılık testini (liveness) yenilemelidir; aksi takdirde düğüm pasife düşer.',
    },
    {
      id: 'feespot',
      title: 'FeesPot (Ücret Dağıtım Havuzu)',
      badge: 'Ekonomi',
      color: 'teal',
      icon: IconCoins,
      summary: 'Ağ genelinde toplanan işlem ve transfer ücretlerinin biriktiği merkezi olmayan akıllı havuzdur.',
      details: 'FeesPot bakiyesi periyodik dağıtım turlarında (Distribution Rounds) tüm aktif 89 biyometrik düğüme mutlak eşit paylarla aktarılır. Aynı zamanda enflasyonsuz tokenomiyi desteklemek adına toplanan ücretlerin bir kısmı kalıcı olarak yakılır (Burn).',
    },
    {
      id: 'biomapper',
      title: 'Biomapper (Çapraz Zincir Kimlik)',
      badge: 'Çapraz Zincir',
      color: 'indigo',
      icon: IconFingerprint,
      summary: 'Humanode biyometrisini Ethereum, Arbitrum, Optimism, Polygon gibi 25+ farklı EVM ağına güvenle bağlayan kimlik köprüsüdür.',
      details: 'Kullanıcının biyometrik verisi hiçbir zaman ağa sızdırılmaz. Sıfır bilgi kanıtı ve kriptografik eşleme ile kullanıcının harici bir ağdaki cüzdanının tekil bir insana ait olduğu doğrulanır (Sybil saldırılarına karşı koruma).',
    },
    {
      id: 'dual_layer',
      title: 'Substrate & EVM Çift Katmanı',
      badge: 'Mimari',
      color: 'violet',
      icon: IconArrowsExchange,
      summary: 'Humanode hem Substrate tabanlı yerel konsensüs katmanını hem de Ethereum Sanal Makinesini (EVM) eşzamanlı çalıştırır.',
      details: 'Substrate katmanı biyometri, validatör oturumları ve hazine gibi temel sistem extrinsics işlemlerini yönetirken; EVM katmanı standart Solidity akıllı sözleşmelerini ve ERC-20 tokenlarını yürütür.',
    },
    {
      id: 'precompile',
      title: 'Precompile 0x...0900 (Katmanlar Arası Köprü)',
      badge: 'Köprü',
      color: 'orange',
      icon: IconShieldCheck,
      summary: 'Substrate yerel bakiyesi ile EVM WeHMND bakiyesi arasında çift yönlü anlık takas sağlayan ön-derlenmiş sistem sözleşmesidir.',
      details: '0x0000000000000000000000000000000000000900 adresine gönderilen işlemler, harici bir üçüncü taraf köprüye ihtiyaç duymadan protokol düzeyinde atomik dönüşüm sağlar.',
    },
  ];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <ThemeIcon variant="light" color="cyan" size={32} radius="md">
            <IconHelpCircle size={20} />
          </ThemeIcon>
          <Box>
            <Title order={4} style={{ color: '#f0f6fc', fontWeight: 700 }}>
              Humanode Ağ Kılavuzu & Terimler Sözlüğü
            </Title>
            <Text size="xs" c="dimmed">
              Proof-of-Humanity ve Çift Katmanlı Blokzincir Kavramları Rehberi
            </Text>
          </Box>
        </Group>
      }
      size="min(1000px, 95vw)"
      centered
      radius="md"
      styles={{
        content: {
          maxWidth: '1000px',
          width: '95vw',
          border: '1px solid rgba(56, 189, 248, 0.28)',
          borderRadius: 14,
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 30px rgba(56, 189, 248, 0.12)',
        },
        header: {
          backgroundColor: '#0d1117',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '16px 20px',
        },
        body: {
          backgroundColor: '#0a0d12',
          padding: '20px',
        },
      }}
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Humanode-Trace kaşifinde gezinirken sıkça karşılaşacağınız teknik metriklerin ve ağ mekaniklerinin sadeleştirilmiş açıklamaları:
        </Text>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          {GLOSSARY_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.id}
                p="md"
                radius="md"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  transition: 'border-color 0.2s',
                }}
              >
                <Group justify="space-between" align="flex-start" mb="xs">
                  <Group gap="xs">
                    <ThemeIcon variant="light" color={item.color} size={28} radius="md">
                      <Icon size={16} />
                    </ThemeIcon>
                    <Text size="sm" fw={700} style={{ color: '#f0f6fc' }}>
                      {item.title}
                    </Text>
                  </Group>
                  <Badge size="xs" variant="outline" color={item.color}>
                    {item.badge}
                  </Badge>
                </Group>

                <Text size="xs" c="dimmed" mb="xs" style={{ lineHeight: 1.5 }}>
                  {item.summary}
                </Text>

                <Box
                  p="xs"
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: 6,
                    borderLeft: `2px solid var(--mantine-color-${item.color}-6)`,
                  }}
                >
                  <Text size="xs" style={{ color: '#c9d1d9', lineHeight: 1.4 }}>
                    {item.details}
                  </Text>
                </Box>
              </Card>
            );
          })}
        </SimpleGrid>

        <Divider my="xs" color="rgba(255, 255, 255, 0.08)" />

        <Group justify="space-between" align="center">
          <Group gap="xs">
            <Badge variant="dot" color="teal">Ağ Durumu: Canlı (89 Düğüm)</Badge>
            <Badge variant="outline" color="gray">Chain ID: 5241 (0x1479)</Badge>
          </Group>
          <Text size="xs" c="dimmed">
            Humanode-Trace Forensic & Explorer Engine
          </Text>
        </Group>
      </Stack>
    </Modal>
  );
}
