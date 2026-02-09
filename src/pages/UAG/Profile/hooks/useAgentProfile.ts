import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { notify } from '../../../../lib/notify';
import type { AgentProfileMe, UpdateAgentProfilePayload } from '../../../../types/agent.types';
import {
  fetchAgentMe,
  updateAgentProfile,
  uploadAgentAvatar,
} from '../../../../services/agentService';

const getAgentProfileQueryKey = (isMockMode: boolean) =>
  ['agent-profile-me', isMockMode ? 'mock' : 'live'] as const;

// #7 Mock 資料
const MOCK_PROFILE: AgentProfileMe = {
  id: 'mock-agent-001',
  internalCode: 88001,
  name: '游杰倫',
  avatarUrl: null,
  company: '邁房子',
  bio: '專注於大台北地區房地產買賣，擅長捷運宅與學區房。',
  specialties: ['捷運宅', '學區房', '首購族諮詢'],
  certifications: ['不動產經紀人', '地政士'],
  phone: '0912345678',
  lineId: 'maihouses_demo',
  licenseNumber: '(113)北市經紀字第004521號',
  isVerified: true,
  verifiedAt: '2024-06-15T00:00:00Z',
  trustScore: 87,
  encouragementCount: 23,
  serviceRating: 4.8,
  reviewCount: 32,
  completedCases: 45,
  activeListings: 12,
  serviceYears: 4,
  joinedAt: '2021-02-01',
  visitCount: 156,
  dealCount: 45,
  email: null,
  points: 1200,
  quotaS: 5,
  quotaA: 10,
  createdAt: '2021-02-01T00:00:00Z',
};

export function useAgentProfile() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const isMockMode = searchParams.get('mock') === 'true';
  const profileQueryKey = getAgentProfileQueryKey(isMockMode);

  const { data, isLoading, error } = useQuery({
    queryKey: profileQueryKey,
    queryFn: async () => {
      // #7 Mock 模式：直接回傳假資料
      if (isMockMode) {
        return MOCK_PROFILE;
      }
      return fetchAgentMe();
    },
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
      // #7 Mock 模式：提示這是模擬
      if (isMockMode) {
        notify.success('已更新個人資料（Mock 模式）', '這是模擬更新，實際資料未儲存');
        // #7: Mock 模式更新本地快取，讓 UI 立即反映編輯結果
        queryClient.setQueryData<AgentProfileMe | undefined>(profileQueryKey, (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            ...(payload.name !== undefined ? { name: payload.name } : {}),
            ...(payload.bio !== undefined ? { bio: payload.bio } : {}),
            ...(payload.specialties !== undefined ? { specialties: payload.specialties } : {}),
            ...(payload.certifications !== undefined
              ? { certifications: payload.certifications }
              : {}),
            ...(payload.phone !== undefined ? { phone: payload.phone } : {}),
            ...(payload.lineId !== undefined ? { lineId: payload.lineId } : {}),
            ...(payload.licenseNumber !== undefined
              ? { licenseNumber: payload.licenseNumber }
              : {}),
            ...(payload.joinedAt !== undefined ? { joinedAt: payload.joinedAt } : {}),
          };
        });
      } else {
        notify.success('已更新個人資料');
        queryClient.invalidateQueries({ queryKey: profileQueryKey });
      }
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : '更新失敗';
      notify.error('更新失敗', message);
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
      // #7 Mock 模式：提示這是模擬
      if (isMockMode) {
        notify.success('頭像已更新（Mock 模式）', '這是本地預覽，實際未上傳');
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
