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

// Custom hook for interval
function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay !== null) {
      const id = setInterval(() => savedCallback.current(), delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

export default function UAGPage() {
  const [appData, setAppData] = useState<AppData | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [useMock, setUseMock] = useState(true);
  const actionPanelRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async (mockMode: boolean) => {
    if (mockMode) {
      // Simulate API delay
      // setTimeout(() => setAppData({ ...MOCK_DB }), 500);
      setAppData({ ...MOCK_DB }); // Direct load for now
    } else {
      // Live API implementation with Supabase
      try {
        // 1. Fetch User Data
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('points, quota_s, quota_a')
          .single();
          
        if (userError) throw userError;

        // 2. Fetch Leads (New + Purchased by me)
        // Note: In a real app, you'd filter by user ID. For now, we fetch all relevant leads.
        const { data: leadsData, error: leadsError } = await supabase
          .from('leads')
          .select('*')
          .or('status.eq.new,status.eq.purchased');

        if (leadsError) throw leadsError;

        // 3. Fetch Listings
        const { data: listingsData, error: listingsError } = await supabase
          .from('listings')
          .select('*');

        if (listingsError) throw listingsError;

        // 4. Fetch Feed
        const { data: feedData, error: feedError } = await supabase
          .from('feed')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        if (feedError) throw feedError;

        // Transform data to match AppData interface
        const transformedData: AppData = {
          user: {
            points: userData.points,
            quota: { s: userData.quota_s, a: userData.quota_a }
          },
          leads: leadsData.map((l: any) => {
            // [Item 4] Calculate remainingHours if backend doesn't provide it
            let remainingHours = l.remaining_hours;
            if (remainingHours == null && l.purchased_at && l.status === 'purchased') {
              const grade = l.grade as 'S' | 'A' | 'B' | 'C' | 'F';
              const totalHours = GRADE_HOURS[grade] || 336;
              const purchasedAt = new Date(l.purchased_at).getTime();
              const elapsedHours = (Date.now() - purchasedAt) / (1000 * 60 * 60);
              remainingHours = Math.max(0, totalHours - elapsedHours);
            }

            return {
              ...l,
              // Ensure types match
              grade: l.grade as 'S' | 'A' | 'B' | 'C' | 'F',
              status: l.status as 'new' | 'purchased',
              remainingHours
            };
          }),
          listings: listingsData.map((l: any) => ({
            ...l,
            thumbColor: l.thumb_color // Map snake_case to camelCase
          })),
          feed: feedData
        };

        setAppData(transformedData);

      } catch (e) {
        console.warn('Live API failed, falling back to mock', e);
        toast.error('目前無法連接 Supabase 資料庫，或資料表尚未建立。系統自動降級顯示 Mock 資料。');
        setAppData({ ...MOCK_DB });
      }
    }
  }, []);

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
    loadData(useMock).catch(err => {
      console.error(err);
      toast.error("載入失敗，請重試");
    });
  }, [useMock, loadData]);

  // Simulate countdown for mock data
  useInterval(() => {
    if (useMock && appData) {
      setAppData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          leads: prev.leads.map(lead => {
            if ((lead.remainingHours || 0) > 0) {
              return { ...lead, remainingHours: Math.max(0, (lead.remainingHours || 0) - 0.1) };
            }
            return lead;
          })
        };
      });
    }
  }, 36000); // Check every 36s (0.01h)

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
    if (!appData) return;
    setIsProcessing(true);

    if (useMock) {
      // Simulate API call
      setTimeout(() => {
        setAppData(prev => {
          if (!prev) return null;
          
          const leadIndex = prev.leads.findIndex(l => l.id === leadId);
          if (leadIndex === -1) {
            toast.error("客戶不存在");
            return prev;
          }

          const lead = prev.leads[leadIndex];
          if (!lead) return prev;

          if (lead.status !== 'new') {
            toast.error("此客戶已被購買");
            return prev;
          }

          if (prev.user.points < lead.price) {
            toast.error("點數不足 (Mock)");
            return prev;
          }

          // [Item 5] Quota Check
          if (lead.grade === 'S' && prev.user.quota.s <= 0) {
            toast.error("S 級配額已用完");
            return prev;
          }
          if (lead.grade === 'A' && prev.user.quota.a <= 0) {
            toast.error("A 級配額已用完");
            return prev;
          }

          // Immutable update
          const updatedUser = {
            ...prev.user,
            points: prev.user.points - lead.price,
            quota: {
              ...prev.user.quota,
              s: lead.grade === 'S' ? prev.user.quota.s - 1 : prev.user.quota.s,
              a: lead.grade === 'A' ? prev.user.quota.a - 1 : prev.user.quota.a
            }
          };

          const updatedLeads = [...prev.leads];
          updatedLeads[leadIndex] = {
            ...lead,
            status: 'purchased',
            purchasedAt: Date.now(),
            remainingHours: GRADE_HOURS[lead.grade] || 336
          };

          toast.success("交易成功 (Mock)");
          return {
            ...prev,
            user: updatedUser,
            leads: updatedLeads
          };
        });
        
        setSelectedLead(null);
        setIsProcessing(false);
      }, 800);
    } else {
      // Live API implementation with Supabase RPC
      try {
        // [Item 5] Quota Check (Frontend pre-check)
        const lead = appData.leads.find(l => l.id === leadId);
        if (lead) {
          if (lead.grade === 'S' && appData.user.quota.s <= 0) {
            toast.error("S 級配額已用完");
            setIsProcessing(false);
            return;
          }
          if (lead.grade === 'A' && appData.user.quota.a <= 0) {
            toast.error("A 級配額已用完");
            setIsProcessing(false);
            return;
          }
        }

        // Assuming we have a logged in user. For now, we might need a hardcoded user ID or auth context.
        // const { data: { user } } = await supabase.auth.getUser();
        // if (!user) throw new Error('Not authenticated');

        // Call the stored procedure 'buy_lead_transaction'
        const { data, error } = await supabase.rpc('buy_lead_transaction', {
          p_lead_id: leadId
          // p_user_id is usually handled by auth.uid() in RLS/RPC, but depends on implementation
        });

        if (error) throw error;

        // [Item 6] RPC Return Check
        const result = data as any;
        if (result && !result.success) {
          throw new Error(result.message || 'Transaction failed');
        }

        toast.success("交易成功 (Live)");
        
        // Update local state directly without reloading
        setAppData(prev => {
          if (!prev) return null;
          
          // Update User
          const updatedUser = {
            ...prev.user,
            points: result.new_points,
            quota: {
              s: result.new_quota_s,
              a: result.new_quota_a
            }
          };

          // Update Leads
          const updatedLeads = prev.leads.map(l => {
            if (l.id === leadId) {
              return {
                ...l,
                status: 'purchased',
                purchasedAt: new Date(result.purchased_at).getTime(),
                // Recalculate remaining hours or use default full duration since it's just bought
                remainingHours: GRADE_HOURS[l.grade] || 336 
              } as Lead;
            }
            return l;
          });

          return {
            ...prev,
            user: updatedUser,
            leads: updatedLeads
          };
        });
        
        setSelectedLead(null);

      } catch (e: any) {
        console.error('Buy lead failed', e);
        toast.error(`交易失敗: ${e.message || '未知錯誤'}`);
      } finally {
        setIsProcessing(false);
      }
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
