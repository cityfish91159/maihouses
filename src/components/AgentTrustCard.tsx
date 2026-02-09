import React, { useState, useMemo, memo, useId, type CSSProperties } from 'react';
import {
  Shield,
  ThumbsUp,
  Star,
  MessageCircle,
  Phone,
  Clock,
  UserCircle,
} from 'lucide-react';
import { Agent } from '../lib/types';
import { useQuery } from '@tanstack/react-query';
import { fetchAgentProfile } from '../services/agentService';
import { LINE_BRAND_GREEN, LINE_BRAND_GREEN_HOVER } from './PropertyDetail/constants';

interface AgentTrustCardProps {
  agent: Agent;
  isDemo?: boolean;
  onLineClick?: () => void;
  onCallClick?: () => void;
  onReviewClick?: () => void;
}

export const AgentTrustCard: React.FC<AgentTrustCardProps> = memo(function AgentTrustCard({
  agent,
  isDemo = false,
  onLineClick,
  onCallClick,
  onReviewClick,
}) {
  const [showTrustTooltip, setShowTrustTooltip] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const trustTooltipId = useId();

  const isTestEnv = import.meta.env.MODE === 'test' || import.meta.env.VITEST;
  const shouldFetchProfile = Boolean(agent.id) && !isDemo && !isTestEnv;

  const { data: profile } = useQuery({
    queryKey: ['agent-profile', agent.id],
    queryFn: () => fetchAgentProfile(agent.id),
    enabled: shouldFetchProfile,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // MVP: 後續改接 profile.isOnline API (#16)
  // 設計決策：MVP 階段使用模擬值，後端 API 完成後可替換為 profile.isOnline
  const isOnline = useMemo(() => {
    return agent.internalCode % 10 > 3; // 約 70% 機率在線，對同一 agent 結果穩定
  }, [agent.internalCode]);
  const trustScore = profile?.trustScore ?? agent.trustScore;
  const encouragementCount = profile?.encouragementCount ?? agent.encouragementCount;
  const displayName = profile?.name ?? agent.name;
  const rawAvatar = profile?.avatarUrl ?? agent.avatarUrl;
  const displayCompany = profile?.company ?? agent.company ?? '邁房子';
  const licenseNumber = isDemo ? null : (profile?.licenseNumber ?? agent.licenseNumber ?? null);
  const isVerified = isDemo ? true : (profile?.isVerified ?? agent.isVerified ?? false);
  const platformCode = `MH-${String(agent.internalCode).padStart(5, '0')}`;

  const lineBrandVars = {
    '--line-brand-green': LINE_BRAND_GREEN,
    '--line-brand-green-hover': LINE_BRAND_GREEN_HOVER,
  } as CSSProperties;

  const agentMetrics = useMemo(() => {
    if (isDemo) {
      return {
        responseTime: isOnline ? '5 分鐘' : '2 小時',
        serviceRating: 4.8,
        reviewCount: 32,
        completedCases: 45,
        serviceYears: 4,
      };
    }

    return {
      responseTime: isOnline ? '5 分鐘' : '2 小時',
      serviceRating: profile?.serviceRating ?? agent.serviceRating ?? 0,
      reviewCount: profile?.reviewCount ?? agent.reviewCount ?? 0,
      completedCases: profile?.completedCases ?? agent.completedCases ?? 0,
      serviceYears: profile?.serviceYears ?? agent.serviceYears ?? 0,
    };
  }, [
    isDemo,
    isOnline,
    profile?.serviceRating,
    profile?.reviewCount,
    profile?.completedCases,
    profile?.serviceYears,
    agent.serviceRating,
    agent.reviewCount,
    agent.completedCases,
    agent.serviceYears,
  ]);

  return (
    <div style={lineBrandVars} className="rounded-xl border border-border bg-bg-card p-4 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="relative">
          {/* #19 avatar fallback 改用 Lucide UserCircle */}
          {rawAvatar && !avatarError ? (
            <img
              src={rawAvatar}
              alt={displayName}
              className="size-16 rounded-full border-2 border-white object-cover shadow-md"
              onError={() => setAvatarError(true)}
            />
          ) : (
            <UserCircle className="size-16 text-text-muted" strokeWidth={1} />
          )}
          {/* 在線狀態指示器 */}
          <div
            className={`absolute -bottom-1 -right-1 ${isOnline ? 'bg-green-500' : 'bg-text-muted'} flex items-center gap-0.5 rounded-full border border-white px-1.5 py-0.5 text-xs text-white`}
          >
            <div
              className={`size-1.5 rounded-full ${isOnline ? 'animate-pulse bg-white motion-reduce:animate-none' : 'bg-neutral-200'}`}
            />
            <span>{isOnline ? '在線' : '離線'}</span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-bold text-ink-900">
                {displayName}
                <span className="rounded-full bg-bg-base px-2 py-0.5 text-xs font-normal text-text-muted">
                  {displayCompany}
                </span>
              </h3>
              <div className="mt-0.5 flex items-center gap-2">
                {licenseNumber ? (
                  <p className="text-xs text-text-muted">經紀人證照：{licenseNumber}</p>
                ) : (
                  <p className="text-xs text-text-muted">平台編號：{platformCode}</p>
                )}
                {isVerified ? (
                  <div className="flex items-center gap-0.5 rounded bg-green-50 px-1.5 py-0.5 text-xs text-green-600">
                    <Shield size={10} />
                    <span>已認證</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-0.5 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-text-muted">
                    <span>未認證</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-4">
            {/* 信任分 - 加入 Tooltip */}
            <div
              className="relative flex cursor-pointer items-center gap-1.5"
              role="button"
              tabIndex={0}
              aria-expanded={showTrustTooltip}
              aria-describedby={showTrustTooltip ? trustTooltipId : undefined}
              aria-label={`信任分數 ${trustScore}，顯示計算說明`}
              onMouseEnter={() => setShowTrustTooltip(true)}
              onMouseLeave={() => setShowTrustTooltip(false)}
              onFocus={() => setShowTrustTooltip(true)}
              onBlur={() => setShowTrustTooltip(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setShowTrustTooltip((prev) => !prev);
                }
                if (e.key === 'Escape') {
                  setShowTrustTooltip(false);
                }
              }}
            >
              <div className="flex size-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <Star size={16} fill="currentColor" />
              </div>
              <div>
                <div className="text-sm font-bold text-brand-700">{trustScore}</div>
                <div className="text-xs text-text-muted">信任分</div>
              </div>

              {/* Trust Score Tooltip */}
              {showTrustTooltip && (
                <div
                  id={trustTooltipId}
                  role="tooltip"
                  className="absolute bottom-full left-0 z-10 mb-2 w-52 rounded-lg bg-slate-800 p-3 text-xs text-white shadow-xl"
                >
                  <div className="mb-1 font-bold">
                    信任分數 <span className="text-green-400">{trustScore}</span> / 100
                  </div>
                  <p className="mb-2 text-slate-300">綜合以下指標自動計算：</p>
                  <ul className="space-y-1 text-slate-300">
                    <li className="flex items-center gap-1.5">
                      <Shield size={10} className="shrink-0 text-green-400" />
                      平台實名認證
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Star size={10} className="shrink-0 text-green-400" />
                      歷史服務評價
                    </li>
                    <li className="flex items-center gap-1.5">
                      <ThumbsUp size={10} className="shrink-0 text-green-400" />
                      成交記錄與客戶回饋
                    </li>
                  </ul>
                  <p className="mt-2 border-t border-slate-600 pt-2 text-[10px] text-slate-400">
                    每次資料更新後重新計算
                  </p>
                  {/* Tooltip Arrow */}
                  <div className="absolute left-4 top-full border-8 border-transparent border-t-slate-800" />
                </div>
              )}
            </div>

            <div className="h-8 w-px bg-border"></div>

            <div className="flex items-center gap-1.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
                <ThumbsUp size={16} />
              </div>
              <div>
                <div className="text-sm font-bold text-ink-900">{encouragementCount}</div>
                <div className="text-xs text-text-muted">獲得鼓勵</div>
              </div>
            </div>
          </div>

          {/* 在線狀態提示 */}
          {isOnline && (
            <div className="mt-3 inline-flex items-center gap-1 rounded-lg bg-green-50 px-2 py-1 text-xs text-green-600">
              <Clock size={12} />
              平均 {agentMetrics.responseTime} 內回覆
            </div>
          )}
        </div>
      </div>

      {/* 經紀人績效指標 */}
      <div className="mt-4 grid grid-cols-3 gap-2 border-y border-border py-3">
        <button
          type="button"
          onClick={onReviewClick}
          className="cursor-pointer rounded-lg p-1 text-center transition-colors hover:bg-bg-base focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          aria-label={`查看 ${agentMetrics.reviewCount} 則服務評價`}
        >
          <div className="text-lg font-bold text-brand-700">
            {agentMetrics.serviceRating.toFixed(1)}
          </div>
          <div className="text-xs text-text-muted">服務評價</div>
          <div className="text-xs text-brand-600 underline decoration-dotted underline-offset-2">
            ({agentMetrics.reviewCount})
          </div>
        </button>
        <div className="border-x border-border text-center">
          <div className="text-lg font-bold text-ink-900">{agentMetrics.completedCases}</div>
          <div className="text-xs text-text-muted">完成案件</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-ink-900">{agentMetrics.serviceYears}年</div>
          <div className="text-xs text-text-muted">服務年資</div>
        </div>
      </div>

      {/* CTA 按鈕區 - 雙按鈕布局（#2 UX 重構） */}
      <div className="mt-4 space-y-3 border-t border-border pt-3">
        {/* 主要 CTA：加 LINE（低門檻）- LINE 官方品牌色 */}
        <button
          type="button"
          onClick={onLineClick}
          aria-label="加 LINE 聊聊"
          data-testid="agent-card-line-button"
          className="flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--line-brand-green)] py-2.5 text-sm font-bold tracking-wide text-white shadow-lg shadow-green-500/20 transition-all duration-200 hover:bg-[var(--line-brand-green-hover)] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
        >
          <MessageCircle size={18} />加 LINE 聊聊
        </button>

        {/* 次要 CTA：致電諮詢（outline 樣式） */}
        <button
          type="button"
          onClick={onCallClick}
          aria-label="致電諮詢"
          data-testid="agent-card-call-button"
          className="flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-brand-700 bg-bg-card py-2.5 text-sm font-medium tracking-wide text-brand-700 shadow-sm shadow-blue-900/10 transition-all duration-200 hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
        >
          <Phone size={18} />
          致電諮詢
        </button>
      </div>
    </div>
  );
});
