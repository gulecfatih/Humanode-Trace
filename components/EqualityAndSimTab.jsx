'use client';
import { useState, useEffect, useMemo } from 'react';
import {
  Paper,
  Stack,
  Title,
  Text,
  Badge,
  Group,
  Box,
  SimpleGrid,
  Table,
  Progress,
  Tooltip,
  Loader,
  Center,
  ThemeIcon,
  Divider,
} from '@mantine/core';
import {
  IconScale,
  IconShieldLock,
  IconUsers,
  IconCoins,
  IconTrendingUp,
  IconDna,
} from '@tabler/icons-react';
import { formatHMND, formatUSD, formatNumber } from './formatters';
import { useLanguage } from './LanguageContext';
import { useModuleFields } from './ModuleLayout';
import KpiStatCard from './ui/KpiStatCard';
import AmountDisplay from './ui/AmountDisplay';

export default function EqualityAndSimTab() {
  const { lang } = useLanguage();
  const { t, fields } = useModuleFields();
  const locStr = t('whales_enUs');

  // Equality Metrics State
  const [equalityData, setEqualityData] = useState(null);
  const [eqLoading, setEqLoading] = useState(true);

  // Load initial equality data
  useEffect(() => {
    let mounted = true;
    fetch('/api/equality-metrics')
      .then((res) => res.json())
      .then((data) => {
        if (mounted) {
          setEqualityData(data);
          setEqLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching equality metrics:', err);
        if (mounted) setEqLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Computed concentration slices from object
  const slices = useMemo(() => {
    const wd = equalityData?.wealthDistribution;
    const totalWealth = equalityData?.totalTrackedWealthHmnd || 0;
    const totalHolders = equalityData?.totalHoldersCount || 15358;
    if (!wd) return [];

    return [
      {
        label: t('sim_top01'),
        range: `~${Math.max(1, Math.round(totalHolders * 0.001))} ${t('whales_wallets')}`,
        percentage: wd.top01PercentShare || 0,
        totalHmnd: (totalWealth * (wd.top01PercentShare || 0)) / 100,
        color: 'red',
      },
      {
        label: t('sim_top1'),
        range: `~${Math.round(totalHolders * 0.01)} ${t('whales_wallets')}`,
        percentage: wd.top1PercentShare || 0,
        totalHmnd: (totalWealth * (wd.top1PercentShare || 0)) / 100,
        color: 'orange',
      },
      {
        label: t('sim_top5'),
        range: `~${Math.round(totalHolders * 0.05)} ${t('whales_wallets')}`,
        percentage: wd.top5PercentShare || 0,
        totalHmnd: (totalWealth * (wd.top5PercentShare || 0)) / 100,
        color: 'yellow',
      },
      {
        label: t('sim_top10'),
        range: `~${Math.round(totalHolders * 0.1)} ${t('whales_wallets')}`,
        percentage: wd.top10PercentShare || 0,
        totalHmnd: (totalWealth * (wd.top10PercentShare || 0)) / 100,
        color: 'cyan',
      },
      {
        label: t('sim_bottom90'),
        range: `~${Math.round(totalHolders * 0.9)} ${t('whales_wallets')}`,
        percentage: wd.bottom90PercentShare || 0,
        totalHmnd: (totalWealth * (wd.bottom90PercentShare || 0)) / 100,
        color: 'blue',
      },
    ];
  }, [equalityData, lang]);

  // SVG dimensions for Lorenz curve
  const lorenzPoints = equalityData?.lorenzCurve || [];
  const svgPath = useMemo(() => {
    if (!lorenzPoints.length) return '';
    // Map percentile (0-100) to svg X (30-370), wealth (0-100) to svg Y (270-30)
    return lorenzPoints
      .map((pt, idx) => {
        const x = 40 + (pt.percentile / 100) * 320;
        const y = 260 - (pt.cumulativeWealthPercent / 100) * 220;
        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }, [lorenzPoints]);

  if (eqLoading) {
    return (
      <Center py={80}>
        <Stack align="center" gap="sm">
          <Loader color="cyan" size="lg" />
          <Text size="sm" c="dimmed">
            {t('sim_calculatingWealthDistributionAnd')}
          </Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Stack gap="lg">
      {/* Header */}
      <Paper
        p="md"
        radius="md"
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(56, 189, 248, 0.08) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
        }}
      >
        <Group justify="space-between" align="center">
          <Group gap="sm">
            <ThemeIcon size={38} radius="md" color="teal" variant="light">
              <IconScale size={22} />
            </ThemeIcon>
            <div>
              <Title order={3} fw={700} c="white">
                {t('sim_biometricEqualityDistributionIndex')}
              </Title>
              <Text size="xs" c="dimmed">
                {t('sim_humanodeProofOfHumanity')}
              </Text>
            </div>
          </Group>
          <Badge size="lg" variant="filled" color="teal">
            1 HUMAN = 1 VOTE
          </Badge>
        </Group>
      </Paper>

      {/* KPI Cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
        <KpiStatCard
          title={t('sim_giniCoefficient')}
          value={equalityData?.giniCoefficient ? formatNumber(equalityData.giniCoefficient, { minDecimals: 2, maxDecimals: 2 }) : '0,84'}
          unit="/ 1.00"
          color="cyan"
          icon={IconScale}
          badge={equalityData?.giniRating || 'Konsantrasyon'}
          badgeColor="yellow"
          subtext={equalityData?.giniDescription || (t('sim_wealthDistributionMeasure'))}
        />

        <KpiStatCard
          title={t('sim_nakamoto51')}
          value={equalityData?.nakamoto51Coefficient || 25}
          unit={t('sim_humans')}
          color="teal"
          icon={IconShieldLock}
          badge="Proof-of-Humanity"
          badgeColor="teal"
          subtext={
            t('sim_requires25BiologicalIndividuals')
          }
        />

        <KpiStatCard
          title={t('sim_totalTokenHolders')}
          value={equalityData?.totalHoldersCount ? formatNumber(equalityData.totalHoldersCount) : '15.822'}
          unit={t('whales_wallets')}
          color="violet"
          icon={IconUsers}
          subtext={`${t('sim_trackedWealth')} ${formatHMND(equalityData?.totalTrackedWealthHmnd || 0, { locale: lang })}`}
        />

        <KpiStatCard
          title={t('sim_activeValidators')}
          value={equalityData?.activeValidatorsCount || 48}
          unit={t('validators_nodes')}
          color="blue"
          icon={IconDna}
          badge="1 HUMAN = 1 VOTE"
          badgeColor="blue"
          subtext={`${t('sim_334Censorship')} ${equalityData?.nakamoto33Coefficient || 17} ${t('validators_nodes')}`}
        />
      </SimpleGrid>

      {/* Lorenz Curve & Wealth Distribution Slices */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        {/* Lorenz Curve SVG Chart */}
        <Paper
          p="md"
          radius="md"
          style={{ background: '#121824', border: '1px solid rgba(255, 255, 255, 0.07)' }}
        >
          <Group justify="space-between" mb="xs">
            <Group gap="xs">
              <IconScale size={18} color="#38bdf8" />
              <Text fw={700} size="sm" c="white">
                {t('sim_lorenzCurveWealthEquality')}
              </Text>
            </Group>
            <Group gap="xs">
              <Badge size="xs" color="gray" variant="outline">
                --- {t('sim_perfectEquality45')}
              </Badge>
              <Badge size="xs" color="cyan" variant="filled">
                — {t('sim_actualHumanodeCurve')}
              </Badge>
            </Group>
          </Group>

          <Box style={{ width: '100%', height: 280, position: 'relative' }}>
            <svg
              viewBox="0 0 380 280"
              style={{ width: '100%', height: '100%', overflow: 'visible' }}
            >
              {/* Grid Lines */}
              <line x1="40" y1="260" x2="360" y2="260" stroke="#334155" strokeWidth="1" />
              <line x1="40" y1="40" x2="40" y2="260" stroke="#334155" strokeWidth="1" />
              <line x1="40" y1="150" x2="360" y2="150" stroke="#1e293b" strokeDasharray="4 4" strokeWidth="1" />
              <line x1="200" y1="40" x2="200" y2="260" stroke="#1e293b" strokeDasharray="4 4" strokeWidth="1" />
              <line x1="360" y1="40" x2="360" y2="260" stroke="#1e293b" strokeDasharray="4 4" strokeWidth="1" />

              {/* 45 Degree Line of Perfect Equality */}
              <line
                x1="40"
                y1="260"
                x2="360"
                y2="40"
                stroke="#64748b"
                strokeWidth="1.5"
                strokeDasharray="5 5"
              />

              {/* Lorenz Shaded Area (Gini Gap) */}
              {lorenzPoints.length > 0 && (
                <path
                  d={`${svgPath} L 360 260 L 40 260 Z`}
                  fill="rgba(56, 189, 248, 0.12)"
                />
              )}

              {/* Actual Lorenz Curve Line */}
              {svgPath && (
                <path
                  d={svgPath}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              )}

              {/* Data points */}
              {lorenzPoints.filter((_, i) => i % 2 === 0).map((pt, idx) => {
                const cx = 40 + (pt.percentile / 100) * 320;
                const cy = 260 - (pt.cumulativeWealthPercent / 100) * 220;
                return (
                  <circle
                    key={idx}
                    cx={cx}
                    cy={cy}
                    r={3}
                    fill="#38bdf8"
                    stroke="#0b0f17"
                    strokeWidth="1.5"
                  />
                );
              })}

              {/* Axis Labels */}
              <text x="200" y="278" fill="#64748b" fontSize="10" textAnchor="middle">
                {t('sim_cumulativeOfWallets0')}
              </text>
              <text
                x="-150"
                y="14"
                fill="#64748b"
                fontSize="10"
                textAnchor="middle"
                transform="rotate(-90)"
              >
                {t('sim_cumulativeOfWealth')}
              </text>
            </svg>
          </Box>
        </Paper>

        {/* Wealth Concentration Slices */}
        <Paper
          p="md"
          radius="md"
          style={{ background: '#121824', border: '1px solid rgba(255, 255, 255, 0.07)' }}
        >
          <Group justify="space-between" mb="xs">
            <Group gap="xs">
              <IconCoins size={18} color="#eab308" />
              <Text fw={700} size="sm" c="white">
                {t('sim_wealthConcentrationBrackets')}
              </Text>
            </Group>
            <Badge size="xs" color="yellow" variant="light">
              15.822 Cüzdan
            </Badge>
          </Group>

          <Table verticalSpacing="xs" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ color: '#94a3b8', fontSize: 12 }}>{t('sim_tier')}</Table.Th>
                <Table.Th style={{ color: '#94a3b8', fontSize: 12 }}>{t('sim_holders')}</Table.Th>
                <Table.Th style={{ color: '#94a3b8', fontSize: 12 }}>{t('sim_totalHmnd')}</Table.Th>
                <Table.Th style={{ color: '#94a3b8', fontSize: 12 }}>{t('sim_share')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {slices.map((slice, idx) => (
                <Table.Tr key={idx}>
                  <Table.Td>
                    <Group gap={6}>
                      <Badge
                        size="xs"
                        color={slice.color}
                        variant="filled"
                      >
                        {slice.label}
                      </Badge>
                      <Text size="xs" c="dimmed">
                        {slice.range}
                      </Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" fw={600} c="white">
                      {slice.range}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" c="teal" fw={600}>
                      {formatHMND(slice.totalHmnd)}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ minWidth: 100 }}>
                    <Group gap="xs" wrap="nowrap">
                      <Progress
                        value={slice.percentage}
                        color={slice.color}
                        size="sm"
                        radius="xl"
                        style={{ flex: 1 }}
                      />
                      <Text size="xs" fw={700} c="white">
                        %{slice.percentage.toFixed(1)}
                      </Text>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      </SimpleGrid>
    </Stack>
  );
}
