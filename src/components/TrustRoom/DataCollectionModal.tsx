/** DataCollectionModal - 安心留痕資料收集 Modal */

import React, { useState, useCallback, useRef } from 'react';
import { X, Shield, Loader2, User, Phone, Mail, Info } from 'lucide-react';
import { z } from 'zod';
import { notify } from '../../lib/notify';
import { logger } from '../../lib/logger';
import { useFocusTrap } from '../../hooks/useFocusTrap';

// ============================================================================
// Constants
// ============================================================================

/** 表單欄位長度限制 */
const FIELD_LIMITS = {
  NAME_MAX: 50,
  PHONE_LENGTH: 10,
  EMAIL_MAX: 100,
} as const;

/** UI 文案常數 */
const S = {
  TITLE: '留下聯絡方式，方便後續聯繫',
  NAME_LABEL: '姓名',
  NAME_PLACEHOLDER: '你的名字',
  PHONE_LABEL: '電話',
  PHONE_PLACEHOLDER: '0912345678',
  EMAIL_LABEL: 'Email',
  EMAIL_PLACEHOLDER: 'email@example.com（選填）',
  PRIVACY_NOTE: '資料只用於交易紀錄，不會外流',
  SUBMIT_BTN: '確認送出',
  SKIP_BTN: '稍後再說',
  SUBMITTING: '送出中...',
  VALIDATION_ERROR: '請填寫必要欄位',
} as const;

// ============================================================================
// Zod Schema [NASA TypeScript Safety]
// ============================================================================

/**
 * 姓名驗證正則：僅允許中文（CJK 統一漢字）、英文字母、空格
 * - \u4e00-\u9fa5: CJK 統一漢字（常用中文字）
 * - a-zA-Z: 英文大小寫
 * - \s: 空白字元（支援中間名空格）
 */
const NAME_REGEX = /^[\u4e00-\u9fa5a-zA-Z\s]+$/;

/**
 * 台灣手機號碼正則：09 開頭 + 8 位數字（共 10 碼）
 * - 09: 台灣行動電話前綴
 * - \d{8}: 後續 8 位數字
 */
const TW_PHONE_REGEX = /^09\d{8}$/;

/**
 * [Team 7 修復] 前後端驗證規則統一
 *
 * 與後端 complete-buyer-info.ts Schema 保持一致：
 * - name: 僅允許中英文 + 空格
 * - phone: 台灣手機格式 09XXXXXXXX (10碼)
 * - email: 標準 Email 格式（選填）
 */
export const DataCollectionFormSchema = z.object({
  name: z
    .string()
    .min(1, '姓名不可為空')
    .max(FIELD_LIMITS.NAME_MAX, `姓名最多 ${FIELD_LIMITS.NAME_MAX} 字`)
    .regex(NAME_REGEX, '姓名僅能包含中英文'),
  phone: z
    .string()
    .min(1, '電話不可為空')
    .regex(TW_PHONE_REGEX, '請輸入正確的台灣手機號碼（09 開頭 10 碼）'),
  email: z
    .string()
    .max(FIELD_LIMITS.EMAIL_MAX, `Email 最多 ${FIELD_LIMITS.EMAIL_MAX} 字`)
    .email('Email 格式不正確')
    .optional()
    .or(z.literal('')),
});

export type DataCollectionFormData = z.infer<typeof DataCollectionFormSchema>;

// ============================================================================
// Props Interface
// ============================================================================

export interface DataCollectionModalProps {
  isOpen: boolean;
  onSubmit: (data: { name: string; phone: string; email: string }) => void | Promise<void>;
  onSkip: () => void;
  isSubmitting?: boolean;
}

type DataCollectionModalContentProps = Omit<DataCollectionModalProps, 'isOpen'>;

// ============================================================================
// Component
// ============================================================================

export function DataCollectionModal({
  isOpen,
  onSubmit,
  onSkip,
  isSubmitting = false,
}: DataCollectionModalProps): React.ReactElement | null {
  if (!isOpen) return null;

  return (
    <DataCollectionModalContent onSubmit={onSubmit} onSkip={onSkip} isSubmitting={isSubmitting} />
  );
}

