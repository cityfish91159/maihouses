import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import styles from './UAG.module.css';
import { MOCK_DB, AppData, Lead } from './mockData';
import { GRADE_HOURS } from './constants';
import RadarCluster from './components/RadarCluster';
import ActionPanel from './components/ActionPanel';
import AssetMonitor from './components/AssetMonitor';
import ListingFeed from './components/ListingFeed';
import MaiCard from './components/MaiCard';
import TrustFlow from './components/TrustFlow';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

// Helper function for remaining hours calculation
const calculateRemainingHours = (
  purchasedAt: number | string | undefined,
  grade: 'S' | 'A' | 'B' | 'C' | 'F'
): number => {
  if (!purchasedAt) return 0;
  
  const totalHours = GRADE_HOURS[grade] || 336;
  const purchasedTime = new Date(purchasedAt).getTime();
  const elapsedHours = (Date.now() - purchasedTime) / (1000 * 60 * 60);
  
  // Guard: ensure not out of range or negative
  return Math.max(0, Math.min(totalHours, totalHours - elapsedHours));
};

// Helper for quota validation
const validateQuota = (lead: Lead, user: { quota: { s: number; a: number } }): { valid: boolean; error?: string } => {
  if (lead.grade === 'S' && user.quota.s <= 0) {
    return { valid: false, error: 'S 級配額已用完' };
  }
  if (lead.grade === 'A' && user.quota.a <= 0) {
    return { valid: false, error: 'A 級配額已用完' };
  }
  return { valid: true };
};

