import React, { useState, useEffect } from 'react';
import './UAG.css';
import { MOCK_DB, AppData, Lead } from './mockData';
import RadarCluster from './components/RadarCluster';
import ActionPanel from './components/ActionPanel';
import AssetMonitor from './components/AssetMonitor';
import ListingFeed from './components/ListingFeed';
import MaiCard from './components/MaiCard';
import TrustFlow from './components/TrustFlow';

export default function UAGPage() {
  const [appData, setAppData] = useState<AppData | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [useMock, setUseMock] = useState(true);

  useEffect(() => {
    // Initialize mode from localStorage or URL
    const params = new URLSearchParams(window.location.search);
    const urlMode = params.get('mode');
    let initialMock = true;
    
    if (urlMode === 'mock' || urlMode === 'live') {
      initialMock = urlMode === 'mock';
      localStorage.setItem('uag_mode', urlMode);
    } else {
      const saved = localStorage.getItem('uag_mode');
      if (saved === 'mock' || saved === 'live') {
        initialMock = saved === 'mock';
      }
    }
    setUseMock(initialMock);
    
    // Initial Load
    loadData(initialMock);
  }, []);

  const loadData = async (mockMode: boolean) => {
    if (mockMode) {
      // Simulate API delay
      // setTimeout(() => setAppData({ ...MOCK_DB }), 500);
      setAppData({ ...MOCK_DB }); // Direct load for now
    } else {
      // Live API implementation would go here
      console.log('Live API not implemented, falling back to mock');
      setAppData({ ...MOCK_DB });
    }
  };

  const toggleMode = () => {
    const newMode = !useMock;
    setUseMock(newMode);
    localStorage.setItem('uag_mode', newMode ? 'mock' : 'live');
    loadData(newMode);
  };

  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead);
    // Scroll to action panel on mobile
    if (window.innerWidth <= 1024) {
      const el = document.getElementById('action-panel-container');
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleBuyLead = async (leadId: string) => {
    if (!appData) return;
    setIsProcessing(true);

    // Simulate API call
    setTimeout(() => {
      if (useMock) {
        // Deep copy to avoid direct mutation of state before setAppData
        const newAppData = JSON.parse(JSON.stringify(appData));
        const lead = newAppData.leads.find((l: Lead) => l.id === leadId);
        
        if (!lead) {
          alert("客戶不存在");
          setIsProcessing(false);
          return;
        }

        if (lead.status !== 'new') {
          alert("此客戶已被購買");
          setIsProcessing(false);
          return;
        }

        if (newAppData.user.points < lead.price) {
          alert("點數不足 (Mock)");
          setIsProcessing(false);
          return;
        }

        // Execute transaction
        newAppData.user.points -= lead.price;
        if (lead.grade === 'S') newAppData.user.quota.s--;
        if (lead.grade === 'A') newAppData.user.quota.a--;

        lead.status = 'purchased';
        lead.purchasedAt = Date.now();
        const total = lead.grade === 'S' ? 120 : lead.grade === 'A' ? 72 : 336;
        lead.remainingHours = total;

        setAppData(newAppData);
        setSelectedLead(null); // Deselect or update selection
        alert("交易成功 (Mock)");
      } else {
        alert("Live API buy not implemented");
      }
      setIsProcessing(false);
    }, 800);
  };

  if (!appData) return <div className="p-6 text-center">載入中...</div>;

  return (
    <div className="uag-page">
      <header className="uag-header">
        <div className="uag-header-inner">
          <div className="uag-logo"><div className="uag-logo-badge">邁</div><span>邁房子廣告後台</span></div>
          <div className="uag-breadcrumb"><span>游杰倫 21世紀不動產河南店</span><span className="uag-badge pro">專業版 PRO</span></div>
        </div>
      </header>

      <main className="uag-container">
        <div className="uag-grid">
          {/* [1] UAG Radar */}
          <RadarCluster leads={appData.leads} onSelectLead={handleSelectLead} />

          {/* [Action Panel] */}
          <ActionPanel 
            selectedLead={selectedLead} 
            onBuyLead={handleBuyLead} 
            isProcessing={isProcessing} 
          />

          {/* [2] Asset Monitor */}
          <AssetMonitor leads={appData.leads} />

          {/* [3] Listings & [4] Feed */}
          <ListingFeed listings={appData.listings} feed={appData.feed} />

          {/* [5] Mai Card */}
          <MaiCard />

          {/* [6] Trust Flow */}
          <TrustFlow />
        </div>
      </main>

      <div className="uag-footer-bar">
        <div style={{ marginRight: 'auto', fontSize: '12px', color: 'var(--ink-300)' }}>
          系統模式：<strong style={{ color: useMock ? '#f59e0b' : '#16a34a' }}>{useMock ? "Local Mock" : "Live API"}</strong>
          <button onClick={toggleMode} style={{ marginLeft: '10px', fontSize: '10px', cursor: 'pointer', border: '1px solid #ccc', padding: '2px 6px', borderRadius: '4px' }}>切換模式</button>
        </div>
        <button className="uag-btn">方案設定</button>
        <button className="uag-btn primary">加值點數</button>
        <span className="uag-badge" style={{ fontSize: '14px', background: '#fff8dc', color: '#92400e', borderColor: '#fcd34d' }}>
          點數 <span id="user-points">{appData.user.points}</span>
        </span>
      </div>
    </div>
  );
}