function DataCollectionModalContent({
  onSubmit,
  onSkip,
  isSubmitting = false,
}: DataCollectionModalContentProps): React.ReactElement {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // [frontend_mastery] Focus Trap refs
  const modalRef = useRef<HTMLFormElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useFocusTrap({
    containerRef: modalRef,
    initialFocusRef: firstInputRef,
    onEscape: onSkip,
    isEscapeEnabled: !isSubmitting,
  });

  // Validate form
  const validateForm = useCallback((): { name: string; phone: string; email: string } | null => {
    const formData = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || '',
    };

    const result = DataCollectionFormSchema.safeParse(formData);

    if (!result.success) {
      const newErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (typeof field === 'string') {
          newErrors[field] = issue.message;
        }
      }
      setErrors(newErrors);
      logger.warn('[DataCollectionModal] Validation failed', {
        errors: newErrors,
      });
      notify.error(S.VALIDATION_ERROR);
      return null;
    }

    setErrors({});
    return formData;
  }, [name, phone, email]);

  // Handle submit
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (isSubmitting) return;

      const formData = validateForm();
      if (!formData) return;

      // [Team 8 修復] 添加錯誤處理，防止 onSubmit 拋出錯誤時 Modal 卡住
      try {
        await onSubmit(formData);
      } catch (error) {
        logger.error('[DataCollectionModal] Submit failed', {
          error: error instanceof Error ? error.message : 'Unknown',
        });
        notify.error('送出失敗', '請稍後再試或聯繫客服');
      }
    },
    [validateForm, isSubmitting, onSubmit]
  );

  // Handle skip
  const handleSkip = useCallback(() => {
    if (isSubmitting) return;
    onSkip();
  }, [isSubmitting, onSkip]);

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm dark:bg-black/70">
      <form
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="data-collection-title"
        noValidate
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl bg-bg-card shadow-brand-lg transition-transform duration-200 dark:border dark:border-border dark:bg-slate-900"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Shield className="size-5 text-brand-600" />
            <h2
              id="data-collection-title"
              className="text-base font-bold text-ink-900 sm:text-lg dark:text-slate-100"
            >
              {S.TITLE}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleSkip}
            disabled={isSubmitting}
            className="rounded-full p-1.5 text-text-muted transition-colors hover:bg-bg-base hover:text-ink-900 disabled:opacity-50"
            aria-label="關閉"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 p-4">
          {/* Privacy Notice */}
          <div className="bg-brand-50/40 flex items-start gap-3 rounded-xl border border-brand-100 p-3">
            <Info className="mt-0.5 size-5 shrink-0 text-brand-600" />
            <p className="text-sm text-brand-700">{S.PRIVACY_NOTE}</p>
          </div>

          {/* Name Input */}
          <div>
            <label
              htmlFor="data-name-input"
              className="mb-1.5 flex items-center gap-2 text-sm font-medium text-ink-900 dark:text-slate-200"
            >
              <User className="size-4 text-text-muted" />
              {S.NAME_LABEL}
              <span className="text-red-500">*</span>
            </label>
            <input
              ref={firstInputRef}
              id="data-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={S.NAME_PLACEHOLDER}
              maxLength={FIELD_LIMITS.NAME_MAX}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'data-name-error' : undefined}
              className={`w-full rounded-xl border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 ${
                errors.name
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                  : 'focus:ring-brand-500/20 border-border focus:border-brand-500'
              }`}
              disabled={isSubmitting}
              required
            />
            {errors.name && (
              <p
                id="data-name-error"
                className="mt-1 text-xs text-red-500"
                role="alert"
                aria-live="polite"
              >
                {errors.name}
              </p>
            )}
          </div>

          {/* Phone Input */}
          <div>
            <label
              htmlFor="data-phone-input"
              className="mb-1.5 flex items-center gap-2 text-sm font-medium text-ink-900 dark:text-slate-200"
            >
              <Phone className="size-4 text-text-muted" />
              {S.PHONE_LABEL}
              <span className="text-red-500">*</span>
            </label>
            <input
              id="data-phone-input"
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => {
                const digitsOnly = e.target.value
                  .replace(/\D/g, '')
                  .slice(0, FIELD_LIMITS.PHONE_LENGTH);
                setPhone(digitsOnly);
              }}
              placeholder={S.PHONE_PLACEHOLDER}
              maxLength={FIELD_LIMITS.PHONE_LENGTH}
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? 'data-phone-error' : undefined}
              className={`w-full rounded-xl border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 ${
                errors.phone
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                  : 'focus:ring-brand-500/20 border-border focus:border-brand-500'
              }`}
              disabled={isSubmitting}
              required
            />
            {errors.phone && (
              <p
                id="data-phone-error"
                className="mt-1 text-xs text-red-500"
                role="alert"
                aria-live="polite"
              >
                {errors.phone}
              </p>
            )}
          </div>

          {/* Email Input (Optional) */}
          <div>
            <label
              htmlFor="data-email-input"
              className="mb-1.5 flex items-center gap-2 text-sm font-medium text-ink-900 dark:text-slate-200"
            >
              <Mail className="size-4 text-text-muted" />
              {S.EMAIL_LABEL}
            </label>
            <input
              id="data-email-input"
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={S.EMAIL_PLACEHOLDER}
              maxLength={FIELD_LIMITS.EMAIL_MAX}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'data-email-error' : undefined}
              className={`w-full rounded-xl border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 ${
                errors.email
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                  : 'focus:ring-brand-500/20 border-border focus:border-brand-500'
              }`}
              disabled={isSubmitting}
            />
            {errors.email && (
              <p
                id="data-email-error"
                className="mt-1 text-xs text-red-500"
                role="alert"
                aria-live="polite"
              >
                {errors.email}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-border p-4 dark:border-slate-700">
          <button
            type="button"
            onClick={handleSkip}
            disabled={isSubmitting}
            className="min-h-[44px] flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-ink-900 transition-colors hover:bg-bg-base disabled:opacity-50"
          >
            {S.SKIP_BTN}
          </button>
          <button
            type="submit"
            disabled={!name.trim() || !phone.trim() || isSubmitting}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:bg-border disabled:text-text-muted"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {S.SUBMITTING}
              </>
            ) : (
              <>{S.SUBMIT_BTN}</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default DataCollectionModal;
