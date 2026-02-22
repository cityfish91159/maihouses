/**
 * useUserCommunity
 *
 * 取得「已登入使用者」的主要社區歸屬，供 Header 導航分流使用。
 */
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

const USER_COMMUNITY_QUERY_STALE_TIME_MS = 5 * 60 * 1000;
const USER_COMMUNITY_API_ENDPOINT = '/api/community/my';

const UserCommunityDataSchema = z.object({
  communityId: z.string().uuid(),
});

const UserCommunityApiResponseSchema = z.object({
  success: z.literal(true),
  data: z.union([UserCommunityDataSchema, z.null()]),
});

interface UseUserCommunityOptions {
  isAuthenticated: boolean;
  userId?: string | null;
  enabled?: boolean;
}

export const userCommunityQueryKey = (userId?: string | null) =>
  ['community', 'my', userId ?? 'anonymous'] as const;

async function fetchUserCommunity(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const accessToken = session?.access_token;
  if (!accessToken) {
    return null;
  }

  const response = await fetch(USER_COMMUNITY_API_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`社區歸屬載入失敗 (HTTP ${response.status})`);
  }

  const payload: unknown = await response.json();
  const parsed = UserCommunityApiResponseSchema.safeParse(payload);

  if (!parsed.success) {
    logger.error('[useUserCommunity] API 回應格式驗證失敗', {
      error: parsed.error.message,
    });
    throw new Error('社區歸屬資料格式錯誤');
  }

  return parsed.data.data?.communityId ?? null;
}

export function useUserCommunity({
  isAuthenticated,
  userId,
  enabled = true,
}: UseUserCommunityOptions) {
  const query = useQuery({
    queryKey: userCommunityQueryKey(userId),
    queryFn: fetchUserCommunity,
    enabled: enabled && isAuthenticated && Boolean(userId),
    staleTime: USER_COMMUNITY_QUERY_STALE_TIME_MS,
  });

  return {
    communityId: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

