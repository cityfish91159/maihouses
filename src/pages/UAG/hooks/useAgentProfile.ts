import { useQuery } from '@tanstack/react-query';
import type { AgentProfile } from '../types/uag.types';
import { MOCK_AGENT_PROFILE } from '../mockData';
import { useUAGModeStore } from '../../../stores/uagModeStore';
import { fetchAgentMe } from '../../../services/agentService';

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

      const data = await fetchAgentMe();

      return {
        id: data.id,
        internalCode: data.internalCode,
        name: data.name,
        avatarUrl: data.avatarUrl,
        company: data.company ?? '邁房子',
        trustScore: data.trustScore,
        encouragementCount: data.encouragementCount,
        visitCount: data.visitCount ?? 0,
        dealCount: data.dealCount ?? 0,
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
