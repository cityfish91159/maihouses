import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Grade, Lead } from '../types/uag.types';
import styles from '../UAG.module.css';
import { resolveOverlap } from '../utils/resolveOverlap';

export interface RadarClusterProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
}

const RADAR_FILTER_OPTIONS = ['all', 'S', 'A', 'B', 'C', 'F'] as const;
type RadarGradeFilter = (typeof RADAR_FILTER_OPTIONS)[number];

const GRADE_ORDER: Record<string, number> = {
  S: 1,
  A: 2,
  B: 3,
  C: 4,
  F: 5,
};

export const RADAR_CONTAINER_HEIGHT_PX = 450;
export const BUBBLE_MIN_PADDING_PX = 4;
export const TOOLTIP_AUTO_HIDE_MS = 3000;

export function getRadarContainerHeightPx(leadCount: number, isMobile: boolean): number {
  if (!isMobile) return RADAR_CONTAINER_HEIGHT_PX;
  if (leadCount <= 3) return 240;
  if (leadCount <= 8) return 320;
  return 380;
}

/** 簡單的種子隨機數生成器，基於 lead ID 產生穩定的隨機值 */
export function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32-bit signed integer
  }
  // 正規化到 0-1 範圍
  return Math.abs((Math.sin(hash) * 10000) % 1);
}

