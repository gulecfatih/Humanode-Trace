'use client';
import { useState, useEffect } from 'react';
import { Group, Title, Button, Kbd, ActionIcon, Tooltip, Box, Badge } from '@mantine/core';
import { IconSearch, IconRefresh, IconHelpCircle } from '@tabler/icons-react';
import { useLanguage, LanguageSwitcher } from './LanguageContext';
import NetworkGlossaryModal from './NetworkGlossaryModal';

export default function AppHeader({
  onOpenCommandPalette,
  onRefresh,
}) {
  const { t } = useLanguage();
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [blockCount, setBlockCount] = useState('628,827');
  const [validatorCount, setValidatorCount] = useState(89);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/stats')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted || !data) return;
        if (data.total_blocks) {
          setBlockCount(Number(data.total_blocks).toLocaleString());
        }
      })
      .catch(() => {
        // Fallback varsayılan canlı veri değerleri
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <Box
        px="md"
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: '#0d1117',
        }}
      >
        <Group justify="space-between" align="center" style={{ width: '100%' }}>
          <Group gap="md" align="center">
            <Group gap="sm" align="center">
              <Box
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15) 0%, rgba(37, 99, 235, 0.2) 100%)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 12px rgba(56, 189, 248, 0.25)',
                  overflow: 'hidden',
                  padding: 2,
                }}
              >
                <img
                  src="/icon.png"
                  alt="Humanode"
                  width={20}
                  height={20}
                  style={{ objectFit: 'contain' }}
                />
              </Box>
              <Title order={4} style={{ letterSpacing: -0.3, color: '#f0f6fc', fontWeight: 700 }}>
                {t('appTitle') || 'Humanode-Trace'}
              </Title>
            </Group>

            {/* Canlı Ağ Nabzı Rozeti */}
            <Tooltip label="Humanode Çift Katmanlı Ağ Durumu: Senkronize ve Canlı">
              <Badge
                variant="light"
                color="teal"
                size="sm"
                visibleFrom="sm"
                leftSection={
                  <Box
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: '#10b981',
                      boxShadow: '0 0 8px #10b981',
                    }}
                  />
                }
                style={{
                  cursor: 'pointer',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  textTransform: 'none',
                  fontWeight: 600,
                  color: '#34d399',
                }}
                onClick={() => setGlossaryOpen(true)}
              >
                Blok #{blockCount} • {validatorCount} Düğüm
              </Badge>
            </Tooltip>
          </Group>

          <Group gap="sm" align="center">
            {/* Dil Seçeneği: Dinamik SQL Sözlüğü */}
            <LanguageSwitcher size="xs" />

            {/* Ağ Kılavuzu & Terimler Sözlüğü Butonu */}
            <Tooltip label="Ağ Kılavuzu & Terimler Sözlüğü">
              <ActionIcon
                variant="default"
                size="md"
                onClick={() => setGlossaryOpen(true)}
                aria-label="Ağ Kılavuzu"
                style={{ color: '#38bdf8' }}
              >
                <IconHelpCircle size={16} />
              </ActionIcon>
            </Tooltip>

            {/* Hızlı Arama Butonu */}
            <Button
              variant="default"
              size="xs"
              leftSection={<IconSearch size={14} />}
              rightSection={<Kbd size="xs">Ctrl + K</Kbd>}
              onClick={onOpenCommandPalette}
            >
              {t('search') || 'Ara'}
            </Button>

            {/* Yenile Butonu */}
            <Tooltip label={t('refresh') || 'Yenile'}>
              <ActionIcon variant="default" size="md" onClick={onRefresh}>
                <IconRefresh size={15} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </Box>

      {/* Ağ Kılavuzu & Sözlük Modalı */}
      <NetworkGlossaryModal
        opened={glossaryOpen}
        onClose={() => setGlossaryOpen(false)}
      />
    </>
  );
}
