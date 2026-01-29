/**
 * UAG De-AI Demo v2 - 完整去除 AI 感的 UAG 頁面設計
 *
 * 所有設計元素來自 ui-ux-pro-max 資料庫：
 *
 * 【風格】Flat Design + Minimalism & Swiss Style
 * 【產品】Real Estate/Property - Trust Blue + Gold + White
 * 【字體】Corporate Trust - Lexend + Source Sans 3
 * 【顏色】Financial Dashboard - #3B82F6, #F97316, #F8FAFC
 * 【動畫】Micro-interactions - Small hover (50-100ms)
 *        Sales Intelligence Dashboard - status change highlights
 * 【Stack】html-tailwind - rounded-2xl shadow-lg p-6
 */

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Phone,
  Eye,
  DollarSign,
  FileText,
  Home,
  ChevronRight,
  Plus,
  Check,
  Upload,
  MessageCircle,
} from 'lucide-react';
import styles from './UAG-deai-v2.module.css';
import type { Lead } from './types/uag.types';

// ============================================================
// Mock Data
// ============================================================
const mockLeads: Lead[] = [
  {
    id: 'lead-001',
    session_id: 'session-001',
    grade: 'S',
    intent: 92,
    prop: '捷運共構 3 房',
    status: 'purchased',
    x: 32,
    y: 32,
    name: '張先生',
    visit: 8,
    price: 1500,
    ai: '高意向客戶，近期有強烈購屋需求',
    notification_status: 'sent',
    conversation_id: 'conv-001',
  },
  {
    id: 'lead-002',
    session_id: 'session-002',
    grade: 'S',
    intent: 88,
    prop: '惠宇上晴 12F',
    status: 'purchased',
    x: 20,
    y: 48,
    name: '李小姐',
    visit: 6,
    price: 1800,
    ai: '關注高樓層物件，預算充裕',
    notification_status: 'pending',
  },
  {
    id: 'lead-003',
    session_id: 'session-003',
    grade: 'S',
    intent: 94,
    prop: '京城豪景',
    status: 'new',
    x: 45,
    y: 40,
    name: '王先生',
    visit: 12,
    price: 2200,
    ai: '豪宅客群，多次瀏覽高價物件',
  },
  {
    id: 'lead-004',
    session_id: 'session-004',
    grade: 'S',
    intent: 90,
    prop: '預售捷運宅',
    status: 'new',
    x: 65,
    y: 52,
    name: '陳小姐',
    visit: 7,
    price: 1200,
    ai: '首購族，偏好交通便利區域',
  },
  {
    id: 'lead-005',
    session_id: 'session-005',
    grade: 'A',
    intent: 69,
    prop: '公園首排',
    status: 'new',
    x: 58,
    y: 26,
    name: '林先生',
    visit: 4,
    price: 1600,
    ai: '重視生活品質，偏好綠地環境',
  },
  {
    id: 'lead-006',
    session_id: 'session-006',
    grade: 'A',
    intent: 75,
    prop: '南屯學區宅',
    status: 'new',
    x: 70,
    y: 36,
    name: '黃小姐',
    visit: 5,
    price: 1400,
    ai: '家庭客群，學區為首要考量',
  },
  {
    id: 'lead-007',
    session_id: 'session-007',
    grade: 'A',
    intent: 71,
    prop: '次高樓層 3 房',
    status: 'new',
    x: 80,
    y: 42,
    name: '吳先生',
    visit: 3,
    price: 1350,
    ai: '換屋族，需要較大空間',
  },
  {
    id: 'lead-008',
    session_id: 'session-008',
    grade: 'B',
    intent: 62,
    prop: '捷運生活圈',
    status: 'new',
    x: 50,
    y: 56,
    name: '鄭小姐',
    visit: 2,
    price: 900,
    ai: '通勤族，交通便利優先',
  },
  {
    id: 'lead-009',
    session_id: 'session-009',
    grade: 'B',
    intent: 58,
    prop: '小坪數投資宅',
    status: 'new',
    x: 36,
    y: 60,
    name: '周先生',
    visit: 3,
    price: 600,
    ai: '投資客，關注租金報酬率',
  },
  {
    id: 'lead-010',
    session_id: 'session-010',
    grade: 'C',
    intent: 48,
    prop: '老屋翻新',
    status: 'new',
    x: 82,
    y: 55,
    name: '許小姐',
    visit: 1,
    price: 500,
    ai: '觀望中，偶爾瀏覽',
  },
  {
    id: 'lead-011',
    session_id: 'session-011',
    grade: 'C',
    intent: 42,
    prop: '套房',
    status: 'new',
    x: 86,
    y: 62,
    name: '蔡先生',
    visit: 1,
    price: 350,
    ai: '預算有限，尚在比較階段',
  },
  {
    id: 'lead-012',
    session_id: 'session-012',
    grade: 'F',
    intent: 22,
    prop: '套房出租',
    status: 'new',
    x: 60,
    y: 70,
    name: '劉小姐',
    visit: 0,
    price: 200,
    ai: '低意向，可能是租屋需求',
  },
  {
    id: 'lead-013',
    session_id: 'session-013',
    grade: 'F',
    intent: 28,
    prop: '小坪數',
    status: 'new',
    x: 72,
    y: 66,
    name: '謝先生',
    visit: 0,
    price: 280,
    ai: '低意向，尚未有明確需求',
  },
];