export default function RadarCluster({ leads, onSelectLead }: RadarClusterProps) {
  const liveLeads = leads.filter((l) => l.status === 'new');
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const [containerWidth, setContainerWidth] = useState(0);
  const [activeGrade, setActiveGrade] = useState<RadarGradeFilter>('all');
  const [clickedLeadId, setClickedLeadId] = useState<string | null>(null);

  const clearTooltipTimeout = useCallback(() => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }
  }, []);

  // 偵測容器寬度變化（響應式）
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateWidth = () => {
      const width = container.offsetWidth;
      // width=0 代表容器尚未完成 layout，保留前次有效寬度
      if (width > 0) {
        setContainerWidth(width);
      }
    };

    updateWidth();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateWidth);
      return () => window.removeEventListener('resize', updateWidth);
    }

    try {
      const resizeObserver = new ResizeObserver(updateWidth);
      resizeObserver.observe(container);
      return () => resizeObserver.disconnect();
    } catch {
      window.addEventListener('resize', updateWidth);
      return () => window.removeEventListener('resize', updateWidth);
    }
  }, []);

  const gradeCounts = useMemo<Record<Grade, number>>(() => {
    const initialCounts: Record<Grade, number> = { S: 0, A: 0, B: 0, C: 0, F: 0 };
    for (const lead of liveLeads) {
      initialCounts[lead.grade] += 1;
    }
    return initialCounts;
  }, [liveLeads]);

  const normalizedActiveGrade: RadarGradeFilter =
    activeGrade === 'all' || gradeCounts[activeGrade] > 0 ? activeGrade : 'all';

  const filteredLeads = useMemo(() => {
    if (normalizedActiveGrade === 'all') return liveLeads;
    return liveLeads.filter((lead) => lead.grade === normalizedActiveGrade);
  }, [liveLeads, normalizedActiveGrade]);

  // R7: Radar 容器高度依據手機泡泡數量調整
  const isMobile = containerWidth > 0 && containerWidth <= 768;
  const containerHeight = useMemo(
    () => getRadarContainerHeightPx(filteredLeads.length, isMobile),
    [filteredLeads.length, isMobile]
  );

  const selectedLeadId = useMemo(() => {
    if (!clickedLeadId) return null;
    return filteredLeads.some((lead) => lead.id === clickedLeadId) ? clickedLeadId : null;
  }, [clickedLeadId, filteredLeads]);

  // 預先計算每個 lead 的動畫時長（基於 lead ID 產生穩定的隨機值）
  const floatDurations = useMemo(() => {
    const durations: Record<string, string> = {};
    for (const lead of filteredLeads) {
      const randomOffset = seededRandom(lead.id) * 3; // 0-3 範圍
      durations[lead.id] = 5 + randomOffset + 's';
    }
    return durations;
  }, [filteredLeads]);

  // 產生「等級-序號」標籤（例如 S-01, A-05）
  const leadLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    const gradeCounters: Record<string, number> = {};

    // 依照等級排序，確保序號順序一致；同級以 id 排序保證穩定性
    const sortedLeads = [...filteredLeads].sort((a, b) => {
      const orderA = GRADE_ORDER[a.grade] ?? 99;
      const orderB = GRADE_ORDER[b.grade] ?? 99;
      return orderA !== orderB ? orderA - orderB : a.id.localeCompare(b.id);
    });

    for (const lead of sortedLeads) {
      const count = (gradeCounters[lead.grade] ?? 0) + 1;
      gradeCounters[lead.grade] = count;
      labels[lead.id] = `${lead.grade}-${String(count).padStart(2, '0')}`;
    }

    return labels;
  }, [filteredLeads]);

  // R1: 響應式尺寸對應表（手機 vs 桌面）
  const sizeMap = useMemo(() => {
    if (isMobile) {
      // C 級維持 52px，避免後續樣式微調時接近觸控下限
      return { S: 72, A: 60, B: 54, C: 52, F: 40 };
    }
    return { S: 120, A: 100, B: 90, C: 80, F: 60 };
  }, [isMobile]);

  // R2: 碰撞偵測與位置解析
  const resolvedPositions = useMemo(() => {
    if (containerWidth === 0 || filteredLeads.length === 0) return [];

    const bubbles = filteredLeads.map((lead) => {
      const x = lead.x != null ? (lead.x / 100) * containerWidth : containerWidth / 2;
      const y = lead.y != null ? (lead.y / 100) * containerHeight : containerHeight / 2;
      const size = sizeMap[lead.grade as keyof typeof sizeMap] ?? 60;
      return { x, y, size };
    });

    return resolveOverlap(bubbles, containerWidth, containerHeight, BUBBLE_MIN_PADDING_PX);
  }, [filteredLeads, containerWidth, containerHeight, sizeMap]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      clearTooltipTimeout();
    };
  }, [clearTooltipTimeout]);

  const handleLeadSelect = useCallback(
    (lead: Lead) => {
      clearTooltipTimeout();
      setClickedLeadId(lead.id);
      onSelectLead(lead);

      tooltipTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setClickedLeadId((previousId) => (previousId === lead.id ? null : previousId));
        }
        tooltipTimeoutRef.current = null;
      }, TOOLTIP_AUTO_HIDE_MS);
    },
    [clearTooltipTimeout, onSelectLead]
  );

  const handleGradeFilterChange = useCallback(
    (grade: RadarGradeFilter) => {
      clearTooltipTimeout();
      setClickedLeadId(null);
      setActiveGrade(grade);
    },
    [clearTooltipTimeout]
  );

  const hasSelection = selectedLeadId != null;

  return (
    <section
      className={`${styles['uag-card']} ${styles['k-span-6']}`}
      id="radar-section"
      style={{ minHeight: `${containerHeight}px` }}
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
      <div className={styles['uag-grade-chip-row']} role="group" aria-label="雷達等級篩選">
        {RADAR_FILTER_OPTIONS.map((grade) => {
          const count = grade === 'all' ? liveLeads.length : gradeCounts[grade];
          if (grade !== 'all' && count === 0) return null;

          const isActive = normalizedActiveGrade === grade;
          return (
            <button
              key={grade}
              type="button"
              className={styles['uag-grade-chip']}
              data-active={isActive ? 'true' : undefined}
              data-grade={grade.toLowerCase()}
              aria-pressed={isActive}
              onClick={() => handleGradeFilterChange(grade)}
            >
              <span className={styles['uag-grade-chip-label']}>{grade === 'all' ? '全部' : grade}</span>
              <span className={styles['uag-grade-chip-count']}>{count}</span>
            </button>
          );
        })}
      </div>
      <div
        className={styles['uag-cluster']}
        id="radar-container"
        data-has-selection={hasSelection ? 'true' : undefined}
        ref={containerRef}
      >
        <div className={`${styles['uag-cluster-ring']} ${styles['uag-cluster-ring-outer']}`}></div>
        <div className={`${styles['uag-cluster-ring']} ${styles['uag-cluster-ring-inner']}`}></div>
        <div className={styles['uag-cluster-live-badge']}>
          <span className={styles['uag-live-dot']}></span>
          <span style={{ fontWeight: 700 }}>Live 監控中</span>
        </div>

        {filteredLeads.map((lead, index) => {
          const size = sizeMap[lead.grade as keyof typeof sizeMap] ?? 60;
          const floatDuration = floatDurations[lead.id] ?? '6s';
          const resolvedPos = resolvedPositions[index];

          // 若尚未解析位置，使用原始百分比位置
          const x = resolvedPos ? (resolvedPos.x / containerWidth) * 100 : (lead.x ?? 50);
          const y = resolvedPos ? (resolvedPos.y / containerHeight) * 100 : (lead.y ?? 50);

          const isClicked = selectedLeadId === lead.id;

          return (
            <div
              key={lead.id}
              className={styles['uag-bubble']}
              data-grade={lead.grade}
              data-selected={isClicked ? 'true' : undefined}
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
                handleLeadSelect(lead);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleLeadSelect(lead);
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
