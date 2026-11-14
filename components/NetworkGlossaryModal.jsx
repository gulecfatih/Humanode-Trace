'use client';
import { useMemo } from 'react';
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
  Divider,
  Box,
} from '@mantine/core';
import {
  IconDna,
  IconCoins,
  IconFingerprint,
  IconArrowsExchange,
  IconShieldCheck,
  IconClock,
  IconHelpCircle,
} from '@tabler/icons-react';
import { useLanguage } from './LanguageContext';

export default function NetworkGlossaryModal({ opened, onClose }) {
  const { t } = useLanguage();

  const glossaryItems = useMemo(
    () => [
      {
        id: 'poh',
        title: t('glossary_pohTitle'),
        badge: t('glossary_pohBadge'),
        color: 'cyan',
        icon: IconDna,
        summary: t('glossary_pohSummary'),
        details: t('glossary_pohDetails'),
      },
      {
        id: 'bioauth',
        title: t('glossary_bioauthTitle'),
        badge: t('glossary_bioauthBadge'),
        color: 'blue',
        icon: IconClock,
        summary: t('glossary_bioauthSummary'),
        details: t('glossary_bioauthDetails'),
      },
      {
        id: 'feespot',
        title: t('glossary_feespotTitle'),
        badge: t('glossary_feespotBadge'),
        color: 'teal',
        icon: IconCoins,
        summary: t('glossary_feespotSummary'),
        details: t('glossary_feespotDetails'),
      },
      {
        id: 'biomapper',
        title: t('glossary_biomapperTitle'),
        badge: t('glossary_biomapperBadge'),
        color: 'indigo',
        icon: IconFingerprint,
        summary: t('glossary_biomapperSummary'),
        details: t('glossary_biomapperDetails'),
      },
      {
        id: 'dual_layer',
        title: t('glossary_dualLayerTitle'),
        badge: t('glossary_dualLayerBadge'),
        color: 'violet',
        icon: IconArrowsExchange,
        summary: t('glossary_dualLayerSummary'),
        details: t('glossary_dualLayerDetails'),
      },
      {
        id: 'precompile',
        title: t('glossary_subToEvmTitle'),
        badge: t('glossary_subToEvmBadge'),
        color: 'orange',
        icon: IconShieldCheck,
        summary: t('glossary_subToEvmSummary'),
        details: t('glossary_subToEvmDetails'),
      },
    ],
    [t]
  );

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <ThemeIcon variant="light" color="teal" size={32} radius="xs">
            <IconHelpCircle size={20} />
          </ThemeIcon>
          <Box>
            <Title order={4} style={{ color: '#111111', fontWeight: 700, fontFamily: "var(--font-serif)" }}>
              {t('glossary_modalTitle')}
            </Title>
            <Text size="xs" c="#554f47">
              {t('glossary_modalSubtitle')}
            </Text>
          </Box>
        </Group>
      }
      size="min(1000px, 95vw)"
      centered
      radius="xs"
      styles={{
        content: {
          maxWidth: '1000px',
          width: '95vw',
          border: '2px solid #111111',
          borderRadius: 0,
          background: '#fff1e5',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
        },
        header: {
          backgroundColor: '#f5e6d8',
          borderBottom: '2px solid #111111',
          padding: '16px 20px',
        },
        body: {
          backgroundColor: '#fff1e5',
          padding: '20px',
        },
      }}
    >
      <Stack gap="md">
        <Text size="sm" c="#554f47">
          {t('glossary_modalIntro')}
        </Text>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          {glossaryItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.id}
                p="md"
                style={{
                  background: '#f5e6d8',
                  border: '1px solid #d9cbbe',
                  borderTop: '2px solid #111111',
                  borderRadius: 0,
                  boxShadow: 'none',
                }}
              >
                <Group justify="space-between" align="flex-start" mb="xs">
                  <Group gap="xs">
                    <ThemeIcon variant="light" color={item.color} size={28} radius="xs">
                      <Icon size={16} />
                    </ThemeIcon>
                    <Text size="sm" fw={700} style={{ color: '#111111', fontFamily: "var(--font-serif)" }}>
                      {item.title}
                    </Text>
                  </Group>
                  <Badge size="xs" variant="outline" color={item.color}>
                    {item.badge}
                  </Badge>
                </Group>

                <Text size="xs" c="#554f47" mb="xs" style={{ lineHeight: 1.5 }}>
                  {item.summary}
                </Text>

                <Box
                  p="xs"
                  style={{
                    backgroundColor: '#fff1e5',
                    borderRadius: 0,
                    border: '1px solid #d9cbbe',
                    borderLeft: `3px solid var(--mantine-color-${item.color}-6)`,
                  }}
                >
                  <Text size="xs" style={{ color: '#24201c', lineHeight: 1.4 }}>
                    {item.details}
                  </Text>
                </Box>
              </Card>
            );
          })}
        </SimpleGrid>

        <Divider my="xs" color="#d9cbbe" />

        <Group justify="space-between" align="center">
          <Group gap="xs">
            <Badge variant="dot" color="teal">
              {t('glossary_networkStatusLive', { count: 89 })}
            </Badge>
            <Badge variant="outline" color="gray">
              Chain ID: 5241 (0x1479)
            </Badge>
          </Group>
          <Text size="xs" c="dimmed">
            Humanode-Trace Forensic & Explorer Engine
          </Text>
        </Group>
      </Stack>
    </Modal>
  );
}
