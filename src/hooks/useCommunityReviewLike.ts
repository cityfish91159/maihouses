import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { ReviewLikeResponse } from '../types/community-review-like';

export function useCommunityReviewLike() {
  const queryClient = useQueryClient();

  const toggleLike = useMutation({
    mutationFn: async (propertyId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('Unauthorized');
      }

      const res = await fetch('/api/community/review-like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ propertyId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to toggle like');
      }

      return res.json() as Promise<ReviewLikeResponse>;
    },
    onSuccess: (data, propertyId) => {
      // 1. 刷新 agent-profile 讓 AgentTrustCard 的 encouragement_count 更新
      queryClient.invalidateQueries({ queryKey: ['agent-profile'] });
      
      // 2. 也可以選擇性刷新 property-reviews 或手動更新 cache
      // 這裡簡單起見，依賴父層的 optimistic update 或 refetch
    },
  });

  return { toggleLike };
}
