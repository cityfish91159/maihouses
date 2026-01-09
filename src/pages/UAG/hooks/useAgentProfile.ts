import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { safeLocalStorage } from "../../../lib/safeStorage";
import type { AgentProfile } from "../types/uag.types";
import { MOCK_AGENT_PROFILE } from "../mockData";

interface UseAgentProfileResult {
  profile: AgentProfile | null;
  isLoading: boolean;
  error: Error | null;
}

/** 取得目前 UAG 模式（mock 或 live） */
function getUAGMode(): boolean {
  if (typeof window === "undefined") return true;
  const saved = safeLocalStorage.getItem("uag_mode");
  return saved !== "live"; // 預設 mock
}

/**
 * 查詢房仲個人資料（用於 UAG Header 房仲資訊條）
 * 從 agents 表查詢：信任分、帶看數、成交數等
 * 支援 mock 模式：與 useUAG 同步使用 localStorage 判斷
 */
export function useAgentProfile(
  userId: string | undefined,
): UseAgentProfileResult {
  const useMock = getUAGMode();

  const { data, isLoading, error } = useQuery({
    queryKey: ["agentProfile", userId, useMock],
    queryFn: async (): Promise<AgentProfile | null> => {
      // Mock 模式：直接回傳 mock 資料
      if (useMock) {
        return MOCK_AGENT_PROFILE;
      }

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
    enabled: useMock || !!userId,
    staleTime: 5 * 60 * 1000, // 5 分鐘快取
    retry: 1,
  });

  return {
    profile: data ?? null,
    isLoading,
    error: error as Error | null,
  };
}
