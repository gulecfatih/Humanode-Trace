'use client';
import { useState, useEffect, useMemo } from 'react';
import { Paper, Title, Text, Group, Box, SimpleGrid, Tooltip, Button } from '@mantine/core';
import { IconFlame } from '@tabler/icons-react';
import { formatHMND, formatUSD, formatFee } from './formatters';
import { useLanguage } from './LanguageContext';
import { useModuleFields } from './ModuleLayout';

export default function HeatmapTab({ onSelectDate }) {
  const { lang } = useLanguage();
  const { t, fields } = useModuleFields();
  const [year, setYear] = useState('2026');
  const [heatmapData, setHeatmapData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/heatmap?year=${year}`)
      .then((res) => res.json())
      .then((resData) => {
        setHeatmapData(resData || null);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Heatmap load error:', err);
        setLoading(false);
      });
  }, [year]);

  const days = heatmapData?.dayMap
    ? Object.values(heatmapData.dayMap)
    : (Array.isArray(heatmapData?.days) ? heatmapData.days : []);

  // Kullanıcı İsteği: Yeşillik işlem sayısına göre değil, alınan/yakılan gas ücretine göre belirlenir
  const feeThresholds = useMemo(() => {
    const nonZeroFees = days
      .map((d) => Number(d.total_fees || d.fee || 0))
      .filter((f) => f > 0)
      .sort((a, b) => a - b);

    if (nonZeroFees.length === 0) {
      return { q1: 10, q2: 50, q3: 150 };
    }
    const q1 = nonZeroFees[Math.floor(nonZeroFees.length * 0.25)] || 10;
    const q2 = nonZeroFees[Math.floor(nonZeroFees.length * 0.50)] || 50;
    const q3 = nonZeroFees[Math.floor(nonZeroFees.length * 0.80)] || 150;
    return { q1, q2, q3 };
  }, [days]);

  const yearsList = heatmapData?.years || ['2026', '2025', '2024', '2023', '2022'];
  const locStr = lang;

  return (
    <Paper p="md">
      <Group justify="space-between" mb="md" wrap="wrap" gap="sm">
        <div>
          <Group gap={8}>
            <IconFlame size={22} color="#f97316" />
            <Title order={4}>{t('heatmapTitle')}</Title>
          </Group>
          <Text size="xs" c="dimmed">
            {t('heatmapSubtitle')}
          </Text>
        </div>

        {/* Yıl Seçim Hapları */}
        <Group gap={6}>
          {yearsList.map((yr) => (
            <Button
              key={yr}
              size="xs"
              variant={year === yr ? 'filled' : 'light'}
              color={year === yr ? 'orange' : 'gray'}
              onClick={() => setYear(yr)}
            >
              {yr}
            </Button>
          ))}
        </Group>
      </Group>

      {heatmapData && (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="sm" mb="md">
          <Paper p="sm" bg="rgba(0,0,0,0.25)" style={{ borderLeft: '3px solid #f97316' }}>
            <Text size="11px" c="dimmed" tt="uppercase" fw={700}>
              {t('totalTxsYear', { year })}
            </Text>
            <Text size="lg" fw={800} c="orange" className="font-mono">
              {heatmapData.totalTx?.toLocaleString(locStr) || 0}
            </Text>
            <Text size="xs" c="dimmed">
              {t('heatmap_transactionsThroughoutTheYear')}
            </Text>
          </Paper>

          <Paper p="sm" bg="rgba(0,0,0,0.25)" style={{ borderLeft: '3px solid #eab308' }}>
            <Text size="11px" c="dimmed" tt="uppercase" fw={700}>
              {t('kpiBurnedGas')}
            </Text>
            <Text size="lg" fw={800} c="yellow" className="font-mono">
              {formatFee(heatmapData.totalFees, true, lang)}
            </Text>
            <Text size="xs" c="dimmed">≈ {formatUSD(heatmapData.totalFeesUsd || 0, lang)}</Text>
          </Paper>

          <Paper p="sm" bg="rgba(0,0,0,0.25)" style={{ borderLeft: '3px solid #06b6d4' }}>
            <Text size="11px" c="dimmed" tt="uppercase" fw={700}>
              {t('heatmap_peakGasDay')}
            </Text>
            <Text size="lg" fw={800} c="cyan" className="font-mono">
              {heatmapData.peakGasDay?.date || heatmapData.peakDay?.date || '-'}
            </Text>
            <Text size="xs" c="dimmed">
              {heatmapData.peakGasDay?.fee ? `${formatFee(heatmapData.peakGasDay.fee, true, lang)} (${(heatmapData.peakGasDay.count || 0).toLocaleString(locStr)} ${t('heatmap_txs_2')})` : (heatmapData.peakDay?.count ? `${heatmapData.peakDay.count.toLocaleString(locStr)} ${t('heatmap_txs_2')}` : '-')}
            </Text>
          </Paper>

          <Paper p="sm" bg="rgba(0,0,0,0.25)" style={{ borderLeft: '3px solid #10b981' }}>
            <Text size="11px" c="dimmed" tt="uppercase" fw={700}>
              {t('heatmap_activeDaysCount')}
            </Text>
            <Text size="lg" fw={800} c="green" className="font-mono">
              {days.length || 0} {t('heatmap_days')}
            </Text>
            <Text size="xs" c="dimmed">
              {t('daysWithActivityInYear', { year })}
            </Text>
          </Paper>
        </SimpleGrid>
      )}

      <Paper p="md" bg="rgba(0,0,0,0.35)" style={{ borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
        <Group justify="space-between" mb="xs">
          <Text size="xs" fw={700} c="dimmed">
            {t('yearActivityMap', { year })}
          </Text>
          <Text size="xs" c="dimmed">
            {t('heatmap_clickOnAnyDay')}
          </Text>
        </Group>

        <Box style={{ display: 'flex', flexWrap: 'wrap', gap: 5, padding: '10px 0' }}>
          {days.length > 0 ? (
            days.map((day, idx) => {
              const count = day.count || day.tx_count || 0;
              const fees = Number(day.total_fees || day.fee || 0);
              const dateStr = day.date || day.day || idx;

              // Yeşillik seviyesi: Alınan/yakılan gas masrafı miktarına göre
              let bg = 'rgba(255, 255, 255, 0.05)';
              if (fees > 0) {
                if (fees <= feeThresholds.q1) bg = '#0e4429'; // 1. Kademe: Düşük Gas
                else if (fees <= feeThresholds.q2) bg = '#006d32'; // 2. Kademe: Orta Gas
                else if (fees <= feeThresholds.q3) bg = '#26a641'; // 3. Kademe: Yüksek Gas
                else bg = '#39d353'; // 4. Kademe: Zirve Gas (En parlak yeşil)
              } else if (count > 0) {
                bg = '#0e4429';
              }

              const tip = t('heatmapTooltip', {
                date: dateStr,
                fee: formatFee(fees, true, lang),
                count: count.toLocaleString(locStr)
              });

              return (
                <Tooltip key={dateStr} label={tip} withArrow position="top" multiline>
                  <Box
                    onClick={() => onSelectDate?.(dateStr)}
                    style={{
                      width: 15,
                      height: 15,
                      borderRadius: 3,
                      backgroundColor: bg,
                      cursor: 'pointer',
                      transition: 'all 0.1s ease',
                      border: fees > feeThresholds.q3 ? '1px solid rgba(255,255,255,0.35)' : 'none',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.25)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                  />
                </Tooltip>
              );
            })
          ) : (
            <Text size="sm" c="dimmed" style={{ width: '100%', textAlign: 'center', padding: '40px' }}>
              {loading ? (t('heatmap_loadingHeatmapData')) : (t('noHeatmapYear', { year }))}
            </Text>
          )}
        </Box>

        <Group justify="flex-end" align="center" gap="xs" mt="md">
          <Text size="xs" c="dimmed">{t('heatmap_lowGasFee')}</Text>
          <Box style={{ width: 14, height: 14, borderRadius: 3, background: 'rgba(255,255,255,0.05)' }} title="0 HMND" />
          <Box style={{ width: 14, height: 14, borderRadius: 3, background: '#0e4429' }} title={`≤ ${feeThresholds.q1.toFixed(1)} HMND`} />
          <Box style={{ width: 14, height: 14, borderRadius: 3, background: '#006d32' }} title={`≤ ${feeThresholds.q2.toFixed(1)} HMND`} />
          <Box style={{ width: 14, height: 14, borderRadius: 3, background: '#26a641' }} title={`≤ ${feeThresholds.q3.toFixed(1)} HMND`} />
          <Box style={{ width: 14, height: 14, borderRadius: 3, background: '#39d353' }} title={`> ${feeThresholds.q3.toFixed(1)} HMND (Zirve)`} />
          <Text size="xs" c="dimmed">{t('heatmap_highGasFee')}</Text>
        </Group>
      </Paper>
    </Paper>
  );
}