export default function UAGPage() {
  const [appData, setAppData] = useState<AppData | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [useMock, setUseMock] = useState(true);
  const actionPanelRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { session, user } = useAuth();

  const loadData = useCallback(async (mockMode: boolean, signal?: AbortSignal) => {
    if (mockMode) {
      // Simulate API delay
      // setTimeout(() => setAppData({ ...MOCK_DB }), 500);
      setAppData({ ...MOCK_DB }); // Direct load for now
    } else {
      // Live API implementation with Supabase
      if (!session) {
        // Wait for session or show error if not authenticated
        return;
      }

      try {
        // 1. Parallel Fetch
        const [userRes, leadsRes, listingsRes, feedRes] = await Promise.all([
          supabase
            .from('users')
            .select('points, quota_s, quota_a')
            .single(),
          supabase
            .from('leads')
            .select('*'),
          supabase
            .from('listings')
            .select('*')
            .eq('agent_id', session.user.id),
          supabase
            .from('feed')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5)
        ]);

        if (userRes.error) throw userRes.error;
        if (leadsRes.error) throw leadsRes.error;
        if (listingsRes.error) throw listingsRes.error;
        if (feedRes.error) throw feedRes.error;

        const userData = userRes.data;
        const leadsData = leadsRes.data;
        const listingsData = listingsRes.data;
        const feedData = feedRes.data;        // Transform data to match AppData interface
        const transformedData: AppData = {
          user: {
            points: userData.points,
            quota: { s: userData.quota_s, a: userData.quota_a }
          },
          leads: leadsData.map((l: any) => {
            // [Item 4] Calculate remainingHours if backend doesn't provide it
            let remainingHours = l.remaining_hours != null ? Number(l.remaining_hours) : null;

            if (remainingHours == null && l.purchased_at && l.status === 'purchased') {
              remainingHours = calculateRemainingHours(l.purchased_at, l.grade as 'S' | 'A' | 'B' | 'C' | 'F');
            }

            return {
              ...l,
              // Ensure types match
              grade: l.grade as 'S' | 'A' | 'B' | 'C' | 'F',
              status: l.status as 'new' | 'purchased',
              ...(remainingHours != null ? { remainingHours } : {})
            };
          }),
          listings: listingsData.map((l: any) => ({
            title: l.title,
            tags: l.tags ?? [],
            view: l.view_count ?? 0,
            click: l.click_count ?? 0,
            fav: l.fav_count ?? 0,
            thumbColor: l.thumb_color ?? '#e5e7eb'
          })),
          feed: feedData
        };

        setAppData(transformedData);

      } catch (e: any) {
        if (e.name === 'AbortError') return;
        console.warn('Live API failed, falling back to mock', e);
        if (import.meta.env.DEV) {
          toast.error(`Live API Error: ${e.message || 'Unknown error'}`);
        } else {
          toast.error('目前無法連接 Supabase 資料庫，或資料表尚未建立。系統自動降級顯示 Mock 資料。');
        }
        setUseMock(true);
        localStorage.setItem('uag_mode', 'mock');
        setAppData({ ...MOCK_DB });
      }
    }
  }, [session]);

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
  }, []);

  useEffect(() => {
    if (session || useMock) {
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      loadData(useMock, signal).catch(err => {
        if (err.name !== 'AbortError') {
          console.error(err);
          toast.error("載入失敗，請重試");
        }
      });
    }
    return () => abortControllerRef.current?.abort();
  }, [useMock, loadData, session]);

  // Realtime subscription
  useEffect(() => {
    if (!useMock && session) {
      const channel = supabase.channel('leads-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => loadData(false))
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [useMock, session, loadData]);

  // Simulate countdown for mock data using useEffect instead of useInterval
  useEffect(() => {
    if (!useMock || !appData) return;

    const intervalId = setInterval(() => {
      setAppData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          leads: prev.leads.map(lead => {
            if (lead.remainingHours !== undefined) {
              return { ...lead, remainingHours: Math.max(0, lead.remainingHours - 0.01) };
            }
            return lead;
          })
        };
      });
    }, 36000); // Check every 36s (0.01h)

    return () => clearInterval(intervalId);
  }, [useMock, appData]); // appData dependency ensures we have latest data, but might cause re-renders. 
  // Ideally we use functional update which we do, so we might not need appData in dependency if we trust functional update.
  // However, the user requested this specific pattern.
  // Wait, if we put appData in dependency, the interval resets every time appData changes (every 36s).
  // This is actually fine for this use case as long as we cleanup.

  const toggleMode = () => {
    const newMode = !useMock;
    setUseMock(newMode);
    localStorage.setItem('uag_mode', newMode ? 'mock' : 'live');
    // loadData is triggered by useEffect
  };

  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead);
    // Scroll to action panel on mobile
    if (window.innerWidth <= 1024) {
      actionPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleBuyLead = async (leadId: string) => {
    if (!appData || isProcessing) return;

    // 1. Optimistic Update Setup
    const previousAppData = appData;
    const lead = appData.leads.find(l => l.id === leadId);
    
    if (!lead) {
      toast.error("客戶不存在");
      return;
    }
    if (lead.status !== 'new') {
      toast.error("此客戶已被購買");
      return;
    }
    
    // Quota Check
    const quotaCheck = validateQuota(lead, appData.user);
    if (!quotaCheck.valid) {
      toast.error(quotaCheck.error || '配額不足');
      return;
    }

    if (appData.user.points < lead.price) {
      toast.error("點數不足");
      return;
    }

    setIsProcessing(true);

    // 2. Apply Optimistic Update
    const optimisticUser = {
      ...appData.user,
      points: appData.user.points - lead.price,
      quota: {
        ...appData.user.quota,
        s: lead.grade === 'S' ? appData.user.quota.s - 1 : appData.user.quota.s,
        a: lead.grade === 'A' ? appData.user.quota.a - 1 : appData.user.quota.a
      }
    };

    const optimisticLeads = appData.leads.map(l => 
      l.id === leadId 
        ? { ...l, status: 'purchased' as const, purchasedAt: Date.now(), remainingHours: GRADE_HOURS[l.grade] || 336 } 
        : l
    );

    setAppData({ ...appData, user: optimisticUser, leads: optimisticLeads });
    setSelectedLead(null);

    try {
      if (useMock) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        toast.success("交易成功 (Mock)");
      } else {
        // Live API
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase.rpc('buy_lead_transaction', {
          p_lead_id: leadId
        });

        if (error) throw error;

        const result = data as any;
        if (!result.success) {
          throw new Error(result.message || 'Transaction failed');
        }

        toast.success("交易成功");
      }
    } catch (error: any) {
      console.error('Transaction failed:', error);
      toast.error(`交易失敗: ${error.message}`);
      // 3. Rollback on Error
      setAppData(previousAppData);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!appData) return <div className="p-6 text-center">載入中...</div>;

  return (
    <div className={styles['uag-page']}>
      <Toaster position="top-center" />
      <header className={styles['uag-header']}>
        <div className={styles['uag-header-inner']}>
          <div className={styles['uag-logo']}><div className={styles['uag-logo-badge']}>邁</div><span>邁房子廣告後台</span></div>
          <div className={styles['uag-breadcrumb']}><span>游杰倫 21世紀不動產河南店</span><span className={`${styles['uag-badge']} ${styles['uag-badge--pro']}`}>專業版 PRO</span></div>
        </div>
      </header>

      <main className={styles['uag-container']}>
        <div className={styles['uag-grid']}>
          {/* [1] UAG Radar */}
          <RadarCluster leads={appData.leads} onSelectLead={handleSelectLead} />

          {/* [Action Panel] */}
          <ActionPanel 
            ref={actionPanelRef}
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

      <div className={styles['uag-footer-bar']}>
        <div style={{ marginRight: 'auto', fontSize: '12px', color: 'var(--ink-300)' }}>
          系統模式：<strong style={{ color: useMock ? '#f59e0b' : '#16a34a' }}>{useMock ? "Local Mock" : "Live API"}</strong>
          <button onClick={toggleMode} style={{ marginLeft: '10px', fontSize: '10px', cursor: 'pointer', border: '1px solid #ccc', padding: '2px 6px', borderRadius: '4px' }}>切換模式</button>
        </div>
        <button className={styles['uag-btn']}>方案設定</button>
        <button className={`${styles['uag-btn']} ${styles['primary']}`}>加值點數</button>
        <span className={styles['uag-badge']} style={{ fontSize: '14px', background: '#fff8dc', color: '#92400e', borderColor: '#fcd34d' }}>
          點數 <span id="user-points">{appData.user.points}</span>
        </span>
      </div>
    </div>
  );
}
