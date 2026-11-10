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

  const locStr = lang;

  return (
    <Paper p="md" className="glass-panel" style={{ borderRadius: 8 }}>
      <Group justify="space-between" mb="md" wrap="wrap">
        <div>
          <Title order={4} c="white">📈 {t('ratesTitle')}</Title>
          <Text size="xs" c="dimmed">
            {t('ratesSubtitle')}
          </Text>
        </div>
        <Button size="xs" color="cyan" leftSection={<IconRefresh size={14} />} onClick={handleSync} loading={syncing}>
          {t('rates_syncRates')}
        </Button>
      </Group>

      <Box style={{ overflowX: 'auto' }}>
        <Table striped highlightOnHover verticalSpacing="xs">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('rates_date')}</Table.Th>
              <Table.Th>{t('rates_priceUsd')}</Table.Th>
              <Table.Th>{t('rates_source')}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rates.slice(0, 50).map((r, idx) => (
              <Table.Tr key={r.day || idx}>
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
