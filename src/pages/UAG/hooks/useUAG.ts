import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UAGService } from '../services/uagService';
import { AppData, Grade, Lead, LeadStatus } from '../types/uag.types';
import { MOCK_DB } from '../mockData';
import { notify } from '../../../lib/notify';
import { useAuth } from '../../../hooks/useAuth';
import { GRADE_PROTECTION_HOURS } from '../uag-config';
import { validateQuota } from '../utils/validation';
import { safeLocalStorage } from '../../../lib/safeStorage';

/** 從 URL 或 localStorage 取得初始 mock 模式設定 */
function getInitialMockMode(): boolean {
  if (typeof window === 'undefined') return true;

  const params = new URLSearchParams(window.location.search);
  const urlMode = params.get('mode');

  if (urlMode === 'mock' || urlMode === 'live') {
    safeLocalStorage.setItem('uag_mode', urlMode);
    return urlMode === 'mock';
  }

  const saved = safeLocalStorage.getItem('uag_mode');
  if (saved === 'mock' || saved === 'live') {
    return saved === 'mock';
  }

  return true;
}

/** 購買結果類型 */
export interface BuyLeadResult {
  success: boolean;
  lead?: Lead;
  conversation_id?: string | undefined; // UAG-13 [NEW] - 明確允許 undefined (exactOptionalPropertyTypes)
  error?: string;
}

