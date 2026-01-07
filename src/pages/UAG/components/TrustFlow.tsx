import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Eye, DollarSign, FileText, Home, ChevronRight, RefreshCw, Plus, Check, AlertCircle, Zap } from 'lucide-react';
import styles from '../UAG.module.css';
import { logger } from '../../../lib/logger';

// ==================== Types ====================
interface TrustCase {
  id: string;
  buyerId: string;
  buyerName: string;
  propertyTitle: string;
  currentStep: number;
  status: 'active' | 'completed' | 'pending' | 'expired';
  lastUpdate: number;
  offerPrice?: number;
  events: TrustEvent[];
}

interface TrustEvent {
  id: string;
  step: number;
  stepName: string;
  action: string;
  actor: 'agent' | 'buyer' | 'system';
  timestamp: number;
  hash?: string;
  detail?: string;
}

// ==================== Mock Data ====================
const MOCK_CASES: TrustCase[] = [
  {
    id: 'TR-2024-001',
    buyerId: 'A103',
    buyerName: '買方 A103',
    propertyTitle: '惠宇上晴 12F',
    currentStep: 3,
    status: 'active',
    lastUpdate: Date.now() - 30 * 60000,
    offerPrice: 31500000,
    events: [
      { id: 'e1', step: 1, stepName: 'M1 接洽', action: '初次接洽建立', actor: 'agent', timestamp: Date.now() - 2 * 86400000, hash: '9f2a...c8d1' },
      { id: 'e2', step: 2, stepName: 'M2 帶看', action: '帶看雙方到場', actor: 'buyer', timestamp: Date.now() - 1 * 86400000, hash: 'b7aa...f3e2', detail: 'GeoTag: 南屯社區大廳' },
      { id: 'e3', step: 3, stepName: 'M3 出價', action: '買方出價', actor: 'buyer', timestamp: Date.now() - 30 * 60000, hash: '1a7c...92b4', detail: '出價 NT$31,500,000' },
    ]
  },
  {
    id: 'TR-2024-002',
    buyerId: 'B218',
    buyerName: '買方 B218',
    propertyTitle: '捷運共構 3房',
    currentStep: 2,
    status: 'active',
    lastUpdate: Date.now() - 2 * 3600000,
    events: [
      { id: 'e4', step: 1, stepName: 'M1 接洽', action: '初次接洽建立', actor: 'agent', timestamp: Date.now() - 3 * 86400000, hash: '3c5d...a7b9' },
      { id: 'e5', step: 2, stepName: 'M2 帶看', action: '預約帶看確認', actor: 'buyer', timestamp: Date.now() - 2 * 3600000, hash: 'd8e2...1f4c', detail: '預約 11/30 14:00' },
    ]
  },
  {
    id: 'TR-2024-003',
    buyerId: 'S901',
    buyerName: '買方 S901',
    propertyTitle: '高樓景觀宅',
    currentStep: 4,
    status: 'active',
    lastUpdate: Date.now() - 12 * 3600000,
    offerPrice: 28800000,
    events: [
      { id: 'e6', step: 1, stepName: 'M1 接洽', action: '初次接洽建立', actor: 'agent', timestamp: Date.now() - 7 * 86400000, hash: 'f1a2...b3c4' },
      { id: 'e7', step: 2, stepName: 'M2 帶看', action: '帶看完成', actor: 'buyer', timestamp: Date.now() - 5 * 86400000, hash: 'e5d6...c7f8' },
      { id: 'e8', step: 3, stepName: 'M3 出價', action: '議價中', actor: 'buyer', timestamp: Date.now() - 3 * 86400000, hash: 'a9b0...d1e2' },
      { id: 'e9', step: 4, stepName: 'M4 簽約', action: '合約審閱中', actor: 'agent', timestamp: Date.now() - 12 * 3600000, hash: 'c3d4...e5f6', detail: '等待買方確認' },
    ]
  }
];

