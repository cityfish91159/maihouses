import React, { useCallback, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { ROUTES, RouteUtils } from '../../../constants/routes';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { usePageMode } from '../../../hooks/usePageMode';
import { AvatarUploader } from './AvatarUploader';
import { MetricsDisplay } from './MetricsDisplay';
import { BasicInfoSection } from './BasicInfoSection';
import { useAgentProfile } from './hooks/useAgentProfile';

interface FormStateInfo {
  hasUnsavedChanges: boolean;
  isSubmitDisabled: boolean;
}

interface SectionErrorFallbackProps extends Pick<FallbackProps, 'resetErrorBoundary'> {
  title: string;
  description: string;
}

const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)';
const PROFILE_STICKY_SAVE_BAR_HEIGHT_PX = 80;
type ProfileLayoutStyle = CSSProperties & {
  '--page-uag-profile-sticky-save-bar-height': string;
};
const PROFILE_LAYOUT_STYLE: ProfileLayoutStyle = {
  '--page-uag-profile-sticky-save-bar-height': `${PROFILE_STICKY_SAVE_BAR_HEIGHT_PX}px`,
};

const SectionErrorFallback: React.FC<SectionErrorFallbackProps> = ({
  title,
  description,
  resetErrorBoundary,
}) => (
  <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
    <p className="font-semibold">{title}</p>
    <p className="mt-1">{description}</p>
    <button
      type="button"
      onClick={resetErrorBoundary}
      className="mt-3 inline-flex min-h-[44px] items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
    >
      重試
    </button>
  </div>
);

export default function UAGProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const mode = usePageMode();
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY, true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
  const uagRoute = RouteUtils.toNavigatePath(ROUTES.UAG);

  useEffect(() => {
    // TODO(#28): 觀察一段時間後移除 legacy mock query 相容清洗
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('mock') !== 'true') return;

    navigate(
      {
        pathname: location.pathname,
        search: '',
      },
      { replace: true }
    );
  }, [location.pathname, location.search, navigate]);

  const handleBackToUAG = useCallback(() => {
    navigate(uagRoute, { replace: mode === 'visitor' });
  }, [mode, navigate, uagRoute]);

  const { profile, isLoading, error, updateProfile, isUpdating, uploadAvatar, isUploadingAvatar } =
    useAgentProfile();

  const handleFormStateChange = useCallback((state: FormStateInfo) => {
    setHasUnsavedChanges(state.hasUnsavedChanges);
    setIsSubmitDisabled(state.isSubmitDisabled);
  }, []);

  if (isLoading) {
    return (
      <div
        className="min-h-screen bg-bg-base"
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label="個人資料載入中"
      >
        <span className="sr-only">個人資料載入中</span>
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
      <div className="min-h-screen bg-bg-base">
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

  const avatarVariant = isDesktop ? 'card' : 'compact';
  const metricsVariant = isDesktop ? 'card' : 'compact';

  return (
    <div
      style={PROFILE_LAYOUT_STYLE}
      className="min-h-screen bg-bg-base pb-[calc(var(--page-uag-profile-sticky-save-bar-height)+env(safe-area-inset-bottom))] text-slate-900 lg:pb-0"
    >
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
          <div className="space-y-6">
            <ErrorBoundary
              resetKeys={[profile.id, avatarVariant]}
              fallbackRender={({ resetErrorBoundary }) => (
                <SectionErrorFallback
                  title="頭像模組載入失敗"
                  description="請點擊重試按鈕，或重新整理頁面後再試一次。"
                  resetErrorBoundary={resetErrorBoundary}
                />
              )}
            >
              <AvatarUploader
                name={profile.name}
                avatarUrl={profile.avatarUrl}
                isUploading={isUploadingAvatar}
                onUpload={uploadAvatar}
                variant={avatarVariant}
              />
            </ErrorBoundary>

            <ErrorBoundary
              resetKeys={[profile.id, metricsVariant]}
              fallbackRender={({ resetErrorBoundary }) => (
                <SectionErrorFallback
                  title="指標模組載入失敗"
                  description="請點擊重試按鈕，或重新整理頁面後再試一次。"
                  resetErrorBoundary={resetErrorBoundary}
                />
              )}
            >
              <MetricsDisplay profile={profile} variant={metricsVariant} />
            </ErrorBoundary>
          </div>

          <ErrorBoundary
            resetKeys={[profile.id]}
            fallbackRender={({ resetErrorBoundary }) => (
              <SectionErrorFallback
                title="表單模組載入失敗"
                description="請點擊重試按鈕，或重新整理頁面後再試一次。"
                resetErrorBoundary={resetErrorBoundary}
              />
            )}
          >
            <BasicInfoSection
              profile={profile}
              isSaving={isUpdating}
              onSave={updateProfile}
              formId="profile-form"
              onFormStateChange={handleFormStateChange}
              storageKeyPrefix="uag-profile"
            />
          </ErrorBoundary>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 min-h-[var(--page-uag-profile-sticky-save-bar-height)] border-t border-slate-200 bg-white px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 shadow-lg lg:hidden">
        <button
          type="submit"
          form="profile-form"
          className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={isSubmitDisabled}
        >
          {isUpdating ? (
            <>
              <Loader2 size={16} className="animate-spin motion-reduce:animate-none" />
              儲存中...
            </>
          ) : hasUnsavedChanges ? (
            '儲存變更'
          ) : (
            '尚未修改'
          )}
        </button>
      </div>
    </div>
  );
}
