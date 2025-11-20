# UAG Full Stack Code Documentation

This document consolidates the complete source code for the UAG (User Activity & Growth) module, including Frontend (React/TypeScript) and Backend (Supabase SQL/RPC).

## 1. Frontend (React + TypeScript)

### 1.1 Main Page (`src/pages/UAG/index.tsx`)
The entry point for the UAG dashboard. Handles data loading (Mock/Live), state management, and layout.

```tsx
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
            let remainingHours = l.remaining_hours != null ? Number(l.remaining_hours) : null;

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
              remainingHours: remainingHours ?? undefined
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
        console.warn('Live API failed, falling back to mock', e);
        if (import.meta.env.DEV) {
          toast.error(`Live API Error: ${e.message || 'Unknown error'}`);
        } else {
          toast.error('目前無法連接 Supabase 資料庫，或資料表尚未建立。系統自動降級顯示 Mock 資料。');
        }
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
            if (lead.remainingHours && lead.remainingHours > 0) {
              return { ...lead, remainingHours: Math.max(0, lead.remainingHours - 0.1) };
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
          if (!lead) return prev; // Should not happen given findIndex check

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
```

### 1.2 Components

#### `src/pages/UAG/components/RadarCluster.tsx`
Displays the interactive radar with floating bubbles for leads.

```tsx
import React from 'react';
import { Lead } from '../mockData';
import styles from '../UAG.module.css';

export interface RadarClusterProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
}

export default function RadarCluster({ leads, onSelectLead }: RadarClusterProps) {
  const liveLeads = leads.filter(l => l.status === 'new');

  return (
    <section className={`${styles['uag-card']} ${styles['k-span-6']}`} id="radar-section" style={{ minHeight: '450px' }}>
      <div className={styles['uag-card-header']}>
        <div>
          <div className={styles['uag-card-title']}>UAG 精準導客雷達</div>
          <div className={styles['uag-card-sub']}>S/A 級獨家聯絡權｜B/C/F 級點數兌換</div>
        </div>
        <div className={styles['uag-actions']} style={{ gap: '4px' }}>
          {/* Quota display is handled in parent or separate component, but for now static or passed props */}
        </div>
      </div>
      <div className={styles['uag-cluster']} id="radar-container">
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: '300px', height: '300px', border: '1px dashed #cbd5e1', borderRadius: '50%', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: '150px', height: '150px', border: '1px dashed #cbd5e1', borderRadius: '50%', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', left: '16px', top: '16px', background: 'rgba(255,255,255,0.9)', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', color: '#0f172a', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', zIndex: 5 }}>
          <span style={{ width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%', display: 'inline-block', marginRight: '4px' }}></span>
          <span style={{ fontWeight: 700 }}>Live 監控中</span>
        </div>

        {liveLeads.map(lead => {
          const x = lead.x != null ? lead.x : 50;
          const y = lead.y != null ? lead.y : 50;
          const size = lead.grade === 'S' ? 120 : lead.grade === 'A' ? 100 : lead.grade === 'B' ? 90 : lead.grade === 'C' ? 80 : 60;
          const floatDuration = (5 + Math.random() * 3) + 's';

          return (
            <div
              key={lead.id}
              className={styles['uag-bubble']}
              data-grade={lead.grade}
              role="button"
              aria-label={`${lead.name || lead.id} - ${lead.grade}級`}
              tabIndex={0}
              style={{
                '--w': size + 'px',
                '--float': floatDuration,
                left: x + '%',
                top: y + '%'
              } as React.CSSProperties}
              onClick={() => onSelectLead(lead)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onSelectLead(lead);
                }
              }}
            >
              <div className={styles['uag-bubble-grade']} style={{ background: `var(--grade-${lead.grade.toLowerCase()})`, color: '#fff' }}>{lead.grade}</div>
              <div style={{ textAlign: 'center', lineHeight: 1.2 }}>
                <div style={{ fontWeight: 800, fontSize: '14px' }}>{lead.id}</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>{lead.intent}%</div>
              </div>
              <div className={styles['uag-bubble-label']}>{lead.prop}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
```

#### `src/pages/UAG/components/ActionPanel.tsx`
Displays details of the selected lead and handles the purchase action.