export function useUAG() {
  const { session } = useAuth();
  const [useMock, setUseMock] = useState<boolean>(getInitialMockMode);
  const queryClient = useQueryClient();

  const toggleMode = () => {
    if (import.meta.env.PROD) {
      notify.error('生產環境無法切換模式');
      return;
    }
    const newMode = !useMock;
    setUseMock(newMode);
    safeLocalStorage.setItem('uag_mode', newMode ? 'mock' : 'live');
    queryClient.invalidateQueries({ queryKey: ['uagData'] });
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['uagData', useMock, session?.user?.id],
    queryFn: async () => {
      if (useMock) {
        return MOCK_DB as unknown as AppData;
      }
      if (!session?.user?.id) throw new Error('Not authenticated');
      return UAGService.fetchAppData(session.user.id);
    },
    enabled: useMock || !!session?.user?.id,
    // 漏洞 5 修復：staleTime 與 refetchInterval 一致，避免不必要的 refetch
    // 購買操作的即時更新依賴 onSuccess 手動 cache 更新，不依賴 refetch
    staleTime: 1000 * 30,
    refetchInterval: useMock ? false : 30000,
  });

  const buyLeadMutation = useMutation({
    mutationFn: async ({ leadId, cost, grade }: { leadId: string; cost: number; grade: Grade }) => {
      if (useMock) {
        await new Promise(resolve => setTimeout(resolve, 500));
        // ✅ Mock 模式：生成符合 UUID 格式的假 purchase_id
        // ✅ Mock 模式：生成符合 UUID 格式的假 purchase_id 與 conversation_id
        const mockPurchaseId = crypto.randomUUID();
        const mockConversationId = crypto.randomUUID();
        return { 
          success: true, 
          used_quota: false, 
          purchase_id: mockPurchaseId,
          conversation_id: mockConversationId // UAG-13 Mock Parity
        };
      }
      if (!session?.user?.id) throw new Error('Not authenticated');
      return UAGService.purchaseLead(session.user.id, leadId, cost, grade);
    },
    onMutate: async ({ leadId, cost, grade }) => {
      await queryClient.cancelQueries({ queryKey: ['uagData'] });
      const previousData = queryClient.getQueryData<AppData>(['uagData', useMock, session?.user?.id]);

      if (previousData) {
        const lead = previousData.leads.find(l => l.id === leadId);
        if (lead) {
          const { valid, error } = validateQuota(lead, previousData.user);
          if (!valid) {
            notify.error(error || '配額不足');
            throw new Error(error || "配額不足 (Optimistic Check)");
          }
        }

        const newData = {
          ...previousData,
          user: {
            ...previousData.user,
            points: previousData.user.points - cost,
            quota: {
              ...previousData.user.quota,
              s: grade === 'S' ? previousData.user.quota.s - 1 : previousData.user.quota.s,
              a: grade === 'A' ? previousData.user.quota.a - 1 : previousData.user.quota.a
            }
          },
          leads: previousData.leads.map(l =>
            l.id === leadId
              ? { ...l, status: 'purchased' as LeadStatus, remainingHours: GRADE_PROTECTION_HOURS[grade] || 48 }
              : l
          )
        };
        queryClient.setQueryData(['uagData', useMock, session?.user?.id], newData);
      }

      return { previousData };
    },
    onError: (err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['uagData', useMock, session?.user?.id], context.previousData);
      }
      notify.error(`購買失敗: ${err instanceof Error ? err.message : 'Unknown error'}`);
    },
    // ❌ 移除 onSettled：避免與局部 onSuccess 競態
    // onSuccess 會手動更新 query cache（包含新的 purchase_id）
  });

  /**
   * MSG-5 FIX: 購買客戶，回傳 Promise 以便追蹤成功/失敗
   * 問題 #19 修復：返回更新後的 lead 數據（status = 'purchased'）
   * @returns Promise<BuyLeadResult> 包含購買結果
   */
  const buyLead = useCallback(async (leadId: string): Promise<BuyLeadResult> => {
    if (!data || buyLeadMutation.isPending) {
      return { success: false, error: '無法購買' };
    }

    const lead = data.leads.find(l => l.id === leadId);
    if (!lead) {
      notify.error('客戶不存在');
      return { success: false, error: '客戶不存在' };
    }

    if (lead.status !== 'new') {
      notify.error('此客戶已被購買');
      return { success: false, error: '此客戶已被購買' };
    }

    const { valid, error: quotaError } = validateQuota(lead, data.user);
    if (!valid) {
      notify.error(quotaError || '配額不足');
      return { success: false, error: quotaError || '配額不足' };
    }

    const cost = lead.price ?? 10;
    if (data.user.points < cost) {
      notify.error('點數不足');
      return { success: false, error: '點數不足' };
    }

    return new Promise((resolve) => {
      buyLeadMutation.mutate({ leadId, cost, grade: lead.grade }, {
        onSuccess: (result) => {
          notify.success('購買成功');

          // ✅ 漏洞 3 修復：手動更新 Query Cache（解決列表與 Modal 數據不一致）
          queryClient.setQueryData<AppData>(
            ['uagData', useMock, session?.user?.id],
            (oldData) => {
              if (!oldData) return oldData;

              return {
                ...oldData,
                // 遍歷 leads 陣列，找到目標並替換
                leads: oldData.leads.map((item) => {
                  // ⚠️ 用舊的 leadId (session_id) 來匹配，因為此時 cache 中還是舊 ID
                  if (item.id === leadId) {
                    // ✅ 使用 oldData 中的 lead（保留 onMutate 的更新）
                    return {
                      ...item,
                      id: result?.purchase_id ?? item.id,  // 更新為 purchase UUID
                      purchased_at: new Date().toISOString(),
                    };
                  }
                  return item;
                })
              };
            }
          );

          // 從更新後的 cache 中取得最終 lead
          const finalData = queryClient.getQueryData<AppData>(['uagData', useMock, session?.user?.id]);
          const updatedLead = finalData?.leads.find(l => l.id === result?.purchase_id) ?? {
            ...lead,
            id: result?.purchase_id ?? lead.id,
            status: 'purchased' as LeadStatus,
            remainingHours: GRADE_PROTECTION_HOURS[lead.grade] ?? 48,
            purchased_at: new Date().toISOString(),
          };

          resolve({
            success: true,
            lead: updatedLead,
            // [UAG-13 FIX] 明確賦值，避免 conditional spreading 的型別模糊
            conversation_id: result?.conversation_id,
          });
        },
        onError: (err) => {
          resolve({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
        }
      });
    });
  }, [data, buyLeadMutation, queryClient, useMock, session?.user?.id]);

  return {
    data,
    isLoading,
    error,
    buyLead,
    isBuying: buyLeadMutation.isPending,
    useMock,
    toggleMode,
    refetch
  };
}
