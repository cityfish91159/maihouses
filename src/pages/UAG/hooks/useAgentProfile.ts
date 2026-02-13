import { useQuery } from '@tanstack/react-query';
import type { AgentProfile } from '../types/uag.types';
import { MOCK_AGENT_PROFILE } from '../../../constants/mockData';
import { useUAGModeStore } from '../../../stores/uagModeStore';
import { fetchAgentMe } from '../../../services/agentService';
import { usePageMode } from '../../../hooks/usePageMode';
import { uagAgentProfileQueryKey } from './queryKeys';

interface UseAgentProfileResult {
  profile: AgentProfile | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * 查詢房仲個人資料（用於 UAG Header 房仲資訊條）
 * 從 agents 表查詢：信任分、帶看數、成交數等
 * 以 usePageMode 為主，舊版 UAG store 僅作過渡 fallback
 */
export function useAgentProfile(userId: string | undefined): UseAgentProfileResult {
  const pageMode = usePageMode();
  // #5b 遷移前兼容：若仍有舊版 UAG Mock store，visitor 模式時允許 fallback 為 demo。
  const useMockFallback = useUAGModeStore((state) => state.useMock);
  const mode = pageMode === 'visitor' && useMockFallback ? 'demo' : pageMode;
  const isDemoMode = mode === 'demo';

  const { data, isLoading, error } = useQuery({
    queryKey: uagAgentProfileQueryKey(mode, userId),
    queryFn: async (): Promise<AgentProfile | null> => {
      // Mock 模式：直接回傳 mock 資料
      if (isDemoMode) {
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
    enabled: isDemoMode || !!userId,
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
