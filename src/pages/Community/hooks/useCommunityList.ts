/**
 * useCommunityList
 *
 * 呼叫 GET /api/community/list，回傳公開社區清單。
 * #8d 社區探索頁
 */
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { logger } from '../../../lib/logger';

// ─── 型別 ────────────────────────────────────────────────────────────────────

export const CommunityListItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  address: z.string().nullable(),
  image: z.string().nullable(),
  post_count: z.number().int().nonnegative(),
  review_count: z.number().int().nonnegative(),
});

export type CommunityListItem = z.infer<typeof CommunityListItemSchema>;

const ApiResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(CommunityListItemSchema),
});

// ─── 常數 ────────────────────────────────────────────────────────────────────

const STALE_TIME_MS = 2 * 60 * 1000; // 2 分鐘
const API_ENDPOINT = '/api/community/list';

// ─── Fetcher ─────────────────────────────────────────────────────────────────

async function fetchCommunityList(): Promise<CommunityListItem[]> {
  const res = await fetch(API_ENDPOINT);

  if (!res.ok) {
    const message = `社區清單載入失敗 (HTTP ${res.status})`;
    logger.error('[useCommunityList] API 錯誤', { status: res.status });
    throw new Error(message);
  }

  const json: unknown = await res.json();
  const parsed = ApiResponseSchema.safeParse(json);

  if (!parsed.success) {
    const message = '社區清單資料格式錯誤';
    logger.error('[useCommunityList] Zod 驗證失敗', {
      error: parsed.error.message,
    });
    throw new Error(message);
  }

  return parsed.data.data;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCommunityList() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['community', 'list'],
    queryFn: fetchCommunityList,
    staleTime: STALE_TIME_MS,
  });

  return { data, isLoading, isError, refetch };
}
