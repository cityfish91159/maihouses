import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Lead } from '../types/uag.types';
import styles from '../UAG.module.css';
import { resolveOverlap } from '../utils/resolveOverlap';

export interface RadarClusterProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
}

/** 簡單的種子隨機數生成器，基於 lead ID 產生穩定的隨機值 */
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // 正規化到 0-1 範圍
  return Math.abs((Math.sin(hash) * 10000) % 1);
}

export default function RadarCluster({ leads, onSelectLead }: RadarClusterProps) {
  const liveLeads = leads.filter((l) => l.status === 'new');
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [clickedLeadId, setClickedLeadId] = useState<string | null>(null);

  // 偵測容器寬度變化（響應式）
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateWidth = () => {
      const width = container.offsetWidth;
      if (width > 0) {
        setContainerWidth(width);
      }
    };

    // 立即執行一次（處理測試環境）
    const immediateWidth = container.offsetWidth;
    if (immediateWidth > 0) {
      setContainerWidth(immediateWidth);
    }

    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  // 預先計算每個 lead 的動畫時長（基於 lead ID 產生穩定的隨機值）
  const floatDurations = useMemo(() => {
    const durations: Record<string, string> = {};
    for (const lead of liveLeads) {
      const randomOffset = seededRandom(lead.id) * 3; // 0-3 範圍
      durations[lead.id] = 5 + randomOffset + 's';
    }
    return durations;
  }, [liveLeads]);

  // 產生「等級-序號」標籤（例如 S-01, A-05）
  const leadLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    const gradeCounters: Record<string, number> = {
      S: 0,
      A: 0,
      B: 0,
      C: 0,
      F: 0,
    };

    // 依照等級排序，確保序號順序一致
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

  // R1: 響應式尺寸對應表（手機 vs 桌面）
  const isMobile = containerWidth > 0 && containerWidth <= 768;
  const sizeMap = useMemo(() => {
    if (isMobile) {
      return { S: 72, A: 60, B: 54, C: 48, F: 40 };
    }
    return { S: 120, A: 100, B: 90, C: 80, F: 60 };
  }, [isMobile]);

  // R2: 碰撞偵測與位置解析
  const resolvedPositions = useMemo(() => {
    if (containerWidth === 0 || liveLeads.length === 0) return [];

    const containerHeight = 450; // 固定高度（與 CSS minHeight 一致）
    const bubbles = liveLeads.map((lead) => {
      const x = lead.x != null ? (lead.x / 100) * containerWidth : containerWidth / 2;
      const y = lead.y != null ? (lead.y / 100) * containerHeight : containerHeight / 2;
      const size = sizeMap[lead.grade as keyof typeof sizeMap] ?? 60;
      return { x, y, size };
    });

    return resolveOverlap(bubbles, containerWidth, containerHeight, 4);
  }, [liveLeads, containerWidth, sizeMap]);

  return (
    <section
      className={`${styles['uag-card']} ${styles['k-span-6']}`}
      id="radar-section"
      style={{ minHeight: '450px' }}
    >
      <div className={styles['uag-card-header']}>
        <div>
          <div className={styles['uag-card-title']}>UAG 精準導客雷達</div>
          <div className={styles['uag-card-sub']}>S/A 級獨家聯絡權｜B/C/F 級點數兌換</div>
        </div>
        <div className={styles['uag-actions']} style={{ gap: '4px' }}>
          {/* Quota display is handled in parent or separate component, but for now static or passed props */}
        </div>
      </div>
      <div className={styles['uag-cluster']} id="radar-container" ref={containerRef}>
        <div className={`${styles['uag-cluster-ring']} ${styles['uag-cluster-ring-outer']}`}></div>
        <div className={`${styles['uag-cluster-ring']} ${styles['uag-cluster-ring-inner']}`}></div>
        <div className={styles['uag-cluster-live-badge']}>
          <span className={styles['uag-live-dot']}></span>
          <span style={{ fontWeight: 700 }}>Live 監控中</span>
        </div>

        {liveLeads.map((lead, index) => {
          const size = sizeMap[lead.grade as keyof typeof sizeMap] ?? 60;
          const floatDuration = floatDurations[lead.id] ?? '6s';
          const resolvedPos = resolvedPositions[index];

          // 若尚未解析位置，使用原始百分比位置
          const x = resolvedPos ? (resolvedPos.x / containerWidth) * 100 : (lead.x ?? 50);
          const y = resolvedPos ? (resolvedPos.y / 450) * 100 : (lead.y ?? 50);

          const isClicked = clickedLeadId === lead.id;

          return (
            <div
              key={lead.id}
              className={styles['uag-bubble']}
              data-grade={lead.grade}
              data-clicked={isClicked ? 'true' : undefined}
              role="button"
              aria-label={`${lead.name || lead.id} - ${lead.grade}級`}
              tabIndex={0}
              style={
                {
                  '--w': size + 'px',
                  '--float': floatDuration,
                  left: x + '%',
                  top: y + '%',
                } as React.CSSProperties
              }
              onClick={() => {
                setClickedLeadId(lead.id);
                onSelectLead(lead);
                // 3 秒後自動隱藏 tooltip
                setTimeout(() => setClickedLeadId(null), 3000);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setClickedLeadId(lead.id);
                  onSelectLead(lead);
                  setTimeout(() => setClickedLeadId(null), 3000);
                }
              }}
            >
              <div
                className={styles['uag-bubble-grade']}
                style={{
                  background: `var(--grade-${lead.grade.toLowerCase()})`,
                  color: '#fff',
                }}
              >
                {lead.grade}
              </div>
              <div className={styles['uag-bubble-content']}>
                <div className={styles['uag-bubble-id']}>{leadLabels[lead.id] || lead.grade}</div>
                <div className={styles['uag-bubble-intent']}>{lead.intent}%</div>
              </div>
              <div className={styles['uag-bubble-label']}>{lead.prop}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
