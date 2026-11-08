'use client';
import { useState, useEffect } from 'react';
import { AppShell, Container, Box, Affix, Transition, ActionIcon, Tooltip } from '@mantine/core';
import { useWindowScroll } from '@mantine/hooks';
import { IconArrowUp } from '@tabler/icons-react';
import { LanguageProvider, useLanguage } from '../components/LanguageContext';
import AppHeader from '../components/AppHeader';
import SidebarNav from '../components/SidebarNav';
import CommandPaletteModal from '../components/CommandPaletteModal';
import QuickPeekDrawer from '../components/QuickPeekDrawer';
import BlockDetailModal from '../components/BlockDetailModal';
import TransactionDetailModal from '../components/TransactionDetailModal';

import OverviewTab from '../components/OverviewTab';
import MajorWalletsTab from '../components/MajorWalletsTab';
import LeaderboardTab from '../components/LeaderboardTab';
import TokensTab from '../components/TokensTab';
import ValidatorsTab from '../components/ValidatorsTab';
import HeatmapTab from '../components/HeatmapTab';
import LedgerTab from '../components/LedgerTab';
import MoneyTrailTab from '../components/MoneyTrailTab';
import RatesTab from '../components/RatesTab';
import UnlocksTab from '../components/UnlocksTab';
import BridgeTab from '../components/BridgeTab';
import HodlersTab from '../components/HodlersTab';
import FeesPotTab from '../components/FeesPotTab';
import TokenomicsTab from '../components/TokenomicsTab';
import WhalesTab from '../components/WhalesTab';
import DexDepthTab from '../components/DexDepthTab';
import BiomapperTab from '../components/BiomapperTab';

