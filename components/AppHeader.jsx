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
        // Fallback default live stats values
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
          borderBottom: '2px solid #111111',
          background: '#fff1e5',
        }}
      >
        <Group justify="space-between" align="center" style={{ width: '100%' }}>
          <Group gap="md" align="center">
            <Group gap="sm" align="center">
              <Box
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 0,
                  background: '#111111',
                  border: '1px solid #111111',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 2,
                }}
              >
                <img
                  src="/icon.png"
                  alt="Humanode"
                  width={20}
                  height={20}
                  style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
                />
              </Box>
              <Title order={4} style={{ fontFamily: "var(--font-masthead), 'Cinzel', serif", letterSpacing: 0.5, color: '#111111', fontWeight: 900, textTransform: 'uppercase' }}>
                {t('appTitle')}
              </Title>
            </Group>

            {/* Live Network Pulse Badge */}
            <Tooltip label={t('header_dualLayerStatusTooltip')}>
              <Badge
                size="md"
                visibleFrom="sm"
                leftSection={
                  <Box
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      backgroundColor: '#0d7680',
                    }}
                  />
                }
                style={{
                  cursor: 'pointer',
                  background: '#e4f1f0',
                  border: '1px solid #0d7680',
                  borderRadius: 2,
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  fontFamily: "var(--font-sans), 'Inter', sans-serif",
                  color: '#0d7680',
                }}
                onClick={() => setGlossaryOpen(true)}
              >
                #{blockCount} • {t('header_nodeCount', { count: validatorCount })}
              </Badge>
            </Tooltip>
          </Group>

          <Group gap="sm" align="center">
            {/* Dynamic SQL Dictionary Language Switcher */}
            <LanguageSwitcher size="sm" />

            {/* Network Guide & Terminology Glossary Button */}
            <Tooltip label={t('header_glossaryTooltip')}>
              <ActionIcon
                size="lg"
                onClick={() => setGlossaryOpen(true)}
                aria-label={t('header_networkGuide')}
                className="neo-btn"
                style={{ background: '#fff1e5', color: '#111111', border: '1px solid #111111', borderRadius: 0 }}
              >
                <IconHelpCircle size={18} stroke={2} />
              </ActionIcon>
            </Tooltip>

            {/* Quick Global Search Button */}
            <Button
              size="sm"
              leftSection={<IconSearch size={16} stroke={2} />}
              rightSection={<Kbd size="xs" style={{ background: '#f5e6d8', color: '#111111', border: '1px solid #c9b9aa', borderRadius: 0 }}>Ctrl + K</Kbd>}
              onClick={onOpenCommandPalette}
              className="neo-btn"
              style={{ background: '#fff1e5', color: '#111111', border: '1px solid #111111', borderRadius: 0 }}
            >
              {t('search')}
            </Button>

            {/* Yenile Butonu */}
            <Tooltip label={t('refresh')}>
              <ActionIcon size="lg" onClick={onRefresh} className="neo-btn" style={{ background: '#fff1e5', color: '#111111', border: '1px solid #111111', borderRadius: 0 }}>
                <IconRefresh size={18} stroke={2} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </Box>

      {/* Network Guide & Glossary Modal Dialog */}
      <NetworkGlossaryModal
        opened={glossaryOpen}
        onClose={() => setGlossaryOpen(false)}
      />
    </>
  );
}
