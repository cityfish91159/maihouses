/**
 * TrustFlow - 安心流程管理組件 (重構後)
 *
 * [code-simplifier] 主組件精簡版，子組件已抽取
 * [react_perf_perfection] 使用 ref 追蹤初始化狀態
 * [agentic_architecture] 清晰的模組邊界
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ChevronRight,
  RefreshCw,
  Plus,
  AlertCircle,
  Zap,
} from "lucide-react";
import styles from "../../UAG.module.css";
import { logger } from "../../../../lib/logger";
import { useUAGModeStore, selectUseMock } from "../../../../stores/uagModeStore";
import {
  TrustCasesApiResponseSchema,
  transformToLegacyCase,
} from "../../../../types/trust-flow.types";
import { CreateCaseModal } from "../CreateCaseModal";

// 子組件
import type { TrustCase } from "./types";
import { CaseSelector } from "./CaseSelector";
import { ProgressSteps } from "./ProgressSteps";
import { EventTimeline } from "./EventTimeline";
import { MOCK_CASES } from "./mockData";

// ==================== Component ====================
interface TrustFlowProps {
  toggleMode: () => void;
}

export default function TrustFlow({ toggleMode }: TrustFlowProps) {
  const useMock = useUAGModeStore(selectUseMock);
  const [cases, setCases] = useState<TrustCase[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // [react_perf_perfection] 使用 ref 追蹤初始化狀態
  const isInitializedRef = useRef(false);

  // Handle create case success
  const handleCreateSuccess = useCallback(
    (caseId: string) => {
      setSelectedCaseId(caseId);
      setLoading(true);
      setTimeout(() => {
        if (useMock) {
          const newCase: TrustCase = {
            id: caseId,
            buyerId: caseId.slice(-4).toUpperCase(),
            buyerName: `新案件 ${caseId.slice(-4)}`,
            propertyTitle: "新建案件",
            currentStep: 1,
            status: "active",
            lastUpdate: Date.now(),
            token: crypto.randomUUID(),
            tokenExpiresAt: Date.now() + 90 * 24 * 60 * 60 * 1000,
            events: [
              {
                id: `${caseId}-e1`,
                step: 1,
                stepName: "M1 接洽",
                action: "初次接洽建立",
                actor: "agent",
                timestamp: Date.now(),
                hash: `${Math.random().toString(16).slice(2, 6)}...${Math.random().toString(16).slice(2, 6)}`,
              },
            ],
          };
          setCases((prev) => [newCase, ...prev]);
        }
        setLoading(false);
      }, 300);
    },
    [useMock]
  );

  // Load data [Backend Safeguard] + [NASA TypeScript Safety]
  const loadCases = useCallback(async () => {
    setLoading(true);
    try {
      if (useMock) {
        await new Promise((r) => setTimeout(r, 300));
        setCases(MOCK_CASES);
        if (!isInitializedRef.current) {
          const firstCase = MOCK_CASES[0];
          if (firstCase) {
            setSelectedCaseId(firstCase.id);
          }
          isInitializedRef.current = true;
        }
      } else {
        const res = await fetch("/api/trust/cases", {
          credentials: "include",
        });
        if (res.ok) {
          const rawData: unknown = await res.json();
          // [NASA TypeScript Safety] Zod 驗證 API 回應，取代不安全的 type assertion
          const parseResult = TrustCasesApiResponseSchema.safeParse(rawData);
          if (!parseResult.success) {
            logger.error("[TrustFlow] API response validation failed", {
              error: parseResult.error.message,
            });
            setCases([]);
            return;
          }
          const data = parseResult.data;
          if (data.success && data.data?.cases) {
            const loadedCases: TrustCase[] = data.data.cases.map((c) =>
              transformToLegacyCase(c, [])
            );
            setCases(loadedCases);
            if (!isInitializedRef.current && loadedCases.length > 0) {
              const firstLoadedCase = loadedCases[0];
              if (firstLoadedCase) {
                setSelectedCaseId(firstLoadedCase.id);
              }
              isInitializedRef.current = true;
            }
          } else {
            logger.warn("[TrustFlow] API returned non-success", { data });
            setCases([]);
          }
        } else if (res.status === 401) {
          logger.warn("[TrustFlow] Unauthorized, please login");
          setCases([]);
        } else {
          logger.error("[TrustFlow] API error", { status: res.status });
          setCases([]);
        }
      }
    } catch (e) {
      logger.error("[TrustFlow] Failed to load cases", { error: e });
      setCases([]);
    } finally {
      setLoading(false);
    }
  }, [useMock]);

  // [react_perf_perfection] 模式切換時重置初始化狀態
  useEffect(() => {
    isInitializedRef.current = false;
    loadCases();
  }, [loadCases]);

  const selectedCase = cases.find((c) => c.id === selectedCaseId);

  return (
    <section className={`${styles["uag-card"]} ${styles["k-span-3"]}`}>
      {/* Header */}
      <div className={styles["uag-card-header"]}>
        <div>
          <div className={styles["uag-card-title"]}>安心流程管理</div>
          <div className={styles["uag-card-sub"]}>
            六階段・交易留痕
            {useMock && (
              <span style={{ marginLeft: 8, color: "#f59e0b", fontSize: 11 }}>
                ● Mock
              </span>
            )}
          </div>
        </div>
        <div className={styles["uag-actions"]}>
          <button
            className={styles["uag-btn"]}
            onClick={toggleMode}
            title={useMock ? "切換到真實模式" : "切換到模擬模式"}
          >
            <Zap size={14} style={{ marginRight: 4 }} />
            {useMock ? "Mock" : "Live"}
          </button>
          <button
            className={styles["uag-btn"]}
            onClick={loadCases}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Case Selector */}
      <CaseSelector
        cases={cases}
        selectedCaseId={selectedCaseId}
        onSelectCase={setSelectedCaseId}
        onCreateNew={() => setIsCreateModalOpen(true)}
      />

      {/* Progress Steps */}
      {selectedCase && <ProgressSteps currentStep={selectedCase.currentStep} />}

      {/* Event Timeline */}
      {selectedCase && <EventTimeline selectedCase={selectedCase} />}

      {/* Empty State */}
      {!selectedCase && !loading && (
        <div
          style={{
            textAlign: "center",
            padding: "32px 16px",
            color: "var(--ink-300)",
          }}
        >
          <AlertCircle
            size={32}
            style={{ margin: "0 auto 8px", opacity: 0.5 }}
          />
          <div style={{ fontSize: 13, marginBottom: 8 }}>
            目前沒有進行中的案件
          </div>
          <button
            className={`${styles["uag-btn"]} ${styles["primary"]}`}
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus size={14} style={{ marginRight: 4 }} />
            建立新案件
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div
          style={{
            textAlign: "center",
            padding: "24px",
            color: "var(--ink-300)",
          }}
        >
          <RefreshCw
            size={20}
            className="animate-spin"
            style={{ margin: "0 auto 8px" }}
          />
          <div style={{ fontSize: 12 }}>載入中...</div>
        </div>
      )}

      {/* Action Footer */}
      {selectedCase && (
        <div
          style={{
            display: "flex",
            gap: 8,
            paddingTop: 8,
            borderTop: "1px solid #e2e8f0",
          }}
        >
          <Link
            to={`/assure?case=${selectedCase.id}`}
            className={`${styles["uag-btn"]} ${styles["primary"]}`}
            style={{
              flex: 1,
              textAlign: "center",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            進入 Trust Room
            <ChevronRight size={14} />
          </Link>
        </div>
      )}

      {/* Summary Stats */}
      {cases.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8,
            padding: "12px 0 0",
            borderTop: "1px solid #e2e8f0",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#1749d7" }}>
              {cases.length}
            </div>
            <div style={{ fontSize: 11, color: "var(--ink-300)" }}>
              進行中案件
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#16a34a" }}>
              {cases.filter((c) => c.currentStep >= 3).length}
            </div>
            <div style={{ fontSize: 11, color: "var(--ink-300)" }}>已出價</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#f59e0b" }}>
              {cases.filter((c) => c.status === "pending").length || 0}
            </div>
            <div style={{ fontSize: 11, color: "var(--ink-300)" }}>待處理</div>
          </div>
        </div>
      )}

      {/* Create Case Modal */}
      <CreateCaseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        useMock={useMock}
        onSuccess={handleCreateSuccess}
      />
    </section>
  );
}

// 維持向後相容的 export
export { TrustFlow };
