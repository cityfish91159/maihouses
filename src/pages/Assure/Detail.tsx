import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTrustRoom } from "../../hooks/useTrustRoom";
import {
  Phone,
  ClipboardCheck,
  HandCoins,
  MessageSquare,
  FileSignature,
  Home,
  Lock,
  Check,
  RotateCcw,
  Info,
  User,
  Briefcase,
  Zap,
} from "lucide-react";
import { getAgentDisplayInfo } from "../../lib/trustPrivacy";
import { DataCollectionModal } from "../../components/TrustRoom/DataCollectionModal";
import { toast } from "sonner";
import { logger } from "../../lib/logger";

export default function AssureDetail() {
  const location = useLocation();

  const {
    isMock,
    caseId,
    setCaseId,
    role,
    setRole,
    setToken,
    tx,
    loading,
    isBusy,
    timeLeft,
    startMockMode,
    dispatchAction,
  } = useTrustRoom();

  // Inputs
  const [inputBuffer, setInputBuffer] = useState("");
  const [supplementInput, setSupplementInput] = useState("");

  // [Team 3 修復] M4 Modal 狀態管理
  const [showDataModal, setShowDataModal] = useState(false);
  const [isSubmittingData, setIsSubmittingData] = useState(false);

  // Dev Helper
  const isDev =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname.includes("127.0.0.1"));

  // Note: Token handling and initialization is now managed by useTrustRoom hook
  // We just need to handle the "No Token" state in the UI

  const handleAction = async (
    endpoint: string,
    body: Record<string, unknown> = {},
  ) => {
    const success = await dispatchAction(endpoint, body);
    if (success) {
      setInputBuffer("");
      setSupplementInput("");
    }
  };

  const submitAgent = (step: string) =>
    handleAction("submit", { step, data: { note: inputBuffer } });
  const confirmStep = (step: string) =>
    handleAction("confirm", { step, note: inputBuffer });
  const pay = () => {
    if (confirm("確認模擬付款？")) handleAction("payment");
  };
  const toggleCheck = (itemId: string, checked: boolean) => {
    if (role === "buyer") handleAction("checklist", { itemId, checked });
  };
  const addSupplement = () =>
    handleAction("supplement", { content: supplementInput });
  const reset = () => {
    if (confirm("重置所有進度？")) handleAction("reset");
  };

  const toggleRole = () => {
    const newRole = role === "agent" ? "buyer" : "agent";
    setRole(newRole);
  };

  // [Team 3 修復] M4 資料收集 Modal 觸發邏輯
  useEffect(() => {
    if (!tx || role !== "buyer") return;

    // 檢查是否需要顯示 Modal（stage === 4 且為臨時代號）
    const isStage4 = tx.currentStep === 4;
    const isTempBuyer =
      tx.buyerName?.startsWith("買方-") && tx.buyerUserId === null;

    if (isStage4 && isTempBuyer && !showDataModal) {
      // 延遲 500ms 顯示 Modal，避免與頁面渲染衝突
      const timer = setTimeout(() => {
        setShowDataModal(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [tx, role, showDataModal]);

  // [Team 3 修復] M4 資料收集表單提交
  const handleDataSubmit = async (data: {
    name: string;
    phone: string;
    email: string;
  }) => {
    setIsSubmittingData(true);
    try {
      const res = await fetch("/api/trust/complete-buyer-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: caseId,
          name: data.name,
          phone: data.phone,
          email: data.email || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({
          error: "提交失敗",
        }));
        throw new Error(errorData.error || "提交失敗");
      }

      toast.success("資料提交成功！", {
        description: "您的資料已安全儲存，感謝您的配合。",
      });
      setShowDataModal(false);

      // 重新載入案件資料（觸發 useTrustRoom 重新 fetch）
      // Note: useTrustRoom 會自動偵測 tx 變化並重新載入
      window.location.reload();
    } catch (error) {
      logger.error("handleDataSubmit error", {
        error: error instanceof Error ? error.message : "Unknown",
        caseId,
      });
      toast.error("提交失敗", {
        description: error instanceof Error ? error.message : "請稍後再試",
      });
    } finally {
      setIsSubmittingData(false);
    }
  };

  // [Team 3 修復] M4 Modal 跳過處理
  const handleDataSkip = () => {
    toast.info("已跳過資料填寫", {
      description: "您可以稍後在案件頁面中補充資料。",
    });
    setShowDataModal(false);
  };

  // --- RENDERING ---

  if (!tx && !loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 p-4 font-sans">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <Zap size={32} />
          </div>
          <h2 className="mb-2 text-xl font-bold text-gray-800">
            安心留痕 Trust Room
          </h2>
          <p className="mb-6 text-sm text-gray-500">
            目前未檢測到有效的登入憑證 (Token)。您可以進入演示模式來測試功能。
          </p>

          <button
            onClick={startMockMode}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-bold text-white shadow-lg transition hover:bg-blue-700"
          >
            <Zap size={18} />
            啟動演示模式 (Demo Mode)
          </button>
          <p className="mt-4 text-xs text-gray-400">
            此模式下資料不會保存到資料庫。
          </p>
        </div>
      </div>
    );
  }

  if (!tx) return <div className="p-8 text-center">載入中...</div>;

  const getStepIcon = (k: string) => {
    switch (k) {
      case "1":
        return <Phone size={14} />;
      case "2":
        return <ClipboardCheck size={14} />;
      case "3":
        return <HandCoins size={14} />;
      case "4":
        return <MessageSquare size={14} />;
      case "5":
        return <FileSignature size={14} />;
      case "6":
        return <Home size={14} />;
      default:
        return <Info size={14} />;
    }
  };

  return (
    <div className="relative mx-auto min-h-screen max-w-md bg-white pb-24 font-sans text-gray-800 shadow-2xl">
      {/* Global Toaster is now used */}

      {/* Header */}
      <header
        className={`${isMock ? "bg-indigo-900" : "bg-slate-900"} sticky top-0 z-overlay flex items-center justify-between p-4 text-white shadow-lg transition-colors`}
      >
        <div>
          <h1 className="flex items-center gap-2 text-lg font-bold tracking-wide">
            MaiHouses{" "}
            <span
              className={`rounded px-1 text-xs ${isMock ? "bg-yellow-500 text-black" : "bg-blue-600"}`}
            >
              {isMock ? "DEMO" : "V10"}
            </span>
          </h1>
          <div className="flex items-center gap-2 text-[10px] text-gray-400">
            <span>案號: {caseId}</span>
            {loading && <span className="animate-pulse">●</span>}
          </div>
          {/* 房仲資訊顯示（買方視角） */}
          {tx && role === "buyer" && (
            <div className="mt-1 text-xs text-blue-200">
              {getAgentDisplayInfo(
                tx.agentName,
                tx.agentCompany,
                "buyer",
              ).fullText}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={reset}
            className="flex size-8 items-center justify-center rounded bg-white/10 transition hover:bg-white/20"
          >
            <RotateCcw size={14} />
          </button>
          <button
            onClick={toggleRole}
            className={`flex items-center gap-1 rounded-md border border-white/20 px-3 py-1 text-xs font-bold transition ${role === "agent" ? "bg-blue-600" : "bg-green-600"}`}
          >
            {role === "agent" ? <Briefcase size={12} /> : <User size={12} />}
            {role === "agent" ? "房仲" : "買方"}
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="sticky top-[60px] z-40 border-b bg-slate-50 p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">
            進度 {tx.currentStep}/6
          </span>
          {tx.isPaid && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-800">
              已履約
            </span>
          )}
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-blue-600 transition-all duration-700"
            style={{ width: `${(tx.currentStep / 6) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-0 p-4">
        {Object.entries(tx.steps).map(([key, step]) => {
          const stepNum = parseInt(key);
          const isCurrent = stepNum === tx.currentStep;
          const isPast = stepNum < tx.currentStep;
          const isFuture = stepNum > tx.currentStep;

          let iconBg = "bg-gray-300 border-gray-300";
          if (isPast || step.locked) iconBg = "bg-green-500 border-green-500";
          else if (isCurrent) iconBg = "bg-blue-600 border-blue-600";

          return (
            <div
              key={key}
              className={`relative py-3 pl-14 ${isFuture ? "opacity-50 grayscale" : ""}`}
            >
              {/* Icon */}
              <div
                className={`absolute left-0 top-3 z-10 flex size-10 items-center justify-center rounded-full border-4 border-white text-white shadow-sm transition-colors ${iconBg}`}
              >
                {getStepIcon(key)}
              </div>
              {/* Line */}
              {key !== "6" && (
                <div className="absolute bottom-[-20px] left-[24px] top-[50px] z-0 w-[2px] bg-gray-200"></div>
              )}

              {/* Card */}
              <div
                className={`rounded-xl border bg-white p-4 shadow-sm transition-all ${isCurrent ? "border-blue-500 ring-2 ring-blue-50" : "border-gray-200"}`}
              >
                <div className="mb-3 flex items-start justify-between">
                  <h3 className="flex items-center gap-2 font-bold text-gray-800">
                    {step.name}
                    {key === "5" &&
                      step.paymentStatus === "initiated" &&
                      !step.locked && (
                        <span className="animate-pulse rounded bg-orange-50 px-2 text-[10px] text-orange-500">
                          付款中
                        </span>
                      )}
                    {key === "5" && step.paymentStatus === "expired" && (
                      <span className="rounded bg-red-50 px-2 text-[10px] text-red-500">
                        逾期
                      </span>
                    )}
                  </h3>
                  {step.locked && <Lock size={14} className="text-green-600" />}
                </div>

                {/* Step 2: Viewing */}
                {key === "2" && step.data.note && (
                  <div className="mb-3 rounded border border-gray-100 bg-gray-50 p-3">
                    <p className="mb-2 border-b pb-1 text-xs font-bold text-gray-500">
                      📢 房仲帶看紀錄
                    </p>
                    <div className="whitespace-pre-wrap text-sm">
                      {step.data.note}
                    </div>
                  </div>
                )}

                {/* Step 5: Payment Timer */}
                {key === "5" &&
                  step.paymentStatus === "initiated" &&
                  !step.locked && (
                    <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 p-4 text-center">
                      <div className="mb-1 font-mono text-2xl font-bold text-orange-600">
                        {timeLeft}
                      </div>
                      <div className="mb-3 text-xs text-orange-400">
                        付款截止
                      </div>
                      {role === "agent" ? (
                        <button
                          onClick={pay}
                          disabled={isBusy || timeLeft === "已逾期"}
                          className={`w-full rounded py-2 font-bold text-white shadow ${timeLeft === "已逾期" ? "cursor-not-allowed bg-gray-400" : "bg-gradient-to-r from-orange-500 to-red-500 hover:shadow-lg"}`}
                        >
                          {timeLeft === "已逾期"
                            ? "付款已截止"
                            : isBusy
                              ? "處理中..."
                              : "房仲代付 NT$ 2,000"}
                        </button>
                      ) : (
                        <div className="text-xs text-gray-400">
                          等待房仲付款...
                        </div>
                      )}
                    </div>
                  )}

                {/* Step 6: Checklist */}
                {key === "6" && !step.locked && tx.isPaid && (
                  <div className="mt-2 space-y-2">
                    {step.checklist?.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => toggleCheck(item.id, !item.checked)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ")
                            toggleCheck(item.id, !item.checked);
                        }}
                        role="checkbox"
                        aria-checked={item.checked}
                        tabIndex={0}
                        className={`flex cursor-pointer items-center rounded border p-4 transition ${item.checked ? "border-indigo-200 bg-indigo-50" : "hover:bg-gray-50"}`}
                      >
                        <div
                          className={`flex size-5 items-center justify-center rounded border bg-white ${item.checked ? "border-indigo-600 bg-indigo-600" : ""}`}
                        >
                          {item.checked && (
                            <Check size={12} className="text-white" />
                          )}
                        </div>
                        <span
                          className={`ml-3 text-sm ${item.checked ? "font-bold text-indigo-800" : ""}`}
                        >
                          {item.label}
                        </span>
                      </div>
                    ))}
                    <button
                      onClick={() => confirmStep("6")}
                      className="mt-2 w-full rounded bg-indigo-600 py-2 font-bold text-white"
                    >
                      完成交屋
                    </button>
                  </div>
                )}

                {/* Actions */}
                {!step.locked && isCurrent && key !== "5" && key !== "6" && (
                  <div>
                    {role === "agent" &&
                      (step.agentStatus === "pending" ? (
                        <div>
                          <textarea
                            value={inputBuffer}
                            onChange={(e) => setInputBuffer(e.target.value)}
                            className="mb-2 w-full rounded border p-2 text-sm outline-none ring-blue-200 focus:ring-2"
                            placeholder="輸入紀錄..."
                          />
                          <button
                            onClick={() => submitAgent(key)}
                            disabled={isBusy}
                            className="w-full rounded bg-slate-800 py-2 text-sm text-white"
                          >
                            {isBusy ? "..." : "送出"}
                          </button>
                        </div>
                      ) : (
                        <div className="rounded bg-gray-50 py-2 text-center text-xs text-gray-400">
                          等待買方確認...
                        </div>
                      ))}
                    {role === "buyer" &&
                      (step.agentStatus === "submitted" ? (
                        <div>
                          <p className="mb-2 text-xs text-gray-500">
                            房仲已提交，請核對：
                          </p>
                          <div className="mb-2 whitespace-pre-wrap rounded border bg-gray-50 p-2 text-sm">
                            {step.data.note || "（已提交表單）"}
                          </div>

                          {/* Buyer Note Input */}
                          <textarea
                            value={inputBuffer}
                            onChange={(e) => setInputBuffer(e.target.value)}
                            className="mb-2 w-full rounded border p-2 text-sm outline-none ring-green-200 focus:ring-2"
                            placeholder="留言給房仲 (選填)..."
                          />

                          <button
                            onClick={() => confirmStep(key)}
                            disabled={isBusy}
                            className="w-full rounded bg-green-600 py-2 text-sm text-white"
                          >
                            {isBusy ? "..." : "確認無誤並送出"}
                          </button>
                        </div>
                      ) : (
                        <div className="py-2 text-center text-xs text-gray-400">
                          等待房仲提交...
                        </div>
                      ))}
                  </div>
                )}

                {/* Display Buyer Note if exists (for history) */}
                {step.data.buyerNote && (
                  <div className="mt-2 rounded border border-green-100 bg-green-50 p-2 text-xs">
                    <span className="font-bold text-green-700">買方留言：</span>{" "}
                    {step.data.buyerNote}
                  </div>
                )}

                {/* Step 5 Actions */}
                {key === "5" &&
                  !step.locked &&
                  step.paymentStatus === "pending" && (
                    <div>
                      {role === "agent" && step.agentStatus === "pending" && (
                        <button
                          onClick={() => submitAgent("5")}
                          className="w-full rounded bg-slate-800 py-2 text-white"
                        >
                          上傳合約並送出
                        </button>
                      )}
                      {role === "buyer" && step.agentStatus === "submitted" && (
                        <button
                          onClick={() => confirmStep("5")}
                          className="w-full rounded bg-green-600 py-2 text-white"
                        >
                          確認合約 (將啟動付款)
                        </button>
                      )}
                    </div>
                  )}

                {/* Supplements */}
                {tx.supplements.length > 0 && (
                  <div className="mt-4 border-t border-dashed pt-4">
                    {tx.supplements.map((s, i) => (
                      <div
                        key={i}
                        className="mb-1 flex gap-2 rounded border border-gray-100 bg-gray-50 p-2 text-xs"
                      >
                        <span className="font-bold">
                          {s.role === "agent" ? "👨‍💼" : "👤"}
                        </span>
                        <span className="flex-1">{s.content}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Add Supplement */}
        <div className="mt-8 rounded-xl border bg-white p-4 shadow-sm">
          <h4 className="mb-2 text-xs font-bold text-gray-500">
            📝 新增補充紀錄 (修正/勘誤)
          </h4>
          <p className="mb-2 text-[10px] text-gray-400">
            若之前的留言有誤，請在此新增補充說明。已送出的內容無法修改。
          </p>
          <div className="flex gap-2">
            <input
              value={supplementInput}
              onChange={(e) => setSupplementInput(e.target.value)}
              className="flex-1 rounded border px-3 py-2 text-sm"
              placeholder="輸入備註..."
            />
            <button
              onClick={addSupplement}
              disabled={!supplementInput}
              className="rounded bg-gray-800 px-4 text-sm text-white"
            >
              送出
            </button>
          </div>
        </div>
      </div>

      {/* [Team 3 修復] M4 資料收集 Modal */}
      {showDataModal && (
        <DataCollectionModal
          isOpen={showDataModal}
          onSubmit={handleDataSubmit}
          onSkip={handleDataSkip}
          isSubmitting={isSubmittingData}
        />
      )}
    </div>
  );
}