// Mock listings data
const mockListings = [
  {
    id: '1',
    title: '惠宇上晴 12F',
    thumbColor: '#3B82F6',
    tags: ['高樓層', '景觀戶'],
    view: 1280,
    click: 245,
    fav: 18,
  },
  {
    id: '2',
    title: '捷運共構 3 房',
    thumbColor: '#10B981',
    tags: ['捷運宅', '首購推薦'],
    view: 890,
    click: 156,
    fav: 12,
  },
  {
    id: '3',
    title: '南屯學區宅',
    thumbColor: '#F59E0B',
    tags: ['學區', '家庭'],
    view: 650,
    click: 98,
    fav: 8,
  },
];

// Mock feed data
const mockFeed = [
  {
    id: '1',
    title: '惠文社區 - 區域分析',
    meta: '24 小時前 · 128 人看過',
    body: '南屯惠文區近年房價穩定成長，學區口碑佳，生活機能完善...',
  },
  {
    id: '2',
    title: '購屋攻略：首購族必看',
    meta: '2 天前 · 356 人看過',
    body: '首購族在選擇物件時，除了價格與坪數，更應該注意...',
  },
];

// Mock trust cases
const mockTrustCases = [
  {
    id: 'TR-2024-001',
    buyerId: 'A103',
    buyerName: '買方 A103',
    propertyTitle: '惠宇上晴 12F',
    currentStep: 3,
    status: 'active' as const,
    lastUpdate: Date.now() - 30 * 60000,
  },
  {
    id: 'TR-2024-002',
    buyerId: 'B218',
    buyerName: '買方 B218',
    propertyTitle: '捷運共構 3房',
    currentStep: 2,
    status: 'active' as const,
    lastUpdate: Date.now() - 2 * 3600000,
  },
];

// ui-ux-pro-max: Sales Intelligence Dashboard - 氣泡尺寸系統
function getBubbleSize(grade: string): number {
  switch (grade) {
    case 'S':
      return 100;
    case 'A':
      return 88;
    case 'B':
      return 80;
    case 'C':
      return 72;
    case 'F':
      return 60;
    default:
      return 72;
  }
}

// 計算保護期剩餘
function getProtectionInfo(lead: Lead) {
  const hours = lead.grade === 'S' ? 72 : lead.grade === 'A' ? 48 : lead.grade === 'B' ? 24 : 12;
  const remaining = Math.floor(Math.random() * hours);
  const percent = Math.round((remaining / hours) * 100);
  return { hours, remaining, percent, timeDisplay: `${remaining}h` };
}

