/**
 * RadarClusterDeAI - 去除 AI 感的氣泡雷達組件
 *
 * 完全基於 ui-ux-pro-max 資料庫建議：
 *
 * 1. Style: Minimalism & Swiss Style
 *    - Clean, simple, spacious, functional
 *    - Subtle hover (200-250ms), smooth transitions
 *    - Sharp shadows, clear type hierarchy
 *
 * 2. Typography: Corporate Trust
 *    - Heading: Lexend (需在 index.html 引入)
 *    - Body: Source Sans 3
 *
 * 3. UX Guidelines:
 *    - cursor-pointer on interactive elements
 *    - onClick handler (not onMouseEnter only)
 *    - Focus states visible for keyboard navigation
 *
 * 4. Accessibility: WCAG AAA
 *    - 4.5:1 minimum contrast ratio
 *    - Proper aria labels
 *    - Keyboard navigation support
 */

import React, { useMemo } from 'react';
import type { Lead } from '../types/uag.types';
import styles from '../UAG-deai-demo.module.css';

export interface RadarClusterDeAIProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
}

/** 簡單的種子隨機數生成器，基於 lead ID 產生穩定的隨機值 */
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs((Math.sin(hash) * 10000) % 1);
}

export default function RadarClusterDeAI({ leads, onSelectLead }: RadarClusterDeAIProps) {
  const liveLeads = leads.filter((l) => l.status === 'new');

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

  // ui-ux-pro-max: Swiss Style 尺寸系統（使用 8px 為基準單位）
  const getBubbleSize = (grade: string): number => {
    switch (grade) {
      case 'S':
        return 112; // 14 * 8
      case 'A':
        return 96; // 12 * 8
      case 'B':
        return 88; // 11 * 8
      case 'C':
        return 80; // 10 * 8
      case 'F':
        return 64; // 8 * 8
      default:
        return 80;
    }
  };

  return (
    <section className={styles['deai-card']}>
      {/* Card Header */}
      <div className={styles['deai-card-header']}>
        <div>
          <h2 className={styles['deai-card-title']}>UAG 精準導客雷達</h2>
          <p className={styles['deai-card-sub']}>S/A 級獨家聯絡權｜B/C/F 級點數兌換</p>
        </div>
      </div>

      {/* Radar Cluster */}
      <div className={styles['deai-cluster']}>
        {/* Reference circles */}
        <div className={`${styles['deai-cluster-ring']} ${styles['deai-cluster-ring--outer']}`} />
        <div className={`${styles['deai-cluster-ring']} ${styles['deai-cluster-ring--inner']}`} />

        {/* Live indicator - ui-ux-pro-max: professional, not playful */}
        <div className={styles['deai-live-badge']}>
          <span className={styles['deai-live-dot']} />
          <span>Live 監控中</span>
        </div>

        {/* Bubbles */}
        {liveLeads.map((lead) => {
          const x = lead.x != null ? lead.x : 50;
          const y = lead.y != null ? lead.y : 50;
          const size = getBubbleSize(lead.grade);

          return (
            <div
              key={lead.id}
              className={styles['deai-bubble']}
              data-grade={lead.grade}
              role="button"
              aria-label={`${leadLabels[lead.id]} - ${lead.grade}級 - ${lead.intent}% 意向度 - ${lead.prop}`}
              tabIndex={0}
              style={
                {
                  '--bubble-size': `${size}px`,
                  left: `${x}%`,
                  top: `${y}%`,
                  // 基於 ID 的微小偏移，增加有機感
                  transform: `translate(-50%, -50%) translate(${seededRandom(lead.id) * 4 - 2}px, ${seededRandom(lead.id + 'y') * 4 - 2}px)`,
                } as React.CSSProperties
              }
              onClick={() => onSelectLead(lead)}
              onKeyDown={(e) => {
                // ui-ux-pro-max: onClick handler, keyboard support
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectLead(lead);
                }
              }}
            >
              {/* Grade badge */}
              <div className={styles['deai-bubble-grade']}>{lead.grade}</div>

              {/* Content */}
              <span className={styles['deai-bubble-id']}>{leadLabels[lead.id] || lead.grade}</span>
              <span className={styles['deai-bubble-intent']}>{lead.intent}%</span>

              {/* Label */}
              <div className={styles['deai-bubble-label']}>{lead.prop}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
