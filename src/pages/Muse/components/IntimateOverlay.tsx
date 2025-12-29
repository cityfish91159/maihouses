import { Lock } from 'lucide-react';

export interface IntimateOverlayProps {
  // 🔒 色色鎖定狀態
  isSexyBlocked: boolean;
  sexyUnlockPending: boolean;
  sexyUnlockDenied: string | null;
  onRequestSexyUnlock: () => void;

  // 🌸 高潮按鈕
  showClimaxButton: boolean;
  climaxButtonHeld: boolean;
  climaxHoldProgress: number;
  onStartClimaxHold: () => void;
  onEndClimaxHold: () => void;
}

export function IntimateOverlay({
  isSexyBlocked,
  sexyUnlockPending,
  sexyUnlockDenied,
  onRequestSexyUnlock,
  showClimaxButton,
  climaxButtonHeld,
  climaxHoldProgress,
  onStartClimaxHold,
  onEndClimaxHold
}: IntimateOverlayProps) {
  return (
    <>
      {/* 🔒 色色限制提示 */}
      {isSexyBlocked && (
        <div className="max-w-2xl mx-auto mb-3">
          <div className="bg-gradient-to-r from-pink-950/50 to-purple-950/50 border border-pink-500/30 rounded-2xl p-4 text-center">
            {sexyUnlockPending ? (
              // 等待解鎖中
              <div className="flex flex-col items-center gap-2">
                <div className="text-pink-400/80 text-sm animate-pulse">
                  ⏳ 請求已發送，等待他的決定...
                </div>
                <p className="text-pink-500/50 text-xs">
                  他會看到妳的請求
                </p>
              </div>
            ) : sexyUnlockDenied ? (
              // 被拒絕
              <div className="flex flex-col items-center gap-2">
                <div className="text-red-400/80 text-sm">
                  ❌ {sexyUnlockDenied}
                </div>
                <p className="text-red-500/50 text-xs">
                  認真上課，等下課再說
                </p>
              </div>
            ) : (
              // 顯示限制提示和解鎖按鈕
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 text-pink-400/80 text-sm">
                  <Lock size={16} />
                  <span>偵測到色色內容 (8:00-17:00 需要解鎖)</span>
                </div>
                <button
                  type="button"
                  onClick={onRequestSexyUnlock}
                  className="px-6 py-2 bg-gradient-to-r from-pink-600/50 to-purple-600/50 rounded-full text-pink-200 text-sm font-medium hover:from-pink-600/70 hover:to-purple-600/70 transition-all hover:scale-105 border border-pink-500/30"
                >
                  💕 但我真的很想聊...
                </button>
                <p className="text-pink-500/40 text-[10px]">
                  點擊後他會收到通知，可以決定要不要讓妳聊
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🌸 高潮按鈕 */}
      {showClimaxButton && (
        <div className="mb-12">
          <button
            type="button"
            onTouchStart={onStartClimaxHold}
            onTouchEnd={onEndClimaxHold}
            onMouseDown={onStartClimaxHold}
            onMouseUp={onEndClimaxHold}
            onMouseLeave={onEndClimaxHold}
            className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all ${
              climaxButtonHeld
                ? 'bg-pink-600/40 border-2 border-pink-400 scale-110'
                : 'bg-pink-900/20 border-2 border-pink-500/30'
            }`}
          >
            {/* 進度環 */}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="44"
                fill="none"
                stroke="rgba(236, 72, 153, 0.3)"
                strokeWidth="4"
              />
              <circle
                cx="48"
                cy="48"
                r="44"
                fill="none"
                stroke="#ec4899"
                strokeWidth="4"
                strokeDasharray={`${(climaxHoldProgress / 100) * 276} 276`}
                className="transition-all duration-100"
              />
            </svg>
            <span className="text-pink-300/80 text-xs text-center leading-tight">
              {climaxButtonHeld ? '再按住...' : '我快到了'}
            </span>
          </button>
          <div className="text-pink-500/40 text-[10px] text-center mt-2">
            長按請求
          </div>
        </div>
      )}
    </>
  );
}