function HomeContent() {
  const { t } = useLanguage();
  const [scroll, scrollTo] = useWindowScroll();
  const [activeTab, setActiveTab] = useState('overview');
  const [cmdOpened, setCmdOpened] = useState(false);
  const [peekAddress, setPeekAddress] = useState(null);
  const [selectedBlockNumber, setSelectedBlockNumber] = useState(null);
  const [selectedTxHash, setSelectedTxHash] = useState(null);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [ledgerAddr, setLedgerAddr] = useState('');
  const [trailAddr, setTrailAddr] = useState('');
  const [overviewDate, setOverviewDate] = useState('');

  const updateUrl = (tab, addr, block, tx) => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (tab && tab !== 'overview') params.set('tab', tab);
    if (addr) params.set('address', addr);
    if (block) params.set('block', block);
    if (tx) params.set('tx', tx);
    const qs = params.toString();
    const newUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, '', newUrl);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    const addr = params.get('address') || params.get('addr');
    const block = params.get('block');
    const tx = params.get('tx');

    if (tab) setActiveTab(tab);
    if (addr) {
      if (tab === 'moneytrail') {
        setTrailAddr(addr);
      } else if (tab === 'ledger') {
        setLedgerAddr(addr);
      } else {
        setPeekAddress(addr);
      }
    }
    if (block) {
      const cleanNum = parseInt(block.replace(/[^\d]/g, ''), 10);
      if (!isNaN(cleanNum)) setSelectedBlockNumber(cleanNum);
    }
    if (tx) setSelectedTxHash(tx);
  }, []);

  const handleSelectTab = (tab) => {
    setActiveTab(tab);
    updateUrl(tab, null, selectedBlockNumber, selectedTxHash);
  };

  const handleOpenBlock = (blockNum) => {
    if (!blockNum) return;
    const cleanNum = parseInt(String(blockNum).replace(/[^\d]/g, ''), 10);
    if (!isNaN(cleanNum)) {
      setSelectedBlockNumber(cleanNum);
      updateUrl(activeTab, null, cleanNum, null);
    }
  };

  const handleOpenTx = (hash) => {
    if (!hash) return;
    setSelectedTxHash(hash);
    updateUrl(activeTab, null, null, hash);
  };

  const handleOpenLedger = (addr) => {
    setLedgerAddr(addr);
    setActiveTab('ledger');
    updateUrl('ledger', addr, null, null);
  };

  const handleOpenTrail = (addr) => {
    setTrailAddr(addr);
    setActiveTab('moneytrail');
    updateUrl('moneytrail', addr, null, null);
  };

  const handleCloseBlockModal = () => {
    setSelectedBlockNumber(null);
    updateUrl(activeTab, null, null, selectedTxHash);
  };

  const handleCloseTxModal = () => {
    setSelectedTxHash(null);
    updateUrl(activeTab, null, selectedBlockNumber, null);
  };

  const handleClosePeek = () => {
    setPeekAddress(null);
  };

  return (
    <AppShell
      header={{ height: 52 }}
      navbar={{
        width: sidebarCollapsed ? 68 : 240,
        breakpoint: 0,
      }}
      padding="md"
      styles={{
        main: {
          background: '#0a0d12',
          minHeight: '100vh',
        },
        navbar: {
          background: '#0d1117',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        header: {
          background: '#0d1117',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        },
      }}
    >
      <AppShell.Header>
        <AppHeader
          onOpenCommandPalette={() => setCmdOpened(true)}
          activeTab={activeTab}
        />
      </AppShell.Header>

      <AppShell.Navbar>
        <SidebarNav
          activeTab={activeTab}
          onTabChange={(tab) => handleSelectTab(tab)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        />
      </AppShell.Navbar>

      <AppShell.Main>
        <Container fluid p={0}>
          {activeTab === 'overview' && (
            <OverviewTab
              onSelectAddress={(addr) => setPeekAddress(addr)}
              onOpenBlock={handleOpenBlock}
              onOpenTx={handleOpenTx}
              onOpenLedger={handleOpenLedger}
              onOpenTrail={handleOpenTrail}
              filterDate={overviewDate}
              onClearFilterDate={() => setOverviewDate('')}
            />
          )}

          {activeTab === 'directory' && (
            <MajorWalletsTab
              onSelectAddress={(addr) => setPeekAddress(addr)}
              onOpenLedger={handleOpenLedger}
              onOpenTrail={handleOpenTrail}
            />
          )}

          {activeTab === 'whales' && (
            <WhalesTab
              onSelectAddress={(addr) => setPeekAddress(addr)}
              onOpenLedger={handleOpenLedger}
              onOpenTrail={handleOpenTrail}
            />
          )}

          {activeTab === 'leaderboard' && (
            <LeaderboardTab
              onSelectAddress={(addr) => setPeekAddress(addr)}
              onOpenLedger={handleOpenLedger}
              onOpenTrail={handleOpenTrail}
            />
          )}

          {activeTab === 'tokens' && (
            <TokensTab
              onSelectAddress={(addr) => setPeekAddress(addr)}
              onOpenLedger={handleOpenLedger}
            />
          )}

          {activeTab === 'tokenomics' && (
            <TokenomicsTab
              onSelectAddress={(addr) => setPeekAddress(addr)}
              onOpenBlock={handleOpenBlock}
              onOpenTx={handleOpenTx}
              onOpenLedger={handleOpenLedger}
              onOpenTrail={handleOpenTrail}
            />
          )}

          {activeTab === 'validators' && (
            <ValidatorsTab
              onSelectAddress={(addr) => setPeekAddress(addr)}
              onOpenBlock={handleOpenBlock}
            />
          )}

          {activeTab === 'feespot' && (
            <FeesPotTab
              onSelectAddress={(addr) => setPeekAddress(addr)}
              onOpenBlock={handleOpenBlock}
            />
          )}

          {activeTab === 'biomapper' && (
            <BiomapperTab
              onSelectAddress={(addr) => setPeekAddress(addr)}
              onOpenLedger={handleOpenLedger}
              onOpenTrail={handleOpenTrail}
              onOpenBlock={handleOpenBlock}
              onOpenTx={handleOpenTx}
            />
          )}

          {activeTab === 'heatmap' && (
            <HeatmapTab
              onSelectDate={(date) => {
                setOverviewDate(date);
                setActiveTab('overview');
              }}
            />
          )}

          {activeTab === 'ledger' && (
            <LedgerTab
              initialAddress={ledgerAddr}
              onSelectAddress={(addr) => setPeekAddress(addr)}
              onOpenTrail={handleOpenTrail}
              onOpenBlock={handleOpenBlock}
              onOpenTx={handleOpenTx}
            />
          )}

          {activeTab === 'moneytrail' && (
            <MoneyTrailTab
              initialAddress={trailAddr}
              onSelectAddress={(addr) => setPeekAddress(addr)}
              onOpenLedger={handleOpenLedger}
            />
          )}

          {activeTab === 'rates' && <RatesTab />}

          {activeTab === 'dexdepth' && <DexDepthTab />}

          {activeTab === 'bridge' && (
            <BridgeTab
              onSelectAddress={(addr) => setPeekAddress(addr)}
              onOpenLedger={handleOpenLedger}
              onOpenTrail={handleOpenTrail}
              onOpenBlock={handleOpenBlock}
              onOpenTx={handleOpenTx}
            />
          )}

          {activeTab === 'hodlers' && (
            <HodlersTab
              onSelectAddress={(addr) => setPeekAddress(addr)}
              onOpenLedger={handleOpenLedger}
              onOpenTrail={handleOpenTrail}
            />
          )}

          {activeTab === 'unlocks' && (
            <UnlocksTab
              onSelectAddress={(addr) => setPeekAddress(addr)}
              onOpenLedger={handleOpenLedger}
              onOpenTrail={handleOpenTrail}
              onOpenBlock={handleOpenBlock}
              onOpenTx={handleOpenTx}
            />
          )}
        </Container>
      </AppShell.Main>

      {/* Floating Scroll-to-Top Button */}
      <Affix position={{ bottom: 24, right: 24 }}>
        <Transition transition="slide-up" mounted={scroll.y > 180}>
          {(transitionStyles) => (
            <Tooltip label={t('scrollToTop') || 'Yukarı Dön'} withArrow position="left">
              <ActionIcon
                size={40}
                radius="xl"
                variant="filled"
                color="cyan"
                style={{
                  ...transitionStyles,
                  backgroundColor: 'rgba(13, 17, 23, 0.85)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5), 0 0 16px rgba(56, 189, 248, 0.25)',
                  color: '#38bdf8',
                }}
                onClick={() => scrollTo({ y: 0 })}
              >
                <IconArrowUp size={20} stroke={2.2} />
              </ActionIcon>
            </Tooltip>
          )}
        </Transition>
      </Affix>

      {/* Global Command Palette */}
      <CommandPaletteModal
        opened={cmdOpened}
        onClose={() => setCmdOpened(false)}
        onSelectAddress={(addr) => handleOpenLedger(addr)}
        onSelectTab={(tab) => handleSelectTab(tab)}
        onOpenBlock={handleOpenBlock}
        onOpenTx={handleOpenTx}
      />

      {/* Quick-Peek Side Drawer */}
      <QuickPeekDrawer
        opened={Boolean(peekAddress)}
        address={peekAddress}
        onClose={handleClosePeek}
        onOpenLedger={handleOpenLedger}
        onOpenTrail={handleOpenTrail}
      />

      {/* Global Block Details Modal */}
      <BlockDetailModal
        opened={Boolean(selectedBlockNumber)}
        onClose={handleCloseBlockModal}
        blockNumber={selectedBlockNumber}
        onOpenTx={handleOpenTx}
        onSelectAddress={(addr) => setPeekAddress(addr)}
      />

      {/* Global Transaction Details Modal */}
      <TransactionDetailModal
        opened={Boolean(selectedTxHash)}
        onClose={handleCloseTxModal}
        txHash={selectedTxHash}
        onOpenBlock={handleOpenBlock}
        onSelectAddress={(addr) => setPeekAddress(addr)}
        onOpenLedger={handleOpenLedger}
      />
    </AppShell>
  );
}

export default function Home() {
  return (
    <LanguageProvider>
      <HomeContent />
    </LanguageProvider>
  );
}
