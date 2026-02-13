/**
 * MSG-5: SendMessageModal
 *
 * 購買客戶成功後彈出的訊息發送 Modal
 */

import React, { useState, useCallback, useEffect } from 'react';
import { X, Send, MessageCircle, User, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Lead } from '../../pages/UAG/types/uag.types';
import { messagingService } from '../../services/messagingService';
import { notify } from '../../lib/notify';
import { logger } from '../../lib/logger';
import { ROUTES, RouteUtils } from '../../constants/routes';

const S = {
  TITLE: '發送訊息給客戶',
  CUSTOMER_LABEL: '客戶',
  PROPERTY_LABEL: '感興趣物件',
  MESSAGE_LABEL: '訊息內容',
  MESSAGE_PLACEHOLDER: '您好！我是專業房仲，很高興為您服務...',
  SEND_BTN: '發送訊息',
  LATER_BTN: '稍後再說',
  SENDING: '發送中...',
  SUCCESS: '訊息已發送',
  SUCCESS_DESC: '客戶會收到通知',
  ERROR: '發送失敗',
  SAVED_FOR_LATER: '已儲存客戶資料',
  SAVED_FOR_LATER_DESC: '您可以稍後在「我的客戶」中發送訊息',
};

interface SendMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  agentId: string;
  sessionId: string;
  /** MSG-5 FIX 6: 可選的物件 ID */
  propertyId?: string;
  /** UAG-13: 預先建立的對話 ID (若有則直接發送訊息) */
  conversationId?: string;
  /** UAG-14: 房仲名稱 (用於 LINE 通知) */
  agentName: string;
  /** 發送成功回調（傳入 conversationId 用於更新 cache） */
  onSuccess?: (conversationId?: string) => void;
}

/**
 * 生成匿名客戶名稱
 */
function getAnonymousName(leadId: string): string {
  const hash = leadId.slice(-4).toUpperCase();
  return `訪客-${hash}`;
}

