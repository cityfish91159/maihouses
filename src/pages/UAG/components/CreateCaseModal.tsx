/**
 * CreateCaseModal - 建立新安心交易案件
 *
 * Skills Applied:
 * - [UI Perfection] 一致的 Modal 樣式
 * - [Frontend Mastery] React 最佳實踐
 * - [NASA TypeScript Safety] 完整類型定義 + Zod 驗證
 * - [No Lazy Implementation] 完整實作
 */

import React, { useState, useCallback, useEffect, useRef } from "react";
import { X, Plus, User, Home, Loader2 } from "lucide-react";
import { z } from "zod";
import { notify } from "../../../lib/notify";
import { logger } from "../../../lib/logger";
import type { CreateCaseRequest } from "../../../types/trust-flow.types";

// ============================================================================
// Constants [NASA TypeScript Safety]
// ============================================================================

const S = {
  TITLE: "建立新案件",
  BUYER_NAME_LABEL: "買方名稱",
  BUYER_NAME_PLACEHOLDER: "請輸入買方名稱或代號",
  PROPERTY_TITLE_LABEL: "物件標題",
  PROPERTY_TITLE_PLACEHOLDER: "請輸入物件名稱",
  BUYER_CONTACT_LABEL: "聯絡方式（選填）",
  BUYER_CONTACT_PLACEHOLDER: "電話或 Email",
  CREATE_BTN: "建立案件",
  CANCEL_BTN: "取消",
  CREATING: "建立中...",
  SUCCESS: "案件建立成功",
  SUCCESS_DESC: "已新增至安心流程管理",
  ERROR: "建立失敗",
  VALIDATION_ERROR: "請填寫必要欄位",
};

// ============================================================================
// Zod Schema [NASA TypeScript Safety]
// ============================================================================

const CreateCaseFormSchema = z.object({
  buyer_name: z
    .string()
    .min(1, "買方名稱不可為空")
    .max(100, "買方名稱最多 100 字"),
  property_title: z
    .string()
    .min(1, "物件標題不可為空")
    .max(200, "物件標題最多 200 字"),
  buyer_contact: z.string().max(50, "聯絡方式最多 50 字").optional(),
});

// ============================================================================
// Props Interface
// ============================================================================

interface CreateCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 使用 Mock 模式 */
  useMock: boolean;
  /** 建立成功的回調 */
  onSuccess?: (caseId: string, eventHash?: string) => void;
}

// ============================================================================
// Component
// ============================================================================

