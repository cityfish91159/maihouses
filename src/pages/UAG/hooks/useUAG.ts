import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UAGService } from '../services/uagService';
import { AppData, Grade, LeadStatus } from '../types/uag.types';
import { MOCK_DB } from '../mockData';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../hooks/useAuth';
import { GRADE_HOURS } from '../uag-config';
import { validateQuota } from '../utils/validation';

export function useUAG() {
  const { session } = useAuth();
  const [useMock, setUseMock] = useState(true);
  const queryClient = useQueryClient();

  // Initialize mock mode from URL or localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const urlMode = params.get('mode');
    let initialMock = true;
    
    if (urlMode === 'mock' || urlMode === 'live') {
      initialMock = urlMode === 'mock';
      localStorage.setItem('uag_mode', urlMode);
    } else {
      const saved = localStorage.getItem('uag_mode');
      if (saved === 'mock' || saved === 'live') {
        initialMock = saved === 'mock';
      }
    }
    setUseMock(initialMock);
  }, []);

  const toggleMode = () => {
    if (import.meta.env.PROD) {
      toast.error("生產環境無法切換模式");
      return;
    }
    const newMode = !useMock;
    setUseMock(newMode);
    localStorage.setItem('uag_mode', newMode ? 'mock' : 'live');
    queryClient.invalidateQueries({ queryKey: ['uagData'] });
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['uagData', useMock, session?.user?.id],
    queryFn: async () => {
      if (useMock) {
        // Simulate delay
        // await new Promise(resolve => setTimeout(resolve, 500));
        return MOCK_DB as unknown as AppData; 
      }
      if (!session?.user?.id) throw new Error('Not authenticated');
      return UAGService.fetchAppData(session.user.id);
    },
    enabled: useMock || !!session?.user?.id,
    staleTime: 1000 * 10, // 10 seconds for leads
    refetchInterval: useMock ? false : 30000, // Auto refresh every 30s for live data
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
              ? { ...l, status: 'purchased' as LeadStatus, remainingHours: GRADE_HOURS[grade] || 48 }
              : l
          )
        };
        queryClient.setQueryData(['uagData', useMock, session?.user?.id], newData);
      }

      return { previousData };
    },
    onError: (err, newTodo, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['uagData', useMock, session?.user?.id], context.previousData);
      }
      toast.error(`購買失敗: ${err instanceof Error ? err.message : 'Unknown error'}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['uagData'] });
    },
  });

  const buyLead = async (leadId: string) => {
    if (!data || buyLeadMutation.isPending) return;

    const lead = data.leads.find(l => l.id === leadId);
    if (!lead) {
      toast.error("客戶不存在");
      return;
    }

    if (lead.status !== 'new') {
      toast.error("此客戶已被購買");
      return;
    }

    const { valid, error } = validateQuota(lead, data.user);
    if (!valid) {
      toast.error(error || "配額不足");
      return;
    }

    const cost = lead.price || 10;
    if (data.user.points < cost) {
      toast.error("點數不足");
      return;
    }

    buyLeadMutation.mutate({ leadId, cost, grade: lead.grade }, {
      onSuccess: () => {
        toast.success("購買成功");
      }
    });
  };

  return {
    data,
    isLoading,
    error,
    buyLead, // Expose the wrapper function
    isBuying: buyLeadMutation.isPending,
    useMock,
    toggleMode,
    refetch
  };
}
