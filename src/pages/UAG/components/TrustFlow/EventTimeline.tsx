/**
 * EventTimeline - 事件時間軸組件
 *
 * [code-simplifier] 從 TrustFlow.tsx 抽取的子組件
 */

import React, { useState } from "react";
import type { TrustCase, TrustEvent } from "./types";
import { formatTime } from "./utils";

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
        style={{
          display: "grid",
          gridTemplateColumns: "80px 1fr 80px",
          padding: "10px 12px",
          borderBottom:
            idx < recentEvents.length - 1 ? "1px solid #e2e8f0" : "none",
          background: isCurrent ? "#fefce8" : "transparent",
          alignItems: "start",
        }}
      >
        <div style={{ fontSize: 11, color: "var(--ink-300)" }}>
          {formatTime(event.timestamp)}
        </div>
        <div>
          <div style={{ fontSize: 12, color: "var(--ink)" }}>
            <b>
              {event.stepName} {event.action}
            </b>
            <span style={{ color: "var(--ink-300)" }}>
              ｜
              {event.actor === "agent"
                ? "房仲"
                : event.actor === "buyer"
                  ? "買方"
                  : "系統"}
            </span>
          </div>
          {event.detail && (
            <div
              style={{
                fontSize: 11,
                color: "var(--ink-300)",
                marginTop: 2,
              }}
            >
              {event.detail}
            </div>
          )}
        </div>
        <div>
          {event.hash && (
            <span
              style={{
                fontSize: 10,
                padding: "3px 8px",
                borderRadius: 4,
                background: isCurrent ? "#fef3c7" : "#f1f5f9",
                color: isCurrent ? "var(--grade-s)" : "var(--ink-300)",
                border: isCurrent ? "1px solid #fcd34d" : "1px solid #e2e8f0",
                fontFamily: "monospace",
              }}
            >
              {event.hash}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: "#f8fafc", borderRadius: 8, overflow: "hidden" }}>
      {/* Header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "80px 1fr 80px",
          padding: "8px 12px",
          fontSize: 11,
          fontWeight: 600,
          color: "var(--ink-300)",
          background: "#f1f5f9",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
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
          style={{
            width: "100%",
            padding: "8px",
            fontSize: 11,
            color: "#1749d7",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {expandedEvents
            ? "收起"
            : `查看全部 ${selectedCase.events.length} 筆紀錄`}
        </button>
      )}
    </div>
  );
}
