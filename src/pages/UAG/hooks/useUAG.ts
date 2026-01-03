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
    staleTime: 1000 * 10,
    refetchInterval: useMock ? false : 30000,
  });

  const buyLeadMutation = useMutation({
    mutationFn: async ({ leadId, cost, grade }: { leadId: string; cost: number; grade: Grade }) => {
      if (useMock) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return;
      }
      if (!session?.user?.id) throw new Error('Not authenticated');
      await UAGService.purchaseLead(session.user.id, leadId, cost, grade);
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
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['uagData'] });
    },
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
        onSuccess: () => {
          notify.success('購買成功');
          // 問題 #19 修復：返回更新後的 lead 數據
          const updatedLead: Lead = {
            ...lead,
            status: 'purchased' as LeadStatus,
            remainingHours: GRADE_PROTECTION_HOURS[lead.grade] ?? 48,
            purchased_at: new Date().toISOString(),
          };
          resolve({ success: true, lead: updatedLead });
        },
        onError: (err) => {
          resolve({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
        }
      });
    });
  }, [data, buyLeadMutation]);

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