```tsx
import React, { forwardRef } from 'react';
import { Lead } from '../mockData';
import styles from '../UAG.module.css';

export interface ActionPanelProps {
  selectedLead: Lead | null;
  onBuyLead: (leadId: string) => void;
  isProcessing: boolean;
}

const StatItem = ({ label, value, highlight = false }: { label: string; value: React.ReactNode; highlight?: boolean }) => (
  <div className={styles['ap-stat']}>
    <span>{label}</span>
    <b style={highlight ? { color: 'var(--uag-brand)' } : {}}>{value}</b>
  </div>
);

const ActionPanel = forwardRef<HTMLDivElement, ActionPanelProps>(({ selectedLead, onBuyLead, isProcessing }, ref) => {
  if (!selectedLead) {
    return (
      <section className={styles['k-span-6']} id="action-panel-container" ref={ref}>
        <div className={styles['uag-action-panel']} id="action-panel">
          <div style={{ height: '100%', minHeight: '200px', display: 'grid', placeItems: 'center', color: 'var(--ink-300)', textAlign: 'center', padding: '40px 20px' }}>
            <div>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>👆</div>
              <div>請點擊上方雷達泡泡<br />查看分析與購買</div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const isExclusive = (selectedLead.grade === 'S' || selectedLead.grade === 'A');

  return (
    <section className={styles['k-span-6']} id="action-panel-container" ref={ref}>
      <div className={styles['uag-action-panel']} id="action-panel">
        <div className={styles['ap-head']}>
          <span className={`${styles['uag-badge']} ${styles['uag-badge--' + selectedLead.grade.toLowerCase()]}`}>{selectedLead.grade}級｜{selectedLead.name}</span>
        </div>
        <div className={styles['ap-body']}>
          <div className={styles['ap-stats-group']}>
            <StatItem label="關注房源" value={selectedLead.prop} />
            <StatItem label="意向分數" value={`${selectedLead.intent}%`} highlight />
            <StatItem label="瀏覽次數" value={`${selectedLead.visit} 次`} />
            <StatItem label="購買成本" value={`${selectedLead.price} 點`} />
          </div>

          <div className={`${styles['ai-box']} ${styles['urgent']}`}>
            <div>{selectedLead.ai}</div>
          </div>

          <div className={styles['action-zone']}>
            {isExclusive && (
              <div style={{ background: '#fff7ed', color: '#ea580c', fontWeight: 700, fontSize: '12px', textAlign: 'center', padding: '6px', borderRadius: '4px', border: '1px solid #ffedd5', marginBottom: '10px' }}>
                ✨ 此客戶包含獨家訊息聯絡權 ✨
              </div>
            )}
            <button
              className={styles['btn-attack']}
              onClick={() => onBuyLead(selectedLead.id)}
              disabled={isProcessing}
            >
              {isProcessing ? '處理中...' : '🚀 獲取聯絡權限 (簡訊/站內信)'}
            </button>
            <div style={{ textAlign: 'center', fontSize: '11px', color: '#94a3b8', marginTop: '8px' }}>
              符合個資法規範：僅能以簡訊/站內信聯繫<br />
              系統將自動發送您的名片與電話給客戶
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

export default ActionPanel;
```

#### `src/pages/UAG/components/AssetMonitor.tsx`
Monitors purchased leads and their protection status.