// ==================== Helpers ====================
const STEPS = [
  { key: 1, name: 'M1 接洽', icon: Phone },
  { key: 2, name: 'M2 帶看', icon: Eye },
  { key: 3, name: 'M3 出價', icon: DollarSign },
  { key: 4, name: 'M4 簽約', icon: FileText },
  { key: 5, name: 'M5 交屋', icon: Home },
];

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return '剛剛';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分鐘前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小時前`;
  return `${Math.floor(diff / 86400000)} 天前`;
}

function getStatusBadge(status: TrustCase['status']) {
  switch (status) {
    case 'active': return { text: '進行中', bg: '#dcfce7', color: '#16a34a' };
    case 'completed': return { text: '已完成', bg: '#dbeafe', color: '#2563eb' };
    case 'pending': return { text: '待處理', bg: '#fef3c7', color: '#d97706' };
    case 'expired': return { text: '已過期', bg: '#fee2e2', color: '#dc2626' };
  }
}

// ==================== Component ====================
export default function TrustFlow() {
  const [useMock, setUseMock] = useState(true);
  const [cases, setCases] = useState<TrustCase[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedEvents, setExpandedEvents] = useState(false);

  // Load data
  const loadCases = useCallback(async () => {
    setLoading(true);
    try {
      if (useMock) {
        // Mock mode: use local data
        await new Promise(r => setTimeout(r, 300)); // Simulate network
        setCases(MOCK_CASES);
        const firstCase = MOCK_CASES[0];
        if (!selectedCaseId && firstCase) {
          setSelectedCaseId(firstCase.id);
        }
      } else {
        // Real mode: fetch from API
        const res = await fetch('/api/trust/cases');
        if (res.ok) {
          const data = await res.json();
          const loadedCases = data.cases || [];
          setCases(loadedCases);
          if (loadedCases.length > 0 && !selectedCaseId) {
            setSelectedCaseId(loadedCases[0].id);
          }
        }
      }
    } catch (e) {
      logger.error('[TrustFlow] Failed to load cases', { error: e });
    } finally {
      setLoading(false);
    }
  }, [useMock, selectedCaseId]);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  const selectedCase = cases.find(c => c.id === selectedCaseId);
  const recentEvents = selectedCase?.events.slice(-3).reverse() || [];

  return (
    <section className={`${styles['uag-card']} ${styles['k-span-3']}`}>
      {/* Header */}
      <div className={styles['uag-card-header']}>
        <div>
          <div className={styles['uag-card-title']}>安心流程管理</div>
          <div className={styles['uag-card-sub']}>
            五階段・交易留痕
            {useMock && <span style={{ marginLeft: 8, color: '#f59e0b', fontSize: 11 }}>● Mock</span>}
          </div>
        </div>
        <div className={styles['uag-actions']}>
          <button
            className={styles['uag-btn']}
            onClick={() => setUseMock(!useMock)}
            title={useMock ? '切換到真實模式' : '切換到模擬模式'}
          >
            <Zap size={14} style={{ marginRight: 4 }} />
            {useMock ? 'Mock' : 'Live'}
          </button>
          <button className={styles['uag-btn']} onClick={loadCases} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Case Selector */}
      {cases.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
          {cases.map(c => {
            const isActive = c.id === selectedCaseId;
            const statusBadge = getStatusBadge(c.status);
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCaseId(c.id)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: isActive ? '2px solid #1749d7' : '1px solid #e2e8f0',
                  background: isActive ? '#eef2ff' : '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  minWidth: 140,
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: isActive ? '#1749d7' : '#334155', marginBottom: 2 }}>
                  {c.buyerName}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-300)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>
                  {c.propertyTitle}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    fontSize: 10,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: statusBadge.bg,
                    color: statusBadge.color,
                    fontWeight: 600,
                  }}>
                    M{c.currentStep}
                  </span>
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>
                    {formatRelativeTime(c.lastUpdate)}
                  </span>
                </div>
              </button>
            );
          })}
          <button
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px dashed #cbd5e1',
              background: '#f8fafc',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 60,
              color: 'var(--ink-300)',
            }}
            onClick={() => {/* TODO: New case modal */}}
          >
            <Plus size={16} />
          </button>
        </div>
      )}

      {/* Progress Steps */}
      {selectedCase && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 8 }}>
          {STEPS.map((step, idx) => {
            const isPast = step.key < selectedCase.currentStep;
            const isCurrent = step.key === selectedCase.currentStep;
            const Icon = step.icon;
            
            return (
              <React.Fragment key={step.key}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      margin: '0 auto 4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isPast ? '#16a34a' : isCurrent ? '#1749d7' : '#e5e7eb',
                      color: isPast || isCurrent ? '#fff' : '#6b7280',
                      transition: 'all 0.3s',
                    }}
                  >
                    {isPast ? <Check size={16} /> : <Icon size={14} />}
                  </div>
                  <div style={{
                    fontSize: 11,
                    fontWeight: isCurrent ? 700 : 500,
                    color: isPast ? '#16a34a' : isCurrent ? '#1749d7' : '#94a3b8',
                  }}>
                    {step.name}
                  </div>
                </div>
                {idx < STEPS.length - 1 && (
                  <div style={{
                    flex: 0.5,
                    height: 2,
                    background: isPast ? '#16a34a' : '#e5e7eb',
                    marginBottom: 20,
                  }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Event Timeline */}
      {selectedCase && (
        <div style={{ background: '#f8fafc', borderRadius: 8, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '80px 1fr 80px',
            padding: '8px 12px',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--ink-300)',
            background: '#f1f5f9',
            borderBottom: '1px solid #e2e8f0',
          }}>
            <div>時間</div>
            <div>事件與參與者</div>
            <div>留痕</div>
          </div>

          {/* Events */}
          {recentEvents.map((event, idx) => {
            const isCurrent = idx === 0;
            return (
              <div
                key={event.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr 80px',
                  padding: '10px 12px',
                  borderBottom: idx < recentEvents.length - 1 ? '1px solid #e2e8f0' : 'none',
                  background: isCurrent ? '#fefce8' : 'transparent',
                  alignItems: 'start',
                }}
              >
                <div style={{ fontSize: 11, color: 'var(--ink-300)' }}>
                  {formatTime(event.timestamp)}
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--ink)' }}>
                    <b>{event.stepName} {event.action}</b>
                    <span style={{ color: 'var(--ink-300)' }}>｜{event.actor === 'agent' ? '房仲' : event.actor === 'buyer' ? '買方' : '系統'}</span>
                  </div>
                  {event.detail && (
                    <div style={{ fontSize: 11, color: 'var(--ink-300)', marginTop: 2 }}>
                      {event.detail}
                    </div>
                  )}
                </div>
                <div>
                  {event.hash && (
                    <span style={{
                      fontSize: 10,
                      padding: '3px 8px',
                      borderRadius: 4,
                      background: isCurrent ? '#fef3c7' : '#f1f5f9',
                      color: isCurrent ? 'var(--grade-s)' : 'var(--ink-300)',
                      border: isCurrent ? '1px solid #fcd34d' : '1px solid #e2e8f0',
                      fontFamily: 'monospace',
                    }}>
                      {event.hash}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Show more */}
          {selectedCase.events.length > 3 && (
            <button
              onClick={() => setExpandedEvents(!expandedEvents)}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: 11,
                color: '#1749d7',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {expandedEvents ? '收起' : `查看全部 ${selectedCase.events.length} 筆紀錄`}
            </button>
          )}
        </div>
      )}

      {/* Empty State */}
      {!selectedCase && !loading && (
        <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--ink-300)' }}>
          <AlertCircle size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
          <div style={{ fontSize: 13, marginBottom: 8 }}>目前沒有進行中的案件</div>
          <button className={`${styles['uag-btn']} ${styles['primary']}`}>
            <Plus size={14} style={{ marginRight: 4 }} />
            建立新案件
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--ink-300)' }}>
          <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px' }} />
          <div style={{ fontSize: 12 }}>載入中...</div>
        </div>
      )}

      {/* Action Footer */}
      {selectedCase && (
        <div style={{ display: 'flex', gap: 8, paddingTop: 8, borderTop: '1px solid #e2e8f0' }}>
          <Link
            to={`/assure?case=${selectedCase.id}`}
            className={`${styles['uag-btn']} ${styles['primary']}`}
            style={{ flex: 1, textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            進入 Trust Room
            <ChevronRight size={14} />
          </Link>
          {selectedCase.currentStep === 3 && selectedCase.offerPrice && (
            <button className={styles['uag-btn']} style={{ background: '#fef3c7', borderColor: '#fcd34d', color: 'var(--grade-s)' }}>
              <DollarSign size={14} style={{ marginRight: 4 }} />
              回應出價
            </button>
          )}
        </div>
      )}

      {/* Summary Stats */}
      {cases.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8,
          padding: '12px 0 0',
          borderTop: '1px solid #e2e8f0',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1749d7' }}>{cases.length}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-300)' }}>進行中案件</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#16a34a' }}>
              {cases.filter(c => c.currentStep >= 3).length}
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-300)' }}>已出價</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#f59e0b' }}>
              {cases.filter(c => c.status === 'pending').length || 0}
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-300)' }}>待處理</div>
          </div>
        </div>
      )}
    </section>
  );
}
