'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Paper,
  Stack,
  Group,
  Title,
  Text,
  TextInput,
  Select,
  Button,
  Badge,
  Box,
  SimpleGrid,
  Card,
  Progress,
  ActionIcon,
  Tooltip,
  Divider,
  SegmentedControl,
  Table,
} from '@mantine/core';
import {
  IconSearch,
  IconGitFork,
  IconEye,
  IconBook,
  IconShieldAlert,
  IconBuildingBank,
  IconRobot,
  IconUsers,
  IconArrowsExchange,
  IconRefresh,
  IconSitemap,
  IconLayoutList,
  IconArrowRight,
} from '@tabler/icons-react';
import { formatHMND, shortAddr } from './formatters';
import { useLanguage } from './LanguageContext';
import { useModuleFields } from './ModuleLayout';
import AddressBadge from './ui/AddressBadge';
import AmountDisplay from './ui/AmountDisplay';

function formatShortAmount(amount, locale = null) {
  const val = Number(amount);
  if (isNaN(val) || val === 0) return '0';
  const abs = Math.abs(val);
  const loc = locale || undefined;
  if (abs >= 1_000_000_000) {
    return (val / 1_000_000_000).toLocaleString(loc, { maximumFractionDigits: 1 }) + 'B';
  }
  if (abs >= 1_000_000) {
    return (val / 1_000_000).toLocaleString(loc, { maximumFractionDigits: 1 }) + 'M';
  }
  if (abs >= 1_000) {
    return (val / 1_000).toLocaleString(loc, { maximumFractionDigits: 1 }) + 'K';
  }
  return val.toLocaleString(loc, { maximumFractionDigits: 2 });
}

function computePositions(nodes, links, mode = 'hierarchical', width = 900, height = 520) {
  const positions = {};
  if (!nodes || nodes.length === 0) return positions;

  if (mode === 'radial') {
    // Katmanlı Halka Düzeni (Concentric Rings - Root merkezde, Hop 1 iç halkada, Hop 2 ebeveynine yakın dış halkada)
    const centerX = width / 2;
    const centerY = height / 2;
    const rootNode = nodes.find((n) => n.isRoot) || nodes[0];
    positions[rootNode.id] = { x: Math.round(centerX), y: Math.round(centerY) };

    const hop1Nodes = nodes.filter((n) => !n.isRoot && (n.depth === 1 || !n.depth));
    const hop2Nodes = nodes.filter((n) => !n.isRoot && n.depth >= 2);

    const hop1Angles = {};
    hop1Nodes.forEach((n, idx) => {
      const angle = (idx / (hop1Nodes.length || 1)) * 2 * Math.PI - Math.PI / 2;
      hop1Angles[n.id] = angle;
      positions[n.id] = {
        x: Math.round(centerX + Math.cos(angle) * 145),
        y: Math.round(centerY + Math.sin(angle) * 145),
      };
    });

    const hop2ByParent = {};
    hop2Nodes.forEach((n) => {
      const parentLink = links.find((l) => l.target === n.id);
      const parentId = parentLink?.source || rootNode.id;
      if (!hop2ByParent[parentId]) hop2ByParent[parentId] = [];
      hop2ByParent[parentId].push(n);
    });

    Object.entries(hop2ByParent).forEach(([parentId, children]) => {
      const parentAngle = hop1Angles[parentId] ?? 0;
      const spread = 0.55;
      children.forEach((c, cIdx) => {
        const offset = children.length === 1 ? 0 : (cIdx - (children.length - 1) / 2) * (spread / children.length);
        const childAngle = parentAngle + offset;
        positions[c.id] = {
          x: Math.round(centerX + Math.cos(childAngle) * 235),
          y: Math.round(centerY + Math.sin(childAngle) * 235),
        };
      });
    });

    return positions;
  }

  // Varsayılan: Sıralı Akış (Hierarchical Directed DAG - Sol'dan Sağa)
  const depthGroups = {};
  nodes.forEach((n) => {
    const d = n.isRoot ? 0 : (n.depth || 1);
    if (!depthGroups[d]) depthGroups[d] = [];
    depthGroups[d].push(n);
  });

  const maxDepth = Math.max(...Object.keys(depthGroups).map(Number), 1);
  const colWidth = (width - 200) / (maxDepth || 1);

  // Depth 0: Kök (Root)
  if (depthGroups[0]) {
    depthGroups[0].forEach((n) => {
      positions[n.id] = { x: 95, y: Math.round(height / 2) };
    });
  }

  // Depth 1: 1. Kademe Alıcılar (Root'a doğrudan bağlı)
  if (depthGroups[1]) {
    depthGroups[1].sort((a, b) => {
      const volA = links.filter((l) => l.target === a.id).reduce((s, l) => s + l.valueHmnd, 0);
      const volB = links.filter((l) => l.target === b.id).reduce((s, l) => s + l.valueHmnd, 0);
      return volB - volA;
    });

    const count = depthGroups[1].length;
    const padding = 70;
    const step = count > 1 ? (height - padding * 2) / (count - 1) : 0;
    depthGroups[1].forEach((n, idx) => {
      const y = count === 1 ? height / 2 : padding + idx * step;
      positions[n.id] = { x: Math.round(95 + colWidth), y: Math.round(y) };
    });
  }

  // Depth 2: 2. Kademe Alıcılar (Kendi ebeveynlerinin Y konumuna göre sıralı)
  if (depthGroups[2]) {
    depthGroups[2].sort((a, b) => {
      const parentA = links.find((l) => l.target === a.id)?.source;
      const parentB = links.find((l) => l.target === b.id)?.source;
      const pYA = positions[parentA]?.y || 0;
      const pYB = positions[parentB]?.y || 0;
      if (pYA !== pYB) return pYA - pYB;
      const volA = links.find((l) => l.target === a.id)?.valueHmnd || 0;
      const volB = links.find((l) => l.target === b.id)?.valueHmnd || 0;
      return volB - volA;
    });

    const count = depthGroups[2].length;
    const padding = 55;
    const step = count > 1 ? (height - padding * 2) / (count - 1) : 0;
    depthGroups[2].forEach((n, idx) => {
      const y = count === 1 ? height / 2 : padding + idx * step;
      positions[n.id] = { x: Math.round(95 + 2 * colWidth), y: Math.round(y) };
    });
  }

  // Varsa Depth >= 3
  for (let d = 3; d <= maxDepth; d++) {
    if (depthGroups[d]) {
      const count = depthGroups[d].length;
      const padding = 55;
      const step = count > 1 ? (height - padding * 2) / (count - 1) : 0;
      depthGroups[d].forEach((n, idx) => {
        const y = count === 1 ? height / 2 : padding + idx * step;
        positions[n.id] = { x: Math.round(95 + d * colWidth), y: Math.round(y) };
      });
    }
  }

  return positions;
}