```tsx
import React from 'react';
import { Lead } from '../mockData';
import styles from '../UAG.module.css';
import { GRADE_HOURS } from '../constants';

interface AssetMonitorProps {
  leads: Lead[];
}

const calculateProtection = (lead: Lead) => {
  const total = GRADE_HOURS[lead.grade] ?? 336;
  const remaining = lead.remainingHours != null ? lead.remainingHours : total;
  const percent = Math.max(0, Math.min(100, (remaining / total) * 100));
  const isExclusive = (lead.grade === 'S' || lead.grade === 'A');
  
  let timeDisplay = '';
  if (isExclusive) {
    timeDisplay = `${remaining.toFixed(1)} 小時`;
  } else {
    const days = (remaining / 24).toFixed(1);
    timeDisplay = `${days} 天`;
  }

  return { total, remaining, percent, isExclusive, timeDisplay };
};

export default function AssetMonitor({ leads }: AssetMonitorProps) {
  const boughtLeads = leads.filter(l => l.status === 'purchased');

  return (
    <section className={`${styles['uag-card']} ${styles['k-span-6']}`}>
      <div className={styles['uag-card-header']}>
        <div>
          <div className={styles['uag-card-title']}>已購客戶資產與保護監控</div>
          <div className={styles['uag-card-sub']}>S 級 120hr / A 級 72hr 獨家倒數｜B/C/F 級 14 天防撞</div>
        </div>
        <div className={styles['uag-actions']}><button className={styles['uag-btn']}>匯出報表</button></div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className={styles['monitor-table']}>
          <thead>
            <tr>
              <th style={{ width: '25%' }}>客戶等級/名稱</th>
              <th style={{ width: '35%' }}>保護期倒數</th>
              <th style={{ width: '20%' }}>目前狀態</th>
              <th style={{ width: '20%' }}>操作</th>
            </tr>
          </thead>
          <tbody id="asset-list">
            {boughtLeads.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>尚無已購資產，請從上方雷達進攻。</td></tr>
            ) : (
              boughtLeads.map(lead => {
                const { percent, isExclusive, timeDisplay } = calculateProtection(lead);
                const colorVar = `var(--grade-${lead.grade.toLowerCase()})`;
                const protectText = isExclusive ? '獨家鎖定中' : '去重保護中';

                return (
                  <tr key={lead.id}>
                    <td data-label="客戶等級/名稱">
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ display: 'inline-grid', placeItems: 'center', width: '24px', height: '24px', borderRadius: '50%', fontSize: '11px', fontWeight: 900, color: '#fff', marginRight: '8px', background: colorVar }}>{lead.grade}</span>
                        <div>
                          <div style={{ fontWeight: 800, color: 'var(--ink-100)' }}>{lead.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--ink-300)' }}>{lead.prop}</div>
                        </div>
                      </div>
                    </td>
                    <td data-label="保護期倒數">
                      <div style={{ fontSize: '11px', fontWeight: 700, marginBottom: '2px', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: colorVar }}>{protectText}</span>
                        <span className={styles['t-countdown']}>{timeDisplay}</span>
                      </div>
                      <div className={styles['progress-bg']}><div className={styles['progress-fill']} style={{ width: `${percent}%`, background: colorVar }}></div></div>
                    </td>
                    <td data-label="目前狀態"><span className={styles['uag-badge']} style={{ background: '#f0fdf4', color: '#16a34a', border: 'none' }}>簡訊已發送</span></td>
                    <td data-label="操作"><button className={`${styles['uag-btn']} ${styles['primary']}`} style={{ padding: '4px 12px', fontSize: '12px' }}>寫紀錄 / 預約</button></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
```

### 1.3 Data & Constants

#### `src/pages/UAG/mockData.ts`
```typescript
export interface BackendLead {
  id: string;
  name: string;
  grade: 'S' | 'A' | 'B' | 'C' | 'F';
  intent: number;
  prop: string;
  visit: number;
  price: number;
  status: 'new' | 'purchased';
  purchasedAt?: number;
  purchasedBy?: string;
  transactionHash?: string;
  ai: string;
  remainingHours?: number;
  x?: number;
  y?: number;
}

export interface Lead extends BackendLead {}

export interface Listing {
  title: string;
  tags: string[];
  view: number;
  click: number;
  fav: number;
  thumbColor: string;
}

export interface FeedPost {
  title: string;
  meta: string;
  body: string;
}

export interface UserData {
  points: number;
  quota: {
    s: number;
    a: number;
  };
}

export interface AppData {
  user: UserData;
  leads: Lead[];
  listings: Listing[];
  feed: FeedPost[];
}

export const MOCK_DB: AppData = {
  user: { points: 1280, quota: { s: 2, a: 3 } },
  leads: [
    // ... (Mock data content)
  ],
  listings: [
    // ...
  ],
  feed: [
    // ...
  ]
};
```

#### `src/pages/UAG/constants.ts`
```typescript
export const GRADE_HOURS = { S: 120, A: 72, B: 336, C: 336, F: 336 };
```

## 2. Backend (Supabase)

### 2.1 Schema & RPC (`supabase-uag-full.sql`)
Contains table definitions, RLS policies, and the `buy_lead_transaction` stored procedure.

