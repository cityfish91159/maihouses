/**
 * CaseSelector - 案件選擇器組件
 *
 * [code-simplifier] 從 TrustFlow.tsx 抽取的子組件
 */

import React from "react";
import { Plus } from "lucide-react";
import type { TrustCase } from "./types";
import { formatRelativeTime, getStatusBadge } from "./utils";

interface CaseSelectorProps {
  cases: TrustCase[];
  selectedCaseId: string | null;
  onSelectCase: (id: string) => void;
  onCreateNew: () => void;
}

export function CaseSelector({
  cases,
  selectedCaseId,
  onSelectCase,
  onCreateNew,
}: CaseSelectorProps) {
  if (cases.length === 0) return null;

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
      {cases.map((c) => {
        const isActive = c.id === selectedCaseId;
        const statusBadge = getStatusBadge(c.status);
        return (
          <button
            key={c.id}
            onClick={() => onSelectCase(c.id)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: isActive ? "2px solid #1749d7" : "1px solid #e2e8f0",
              background: isActive ? "#eef2ff" : "#fff",
              cursor: "pointer",
              textAlign: "left",
              minWidth: 140,
              transition: "all 0.2s",
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: isActive ? "#1749d7" : "#334155",
                marginBottom: 2,
              }}
            >
              {c.buyerName}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--ink-300)",
                marginBottom: 4,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: 120,
              }}
            >
              {c.propertyTitle}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  fontSize: 10,
                  padding: "2px 6px",
                  borderRadius: 4,
                  background: statusBadge.bg,
                  color: statusBadge.color,
                  fontWeight: 600,
                }}
              >
                M{c.currentStep}
              </span>
              <span style={{ fontSize: 10, color: "#94a3b8" }}>
                {formatRelativeTime(c.lastUpdate)}
              </span>
            </div>
          </button>
        );
      })}
      <button
        style={{
          padding: "8px 12px",
          borderRadius: 8,
          border: "1px dashed #cbd5e1",
          background: "#f8fafc",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: 60,
          color: "var(--ink-300)",
        }}
        onClick={onCreateNew}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
