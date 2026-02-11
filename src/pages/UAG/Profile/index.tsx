import React, { useState } from 'react';
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);

  // 返回 UAG：保留 mock 參數，且使用 router 內部路徑避免 basename 重複。
  const handleBackToUAG = () => {
    const targetUrl = isMockMode ? '/uag?mock=true' : '/uag';
    navigate(targetUrl);
  };

  const { profile, isLoading, error, updateProfile, isUpdating, uploadAvatar, isUploadingAvatar } =
    useAgentProfile();

  const handleFormStateChange = (state: { hasUnsavedChanges: boolean; isSubmitDisabled: boolean }) => {
    setHasUnsavedChanges(state.hasUnsavedChanges);
    setIsSubmitDisabled(state.isSubmitDisabled);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-5xl p-6">
          <div className="h-6 w-40 animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
          <div className="mt-6 grid gap-6 lg:grid-cols-[280px,1fr]">
            <div className="h-40 animate-pulse rounded-2xl bg-white/60 motion-reduce:animate-none sm:h-64" />
            <div className="h-64 animate-pulse rounded-2xl bg-white/60 motion-reduce:animate-none sm:h-96" />
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
            className="mb-4 inline-flex min-h-[44px] min-w-[44px] items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
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
    <div className="min-h-screen bg-bg-base pb-[80px] text-slate-900 lg:pb-0">
      <div className="mx-auto max-w-5xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <button
              onClick={handleBackToUAG}
              className="inline-flex min-h-[44px] min-w-[44px] items-center gap-2 text-xs font-medium text-slate-500 transition-colors hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 active:text-slate-900"
            >
              <ArrowLeft size={16} />
              返回 UAG
            </button>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">房仲個人資料</h1>
            <p className="text-sm text-slate-500">管理你的公開資訊與專業數據</p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[280px,1fr]">
          {/* Desktop: 卡片版,手機: compact 版 */}
          <div className="space-y-6">
            <div className="hidden lg:block">
              <AvatarUploader
                name={profile.name}
                avatarUrl={profile.avatarUrl}
                isUploading={isUploadingAvatar}
                onUpload={uploadAvatar}
                variant="card"
              />
            </div>
            <div className="lg:hidden">
              <AvatarUploader
                name={profile.name}
                avatarUrl={profile.avatarUrl}
                isUploading={isUploadingAvatar}
                onUpload={uploadAvatar}
                variant="compact"
              />
            </div>
            <div className="hidden lg:block">
              <MetricsDisplay profile={profile} variant="default" />
            </div>
            <div className="lg:hidden">
              <MetricsDisplay profile={profile} variant="compact" />
            </div>
          </div>

          <BasicInfoSection
            profile={profile}
            isSaving={isUpdating}
            onSave={updateProfile}
            formId="profile-form"
            onFormStateChange={handleFormStateChange}
          />
        </div>
      </div>

      {/* Sticky Save Bar (手機版) */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white px-4 py-3 shadow-lg lg:hidden">
        <button
          type="submit"
          form="profile-form"
          className="min-h-[44px] w-full rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={isSubmitDisabled}
        >
          {isUpdating ? '儲存中...' : hasUnsavedChanges ? '儲存變更' : '尚未修改'}
        </button>
      </div>
    </div>
  );
}
