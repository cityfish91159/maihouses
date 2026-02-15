import { ArrowLeft, Hash, Home } from 'lucide-react';
import { usePageMode } from '../../hooks/usePageMode';

interface PropertyDetailHeaderProps {
  propertyPublicId: string;
  mockTrustEnabled: boolean | null;
  onToggleMockTrustEnabled: () => void;
  onBack?: () => void;
}

export function PropertyDetailHeader({
  propertyPublicId,
  mockTrustEnabled,
  onToggleMockTrustEnabled,
  onBack,
}: PropertyDetailHeaderProps) {
  const isDemoMode = usePageMode() === 'demo';

  const handleBackClick = () => {
    if (onBack) {
      onBack();
      return;
    }
    window.history.back();
  };

  return (
    <>
      <nav className="sticky top-0 z-overlay flex h-16 items-center justify-between border-b border-slate-100 bg-white/90 px-4 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            aria-label="返回上一頁"
            onClick={handleBackClick}
            className="cursor-pointer rounded-full p-2 transition-colors hover:bg-slate-100"
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div className="flex items-center gap-2 text-xl font-extrabold text-brand-700">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-700 to-brand-light text-white">
              <Home size={18} />
            </div>
            邁房子
          </div>
        </div>

        <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-xs text-slate-500">
          <Hash size={12} className="mr-1 text-gray-400" />
          編號：
          <span className="ml-1 font-bold text-brand-700">{propertyPublicId}</span>
        </div>
      </nav>

      {isDemoMode && (
        <div className="mx-auto max-w-4xl px-4 pt-4">
          <div className="flex items-center gap-2 rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 p-3">
            <div className="flex-1">
              <p className="text-xs font-bold text-amber-900">開發測試模式（僅 Mock 頁面）</p>
              <p className="text-xs text-amber-700">切換安心留痕狀態查看不同 UI 效果</p>
            </div>
            <button
              onClick={onToggleMockTrustEnabled}
              className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-amber-700 active:scale-95 motion-reduce:transform-none motion-reduce:transition-none"
            >
              {mockTrustEnabled === null
                ? '啟動測試'
                : mockTrustEnabled
                  ? '狀態：已開啟'
                  : '狀態：未開啟'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