```sql
-- ==============================================================================
-- UAG Full Stack Schema (Users, Leads, Listings, Feed, RPC)
-- ==============================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT,
    points INTEGER DEFAULT 1000,
    quota_s INTEGER DEFAULT 0,
    quota_a INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = id);

-- 1.1 Auto-create user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, points, quota_s, quota_a)
  VALUES (NEW.id, NEW.email, 1000, 0, 0);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. Leads Table (The radar bubbles)
CREATE TABLE IF NOT EXISTS public.leads (
    id TEXT PRIMARY KEY, -- e.g., 'S-5566'
    name TEXT NOT NULL,
    grade TEXT CHECK (grade IN ('S', 'A', 'B', 'C', 'F')),
    intent INTEGER,
    prop TEXT,
    visit INTEGER,
    price INTEGER,
    status TEXT CHECK (status IN ('new', 'purchased')) DEFAULT 'new',
    purchased_at TIMESTAMPTZ,
    purchased_by UUID REFERENCES public.users(id),
    ai TEXT,
    remaining_hours NUMERIC,
    x NUMERIC, -- Radar X position
    y NUMERIC, -- Radar Y position
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
-- Everyone can see 'new' leads, Users can see their own 'purchased' leads
CREATE POLICY "View leads" ON public.leads FOR SELECT 
USING (status = 'new' OR purchased_by = auth.uid());

-- 3. Listings Table (My Properties)
CREATE TABLE IF NOT EXISTS public.listings (
    id BIGSERIAL PRIMARY KEY,
    agent_id UUID REFERENCES public.users(id), -- Optional: link to specific agent
    title TEXT NOT NULL,
    tags TEXT[],
    view_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    fav_count INTEGER DEFAULT 0,
    thumb_color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View listings" ON public.listings FOR SELECT USING (true);

-- 4. Feed Table (Community Wall)
CREATE TABLE IF NOT EXISTS public.feed (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    meta TEXT,
    body TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.feed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View feed" ON public.feed FOR SELECT USING (true);

-- ==============================================================================
-- Stored Procedure: Buy Lead Transaction (RPC)
-- ==============================================================================
CREATE OR REPLACE FUNCTION buy_lead_transaction(p_lead_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_lead_price INTEGER;
    v_user_points INTEGER;
    v_user_quota_s INTEGER;
    v_user_quota_a INTEGER;
    v_lead_grade TEXT;
    v_lead_status TEXT;
    v_new_points INTEGER;
    v_new_quota_s INTEGER;
    v_new_quota_a INTEGER;
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Lock lead row for update
    SELECT price, grade, status INTO v_lead_price, v_lead_grade, v_lead_status
    FROM public.leads
    WHERE id = p_lead_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lead not found';
    END IF;

    IF v_lead_status <> 'new' THEN
        RAISE EXCEPTION 'Lead already purchased';
    END IF;

    -- Lock user row for update
    SELECT points, quota_s, quota_a INTO v_user_points, v_user_quota_s, v_user_quota_a
    FROM public.users
    WHERE id = v_user_id
    FOR UPDATE;

    IF v_user_points < v_lead_price THEN
        RAISE EXCEPTION 'Insufficient points';
    END IF;

    -- [FIX] Add Quota Check
    IF v_lead_grade = 'S' AND v_user_quota_s <= 0 THEN
        RAISE EXCEPTION 'Insufficient S-Grade Quota';
    END IF;
    IF v_lead_grade = 'A' AND v_user_quota_a <= 0 THEN
        RAISE EXCEPTION 'Insufficient A-Grade Quota';
    END IF;

    -- Calculate new values
    v_new_points := v_user_points - v_lead_price;
    v_new_quota_s := CASE WHEN v_lead_grade = 'S' THEN v_user_quota_s - 1 ELSE v_user_quota_s END;
    v_new_quota_a := CASE WHEN v_lead_grade = 'A' THEN v_user_quota_a - 1 ELSE v_user_quota_a END;

    -- Deduct points
    UPDATE public.users
    SET points = v_new_points,
        quota_s = v_new_quota_s,
        quota_a = v_new_quota_a
    WHERE id = v_user_id;

    -- Update lead status
    UPDATE public.leads
    SET status = 'purchased',
        purchased_by = v_user_id,
        purchased_at = NOW(),
        remaining_hours = CASE 
            WHEN v_lead_grade = 'S' THEN 120 
            WHEN v_lead_grade = 'A' THEN 72 
            ELSE 336 
        END
    WHERE id = p_lead_id;

    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Transaction completed',
        'new_points', v_new_points,
        'new_quota_s', v_new_quota_s,
        'new_quota_a', v_new_quota_a,
        'purchased_at', NOW()
    );
END;
$$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_purchased_by ON public.leads(purchased_by);
```
