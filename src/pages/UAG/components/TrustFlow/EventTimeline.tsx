/**
 * EventTimeline - 事件時間軸組件
 *
 * [code-simplifier] 從 TrustFlow.tsx 抽取的子組件
 */

import React, { useState } from 'react';
import type { TrustCase, TrustEvent } from './types';
import { formatTime } from './utils';
import { getBuyerDisplayName } from '../../../../lib/trustPrivacy';

interface EventTimelineProps {
  selectedCase: TrustCase;
}

export function EventTimeline({ selectedCase }: EventTimelineProps) {
  const [expandedEvents, setExpandedEvents] = useState(false);
  const recentEvents = selectedCase.events.slice(-3).reverse();

  const renderEvent = (event: TrustEvent, idx: number) => {
    const isCurrent = idx === 0;
    return (
      <div
        key={event.id}
        className={`grid grid-cols-[80px_1fr_80px] items-start px-3 py-2.5 ${
          idx < recentEvents.length - 1 ? 'border-b border-slate-200' : ''
        } ${isCurrent ? 'bg-amber-50' : 'bg-transparent'}`}
      >
        <div className="text-ink-300 text-[11px]">{formatTime(event.timestamp)}</div>
        <div>
          <div className="text-ink text-xs">
            <b>
              {event.stepName} {event.action}
            </b>
            <span className="text-ink-300">
              ｜
              {event.actor === 'agent'
                ? '房仲'
                : event.actor === 'buyer'
                  ? getBuyerDisplayName(selectedCase, 'agent').name
                  : '系統'}
            </span>
          </div>
          {event.detail && (
            <div className="text-ink-300 mt-0.5 text-[11px]">
              {event.detail}
            </div>
          )}
        </div>
        <div>
          {event.hash && (
            <span
              className={`rounded border px-2 py-[3px] font-mono text-[10px] ${
                isCurrent
                  ? 'border-amber-300 bg-amber-100 text-[var(--grade-s)]'
                  : 'text-ink-300 border-slate-200 bg-slate-100'
              }`}
            >
              {event.hash}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="overflow-hidden rounded-lg bg-slate-50">
      {/* Header */}
      <div className="text-ink-300 grid grid-cols-[80px_1fr_80px] border-b border-slate-200 bg-slate-100 px-3 py-2 text-[11px] font-semibold">
        <div>時間</div>
        <div>事件與參與者</div>
        <div>留痕</div>
      </div>

      {/* Events */}
      {recentEvents.map((event, idx) => renderEvent(event, idx))}

      {/* Show more */}
      {selectedCase.events.length > 3 && (
        <button
          onClick={() => setExpandedEvents(!expandedEvents)}
          className="w-full cursor-pointer border-none bg-transparent p-2 text-[11px] font-semibold text-brand"
        >
          {expandedEvents ? '收起' : `查看全部 ${selectedCase.events.length} 筆紀錄`}
        </button>
      )}
    </div>
  );
}
