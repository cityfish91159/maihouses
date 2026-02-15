import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notify } from '../../../../lib/notify';
import { useAuth } from '../../../../hooks/useAuth';
import { usePageMode, type PageMode } from '../../../../hooks/usePageMode';
import type { AgentProfileMe, UpdateAgentProfilePayload } from '../../../../types/agent.types';
import { uagAgentProfileQueryKey } from '../../hooks/queryKeys';
import {
  fetchAgentMe,
  updateAgentProfile,
  uploadAgentAvatar,
} from '../../../../services/agentService';
import { UAG_PROFILE_MOCK_DATA } from './mockProfile';

export function useAgentProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const mode: PageMode = usePageMode();
  const isMockMode = mode === 'demo';
  const profileQueryKey = uagAgentProfileQueryKey(mode, user?.id);

  const { data, isLoading, error } = useQuery({
    queryKey: profileQueryKey,
    queryFn: async () => {
      // #7 Mock 模式：直接回傳假資料
      if (isMockMode) {
        return UAG_PROFILE_MOCK_DATA;
      }
      return fetchAgentMe();
    },
    enabled: isMockMode || (mode === 'live' && Boolean(user?.id)),
    staleTime: 5 * 60 * 1000,
    retry: isMockMode ? 0 : 1, // Mock 模式不重試
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: UpdateAgentProfilePayload) => {
      // #7 Mock 模式：模擬更新
      if (isMockMode) {
        await new Promise((resolve) => setTimeout(resolve, 500)); // 模擬網路延遲
        return;
      }
      return updateAgentProfile(payload);
    },
    onSuccess: (_, payload) => {
      const mockDetail = 'Mock 模式：資料未實際儲存';

      if (isMockMode) {
        notify.success('個人資料已儲存', mockDetail);
        // #7: Mock 模式更新本地快取，讓 UI 立即反映編輯結果
        queryClient.setQueryData<AgentProfileMe | undefined>(profileQueryKey, (prev) => {
          if (!prev) return prev;
          const updates: Partial<AgentProfileMe> = {};

          if (payload.name !== undefined) updates.name = payload.name;
          if (payload.company !== undefined) updates.company = payload.company;
          if (payload.bio !== undefined) updates.bio = payload.bio;
          if (payload.specialties !== undefined) updates.specialties = payload.specialties;
          if (payload.certifications !== undefined) updates.certifications = payload.certifications;
          if (payload.phone !== undefined) updates.phone = payload.phone;
          if (payload.lineId !== undefined) updates.lineId = payload.lineId;
          if (payload.licenseNumber !== undefined) updates.licenseNumber = payload.licenseNumber;
          if (payload.joinedAt !== undefined) updates.joinedAt = payload.joinedAt;

          return { ...prev, ...updates };
        });
      } else {
        notify.success('個人資料已儲存');
        queryClient.invalidateQueries({ queryKey: profileQueryKey });
      }
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : '未知錯誤';
      notify.error('儲存失敗', message);
    },
  });

  const avatarMutation = useMutation({
    mutationFn: async (file: File) => {
      // #7 Mock 模式：模擬上傳
      if (isMockMode) {
        await new Promise((resolve) => setTimeout(resolve, 800)); // 模擬上傳延遲
        // P0-5 FIX: 先釋放舊的 URL，避免記憶體洩漏
        const oldProfile = queryClient.getQueryData<AgentProfileMe>(profileQueryKey);
        if (oldProfile?.avatarUrl && oldProfile.avatarUrl.startsWith('blob:')) {
          URL.revokeObjectURL(oldProfile.avatarUrl);
        }
        return URL.createObjectURL(file); // 使用本地預覽 URL
      }
      return uploadAgentAvatar(file);
    },
    onSuccess: (url) => {
      if (isMockMode) {
        notify.success('頭像已更新', 'Mock 模式：這是本地預覽，實際未上傳');
      } else {
        notify.success('頭像已更新');
      }
      queryClient.setQueryData<AgentProfileMe | undefined>(profileQueryKey, (prev) =>
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
