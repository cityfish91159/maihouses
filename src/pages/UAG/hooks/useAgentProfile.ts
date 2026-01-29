import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import type { AgentProfile } from '../types/uag.types';
import { MOCK_AGENT_PROFILE } from '../mockData';
import { useUAGModeStore } from '../../../stores/uagModeStore';

interface UseAgentProfileResult {
  profile: AgentProfile | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * 查詢房仲個人資料（用於 UAG Header 房仲資訊條）
 * 從 agents 表查詢：信任分、帶看數、成交數等
 * 使用統一的 Zustand store 判斷 Mock/Live 模式
 */
export function useAgentProfile(userId: string | undefined): UseAgentProfileResult {
  // 使用統一的 store 取得模式狀態
  const useMock = useUAGModeStore((state) => state.useMock);

  const { data, isLoading, error } = useQuery({
    queryKey: ['agentProfile', userId, useMock],
    queryFn: async (): Promise<AgentProfile | null> => {
      // Mock 模式：直接回傳 mock 資料
      if (useMock) {
        return MOCK_AGENT_PROFILE;
      }

      if (!userId) return null;

      const { data: agent, error: queryError } = await supabase
        .from('agents')
        .select(
          'id, internal_code, name, avatar_url, company, trust_score, encouragement_count, visit_count, deal_count'
        )
        .eq('id', userId)
        .single();

      if (queryError) {
        // 如果找不到記錄，回傳 null 而不是拋錯誤
        if (queryError.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to fetch agent profile: ${queryError.message}`);
      }

      if (!agent) return null;

      return {
        id: agent.id,
        internalCode: agent.internal_code,
        name: agent.name,
        avatarUrl: agent.avatar_url,
        company: agent.company ?? '邁房子',
        trustScore: agent.trust_score ?? 80,
        encouragementCount: agent.encouragement_count ?? 0,
        visitCount: agent.visit_count ?? 0,
        dealCount: agent.deal_count ?? 0,
      };
    },
    enabled: useMock || !!userId,
    staleTime: 5 * 60 * 1000, // 5 分鐘快取
    retry: 1,
  });

  // [NASA TypeScript Safety] 使用類型守衛取代 as Error | null
  const typedError = error instanceof Error ? error : null;

  return {
    profile: data ?? null,
    isLoading,
    error: typedError,
  };
}