// Trust Flow 步驟
const TRUST_STEPS = [
  { key: 1, name: 'M1 接洽', icon: Phone },
  { key: 2, name: 'M2 帶看', icon: Eye },
  { key: 3, name: 'M3 出價', icon: DollarSign },
  { key: 4, name: 'M4 簽約', icon: FileText },
  { key: 5, name: 'M5 交屋', icon: Home },
];

export default function UAGDeAIDemoV2() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedCase, setSelectedCase] = useState(mockTrustCases[0]);

  const liveLeads = mockLeads.filter((l) => l.status === 'new');
  const purchasedLeads = mockLeads.filter((l) => l.status === 'purchased');

  // 產生「等級-序號」標籤
  const leadLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    const gradeCounters: Record<string, number> = {
      S: 0,
      A: 0,
      B: 0,
      C: 0,
      F: 0,
    };

    const sortedLeads = [...liveLeads].sort((a, b) => {
      const gradeOrder: Record<string, number> = {
        S: 1,
        A: 2,
        B: 3,
        C: 4,
        F: 5,
      };
      return (gradeOrder[a.grade] || 99) - (gradeOrder[b.grade] || 99);
    });

    for (const lead of sortedLeads) {
      gradeCounters[lead.grade] = (gradeCounters[lead.grade] || 0) + 1;
      const seq = String(gradeCounters[lead.grade]).padStart(2, '0');
      labels[lead.id] = `${lead.grade}-${seq}`;
    }
    return labels;
  }, [liveLeads]);

  return (
    <div className={`${styles['deai-v2']} ${styles['deai-v2-page']}`}>
      {/* ========== Header ========== */}
      <header className={styles['deai-v2-header']}>
        <div className={styles['deai-v2-header-inner']}>
          {/* Logo - ui-ux-pro-max: Corporate Trust */}
          <div className={styles['deai-v2-logo']}>
            <div className={styles['deai-v2-logo-icon']}>M</div>
            <span className={styles['deai-v2-logo-text']}>邁房子</span>
          </div>

          {/* Nav - ui-ux-pro-max: Flat Design badges */}
          <nav className={styles['deai-v2-nav']}>
            <span className={`${styles['deai-v2-badge']} ${styles['deai-v2-badge--active']}`}>
              UAG 客戶雷達
            </span>
            <span className={styles['deai-v2-badge']}>邁房子</span>
            <span className={styles['deai-v2-badge']}>專業版 PRO</span>
          </nav>

          {/* User */}
          <div className={styles['deai-v2-logo']}>
            <span style={{ fontSize: '13px', color: 'var(--ink-300)' }}>游杰倫</span>
            <div className={styles['deai-v2-logo-icon']}>游</div>
          </div>
        </div>
      </header>

      {/* ========== Agent Bar ========== */}
      <div className={styles['deai-v2-agent-bar']}>
        <div className={styles['deai-v2-agent-avatar']}>游</div>
        <div className={styles['deai-v2-agent-info']}>
          <div className={styles['deai-v2-agent-name']}>
            游杰倫
            <span className={styles['deai-v2-agent-code']}>#12345</span>
          </div>
          <div className={styles['deai-v2-agent-stats']}>
            <span className={styles['deai-v2-agent-stat--trust']}>
              <strong>92</strong> 信任分
            </span>
            <span className={styles['deai-v2-agent-stat']}>
              <strong>45</strong> 帶看
            </span>
            <span className={styles['deai-v2-agent-stat']}>
              <strong>8</strong> 成交
            </span>
          </div>
        </div>
      </div>

      {/* ========== Main Content - 6 Column Grid ========== */}
      <main className={styles['deai-v2-container']}>
        <div className={styles['deai-v2-grid']}>
          {/* [1] Radar Card - span 3 */}
          <section className={`${styles['deai-v2-card']} ${styles['deai-v2-span-3']}`}>
            <div className={styles['deai-v2-card-header']}>
              <div>
                <h2 className={styles['deai-v2-card-title']}>UAG 精準導客雷達</h2>
                <p className={styles['deai-v2-card-sub']}>S/A 級獨家聯絡權｜B/C/F 級點數兌換</p>
              </div>
            </div>

            {/* Cluster */}
            <div className={styles['deai-v2-cluster']}>
              {/* Live Badge */}
              <div className={styles['deai-v2-live']}>
                <span className={styles['deai-v2-live-dot']} />
                <span>Live 監控中</span>
              </div>

              {/* Bubbles */}
              {liveLeads.map((lead) => {
                const x = lead.x ?? 50;
                const y = lead.y ?? 50;
                const size = getBubbleSize(lead.grade);

                return (
                  <div
                    key={lead.id}
                    className={styles['deai-v2-bubble']}
                    data-grade={lead.grade}
                    role="button"
                    aria-label={`${leadLabels[lead.id]} - ${lead.grade}級 - ${lead.intent}% 意向度`}
                    tabIndex={0}
                    style={
                      {
                        '--size': `${size}px`,
                        left: `${x}%`,
                        top: `${y}%`,
                        transform: 'translate(-50%, -50%)',
                      } as React.CSSProperties
                    }
                    onClick={() => setSelectedLead(lead)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedLead(lead);
                      }
                    }}
                  >
                    {/* Grade Badge */}
                    <div className={styles['deai-v2-bubble-grade']}>{lead.grade}</div>

                    {/* Content */}
                    <span className={styles['deai-v2-bubble-id']}>{leadLabels[lead.id]}</span>
                    <span className={styles['deai-v2-bubble-intent']}>{lead.intent}%</span>

                    {/* Label */}
                    <div className={styles['deai-v2-bubble-label']}>{lead.prop}</div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* [2] Action Panel - span 3 */}
          <section className={`${styles['deai-v2-panel']} ${styles['deai-v2-span-3']}`}>
            <div className={styles['deai-v2-panel-head']}>
              {selectedLead ? `${leadLabels[selectedLead.id]} 名單詳情` : '點選氣泡查看詳情'}
            </div>
            <div className={styles['deai-v2-panel-body']}>
              {selectedLead ? (
                <>
                  <div className={styles['deai-v2-stat']}>
                    <span className={styles['deai-v2-stat-label']}>等級</span>
                    <span className={styles['deai-v2-stat-value']}>
                      <span
                        className={`${styles['deai-v2-grade-badge']} ${styles[`deai-v2-grade-badge--${selectedLead.grade.toLowerCase()}`]}`}
                      >
                        {selectedLead.grade} 級
                      </span>
                    </span>
                  </div>
                  <div className={styles['deai-v2-stat']}>
                    <span className={styles['deai-v2-stat-label']}>意向度</span>
                    <span className={styles['deai-v2-stat-value']}>{selectedLead.intent}%</span>
                  </div>
                  <div className={styles['deai-v2-stat']}>
                    <span className={styles['deai-v2-stat-label']}>物件偏好</span>
                    <span className={styles['deai-v2-stat-value']}>{selectedLead.prop}</span>
                  </div>
                  <div className={styles['deai-v2-stat']}>
                    <span className={styles['deai-v2-stat-label']}>預算範圍</span>
                    <span className={styles['deai-v2-stat-value']}>
                      {selectedLead.price >= 1000
                        ? `${(selectedLead.price / 1000).toFixed(1)}千萬`
                        : `${selectedLead.price}萬`}
                    </span>
                  </div>

                  {/* ui-ux-pro-max: Flat Design feedback */}
                  <div
                    className={`${styles['deai-v2-ai-box']} ${
                      selectedLead.grade === 'S' || selectedLead.grade === 'A'
                        ? styles['deai-v2-ai-box--success']
                        : ''
                    }`}
                  >
                    {selectedLead.grade === 'S' || selectedLead.grade === 'A'
                      ? '高意向客戶，建議優先聯繫。24小時內回覆可提升成交率 35%。'
                      : '建議持續追蹤，可透過物件推薦提升意向度。'}
                  </div>

                  <button
                    className={styles['deai-v2-btn-cta']}
                    onClick={() => {
                      // Demo placeholder - 實際應用中應使用 Modal 或 Toast 通知
                    }}
                  >
                    {selectedLead.grade === 'S' || selectedLead.grade === 'A'
                      ? '購買獨家聯絡權'
                      : '用點數兌換'}
                  </button>
                </>
              ) : (
                <div className={styles['deai-v2-empty']}>
                  <svg
                    className={styles['deai-v2-empty-icon']}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" />
                  </svg>
                  點選左側雷達氣泡以查看名單詳情
                </div>
              )}
            </div>
          </section>

          {/* [3] Asset Monitor - span 6 */}
          <section className={`${styles['deai-v2-card']} ${styles['deai-v2-span-6']}`}>
            <div className={styles['deai-v2-card-header']}>
              <div>
                <h2 className={styles['deai-v2-card-title']}>已購客戶資產與保護監控</h2>
                <p className={styles['deai-v2-card-sub']}>
                  S 級 72hr / A 級 48hr 獨家倒數｜B 級 24hr / C 級 12hr 去重
                </p>
              </div>
              <button className={styles['deai-v2-btn']}>匯出報表</button>
            </div>

            {/* ui-ux-pro-max: html-tailwind - table layout */}
            <div className={styles['deai-v2-table-wrap']}>
              <table className={styles['deai-v2-table']}>
                <thead>
                  <tr>
                    <th style={{ width: '25%' }}>客戶等級/名稱</th>
                    <th style={{ width: '35%' }}>保護期倒數</th>
                    <th style={{ width: '20%' }}>目前狀態</th>
                    <th style={{ width: '20%' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {purchasedLeads.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '24px' }}>
                        尚無已購資產，請從上方雷達進攻。
                      </td>
                    </tr>
                  ) : (
                    purchasedLeads.map((lead) => {
                      const { percent, timeDisplay } = getProtectionInfo(lead);
                      const colorVar = `var(--grade-${lead.grade.toLowerCase()})`;

                      return (
                        <tr key={lead.id}>
                          <td>
                            <div className={styles['deai-v2-table-lead']}>
                              <span
                                className={styles['deai-v2-table-grade']}
                                style={{ background: colorVar }}
                              >
                                {lead.grade}
                              </span>
                              <div>
                                <div className={styles['deai-v2-table-name']}>{lead.name}</div>
                                <div className={styles['deai-v2-table-prop']}>{lead.prop}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className={styles['deai-v2-progress-info']}>
                              <span style={{ color: colorVar }}>
                                {lead.grade === 'S' || lead.grade === 'A'
                                  ? '獨家保護中'
                                  : '去重保護中'}
                              </span>
                              <span className={styles['deai-v2-countdown']}>{timeDisplay}</span>
                            </div>
                            <div className={styles['deai-v2-progress-bg']}>
                              <div
                                className={styles['deai-v2-progress-fill']}
                                style={{
                                  width: `${percent}%`,
                                  background: colorVar,
                                }}
                              />
                            </div>
                          </td>
                          <td>
                            <span
                              className={`${styles['deai-v2-status-badge']} ${
                                lead.notification_status === 'sent'
                                  ? styles['deai-v2-status--sent']
                                  : styles['deai-v2-status--pending']
                              }`}
                            >
                              {lead.notification_status === 'sent' ? '已發送' : '待發送'}
                            </span>
                          </td>
                          <td>
                            {lead.conversation_id ? (
                              <button
                                className={`${styles['deai-v2-btn']} ${styles['deai-v2-btn--secondary']}`}
                              >
                                查看對話
                              </button>
                            ) : (
                              <button
                                className={`${styles['deai-v2-btn']} ${styles['deai-v2-btn--primary']} ${styles['deai-v2-btn--small']}`}
                              >
                                發送訊息
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* [4] Listings - span 3 */}
          <section className={`${styles['deai-v2-card']} ${styles['deai-v2-span-3']}`}>
            <div className={styles['deai-v2-card-header']}>
              <div>
                <h2 className={styles['deai-v2-card-title']}>我的房源總覽</h2>
                <p className={styles['deai-v2-card-sub']}>即時掌握曝光、點擊與收藏</p>
              </div>
              <Link
                to="/property/upload"
                className={styles['deai-v2-btn']}
                style={{ textDecoration: 'none' }}
              >
                <Plus size={14} style={{ marginRight: '4px' }} />
                上傳房源
              </Link>
            </div>

            <div className={styles['deai-v2-listings']}>
              {mockListings.map((item) => (
                <article key={item.id} className={styles['deai-v2-listing']}>
                  <div
                    className={styles['deai-v2-listing-thumb']}
                    style={{ background: item.thumbColor }}
                  />
                  <div className={styles['deai-v2-listing-info']}>
                    <div className={styles['deai-v2-listing-title']}>{item.title}</div>
                    <div className={styles['deai-v2-listing-tags']}>
                      {item.tags.map((t, i) => (
                        <span key={i} className={styles['deai-v2-listing-tag']}>
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className={styles['deai-v2-listing-kpi']}>
                      <span>
                        曝光 <b>{item.view}</b>
                      </span>
                      <span>
                        點擊 <b>{item.click}</b>
                      </span>
                      <span>
                        收藏 <b>{item.fav}</b>
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* [5] Feed - span 3 */}
          <section className={`${styles['deai-v2-card']} ${styles['deai-v2-span-3']}`}>
            <div className={styles['deai-v2-card-header']}>
              <div>
                <h2 className={styles['deai-v2-card-title']}>社區牆 & 真實口碑</h2>
                <p className={styles['deai-v2-card-sub']}>用真實交流建立信任</p>
              </div>
              <button className={styles['deai-v2-btn']}>貼文</button>
            </div>

            <div className={styles['deai-v2-feed']}>
              {mockFeed.map((post) => (
                <article key={post.id} className={styles['deai-v2-feed-post']}>
                  <div className={styles['deai-v2-feed-title']}>{post.title}</div>
                  <div className={styles['deai-v2-feed-meta']}>{post.meta}</div>
                  <div className={styles['deai-v2-feed-body']}>{post.body}</div>
                </article>
              ))}
            </div>
          </section>

          {/* [6] Report Generator - span 3 */}
          <section className={`${styles['deai-v2-card']} ${styles['deai-v2-span-3']}`}>
            <div className={styles['deai-v2-card-header']}>
              <div>
                <h2 className={styles['deai-v2-card-title']}>手機報告生成器</h2>
                <p className={styles['deai-v2-card-sub']}>取代 Word 說明書・一鍵分享給客戶</p>
              </div>
            </div>

            <div className={styles['deai-v2-report-step']}>
              <div className={styles['deai-v2-report-header']}>
                <span className={styles['deai-v2-report-badge']}>1/4</span>
                <h3>選擇物件</h3>
              </div>

              <button className={styles['deai-v2-report-import']}>
                <Upload size={20} />
                <span>匯入房仲頁面截圖</span>
                <small>AI 自動識別物件資訊</small>
              </button>

              <div className={styles['deai-v2-report-divider']}>
                <span>或從我的房源選擇</span>
              </div>

              <div className={styles['deai-v2-report-list']}>
                {mockListings.slice(0, 2).map((item) => (
                  <button key={item.id} className={styles['deai-v2-report-item']}>
                    <div
                      className={styles['deai-v2-report-thumb']}
                      style={{ background: item.thumbColor }}
                    >
                      <Home size={16} />
                    </div>
                    <div className={styles['deai-v2-report-info']}>
                      <div className={styles['deai-v2-report-title']}>{item.title}</div>
                      <div className={styles['deai-v2-report-meta']}>{item.tags[0]}</div>
                    </div>
                    <ChevronRight size={18} />
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* [7] Trust Flow - span 3 */}
          <section className={`${styles['deai-v2-card']} ${styles['deai-v2-span-3']}`}>
            <div className={styles['deai-v2-card-header']}>
              <div>
                <h2 className={styles['deai-v2-card-title']}>安心流程管理</h2>
                <p className={styles['deai-v2-card-sub']}>五階段・交易留痕</p>
              </div>
            </div>

            {/* Case Selector */}
            <div className={styles['deai-v2-trust-cases']}>
              {mockTrustCases.map((c) => (
                <button
                  key={c.id}
                  className={`${styles['deai-v2-trust-case']} ${selectedCase?.id === c.id ? styles['deai-v2-trust-case--active'] : ''}`}
                  onClick={() => setSelectedCase(c)}
                >
                  <div className={styles['deai-v2-trust-case-name']}>{c.buyerName}</div>
                  <div className={styles['deai-v2-trust-case-prop']}>{c.propertyTitle}</div>
                  <div className={styles['deai-v2-trust-case-step']}>M{c.currentStep}</div>
                </button>
              ))}
              <button className={styles['deai-v2-trust-add']}>
                <Plus size={16} />
              </button>
            </div>

            {/* Progress Steps - ui-ux-pro-max: Flat Design progress */}
            {selectedCase && (
              <div className={styles['deai-v2-trust-steps']}>
                {TRUST_STEPS.map((step, idx) => {
                  const isPast = step.key < selectedCase.currentStep;
                  const isCurrent = step.key === selectedCase.currentStep;
                  const Icon = step.icon;

                  return (
                    <React.Fragment key={step.key}>
                      <div className={styles['deai-v2-trust-step']}>
                        <div
                          className={`${styles['deai-v2-trust-step-icon']} ${isPast ? styles['deai-v2-trust-step--past'] : ''} ${isCurrent ? styles['deai-v2-trust-step--current'] : ''}`}
                        >
                          {isPast ? <Check size={14} /> : <Icon size={12} />}
                        </div>
                        <div
                          className={`${styles['deai-v2-trust-step-name']} ${isPast ? styles['deai-v2-trust-step-name--past'] : ''} ${isCurrent ? styles['deai-v2-trust-step-name--current'] : ''}`}
                        >
                          {step.name}
                        </div>
                      </div>
                      {idx < TRUST_STEPS.length - 1 && (
                        <div
                          className={`${styles['deai-v2-trust-line']} ${isPast ? styles['deai-v2-trust-line--past'] : ''}`}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            )}

            {/* Action Footer */}
            <div className={styles['deai-v2-trust-footer']}>
              <Link
                to="/assure"
                className={`${styles['deai-v2-btn']} ${styles['deai-v2-btn--primary']}`}
                style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}
              >
                進入 Trust Room
                <ChevronRight size={14} style={{ marginLeft: '4px' }} />
              </Link>
            </div>

            {/* Summary Stats */}
            <div className={styles['deai-v2-trust-stats']}>
              <div className={styles['deai-v2-trust-stat']}>
                <div className={styles['deai-v2-trust-stat-value']}>{mockTrustCases.length}</div>
                <div className={styles['deai-v2-trust-stat-label']}>進行中案件</div>
              </div>
              <div className={styles['deai-v2-trust-stat']}>
                <div
                  className={`${styles['deai-v2-trust-stat-value']} ${styles['deai-v2-trust-stat--success']}`}
                >
                  {mockTrustCases.filter((c) => c.currentStep >= 3).length}
                </div>
                <div className={styles['deai-v2-trust-stat-label']}>已出價</div>
              </div>
              <div className={styles['deai-v2-trust-stat']}>
                <div
                  className={`${styles['deai-v2-trust-stat-value']} ${styles['deai-v2-trust-stat--warning']}`}
                >
                  0
                </div>
                <div className={styles['deai-v2-trust-stat-label']}>待處理</div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* ========== Footer ========== */}
      <footer className={styles['deai-v2-footer']}>
        <span
          style={{
            fontSize: '12px',
            color: 'var(--ink-300)',
            marginRight: 'auto',
          }}
        >
          系統模式：
          <span style={{ color: 'var(--ink-100)', fontWeight: 600 }}>Demo v2</span>
        </span>
        <button className={styles['deai-v2-btn']}>方案設定</button>
        <button className={`${styles['deai-v2-btn']} ${styles['deai-v2-btn--primary']}`}>
          加值點數
        </button>
        <span className={styles['deai-v2-points']}>
          點數<strong>1,280</strong>
        </span>
      </footer>
    </div>
  );
}
