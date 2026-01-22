import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import {
  Loader2,
  Download,
  Check,
  Home,
  ArrowLeft,
  Building2,
  Edit3,
  RotateCcw,
} from "lucide-react";
import { notify } from "../lib/notify";
import { Logo } from "../components/Logo/Logo"; // Atomic Logo w/ M Icon
import { useMaiMai } from "../context/MaiMaiContext";
import { parse591Content, detect591Content } from "../lib/parse591";
import { logger } from "../lib/logger";

// 抽離的子組件 (HP-2.2)
import { BasicInfoSection } from "../components/upload/BasicInfoSection";
import { FeaturesSection } from "../components/upload/FeaturesSection";
import { TwoGoodsSection } from "../components/upload/TwoGoodsSection";
import { TrustToggleSection } from "../components/upload/TrustToggleSection";
import { MediaSection } from "../components/upload/MediaSection";
import { PreviewSection } from "../components/upload/PreviewSection";
import {
  UploadFormProvider,
  useUploadForm,
} from "../components/upload/UploadContext";

const PropertyUploadContent: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    loading,
    setLoading,
    uploadProgress,
    setForm,
    validation,
    handleSubmit,
    uploadResult,
    showConfirmation,
    // Draft 功能
    hasDraft,
    restoreDraft,
    getDraftPreview,
    clearDraft,
    userId,
  } = useUploadForm();

  // IM-1: MaiMai 狀態管理
  const { setMood, addMessage } = useMaiMai();

  const [draftAvailable, setDraftAvailable] = useState(false);
  const [draftPreview, setDraftPreview] = useState<{
    title: string;
    savedAt: string;
  } | null>(null);

  // IM-3: 重複匯入偵測
  const lastImportedIdRef = useRef<string | null>(null);

  // IM-4: iOS 捷徑支援 - 記錄已處理的 importText 值 (非 boolean，以支援 SPA 多次導航)
  const lastProcessedImportTextRef = useRef<string | null>(null);

  // OPT-2: Timer 清理機制 (解決 SPA 導航 Bug)
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const importTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // OPT-2.5: thinkingDelay timer (信心度延遲)
  const thinkingDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    // 延遲檢查草稿狀態，避免同步級聯渲染
    const timer = setTimeout(() => {
      setDraftAvailable(hasDraft());
      setDraftPreview(getDraftPreview());
    }, 0);

    const onStorage = (event: StorageEvent) => {
      if (event.key && event.key.startsWith("mh_draft_upload")) {
        setDraftAvailable(hasDraft());
        setDraftPreview(getDraftPreview());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("storage", onStorage);
    };
  }, [userId, hasDraft, getDraftPreview]);

  // OPT-2: 組件卸載時清理所有 Timer (防止 SPA 靈異滾動/匯入)
  useEffect(() => {
    return () => {
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
        scrollTimerRef.current = null;
      }
      // OPT-2.5: 清理 thinkingDelay timer
      if (thinkingDelayTimerRef.current) {
        clearTimeout(thinkingDelayTimerRef.current);
        thinkingDelayTimerRef.current = null;
      }
    };
  }, []);

  // 還原草稿
  const handleRestoreDraft = () => {
    const draftData = restoreDraft();
    if (!draftData) {
      notify.error("草稿還原失敗", "草稿可能已過期或損壞，已為你清除");
      clearDraft();
      setDraftAvailable(false);
      setDraftPreview(null);
      return;
    }
    setForm((prev) => ({
      ...prev,
      ...draftData,
      images: prev.images, // 保留當前圖片（不覆蓋）
      // FE-1: trustEnabled 由 Zod Schema default(false) 保證有值，無需 ?? fallback
    }));
    setDraftAvailable(false);
    const preview = getDraftPreview();
    setDraftPreview(preview);
    notify.success(
      "草稿已還原",
      preview
        ? `標題：${preview.title.slice(0, 20)}... / 儲存於 ${preview.savedAt}`
        : "已載入上次編輯內容",
    );
  };

  const handleDiscardDraft = () => {
    clearDraft();
    setDraftAvailable(false);
    setDraftPreview(null);
    notify.info("草稿已捨棄", "已清除本機草稿");
  };

  // IM-1: 智慧貼上處理函數
  // IM-AC3: SCROLL_DELAY_MS - 3 秒後自動滾動至「兩好一公道」區塊
  const SCROLL_DELAY_MS = 3000;
  const TWO_GOODS_SECTION_ID = "two-goods-section";

  const handle591Import = useCallback(
    (text: string, source: "paste" | "url" | "button" = "paste") => {
      setLoading(true);
      setMood("thinking");
      addMessage("正在解析 591 物件資料...");

      // 先同步解析（不阻塞 UI）
      const parsed = parse591Content(text);

      // IM-5: 追蹤解析品質 (非同步,不阻塞主流程)
      const trackImportQuality = async () => {
        try {
          await fetch("/api/analytics/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              textLength: text.length,
              confidence: parsed.confidence,
              fieldsFound: parsed.fieldsFound,
              fieldStatus: {
                title: !!parsed.title,
                price: !!parsed.price,
                size: !!parsed.size,
                layout: !!(parsed.rooms && parsed.halls && parsed.bathrooms),
                address: !!parsed.address,
                listingId: !!parsed.listingId,
              },
              missingFields: parsed.missingFields || [],
              source,
              userAgent: navigator.userAgent,
            }),
          });
        } catch (error) {
          // 靜默失敗,不影響用戶體驗
          logger.warn("[IM-5] Analytics tracking failed", { error });
        }
      };

      // 非阻塞追蹤
      trackImportQuality();

      // IM-3: 重複匯入偵測 (ID 不同時通知)
      if (
        parsed.listingId &&
        lastImportedIdRef.current &&
        parsed.listingId !== lastImportedIdRef.current
      ) {
        notify.info("偵測到新物件", "正在覆蓋先前的資料...");
      }

      // IM-2.8: 解析失敗時立即回饋（0ms），不強制等待
      if (parsed.confidence === 0) {
        setMood("confused");
        const missingMsg =
          parsed.missingFields?.length > 0
            ? `缺少：${parsed.missingFields.join("、")}`
            : "未能從內容中提取有效資訊";
        addMessage(`解析失敗 😢 ${missingMsg}`);
        setLoading(false);
        notify.warning("解析失敗", missingMsg);
        return;
      }

      // IM-2.8 / P2: 統一延遲規格，高信心 500ms 展示撒花，低信心 200ms
      const isHighConfidence = parsed.confidence >= 80;
      const thinkingDelay = isHighConfidence ? 500 : 200;

      const completeImport = () => {
        // 填入表單
        setForm((prev) => ({
          ...prev,
          ...(parsed.title && { title: parsed.title }),
          ...(parsed.price && { price: parsed.price }),
          ...(parsed.address && { address: parsed.address }),
          ...(parsed.size && { size: parsed.size }),
          ...(parsed.rooms && { rooms: parsed.rooms }),
          ...(parsed.halls && { halls: parsed.halls }),
          ...(parsed.bathrooms && { bathrooms: parsed.bathrooms }),
          ...(parsed.listingId && {
            sourceExternalId: `591-${parsed.listingId}`,
          }),
        }));

        // IM-3: 記錄本次匯入的 ID
        if (parsed.listingId) {
          lastImportedIdRef.current = parsed.listingId;
        }

        // 根據信心分數顯示不同的 MaiMai 反應
        if (isHighConfidence) {
          setMood("excited");
          addMessage(`完美！成功解析了 ${parsed.fieldsFound} 個欄位 ✨`);
          // 觸發慶祝動畫
          window.dispatchEvent(new CustomEvent("mascot:celebrate"));
        } else if (parsed.confidence >= 40) {
          setMood("happy");
          const missingHint =
            parsed.missingFields?.length > 0
              ? `（缺少：${parsed.missingFields.join("、")}）`
              : "";
          addMessage(
            `已填入 ${parsed.fieldsFound} 個欄位${missingHint}，剩下的再補齊吧～`,
          );
        } else {
          setMood("confused");
          const missingHint =
            parsed.missingFields?.length > 0
              ? `缺少：${parsed.missingFields.join("、")}`
              : "內容可能不完整";
          addMessage(`只找到了 ${parsed.fieldsFound} 個欄位 🤔 ${missingHint}`);
        }

        setLoading(false);

        const notifyMsg =
          parsed.missingFields?.length > 0
            ? `已填入 ${parsed.fieldsFound} 個欄位，缺少：${parsed.missingFields.join("、")}`
            : `已自動填入 ${parsed.fieldsFound} 個欄位`;
        notify.success(
          "匯入成功",
          `${notifyMsg}（信心度 ${parsed.confidence}%）`,
        );

        // IM-AC3: 匯入成功後 3 秒，自動滾動至「兩好一公道」區塊
        // OPT-2: 使用 ref 儲存 timer，支援組件卸載時清理
        if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
        scrollTimerRef.current = setTimeout(() => {
          const twoGoodsSection = document.getElementById(TWO_GOODS_SECTION_ID);
          if (twoGoodsSection) {
            twoGoodsSection.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }
          scrollTimerRef.current = null;
        }, SCROLL_DELAY_MS);
      };

      // 根據信心度決定是否延遲
      // OPT-2.5: 使用 ref 儲存 timer，支援組件卸載時清理
      if (thinkingDelay > 0) {
        if (thinkingDelayTimerRef.current)
          clearTimeout(thinkingDelayTimerRef.current);
        thinkingDelayTimerRef.current = setTimeout(() => {
          completeImport();
          thinkingDelayTimerRef.current = null;
        }, thinkingDelay);
      } else {
        completeImport();
      }
    },
    [setForm, setLoading, setMood, addMessage],
  );

  // IM-4: iOS 捷徑支援 - 監聽 URL ?importText= 參數
  // OPT-2: 重寫以修復 SPA 導航 Bug、冗餘解碼、記憶體洩漏
  useEffect(() => {
    const importText = searchParams.get("importText");

    // OPT-2.2: 改用值比較而非 boolean 鎖，支援 SPA 中多次不同參數導航
    if (!importText || importText.trim().length === 0) return;
    if (lastProcessedImportTextRef.current === importText) return;

    // 標記當前值已處理
    lastProcessedImportTextRef.current = importText;

    // OPT-2.3: 移除冗餘 decodeURIComponent
    // searchParams.get() 已自動處理 URL 解碼，再次解碼會導致 % 符號異常
    const textToImport = importText;

    // IM-4.3: 處理後清除 URL 參數 (replace: true 避免污染歷史紀錄)
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("importText");
    setSearchParams(newParams, { replace: true });

    // 觸發匯入 (使用現有的 handle591Import 函數)
    if (detect591Content(textToImport)) {
      // OPT-2.4: 使用 ref 儲存 timer，組件卸載時可清理
      if (importTimerRef.current) clearTimeout(importTimerRef.current);
      importTimerRef.current = setTimeout(() => {
        handle591Import(textToImport, "url"); // IM-5: 標記來源為 URL
        importTimerRef.current = null;
      }, 300);
    } else {
      notify.warning("URL 參數格式錯誤", "匯入的內容不符合 591 格式");
    }

    // OPT-2.1: Cleanup function - 組件卸載時清理所有 timer
    return () => {
      if (importTimerRef.current) {
        clearTimeout(importTimerRef.current);
        importTimerRef.current = null;
      }
    };
  }, [searchParams, setSearchParams, handle591Import]);

  // IM-1: 全域 paste 事件監聽器
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // IM-1.2: 排除 INPUT/TEXTAREA 焦點衝突
      const activeEl = document.activeElement;
      if (activeEl?.tagName === "INPUT" || activeEl?.tagName === "TEXTAREA") {
        return;
      }

      const text = e.clipboardData?.getData("text") || "";

      // IM-1.3: 智慧偵測 591 內容
      if (detect591Content(text)) {
        e.preventDefault();
        handle591Import(text, "paste"); // IM-5: 標記來源為 paste
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handle591Import]);

  // 591 搬家（保留舊的按鈕功能）
  const handleImport591 = () => {
    const url = prompt("請貼上 591 網址或內容");
    if (!url) return;

    // 如果貼上的是 URL，顯示提示
    if (url.startsWith("http")) {
      notify.info(
        "提示",
        "請直接從 591 頁面複製物件資訊，然後在空白處按 Ctrl+V 貼上即可自動填表",
      );
      return;
    }

    // 否則當作內容處理
    handle591Import(url, "button"); // IM-5: 標記來源為 button
  };

  if (showConfirmation && uploadResult) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
          <div className="bg-green-500 py-10 text-center text-white">
            <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <Check size={40} strokeWidth={3} />
            </div>
            <h1 className="text-2xl font-black">上傳成功！</h1>
            <p className="mt-1 opacity-90">您的物件已正式發佈</p>
          </div>

          <div className="p-8">
            <div className="mb-8 space-y-4">
              <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
                <div className="flex size-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <Home size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-slate-400">
                    物件編號
                  </p>
                  <p className="font-mono font-bold text-slate-700">
                    {uploadResult.public_id}
                  </p>
                </div>
              </div>

              {uploadResult.community_name && (
                <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400">
                      社區牆
                    </p>
                    <p className="font-bold text-slate-700">
                      {uploadResult.community_name}
                    </p>
                    {uploadResult.is_new_community && (
                      <span className="mt-0.5 inline-block rounded bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        新建立
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3">
              <Link
                to={`/p/${uploadResult.public_id}`}
                className="bg-maihouses-dark flex items-center justify-center gap-2 rounded-xl py-4 font-bold text-white transition-all hover:bg-[#002244] active:scale-[0.98]"
              >
                查看物件詳情
              </Link>
              {uploadResult.community_id && (
                <Link
                  to={`/community/${uploadResult.community_id}`}
                  className="border-maihouses-dark text-maihouses-dark flex items-center justify-center gap-2 rounded-xl border-2 py-4 font-bold transition-all hover:bg-blue-50 active:scale-[0.98]"
                >
                  前往社區牆
                </Link>
              )}
              <button
                onClick={() => window.location.reload()}
                className="mt-2 text-sm font-bold text-slate-400 hover:text-slate-600"
              >
                繼續上傳下一個
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-brand-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <ArrowLeft size={20} />
            </button>
            {/* Atomic Logo Component */}
            <div className="flex items-center gap-4">
              <div className="origin-left scale-90">
                <Logo showSlogan={false} showBadge={true} />
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <h1 className="text-lg font-bold text-slate-700">刊登物件</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {draftAvailable && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRestoreDraft}
                  className="flex items-center gap-2 rounded-full bg-[#003366] px-4 py-2 text-sm font-bold text-white shadow-md shadow-blue-900/10 transition-all hover:bg-[#002244] hover:shadow-lg active:scale-95"
                >
                  <RotateCcw size={16} /> 還原草稿
                  {draftPreview && (
                    <span className="ml-1 border-l border-white/20 pl-2 text-[11px] font-medium opacity-80">
                      {draftPreview.savedAt}
                    </span>
                  )}
                </button>
                <button
                  onClick={handleDiscardDraft}
                  className="rounded-full px-3 py-2 text-xs font-bold text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                  捨棄
                </button>
              </div>
            )}
            <button
              onClick={handleImport591}
              className="hidden items-center gap-2 rounded-full border-2 border-[#003366] bg-white px-4 py-1.5 text-sm font-bold text-[#003366] transition-all hover:bg-blue-50 sm:flex"
            >
              <Download size={16} /> 591 搬家
            </button>

            {!userId && (
              <Link
                to="/auth"
                className="ml-2 text-sm font-bold text-[#003366] hover:underline"
              >
                登入同步
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto mt-8 max-w-5xl px-4">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left: Form */}
          <div className="space-y-8 lg:col-span-7">
            <BasicInfoSection />
            <FeaturesSection />
            <TwoGoodsSection />
            <TrustToggleSection />
            <MediaSection />
          </div>

          {/* Right: Preview & Submit */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-6">
              <PreviewSection />

              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                    發佈確認
                  </h3>
                  <span
                    className={`text-xs font-bold ${validation.canSubmit ? "text-green-500" : "text-red-400"}`}
                  >
                    {validation.canSubmit ? "✓ 資料已齊全" : "⚠ 尚有必填欄位"}
                  </span>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!validation.canSubmit || loading}
                  className={`group relative w-full overflow-hidden rounded-xl py-4 font-black text-white transition-all active:scale-[0.98] ${
                    validation.canSubmit && !loading
                      ? "from-maihouses-dark to-maihouses-light bg-gradient-to-r shadow-lg shadow-blue-200 hover:translate-y-[-2px] hover:shadow-xl"
                      : "cursor-not-allowed bg-slate-300"
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-3">
                      <Loader2 className="animate-spin" size={20} />
                      <span>
                        {uploadProgress
                          ? `上傳中 ${Math.round((uploadProgress.current / uploadProgress.total) * 100)}%`
                          : "處理中..."}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Edit3 size={20} />
                      <span>立即發佈物件</span>
                    </div>
                  )}
                </button>

                <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-400">
                  點擊發佈即代表您同意{" "}
                  <Link to="/terms" className="underline">
                    服務條款
                  </Link>{" "}
                  與{" "}
                  <Link to="/privacy" className="underline">
                    隱私權政策
                  </Link>
                  ，並保證所提供之資訊真實無誤。
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export const PropertyUploadPage: React.FC = () => {
  return (
    <UploadFormProvider>
      <PropertyUploadContent />
    </UploadFormProvider>
  );
};