export function CreateCaseModal({
  isOpen,
  onClose,
  useMock,
  onSuccess,
}: CreateCaseModalProps): React.ReactElement | null {
  const [buyerName, setBuyerName] = useState("");
  const [propertyTitle, setPropertyTitle] = useState("");
  const [buyerContact, setBuyerContact] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // [frontend_mastery] Focus Trap refs
  const modalRef = useRef<HTMLFormElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const lastButtonRef = useRef<HTMLButtonElement>(null);

  // [frontend_mastery] 防抖動：追蹤最後一次提交時間
  const lastSubmitTimeRef = useRef<number>(0);
  const DEBOUNCE_MS = 1000; // 1 秒內不可重複提交

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setBuyerName("");
      setPropertyTitle("");
      setBuyerContact("");
      setErrors({});
    }
  }, [isOpen]);

  // [frontend_mastery] Focus Trap + Escape key handler (a11y compliant)
  useEffect(() => {
    if (!isOpen) return;

    // Auto-focus first input when modal opens
    const timer = setTimeout(() => {
      firstInputRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close
      if (e.key === "Escape" && !isCreating) {
        onClose();
        return;
      }

      // [frontend_mastery] Focus Trap: Tab 循環在 Modal 內
      if (e.key === "Tab" && modalRef.current) {
        const focusableElements =
          modalRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
          );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          // Shift+Tab on first element: go to last
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          // Tab on last element: go to first
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, isCreating]);

  // Validate form
  const validateForm = useCallback((): CreateCaseRequest | null => {
    const formData = {
      buyer_name: buyerName.trim(),
      property_title: propertyTitle.trim(),
      buyer_contact: buyerContact.trim() || undefined,
    };

    const result = CreateCaseFormSchema.safeParse(formData);

    if (!result.success) {
      const newErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string") {
          newErrors[field] = issue.message;
        }
      }
      setErrors(newErrors);
      return null;
    }

    setErrors({});
    return result.data;
  }, [buyerName, propertyTitle, buyerContact]);

  // Handle create [frontend_mastery] 含防抖動檢查
  const handleCreate = useCallback(async () => {
    // [frontend_mastery] 防抖動檢查
    const now = Date.now();
    if (now - lastSubmitTimeRef.current < DEBOUNCE_MS) {
      logger.warn("[CreateCaseModal] Debounced duplicate submission");
      return;
    }
    lastSubmitTimeRef.current = now;

    const formData = validateForm();
    if (!formData || isCreating) return;

    setIsCreating(true);

    try {
      if (useMock) {
        // Mock mode: simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        const mockCaseId = `TR-${Date.now().toString(36).toUpperCase()}`;
        const mockEventHash = `${Math.random().toString(36).slice(2, 6)}...${Math.random().toString(36).slice(2, 6)}`;

        notify.success(S.SUCCESS, S.SUCCESS_DESC);
        onSuccess?.(mockCaseId, mockEventHash);
        onClose();
        return;
      }

      // Live mode: call API [Backend Safeguard]
      const response = await fetch("/api/trust/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || result.error || "建立失敗");
      }

      notify.success(S.SUCCESS, S.SUCCESS_DESC);
      onSuccess?.(result.data.case_id, result.data.event_hash);
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "請稍後再試";
      logger.error("[CreateCaseModal] Failed to create case", {
        error: errorMessage,
      });
      notify.error(S.ERROR, errorMessage);
    } finally {
      setIsCreating(false);
    }
  }, [validateForm, isCreating, useMock, onSuccess, onClose]);

  // Handle form submit
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      handleCreate();
    },
    [handleCreate],
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-case-title"
        onSubmit={handleSubmit}
        className="animate-in fade-in zoom-in-95 w-full max-w-md rounded-2xl bg-white shadow-2xl duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <div className="flex items-center gap-2">
            <Plus className="size-5 text-brand-600" />
            <h2
              id="create-case-title"
              className="text-lg font-bold text-gray-900"
            >
              {S.TITLE}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isCreating}
            className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
            aria-label="關閉"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 p-4">
          {/* Buyer Name */}
          <div>
            <label
              htmlFor="buyer-name-input"
              className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-700"
            >
              <User className="size-4 text-gray-400" />
              {S.BUYER_NAME_LABEL}
              <span className="text-red-500">*</span>
            </label>
            <input
              ref={firstInputRef}
              id="buyer-name-input"
              type="text"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder={S.BUYER_NAME_PLACEHOLDER}
              maxLength={100}
              className={`w-full rounded-xl border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 ${
                errors.buyer_name
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                  : "focus:ring-brand-500/20 border-gray-200 focus:border-brand-500"
              }`}
              disabled={isCreating}
            />
            {errors.buyer_name && (
              <p className="mt-1 text-xs text-red-500">{errors.buyer_name}</p>
            )}
          </div>

          {/* Property Title */}
          <div>
            <label
              htmlFor="property-title-input"
              className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-700"
            >
              <Home className="size-4 text-gray-400" />
              {S.PROPERTY_TITLE_LABEL}
              <span className="text-red-500">*</span>
            </label>
            <input
              id="property-title-input"
              type="text"
              value={propertyTitle}
              onChange={(e) => setPropertyTitle(e.target.value)}
              placeholder={S.PROPERTY_TITLE_PLACEHOLDER}
              maxLength={200}
              className={`w-full rounded-xl border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 ${
                errors.property_title
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                  : "focus:ring-brand-500/20 border-gray-200 focus:border-brand-500"
              }`}
              disabled={isCreating}
            />
            {errors.property_title && (
              <p className="mt-1 text-xs text-red-500">
                {errors.property_title}
              </p>
            )}
          </div>

          {/* Buyer Contact (Optional) */}
          <div>
            <label
              htmlFor="buyer-contact-input"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              {S.BUYER_CONTACT_LABEL}
            </label>
            <input
              id="buyer-contact-input"
              type="text"
              value={buyerContact}
              onChange={(e) => setBuyerContact(e.target.value)}
              placeholder={S.BUYER_CONTACT_PLACEHOLDER}
              maxLength={50}
              className="focus:ring-brand-500/20 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2"
              disabled={isCreating}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-gray-100 p-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isCreating}
            className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            {S.CANCEL_BTN}
          </button>
          <button
            ref={lastButtonRef}
            type="submit"
            disabled={!buyerName.trim() || !propertyTitle.trim() || isCreating}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:bg-gray-300 disabled:text-gray-500"
          >
            {isCreating ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {S.CREATING}
              </>
            ) : (
              <>
                <Plus className="size-4" />
                {S.CREATE_BTN}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateCaseModal;
