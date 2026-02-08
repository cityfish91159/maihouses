import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AvatarUploader } from './AvatarUploader';
import { MetricsDisplay } from './MetricsDisplay';
import { BasicInfoSection } from './BasicInfoSection';
import { useAgentProfile } from './hooks/useAgentProfile';

export default function UAGProfilePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMockMode = searchParams.get('mock') === 'true';

  // 返回 UAG：保留 mock 參數，且使用 router 內部路徑避免 basename 重複。
  const handleBackToUAG = () => {
    const targetUrl = isMockMode ? '/uag?mock=true' : '/uag';
    navigate(targetUrl);
  };

  const { profile, isLoading, error, updateProfile, isUpdating, uploadAvatar, isUploadingAvatar } =
    useAgentProfile();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-5xl p-6">
          <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
          <div className="mt-6 grid gap-6 lg:grid-cols-[280px,1fr]">
            <div className="h-40 animate-pulse rounded-2xl bg-white/60 sm:h-64" />
            <div className="h-64 animate-pulse rounded-2xl bg-white/60 sm:h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-3xl p-6">
          <button
            onClick={handleBackToUAG}
            className="mb-4 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft size={16} />
            返回 UAG
          </button>
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">無法載入個人資料</h2>
            <p className="mt-2 text-sm text-slate-500">請確認已登入，或稍後再試。</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base text-slate-900">
      <div className="mx-auto max-w-5xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <button
              onClick={handleBackToUAG}
              className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft size={14} />
              返回 UAG
            </button>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">房仲個人資料</h1>
            <p className="text-sm text-slate-500">管理你的公開資訊與專業數據</p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[280px,1fr]">
          <div className="space-y-6">
            <AvatarUploader
              name={profile.name}
              avatarUrl={profile.avatarUrl}
              isUploading={isUploadingAvatar}
              onUpload={uploadAvatar}
            />
            <MetricsDisplay profile={profile} />
          </div>

          <BasicInfoSection profile={profile} isSaving={isUpdating} onSave={updateProfile} />
        </div>
      </div>
    </div>
  );
}
