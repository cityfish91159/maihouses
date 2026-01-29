/**
 * UAG Lead 購買 Hook
 *
 * 職責：
 * - 處理 Lead 購買邏輯
 * - 樂觀更新與錯誤回滾
 * - React Query 快取同步
 *
 * @module useLeadPurchase
 */

import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UAGService, type PurchaseLeadResult } from '../services/uagService';
import type { AppData, Grade, Lead } from '../types/uag.types';
import { isUnpurchasedLead, LeadStatusSchema } from '../types/uag.types';
import { notify } from '../../../lib/notify';
import { GRADE_PROTECTION_HOURS } from '../uag-config';
import { validateQuota } from '../utils/validation';
import { UAG_QUERY_KEY } from './useUAGData';

// ============================================================================
// Types
// ============================================================================

/** 購買結果類型 */
export interface BuyLeadResult {
  success: boolean;
  lead?: Lead;
  conversation_id?: string | undefined;
  error?: string;
}

/** Mutation 參數 */
interface MutationParams {
  leadId: string;
  cost: number;
  grade: Grade;
}

/** Mutation Context（用於 rollback） */
interface MutationContext {
  previousData: AppData | undefined;
}

/** Hook 參數 */
export interface UseLeadPurchaseParams {
  /** 當前應用數據 */
  data: AppData | undefined;
  /** 是否使用 Mock 模式 */
  useMock: boolean;
  /** 用戶 ID */
  userId: string | undefined;
}

/** Hook 返回值 */
export interface UseLeadPurchaseReturn {
  /** 購買 Lead */
  buyLead: (leadId: string) => Promise<BuyLeadResult>;
  /** 是否購買中 */
  isBuying: boolean;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * UAG Lead 購買 Hook
 *
 * @example
 * ```tsx
 * const { data, useMock, userId } = useUAGData();
 * const { buyLead, isBuying } = useLeadPurchase({ data, useMock, userId });
 *
 * const handleBuy = async (leadId: string) => {
 *   const result = await buyLead(leadId);
 *   if (result.success) {
 *     showModal(result.lead);
 *   }
 * };
 * ```
 */
export function useLeadPurchase({
  data,
  useMock,
  userId,
}: UseLeadPurchaseParams): UseLeadPurchaseReturn {
  const queryClient = useQueryClient();

  /**
   * React Mutation：購買 Lead
   *
   * 返回類型使用 PurchaseLeadResult，其中 used_quota/purchase_id 為 optional
   * Mock 模式會生成完整的假資料
   */
  const buyLeadMutation = useMutation<PurchaseLeadResult, Error, MutationParams, MutationContext>({
    mutationFn: async ({ leadId, cost, grade }): Promise<PurchaseLeadResult> => {
      if (useMock) {
        // Mock 模式：模擬 500ms 延遲
        await new Promise((resolve) => setTimeout(resolve, 500));
        const mockPurchaseId = crypto.randomUUID();
        const mockConversationId = crypto.randomUUID();
        return {
          success: true,
          used_quota: false,
          purchase_id: mockPurchaseId,
          conversation_id: mockConversationId,
        };
      }

      if (!userId) {
        throw new Error('Not authenticated');
      }

      return UAGService.purchaseLead(userId, leadId, cost, grade);
    },

    /**
     * 樂觀更新：在請求發送前先更新 UI
     */
    onMutate: async ({ leadId, cost, grade }): Promise<MutationContext> => {
      // 取消進行中的查詢
      await queryClient.cancelQueries({ queryKey: [UAG_QUERY_KEY] });

      // 保存當前數據（用於 rollback）
      const previousData = queryClient.getQueryData<AppData>([UAG_QUERY_KEY, useMock, userId]);

      if (previousData) {
        // 前置驗證：配額檢查
        const lead = previousData.leads.find((l) => l.id === leadId);
        if (lead) {
          const { valid, error } = validateQuota(lead, previousData.user);
          if (!valid) {
            notify.error(error || '配額不足');
            throw new Error(error || '配額不足 (Optimistic Check)');
          }
        }

        // 樂觀更新：立即反映購買結果
        const newData: AppData = {
          ...previousData,
          user: {
            ...previousData.user,
            points: previousData.user.points - cost,
            quota: {
              ...previousData.user.quota,
              s: grade === 'S' ? previousData.user.quota.s - 1 : previousData.user.quota.s,
              a: grade === 'A' ? previousData.user.quota.a - 1 : previousData.user.quota.a,
            },
          },
          leads: previousData.leads.map((l) =>
            l.id === leadId
              ? {
                  ...l,
                  // [NASA TypeScript Safety] 使用 Zod parse 取代 as LeadStatus
                  status: LeadStatusSchema.parse('purchased'),
                  remainingHours: GRADE_PROTECTION_HOURS[grade] || 48,
                }
              : l
          ),
        };

        queryClient.setQueryData([UAG_QUERY_KEY, useMock, userId], newData);
      }

      return { previousData };
    },

    /**
     * 錯誤回滾：恢復到樂觀更新前的狀態
     */
    onError: (err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData([UAG_QUERY_KEY, useMock, userId], context.previousData);
      }
      notify.error(`購買失敗: ${err instanceof Error ? err.message : 'Unknown error'}`);
    },
  });

