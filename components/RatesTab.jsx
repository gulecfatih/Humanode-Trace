'use client';
import { useState, useEffect } from 'react';
import { Paper, Title, Text, Table, Badge, Group, Button, Box } from '@mantine/core';
import { IconTrendingUp, IconRefresh } from '@tabler/icons-react';
import { useLanguage } from './LanguageContext';
import { useModuleFields } from './ModuleLayout';

import { formatUSD } from './formatters';
import AmountDisplay from './ui/AmountDisplay';

export default function RatesTab() {
  const { lang } = useLanguage();
  const { t, fields } = useModuleFields();
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const fetchRates = () => {
    setLoading(true);
    fetch('/api/historical-rates')
      .then((res) => res.json())
      .then((resData) => {
        setRates(resData.rates || resData || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const handleSync = () => {
    setSyncing(true);
    fetch('/api/historical-rates/sync', { method: 'POST' })
      .then((res) => res.json())
      .then(() => {
        fetchRates();
        setSyncing(false);
      })
      .catch(() => setSyncing(false));
  };

  const locStr = lang || undefined;

  return (
    <Paper p="md" style={{ background: '#f5e6d8', border: '1px solid #d9cbbe', borderTop: '2px solid #111111', borderRadius: 0 }}>
      <Group justify="space-between" mb="md" wrap="wrap">
        <div>
          <Title order={4} c="#111111" style={{ fontFamily: "var(--font-serif), Georgia, serif", fontWeight: 700 }}>📈 {t('ratesTitle')}</Title>
          <Text size="xs" c="dimmed">
            {t('ratesSubtitle')}
          </Text>
        </div>
        <Button size="xs" color="teal" leftSection={<IconRefresh size={14} />} onClick={handleSync} loading={syncing}>
          {t('rates_syncRates')}
        </Button>
      </Group>

      <Box style={{ overflowX: 'auto' }}>
        <Table highlightOnHover verticalSpacing="xs">
          <Table.Thead
            style={{
              backgroundColor: '#f5e6d8',
              borderBottom: '2px solid #111111',
            }}
          >
            <Table.Tr style={{ borderBottom: '2px solid #111111' }}>
              <Table.Th>{t('rates_date')}</Table.Th>
              <Table.Th>{t('rates_priceUsd')}</Table.Th>
              <Table.Th>{t('rates_source')}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rates.slice(0, 50).map((r, idx) => (
              <Table.Tr key={r.day || idx} style={{ borderBottom: '1px solid #d9cbbe' }}>
                <Table.Td className="font-mono">{r.day}</Table.Td>
                <Table.Td>
                  <AmountDisplay
                    value={(r.price_usd || 0).toLocaleString(locStr, { minimumFractionDigits: 4, maximumFractionDigits: 6 })}
                    unit="USD"
                    sign="$"
                    color="#10b981"
                    size="xs"
                  />
                </Table.Td>
                <Table.Td>
                  <Badge size="xs" color="indigo">{r.source || 'CoinGecko'}</Badge>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Box>
    </Paper>
  );
}