export function SendMessageModal({
  isOpen,
  onClose,
  lead,
  agentId,
  sessionId,
  propertyId,
  conversationId,
  agentName,
  onSuccess,
}: SendMessageModalProps): React.ReactElement | null {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const customerName = getAnonymousName(lead.id);
  const propertyName = lead.prop || '物件諮詢';

  const handleSend = useCallback(async () => {
    if (!message.trim() || isSending) return;

    setIsSending(true);

    try {
      // ========== Mock 模式檢測 ==========
      const isMockMode = agentId === 'mock-agent-001';

      if (isMockMode) {
        // Mock 模式：模擬延遲 + 成功
        await new Promise((resolve) => setTimeout(resolve, 800));

        notify.success('訊息已發送', '客戶會收到通知');
        // Mock 模式：不傳 conversationId，讓父組件生成
        onSuccess?.();
        onClose();
        // Mock 模式下不導航，直接關閉 Modal 回到 UAG 頁面
        return;
      }

      // ========== API 模式（原有邏輯）==========

      // [UAG-13 FIX] 驗證 conversationId 格式 (防禦性編程)
      let validConversationId = conversationId;
      if (conversationId) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(conversationId)) {
          logger.warn('[SendMessageModal] Invalid conversationId format, fallback to create flow', {
            invalidId: conversationId,
            leadId: lead.id,
          });
          validConversationId = undefined; // 強制走建立流程
        }
      }

      // UAG-13: 如果已經有 conversationId，直接發送訊息 (Skip Create，不推 LINE)
      if (validConversationId) {
        const safeConversationId: string = validConversationId;
        await messagingService.sendMessage({
          conversation_id: safeConversationId,
          sender_type: 'agent',
          sender_id: agentId,
          content: message.trim(),
        });

        notify.success(S.SUCCESS, S.SUCCESS_DESC);
        onClose();
        navigate(RouteUtils.toNavigatePath(ROUTES.CHAT(safeConversationId)));
        return;
      }

      // UAG-14: 新購買後首次訊息，使用整合式 API（建立對話 + 發送訊息 + LINE 推播）
      const response = await fetch('/api/uag/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          sessionId,
          purchaseId: lead.id,
          propertyId,
          message: message.trim(),
          agentName,
          propertyTitle: lead.prop,
          grade: lead.grade,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '發送失敗');
      }

      // 根據 LINE 狀態顯示不同提示
      switch (result.lineStatus) {
        case 'sent':
          notify.success('訊息已發送', '已同時透過 LINE 通知客戶');
          break;
        case 'no_line':
          notify.success('訊息已發送', '客戶未綁定 LINE，僅發送站內訊息');
          break;
        case 'unreachable':
          notify.warning('訊息已發送', 'LINE 無法送達（客戶可能已封鎖）');
          break;
        case 'pending':
          notify.success('訊息已發送', 'LINE 通知稍後送達');
          break;
        default:
          notify.success(S.SUCCESS, S.SUCCESS_DESC);
      }

      // API 模式：傳遞真實的 conversationId 給父組件更新 cache
      onSuccess?.(result.conversationId);
      onClose();

      if (result.conversationId) {
        navigate(RouteUtils.toNavigatePath(ROUTES.CHAT(result.conversationId)));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '請稍後再試';
      logger.error('[SendMessageModal] Failed to send message', {
        error: errorMessage,
      });
      notify.error(S.ERROR, errorMessage);
    } finally {
      setIsSending(false);
    }
  }, [
    message,
    isSending,
    agentId,
    sessionId,
    propertyId,
    onClose,
    onSuccess,
    navigate,
    conversationId,
    lead.id,
    lead.prop,
    lead.grade,
    agentName,
  ]);

  const handleLater = useCallback(() => {
    onClose();
    notify.info(S.SAVED_FOR_LATER, S.SAVED_FOR_LATER_DESC);
  }, [onClose]);

  // Escape key handler via useEffect (a11y compliant)
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Ctrl+Enter handler for textarea
  const handleTextareaKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="send-message-title"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="animate-in fade-in zoom-in-95 w-full max-w-md rounded-2xl bg-white shadow-2xl duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="size-5 text-brand-600" />
            <h2 id="send-message-title" className="text-lg font-bold text-gray-900">
              {S.TITLE}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="關閉"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 p-4">
          {/* Customer Info */}
          <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-brand-100 text-brand-600">
              <User className="size-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">{S.CUSTOMER_LABEL}</p>
              <p className="font-semibold text-gray-900">{customerName}</p>
            </div>
          </div>

          {/* Property Info */}
          <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-cyan-100 text-cyan-600">
              <Home className="size-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">{S.PROPERTY_LABEL}</p>
              <p className="font-semibold text-gray-900">{propertyName}</p>
            </div>
          </div>

          {/* Message Input */}
          <div>
            <label
              htmlFor="message-input"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              {S.MESSAGE_LABEL}
            </label>
            <textarea
              id="message-input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleTextareaKeyDown}
              placeholder={S.MESSAGE_PLACEHOLDER}
              maxLength={500}
              rows={4}
              className="focus:ring-brand-500/20 w-full resize-none rounded-xl border border-gray-200 p-3 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2"
              aria-label={S.MESSAGE_LABEL}
              disabled={isSending}
            />
            <p className="mt-1 text-right text-xs text-gray-400">{message.length}/500</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-gray-100 p-4">
          <button
            type="button"
            onClick={handleLater}
            disabled={isSending}
            className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            {S.LATER_BTN}
          </button>
          <button
            type="submit"
            disabled={!message.trim() || isSending}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:bg-gray-300 disabled:text-gray-500"
          >
            {isSending ? (
              S.SENDING
            ) : (
              <>
                <Send className="size-4" />
                {S.SEND_BTN}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default SendMessageModal;