  /**
   * 購買 Lead
   *
   * AUDIT-01 Phase 5: Lead ID 語義說明
   * - 購買時傳入的 leadId 是 session_id（因為 lead.status === "new"）
   * - 購買成功後，lead.id 會被替換為 purchase UUID
   *
   * @param leadId - Lead ID（未購買時為 session_id）
   * @returns Promise<BuyLeadResult> - 購買結果（lead.id 為 purchase UUID）
   */
  const buyLead = useCallback(
    async (leadId: string): Promise<BuyLeadResult> => {
      // 前置檢查：數據可用性
      if (!data || buyLeadMutation.isPending) {
        return { success: false, error: '無法購買' };
      }

      // 尋找目標 Lead
      const lead = data.leads.find((l) => l.id === leadId);
      if (!lead) {
        notify.error('客戶不存在');
        return { success: false, error: '客戶不存在' };
      }

      // AUDIT-01 Phase 5: 使用類型守衛確保只購買 new 狀態的 Lead
      // isUnpurchasedLead 確保 lead.id 在此處語義上是 session_id
      if (!isUnpurchasedLead(lead)) {
        notify.error('此客戶已被購買');
        return { success: false, error: '此客戶已被購買' };
      }

      // 配額驗證
      const { valid, error: quotaError } = validateQuota(lead, data.user);
      if (!valid) {
        notify.error(quotaError || '配額不足');
        return { success: false, error: quotaError || '配額不足' };
      }

      // 點數檢查
      const cost = lead.price ?? 10;
      if (data.user.points < cost) {
        notify.error('點數不足');
        return { success: false, error: '點數不足' };
      }

      // 執行購買 mutation
      return new Promise((resolve) => {
        buyLeadMutation.mutate(
          { leadId, cost, grade: lead.grade },
          {
            onSuccess: (result) => {
              notify.success('購買成功');

              // AUDIT-01 Phase 5: 更新 Query Cache
              // 將 lead.id 從 session_id 替換為 purchase UUID
              // 這樣 lead 就變成 PurchasedLead 類型
              // 注意：status 已在 onMutate 樂觀更新中設為 "purchased"，此處無需重複設定
              queryClient.setQueryData<AppData>([UAG_QUERY_KEY, useMock, userId], (oldData) => {
                if (!oldData) return oldData;

                return {
                  ...oldData,
                  leads: oldData.leads.map((item) => {
                    if (item.id === leadId) {
                      return {
                        ...item,
                        id: result?.purchase_id ?? item.id,
                        purchased_at: new Date().toISOString(),
                        notification_status: useMock ? 'pending' : undefined,
                      };
                    }
                    return item;
                  }),
                };
              });

              // 從更新後的 cache 中取得最終 lead
              const finalData = queryClient.getQueryData<AppData>([UAG_QUERY_KEY, useMock, userId]);
              const updatedLead = finalData?.leads.find((l) => l.id === result?.purchase_id) ?? {
                ...lead,
                id: result?.purchase_id ?? lead.id,
                // [NASA TypeScript Safety] 使用 Zod parse 取代 as LeadStatus
                status: LeadStatusSchema.parse('purchased'),
                remainingHours: GRADE_PROTECTION_HOURS[lead.grade] || 48,
                purchased_at: new Date().toISOString(),
              };

              resolve({
                success: true,
                lead: updatedLead,
                conversation_id: result?.conversation_id,
              });
            },
            onError: (err) => {
              resolve({
                success: false,
                error: err instanceof Error ? err.message : 'Unknown error',
              });
            },
          }
        );
      });
    },
    [data, buyLeadMutation, queryClient, useMock, userId]
  );

  return {
    buyLead,
    isBuying: buyLeadMutation.isPending,
  };
}
