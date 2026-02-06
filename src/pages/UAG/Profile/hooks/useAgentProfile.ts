import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notify } from '../../../../lib/notify';
import type { AgentProfileMe, UpdateAgentProfilePayload } from '../../../../types/agent.types';
import {
  fetchAgentMe,
  updateAgentProfile,
  uploadAgentAvatar,
} from '../../../../services/agentService';

const AGENT_PROFILE_QUERY_KEY = ['agent-profile-me'] as const;

export function useAgentProfile() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: AGENT_PROFILE_QUERY_KEY,
    queryFn: fetchAgentMe,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateAgentProfilePayload) => updateAgentProfile(payload),
    onSuccess: () => {
      notify.success('已更新個人資料');
      queryClient.invalidateQueries({ queryKey: AGENT_PROFILE_QUERY_KEY });
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : '更新失敗';
      notify.error('更新失敗', message);
    },
  });

  const avatarMutation = useMutation({
    mutationFn: (file: File) => uploadAgentAvatar(file),
    onSuccess: (url) => {
      notify.success('頭像已更新');
      queryClient.setQueryData<AgentProfileMe | undefined>(AGENT_PROFILE_QUERY_KEY, (prev) =>
        prev ? { ...prev, avatarUrl: url } : prev
      );
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : '上傳失敗';
      notify.error('上傳失敗', message);
    },
  });

  return {
    profile: data ?? null,
    isLoading,
    error: error instanceof Error ? error : null,
    updateProfile: async (payload: UpdateAgentProfilePayload) => {
      await updateMutation.mutateAsync(payload);
    },
    isUpdating: updateMutation.isPending,
    uploadAvatar: async (file: File) => {
      await avatarMutation.mutateAsync(file);
    },
    isUploadingAvatar: avatarMutation.isPending,
  };
}
