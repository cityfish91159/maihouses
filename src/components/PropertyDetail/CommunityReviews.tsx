import { memo, useEffect, useRef, useState } from 'react';
import { Star, Lock, ChevronRight } from 'lucide-react';

interface CommunityReviewsProps {
  isLoggedIn: boolean;
}

/**
 * 社區評價組件 (延遲渲染版本)
 *
 * 功能:
 * - 使用 Intersection Observer 延遲渲染
 * - 前兩則評價公開顯示
 * - 第三則評價需登入才能查看 (模糊處理)
 * - 社區牆入口引導
 *
 * @remarks
 * 使用 React.memo 優化
 * 使用 Intersection Observer 實現延遲渲染,提升首屏效能
 */
export const CommunityReviews = memo(function CommunityReviews({
  isLoggedIn,
}: CommunityReviewsProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // 只需觸發一次
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      {isVisible ? (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Star size={18} className="text-yellow-500" fill="currentColor" />
              社區評價
            </h3>
            <span className="rounded-full bg-slate-50 px-2 py-1 text-xs text-slate-500">
              88 位住戶加入
            </span>
          </div>

          {/* 前兩則評價（公開顯示） */}
          <div className="space-y-3">
            <div className="flex gap-3 rounded-xl bg-slate-50 p-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#003366] text-lg font-bold text-white">
                J
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-800">J***</span>
                  <span className="text-xs text-slate-500">B棟住戶</span>
                  <span className="text-xs text-yellow-500">★★★★★</span>
                </div>
                <p className="text-sm leading-relaxed text-slate-600">
                  公設維護得乾淨，假日草皮有人整理。之前反映停車動線，管委會一週內就公告改善。
                </p>
              </div>
            </div>

            <div className="flex gap-3 rounded-xl bg-slate-50 p-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#00A8E8] text-lg font-bold text-white">
                W
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-800">W***</span>
                  <span className="text-xs text-slate-500">12F住戶</span>
                  <span className="text-xs text-yellow-500">★★★★☆</span>
                </div>
                <p className="text-sm leading-relaxed text-slate-600">
                  住起來整體舒服，但面向上路的低樓層在上下班尖峰車聲明顯，喜靜的買家可考慮中高樓層。
                </p>
              </div>
            </div>
          </div>

          {/* 第三則（未登入時模糊隱藏，登入後正常顯示） */}
          <div className="relative mt-3 overflow-hidden rounded-xl">
            <div
              className={`flex gap-3 bg-slate-50 p-3 ${!isLoggedIn ? 'select-none blur-sm' : ''}`}
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-green-500 text-lg font-bold text-white">
                L
              </div>
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-800">L***</span>
                  <span className="text-xs text-slate-500">C棟住戶</span>
                  {isLoggedIn && <span className="text-xs text-yellow-500">★★★★★</span>}
                </div>
                <p className="text-sm text-slate-600">
                  {isLoggedIn
                    ? '頂樓排水設計不錯，颱風天也沒有積水問題。管委會有固定請人清理排水孔，很放心。'
                    : '頂樓排水設計不錯，颱風天也沒有積水問題...'}
                </p>
              </div>
            </div>

            {/* 遮罩層 - 已登入則直接看到，未登入顯示註冊按鈕 */}
            {!isLoggedIn && (
              <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-b from-transparent via-white/80 to-white pb-3">
                <button
                  onClick={() => {
                    window.location.href = '/auth.html?redirect=community';
                  }}
                  className="flex items-center gap-2 rounded-full bg-[#003366] px-4 py-2 text-sm font-bold text-white shadow-lg transition-colors hover:bg-[#004488]"
                >
                  <Lock size={14} />
                  註冊查看全部 6 則評價
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>

          {/* 社區牆入口提示 */}
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
            <p className="text-xs text-slate-500">💬 加入社區牆，與現任住戶交流</p>
            <button
              onClick={() => (window.location.href = '/maihouses/community-wall_mvp.html')}
              className="flex items-center gap-1 text-xs font-bold text-[#003366] hover:underline"
            >
              前往社區牆
              <ChevronRight size={12} />
            </button>
          </div>
        </>
      ) : (
        <div className="h-96 animate-pulse rounded-xl bg-gray-100"></div>
      )}
    </div>
  );
});