export default function MoneyTrailTab({ initialAddress, onSelectAddress, onOpenLedger }) {
  const { lang } = useLanguage();
  const { t, fields } = useModuleFields();
  const locStr = t('whales_enUs');

  const [address, setAddress] = useState(
    initialAddress || 'hmqTykgNBa9Jd18j3XggkvSW99L2sgdEbCP4cwxbQtGTJswWs'
  );
  const [depth, setDepth] = useState('2');
  const [trailData, setTrailData] = useState(null);
  const [clusterData, setClusterData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);

  // Görünüm Modları: 'diagram' (Akış Şeması) veya 'table' (Sıralı Transfer Tablosu)
  const [viewMode, setViewMode] = useState('diagram');
  // Yerleşim Algoritması: 'hierarchical' (Soldan Sağa Sıralı) veya 'radial' (Katmanlı Halka)
  const [layoutMode, setLayoutMode] = useState('hierarchical');
  // Miktar Filtresi: 'all' (Tümü) veya 'major' (> 1M HMND)
  const [labelFilter, setLabelFilter] = useState('all');

  // Hover Durumları
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [hoveredLinkKey, setHoveredLinkKey] = useState(null);

  // SVG Sürükleme Durumu
  const [nodePositions, setNodePositions] = useState({});
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const svgRef = useRef(null);

  const fetchTrailAndCluster = (targetAddr, targetDepth = '2') => {
    if (!targetAddr) return;
    setLoading(true);
    setClusterData(null);
    setSelectedNode(null);

    Promise.all([
      fetch(`/api/money-trail?address=${encodeURIComponent(targetAddr)}&depth=${targetDepth}`).then(
        (r) => r.json()
      ),
      fetch(`/api/wallet-cluster?address=${encodeURIComponent(targetAddr)}`).then((r) => r.json()),
    ])
      .then(([trailRes, clusterRes]) => {
        setTrailData(trailRes);
        setClusterData(clusterRes);
        setAddress(targetAddr);
        setLoading(false);

        if (trailRes?.nodes?.length) {
          const positions = computePositions(trailRes.nodes, trailRes.links, layoutMode);
          setNodePositions(positions);
        }
      })
      .catch((err) => {
        console.error('Trail fetch error:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (initialAddress) {
      setAddress(initialAddress);
      fetchTrailAndCluster(initialAddress, depth);
    } else {
      fetchTrailAndCluster(address, depth);
    }
  }, [initialAddress]);

  const handleLayoutChange = (newMode) => {
    setLayoutMode(newMode);
    if (trailData?.nodes?.length) {
      const positions = computePositions(trailData.nodes, trailData.links, newMode);
      setNodePositions(positions);
    }
  };

  const handleSearch = (e) => {
    e?.preventDefault();
    fetchTrailAndCluster(address, depth);
  };

  // Node Drag Handlers
  const handleMouseDown = (nodeId, e) => {
    e.stopPropagation();
    setDraggingNodeId(nodeId);
  };

  const handleMouseMove = (e) => {
    if (!draggingNodeId || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 900;
    const y = ((e.clientY - rect.top) / rect.height) * 520;

    setNodePositions((prev) => ({
      ...prev,
      [draggingNodeId]: { x: Math.max(40, Math.min(860, x)), y: Math.max(40, Math.min(480, y)) },
    }));
  };

  const handleMouseUp = () => {
    setDraggingNodeId(null);
  };

  // Filtrelenmiş Linkler
  const filteredLinks = useMemo(() => {
    if (!trailData?.links) return [];
    if (labelFilter === 'major') {
      return trailData.links.filter((l) => l.valueHmnd >= 1_000_000);
    }
    return trailData.links;
  }, [trailData, labelFilter]);

  // Çoklu bağlantı tespiti (Aynı çift arasında hem bridge hem transfer varsa kavis ver)
  const linkPairMap = useMemo(() => {
    const counts = {};
    filteredLinks.forEach((l) => {
      const k = `${l.source}->${l.target}`;
      counts[k] = (counts[k] || 0) + 1;
    });
    return counts;
  }, [filteredLinks]);

  return (
    <Stack gap="md">
      {/* Search Header */}
      <Paper p="md" radius="md" className="glass-panel">
        <Group justify="space-between" mb="xs" wrap="wrap" gap="sm">
          <Group gap="sm">
            <IconGitFork size={22} color="#a855f7" />
            <div>
              <Title order={4} c="white">
                {t('moneytrail_interactiveMoneyTrailMulti')}
              </Title>
              <Text size="xs" c="dimmed">
                {t('moneytrail_streamlinedHierarchicalFundFlow')}
              </Text>
            </div>
          </Group>
          <Badge color="violet" variant="filled">
            HIERARCHICAL FLOW ENGINE
          </Badge>
        </Group>

        <form onSubmit={handleSearch}>
          <Group justify="space-between" align="center" gap="sm" wrap="wrap">
            <TextInput
              placeholder={
                t('moneytrail_enterWalletAddressTo')
              }
              leftSection={<IconSearch size={16} />}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              style={{ flex: 1, minWidth: 280 }}
            />
            <Select
              data={[
                { value: '1', label: t('moneytrail_1HopDirect') },
                { value: '2', label: t('moneytrail_2HopsDeep') },
                { value: '3', label: t('moneytrail_3HopsWideNetwork') },
              ]}
              value={depth}
              onChange={(val) => {
                setDepth(val);
                fetchTrailAndCluster(address, val);
              }}
              style={{ width: 170 }}
            />
            <Button
              type="submit"
              color="violet"
              loading={loading}
              leftSection={<IconGitFork size={16} />}
            >
              {t('moneytrail_mapNetwork')}
            </Button>
          </Group>
        </form>
      </Paper>

      {/* Cluster Heuristics Intelligence Card */}
      {clusterData && (
        <Paper
          p="md"
          radius="md"
          style={{
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(56, 189, 248, 0.08) 100%)',
            border: `1px solid ${clusterData.color || '#a855f7'}40`,
          }}
        >
          <Group justify="space-between" align="flex-start" wrap="wrap">
            <Group gap="md">
              <Box
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: `${clusterData.color || '#a855f7'}20`,
                  border: `1px solid ${clusterData.color || '#a855f7'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                }}
              >
                {clusterData.icon || '🏦'}
              </Box>
              <div>
                <Group gap="xs">
                  <Title order={4} c="white">
                    {clusterData.entityName}
                  </Title>
                  <Badge color="violet" variant="light">
                    {clusterData.entityType}
                  </Badge>
                  <Badge
                    color={
                      clusterData.riskLevel === 'Düşük'
                        ? 'green'
                        : clusterData.riskLevel === 'Orta'
                        ? 'yellow'
                        : 'red'
                    }
                  >
                    {t('moneytrail_risk')} %{clusterData.riskScore} ({clusterData.riskLevel})
                  </Badge>
                </Group>
                <Text size="xs" c="dimmed" mt={2}>
                  {clusterData.behavioralSummary}
                </Text>
              </div>
            </Group>

            <Group gap="xs">
              <Button
                size="xs"
                variant="light"
                color="cyan"
                leftSection={<IconEye size={14} />}
                onClick={() => onSelectAddress(clusterData.address)}
              >
                {t('moneytrail_profile_2')}
              </Button>
              <Button
                size="xs"
                variant="light"
                color="green"
                leftSection={<IconBook size={14} />}
                onClick={() => onOpenLedger(clusterData.address)}
              >
                {t('validators_walletLedger')}
              </Button>
            </Group>
          </Group>

          {/* Associated Cluster Wallets */}
          {clusterData.associatedClusterWallets?.length > 0 && (
            <Box mt="md" pt="sm" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <Text size="xs" fw={700} c="cyan" mb={6}>
                {t('moneytrail_associatedClusterWalletsAffinity')}
              </Text>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="xs">
                {clusterData.associatedClusterWallets.map((w, idx) => (
                  <Paper
                    key={idx}
                    p="xs"
                    radius="sm"
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      cursor: 'pointer',
                    }}
                    onClick={() => fetchTrailAndCluster(w.address, depth)}
                  >
                    <Group justify="space-between" mb={2}>
                      <Text size="xs" fw={700} c="white">
                        {w.role}
                      </Text>
                      <Badge size="xs" color="violet">
                        %{w.affinityPercentage} {t('moneytrail_affinity')}
                      </Badge>
                    </Group>
                    <Text size="11px" className="font-mono" c="cyan">
                      {w.shortAddress}
                    </Text>
                    <Text size="10px" c="dimmed">
                      {w.commonTxsCount} {t('moneytrail_sharedFlows')}
                    </Text>
                  </Paper>
                ))}
              </SimpleGrid>
            </Box>
          )}
        </Paper>
      )}

      {/* Main Flow Presentation Area */}
      {trailData && (
        <Paper
          p="md"
          radius="md"
          style={{
            background: '#0d131f',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            position: 'relative',
          }}
        >
          {/* Controls & Mode Switcher Toolbar */}
          <Group justify="space-between" mb="md" wrap="wrap" gap="sm">
            <Group gap="xs" wrap="wrap">
              <SegmentedControl
                size="xs"
                value={viewMode}
                onChange={setViewMode}
                data={[
                  { label: t('moneytrail_flowDiagram'), value: 'diagram' },
                  { label: t('moneytrail_stepTable'), value: 'table' },
                ]}
                color="violet"
              />

              {viewMode === 'diagram' && (
                <>
                  <SegmentedControl
                    size="xs"
                    value={layoutMode}
                    onChange={handleLayoutChange}
                    data={[
                      { label: t('moneytrail_leftToRight'), value: 'hierarchical' },
                      { label: t('moneytrail_concentricRadial'), value: 'radial' },
                    ]}
                    color="cyan"
                  />

                  <SegmentedControl
                    size="xs"
                    value={labelFilter}
                    onChange={setLabelFilter}
                    data={[
                      { label: t('moneytrail_allAmounts'), value: 'all' },
                      { label: t('moneytrail_majorOnly'), value: 'major' },
                    ]}
                    color="teal"
                  />
                </>
              )}
            </Group>

            <Group gap="xs">
              <Badge color="violet" variant="filled" size="sm">
                {trailData.totalNodes} {t('validators_nodes')}
              </Badge>
              <Badge color="cyan" variant="filled" size="sm">
                {filteredLinks.length} {t('moneytrail_flows')}
              </Badge>
              {viewMode === 'diagram' && (
                <Button
                  size="compact-xs"
                  variant="subtle"
                  color="cyan"
                  leftSection={<IconRefresh size={12} />}
                  onClick={() => handleLayoutChange(layoutMode)}
                >
                  {t('moneytrail_resetLayout')}
                </Button>
              )}
            </Group>
          </Group>

          {/* VIEW 1: Görsel Akış Şeması (Diagram) */}
          {viewMode === 'diagram' && (
            <Box
              style={{
                width: '100%',
                height: 520,
                background: 'radial-gradient(circle at 50% 50%, #111827 0%, #06090e 100%)',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.06)',
                overflow: 'hidden',
                position: 'relative',
                cursor: draggingNodeId ? 'grabbing' : 'default',
                userSelect: 'none',
              }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <svg
                ref={svgRef}
                viewBox="0 0 900 520"
                style={{ width: '100%', height: '100%', display: 'block' }}
              >
                <defs>
                  <marker
                    id="arrowhead-cyan"
                    markerWidth="9"
                    markerHeight="6"
                    refX="17"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 9 3, 0 6" fill="#38bdf8" opacity="0.9" />
                  </marker>
                  <marker
                    id="arrowhead-bridge"
                    markerWidth="9"
                    markerHeight="6"
                    refX="17"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 9 3, 0 6" fill="#ec4899" opacity="0.95" />
                  </marker>
                </defs>

                {/* Sütun Kılavuz Çizgileri ve Başlıkları (Sıralı Akış Modunda) */}
                {layoutMode === 'hierarchical' && (
                  <g pointerEvents="none">
                    <line x1="270" y1="36" x2="270" y2="495" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                    <line x1="620" y1="36" x2="620" y2="495" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />

                    <text x="95" y="24" textAnchor="middle" fill="#a855f7" fontSize="10" fontWeight="bold" letterSpacing="0.8">
                      {t('moneytrail_rootWallet')}
                    </text>
                    <text x="445" y="24" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold" letterSpacing="0.8">
                      {t('moneytrail_hop1Direct')}
                    </text>
                    <text x="770" y="24" textAnchor="middle" fill="#10b981" fontSize="10" fontWeight="bold" letterSpacing="0.8">
                      {t('moneytrail_hop2Secondary')}
                    </text>
                  </g>
                )}

                {/* Kenar Bağlantıları (Curved Bezier Edges) */}
                {(() => {
                  const pairTracker = {};
                  return filteredLinks.map((link, idx) => {
                    const sPos = nodePositions[link.source];
                    const tPos = nodePositions[link.target];
                    if (!sPos || !tPos) return null;

                    const linkKey = `${link.source}->${link.target}:${link.type}`;
                    const pairKey = `${link.source}->${link.target}`;
                    const pairIdx = pairTracker[pairKey] || 0;
                    pairTracker[pairKey] = pairIdx + 1;

                    const isBridge = link.type === 'bridge';
                    const strokeColor = isBridge ? '#ec4899' : '#38bdf8';

                    // İki cüzdan arasında birden fazla akış varsa kavis ver
                    const hasMulti = (linkPairMap[pairKey] || 0) > 1;
                    const curveOffset = hasMulti ? (pairIdx === 0 ? -22 : 22) : 0;

                    const dx = tPos.x - sPos.x;
                    const dy = tPos.y - sPos.y;

                    let pathD = '';
                    let midX = 0;
                    let midY = 0;

                    if (layoutMode === 'hierarchical') {
                      const c1x = sPos.x + dx * 0.45;
                      const c1y = sPos.y + curveOffset;
                      const c2x = tPos.x - dx * 0.45;
                      const c2y = tPos.y + curveOffset;
                      pathD = `M ${sPos.x} ${sPos.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${tPos.x} ${tPos.y}`;
                      midX = 0.125 * sPos.x + 0.375 * c1x + 0.375 * c2x + 0.125 * tPos.x;
                      midY = 0.125 * sPos.y + 0.375 * c1y + 0.375 * c2y + 0.125 * tPos.y;
                    } else {
                      midX = (sPos.x + tPos.x) / 2 + (dy !== 0 ? (dy / Math.abs(dy)) * curveOffset : 0);
                      midY = (sPos.y + tPos.y) / 2 - (dx !== 0 ? (dx / Math.abs(dx)) * curveOffset : 0);
                      pathD = `M ${sPos.x} ${sPos.y} Q ${midX} ${midY}, ${tPos.x} ${tPos.y}`;
                    }

                    const isHovered = hoveredLinkKey === linkKey;
                    const isNodeConnected =
                      hoveredNodeId && (link.source === hoveredNodeId || link.target === hoveredNodeId);
                    const isDimmed =
                      (hoveredNodeId && !isNodeConnected) || (hoveredLinkKey && !isHovered);

                    const shortLabel = `${formatShortAmount(link.valueHmnd, lang)} HMND`;
                    const pillWidth = Math.max(56, shortLabel.length * 6.5 + 14);

                    return (
                      <g
                        key={`edge-${idx}`}
                        style={{ transition: 'opacity 0.2s ease', opacity: isDimmed ? 0.15 : 1 }}
                        onMouseEnter={() => setHoveredLinkKey(linkKey)}
                        onMouseLeave={() => setHoveredLinkKey(null)}
                      >
                        <path
                          d={pathD}
                          fill="none"
                          stroke={strokeColor}
                          strokeWidth={isBridge ? 2.6 : isHovered ? 2.5 : 1.6}
                          strokeOpacity={isHovered ? 1 : 0.75}
                          strokeDasharray={isBridge ? '5 4' : 'none'}
                          markerEnd={isBridge ? 'url(#arrowhead-bridge)' : 'url(#arrowhead-cyan)'}
                        />

                        {/* Miktar Hapı (Compact Amount Pill) */}
                        <g transform={`translate(${midX}, ${midY})`} style={{ cursor: 'pointer' }}>
                          <rect
                            x={-pillWidth / 2}
                            y={-9}
                            width={pillWidth}
                            height={18}
                            rx={4}
                            fill="#070b12"
                            stroke={isHovered ? '#ffffff' : strokeColor}
                            strokeWidth={isHovered ? 1.5 : 1}
                            fillOpacity={0.94}
                          />
                          <text
                            x={0}
                            y={3.5}
                            fill={isHovered ? '#ffffff' : '#f1f5f9'}
                            fontSize="9"
                            fontFamily="monospace"
                            textAnchor="middle"
                            fontWeight="bold"
                          >
                            {shortLabel}
                          </text>
                        </g>
                      </g>
                    );
                  });
                })()}

                {/* Cüzdan Düğümleri (Interactive Nodes) */}
                {trailData.nodes?.map((node) => {
                  const pos = nodePositions[node.id] || { x: 450, y: 260 };
                  const isRoot = node.isRoot;
                  const radius = isRoot ? 24 : 17;
                  const isEVM = node.layer === 'EVM';
                  const fillColor = isRoot ? '#a855f7' : isEVM ? '#0284c7' : '#059669';
                  const strokeColor = isRoot ? '#c4b5fd' : isEVM ? '#38bdf8' : '#34d399';

                  const isHovered = hoveredNodeId === node.id;
                  const isSelected = selectedNode?.id === node.id;
                  const isDimmed = hoveredNodeId && hoveredNodeId !== node.id;

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${pos.x}, ${pos.y})`}
                      style={{
                        cursor: 'grab',
                        transition: 'opacity 0.2s ease, transform 0.1s ease',
                        opacity: isDimmed ? 0.35 : 1,
                      }}
                      onMouseEnter={() => setHoveredNodeId(node.id)}
                      onMouseLeave={() => setHoveredNodeId(null)}
                      onMouseDown={(e) => handleMouseDown(node.id, e)}
                      onClick={() => {
                        setSelectedNode(node);
                      }}
                    >
                      {/* Aura / Halo for Root & Selected */}
                      {(isRoot || isSelected || isHovered) && (
                        <circle
                          r={radius + 7}
                          fill="none"
                          stroke={fillColor}
                          strokeWidth="2"
                          opacity={isSelected ? 0.9 : 0.45}
                        />
                      )}

                      <circle
                        r={radius}
                        fill={fillColor}
                        stroke={isSelected ? '#ffffff' : strokeColor}
                        strokeWidth={isRoot || isSelected ? 2.5 : 1.5}
                        style={{
                          filter: isRoot || isSelected ? `drop-shadow(0 0 8px ${fillColor})` : 'none',
                        }}
                      />

                      <text
                        textAnchor="middle"
                        dy="3.5"
                        fill="#ffffff"
                        fontSize={isRoot ? 10.5 : 8.5}
                        fontWeight="800"
                        letterSpacing="0.4"
                        pointerEvents="none"
                      >
                        {isRoot ? 'ROOT' : isEVM ? 'EVM' : 'SUB'}
                      </text>

                      {/* Adres Etiket Rozeti (Karanlık zemin ile çizgilere asla karışmaz) */}
                      <g pointerEvents="none">
                        <rect
                          x={-39}
                          y={radius + 4}
                          width={78}
                          height={15}
                          rx={3}
                          fill="#05080e"
                          fillOpacity={0.92}
                          stroke="rgba(255,255,255,0.12)"
                          strokeWidth={0.5}
                        />
                        <text
                          x={0}
                          y={radius + 15}
                          textAnchor="middle"
                          fill={isRoot ? '#c4b5fd' : '#cbd5e1'}
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight={isRoot ? 'bold' : 'normal'}
                        >
                          {node.shortAddress}
                        </text>
                      </g>

                      {/* Varsa Özel Etiket (Örn: Borsa / Balina) */}
                      {node.label && (
                        <text
                          y={-(radius + 7)}
                          fill="#f59e0b"
                          fontSize="9"
                          fontWeight="bold"
                          textAnchor="middle"
                          pointerEvents="none"
                        >
                          {node.label}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </Box>
          )}

          {/* VIEW 2: Adım Adım Akış Tablosu (Step-by-Step Flow Table) */}
          {viewMode === 'table' && (
            <Box style={{ overflowX: 'auto' }}>
              <Table striped highlightOnHover verticalSpacing="xs">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('moneytrail_hop')}</Table.Th>
                    <Table.Th>{t('moneytrail_sourceWallet')}</Table.Th>
                    <Table.Th style={{ textAlign: 'center' }}>{t('moneytrail_direction')}</Table.Th>
                    <Table.Th>{t('moneytrail_targetWallet')}</Table.Th>
                    <Table.Th>{t('colAmount')}</Table.Th>
                    <Table.Th>{t('dirColTxCount')}</Table.Th>
                    <Table.Th>{t('moneytrail_type')}</Table.Th>
                    <Table.Th>{t('moneytrail_actions')}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredLinks.map((link, idx) => {
                    const sNode = trailData.nodes?.find((n) => n.id === link.source);
                    const tNode = trailData.nodes?.find((n) => n.id === link.target);
                    const isHop1 = sNode?.isRoot;
                    const isBridge = link.type === 'bridge';

                    return (
                      <Table.Tr key={`tbl-link-${idx}`}>
                        <Table.Td>
                          <Badge size="xs" color={isHop1 ? 'cyan' : 'violet'} variant="light">
                            {isHop1
                              ? (t('moneytrail_hop1'))
                              : (t('moneytrail_hop2'))}
                          </Badge>
                        </Table.Td>

                        <Table.Td>
                          <AddressBadge
                            address={link.source}
                            network={sNode?.layer}
                            showNetwork={true}
                          />
                        </Table.Td>

                        <Table.Td style={{ textAlign: 'center' }}>
                          <Text c={isBridge ? 'pink' : 'cyan'} fw={700}>
                            ➔
                          </Text>
                        </Table.Td>

                        <Table.Td>
                          <AddressBadge
                            address={link.target}
                            network={tNode?.layer}
                            showNetwork={true}
                          />
                        </Table.Td>

                        <Table.Td>
                          <AmountDisplay
                            value={Number(link.valueHmnd).toLocaleString(locStr, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                            unit="HMND"
                            color="white"
                            fw={700}
                            size="sm"
                          />
                        </Table.Td>

                        <Table.Td className="font-mono">
                          <Badge size="sm" variant="default">
                            {link.txCount} tx
                          </Badge>
                        </Table.Td>

                        <Table.Td>
                          <Badge size="xs" color={isBridge ? 'pink' : 'blue'} variant="light">
                            {isBridge
                              ? (t('moneytrail_crossLayerBridge'))
                              : (t('moneytrail_directTransfer'))}
                          </Badge>
                        </Table.Td>

                        <Table.Td>
                          <Group gap={4}>
                            <Button
                              size="compact-xs"
                              variant="subtle"
                              color="cyan"
                              onClick={() => onSelectAddress(link.target)}
                            >
                              {t('preview')}
                            </Button>
                            <Button
                              size="compact-xs"
                              variant="subtle"
                              color="violet"
                              onClick={() => fetchTrailAndCluster(link.target, depth)}
                            >
                              {t('moneytrail_trace')}
                            </Button>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </Box>
          )}

          {/* Seçili Düğüm Detay Kartı (Tıklandığında Açılır) */}
          {selectedNode && (
            <Paper
              p="sm"
              mt="md"
              radius="sm"
              style={{
                background: 'rgba(168, 85, 247, 0.1)',
                border: '1px solid rgba(168, 85, 247, 0.35)',
              }}
            >
              <Group justify="space-between" align="center" wrap="wrap" gap="sm">
                <div>
                  <Group gap="xs" align="center">
                    <Badge color={selectedNode.isRoot ? 'violet' : 'cyan'}>
                      {selectedNode.isRoot ? (t('moneytrail_root')) : `${selectedNode.depth || 1}. KADEME`}
                    </Badge>
                    <AddressBadge address={selectedNode.address} network={selectedNode.layer} showNetwork={true} />
                  </Group>
                  <Text size="xs" c="dimmed" mt={3}>
                    {t('moneytrail_selectedNodeInThe')}
                  </Text>
                </div>

                <Group gap="xs">
                  <Button
                    size="xs"
                    color="violet"
                    leftSection={<IconGitFork size={14} />}
                    onClick={() => fetchTrailAndCluster(selectedNode.address, depth)}
                  >
                    {t('moneytrail_reRootTrace')}
                  </Button>
                  <Button
                    size="xs"
                    variant="light"
                    color="green"
                    leftSection={<IconBook size={14} />}
                    onClick={() => onOpenLedger(selectedNode.address)}
                  >
                    {t('validators_walletLedger')}
                  </Button>
                  <Button
                    size="xs"
                    variant="default"
                    leftSection={<IconEye size={14} />}
                    onClick={() => onSelectAddress(selectedNode.address)}
                  >
                    {t('moneytrail_profile_2')}
                  </Button>
                </Group>
              </Group>
            </Paper>
          )}
        </Paper>
      )}

      {/* Discovered Nodes & Links Lists */}
      {trailData && viewMode === 'diagram' && (
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          {/* Nodes Table */}
          <Paper p="sm" radius="md" style={{ background: '#121824', border: '1px solid rgba(255,255,255,0.07)' }}>
            <Title order={5} c="white" mb="xs">
              {t('moneytrail_discoveredNodes')}
            </Title>
            <Stack gap={6}>
              {trailData.nodes?.map((node) => (
                <Paper
                  key={node.id}
                  p="xs"
                  radius="sm"
                  style={{
                    background: node.isRoot ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    border: node.isRoot ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <Group justify="space-between" wrap="nowrap">
                    <div>
                      <Group gap={6} wrap="nowrap">
                        <Badge size="xs" color={node.isRoot ? 'violet' : node.layer === 'EVM' ? 'cyan' : 'green'}>
                          {node.isRoot ? (t('moneytrail_root_2')) : node.layer}
                        </Badge>
                        <AddressBadge address={node.address} network={node.layer} showNetwork={false} />
                      </Group>
                      {node.label && <Text size="10px" c="dimmed">{node.label}</Text>}
                    </div>
                    <Group gap={4} wrap="nowrap">
                      <Button
                        size="compact-xs"
                        variant="subtle"
                        color="cyan"
                        onClick={() => onSelectAddress(node.address)}
                      >
                        {t('preview')}
                      </Button>
                      <Button
                        size="compact-xs"
                        variant="subtle"
                        color="green"
                        onClick={() => onOpenLedger(node.address)}
                      >
                        {t('moneytrail_ledger_3')}
                      </Button>
                      <Button
                        size="compact-xs"
                        variant="subtle"
                        color="violet"
                        onClick={() => fetchTrailAndCluster(node.address, depth)}
                      >
                        {t('moneytrail_focus')}
                      </Button>
                    </Group>
                  </Group>
                </Paper>
              ))}
            </Stack>
          </Paper>

          {/* Links Table */}
          <Paper p="sm" radius="md" style={{ background: '#121824', border: '1px solid rgba(255,255,255,0.07)' }}>
            <Title order={5} c="white" mb="xs">
              {t('moneytrail_transferRoutesRanked')}
            </Title>
            <Stack gap={6}>
              {[...filteredLinks]
                .sort((a, b) => b.valueHmnd - a.valueHmnd)
                .map((link, idx) => (
                  <Paper
                    key={idx}
                    p="xs"
                    radius="sm"
                    style={{
                      background: link.type === 'bridge' ? 'rgba(236, 72, 153, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                      border: link.type === 'bridge' ? '1px solid #ec4899' : '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <Group justify="space-between" wrap="nowrap">
                      <div>
                        <Group gap={4} wrap="nowrap">
                          <Text size="xs" className="font-mono" c="cyan">
                            {shortAddr(link.source)}
                          </Text>
                          <Text size="xs" c="dimmed">➔</Text>
                          <Text size="xs" className="font-mono" c="teal">
                            {shortAddr(link.target)}
                          </Text>
                          {link.type === 'bridge' && (
                            <Badge size="xs" color="pink">
                              🌉 {t('moneytrail_bridge')}
                            </Badge>
                          )}
                        </Group>
                        <Text size="10px" c="dimmed">
                          {link.txCount} {t('moneytrail_transfersRecorded')}
                        </Text>
                      </div>
                      <AmountDisplay
                        value={formatShortAmount(link.valueHmnd, lang)}
                        unit="HMND"
                        color="teal"
                        fw={700}
                        size="xs"
                      />
                    </Group>
                  </Paper>
                ))}
            </Stack>
          </Paper>
        </SimpleGrid>
      )}
    </Stack>
  );
}
