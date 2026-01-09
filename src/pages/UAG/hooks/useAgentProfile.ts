import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import type { AgentProfile } from "../types/uag.types";

interface UseAgentProfileResult {
  profile: AgentProfile | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * 查詢房仲個人資料（用於 UAG Header 房仲資訊條）
 * 從 agents 表查詢：信任分、帶看數、成交數等
 */
export function useAgentProfile(
  userId: string | undefined,
): UseAgentProfileResult {
  const { data, isLoading, error } = useQuery({
    queryKey: ["agentProfile", userId],
    queryFn: async (): Promise<AgentProfile | null> => {
      if (!userId) return null;

      const { data: agent, error: queryError } = await supabase
        .from("agents")
        .select(
          "id, internal_code, name, avatar_url, company, trust_score, encouragement_count, visit_count, deal_count",
        )
        .eq("id", userId)
        .single();

      if (queryError) {
        // 如果找不到記錄，回傳 null 而不是拋錯誤
        if (queryError.code === "PGRST116") {
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
        company: agent.company ?? "邁房子",
        trustScore: agent.trust_score ?? 80,
        encouragementCount: agent.encouragement_count ?? 0,
        visitCount: agent.visit_count ?? 0,
        dealCount: agent.deal_count ?? 0,
      };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 分鐘快取
    retry: 1,
  });

  return {
    profile: data ?? null,
    isLoading,
    error: error as Error | null,
  };
}
