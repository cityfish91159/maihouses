/** 社會證明 Hook：真實 API 數據 + demo mock 數據 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import type { PageMode } from '../../hooks/usePageMode';
import { logger } from '../../lib/logger';

const PublicStatsResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    view_count: z.number(),
    trust_cases_count: z.number(),
  }),
});

interface UseSocialProofOptions {
  publicId: string;
  mode: PageMode;
  isDemoMode: boolean;
  isTrustEnabled: boolean;
  liveViewerBaseline: number;
}

export function useSocialProof({
  publicId,
  mode,
  isDemoMode,
  isTrustEnabled,
  liveViewerBaseline,
}: UseSocialProofOptions) {
  const { data: publicStats } = useQuery({
    queryKey: ['property-public-stats', publicId],
    queryFn: async () => {
      const res = await fetch(`/api/property/public-stats?id=${encodeURIComponent(publicId)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: unknown = await res.json();
      const parsed = PublicStatsResponseSchema.safeParse(json);
      if (!parsed.success) {
        logger.error('Invalid public-stats response', { error: parsed.error.message });
        throw new Error('Invalid API response');
      }
      return parsed.data;
    },
    enabled: mode !== 'demo' && Boolean(publicId),
    staleTime: 60_000,
  });

  const socialProof = useMemo(() => {
    if (isDemoMode) {
      const seed = publicId?.charCodeAt(3) || 0;
      return {
        currentViewers: Math.floor(seed % 5) + 2,
        trustCasesCount: Math.floor(seed % 8) + 5,
        isHot: seed % 3 === 0,
      };
    }

    const realViewCount = publicStats?.data?.view_count ?? 0;
    const trustCasesCount = publicStats?.data?.trust_cases_count ?? 0;

    return {
      currentViewers: Math.max(liveViewerBaseline, realViewCount),
      trustCasesCount,
      isHot: isTrustEnabled && trustCasesCount >= 3,
    };
  }, [isDemoMode, isTrustEnabled, liveViewerBaseline, publicId, publicStats]);

  return socialProof;
}
