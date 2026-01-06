/**
 * PrivateWallLocked Component
 * 
 * 私密牆鎖定畫面 (Teaser UI)
 * 運用模糊背景與引導卡片提升轉化率
 */

import { memo } from 'react';
import { Lock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { notify } from '../../lib/notify';
import { STRINGS } from '../../constants/strings';

import { ROUTES } from '../../constants/routes';

const PrivateWallLocked = memo(function PrivateWallLocked() {
    const { isAuthenticated } = useAuth();

    const handleAction = () => {
        if (!isAuthenticated) {
            // P7-Audit-C12: Notify first, then redirect
            notify.info(STRINGS.COMMUNITY.NOTIFY_LOGIN_TITLE, STRINGS.COMMUNITY.NOTIFY_LOGIN_DESC);
            window.location.href = ROUTES.AUTH;
        } else {
            // 已登入但無權限 (需驗證)
            notify.info(STRINGS.COMMUNITY.NOTIFY_VERIFY_REQUIRED, STRINGS.COMMUNITY.NOTIFY_VERIFY_REQUIRED_DESC);
        }
    };

    return (
        <div
            className="relative min-h-[400px] overflow-hidden rounded-xl border border-gray-100 bg-gray-50 p-6"
            role="alert"
            aria-live="polite"
            aria-labelledby="lock-title"
            aria-describedby="lock-desc"
        >
            {/* 模糊背景層 (Fake Content) */}
            <div className="pointer-events-none absolute inset-0 z-0 select-none bg-white/50 p-6 opacity-40 blur-md" aria-hidden="true">
                {/* 模擬幾篇假貼文骨架 */}
                {[1, 2, 3].map((i) => (
                    <div key={i} className="mb-4 space-y-3 rounded-lg bg-gray-100 p-4 opacity-60 shadow-sm">
                        <div className="flex items-center gap-2">
                            <div className="size-10 rounded-full bg-gray-300" />
                            <div className="h-4 w-24 rounded bg-gray-300" />
                        </div>
                        <div className="h-4 w-3/4 rounded bg-gray-300" />
                        <div className="h-4 w-1/2 rounded bg-gray-300" />
                    </div>
                ))}
            </div>

            {/* 互動覆蓋層 */}
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-b from-transparent via-white/80 to-white p-6 text-center">
                <div className="animate-bounce-subtle mb-4 rounded-full bg-white p-4 shadow-xl ring-1 ring-gray-100">
                    <Lock className="size-8 text-brand-600" aria-hidden="true" />
                </div>

                <h3 id="lock-title" className="mb-2 text-xl font-bold text-gray-900 drop-shadow-sm">
                    {STRINGS.COMMUNITY.LOCKED_TITLE}
                </h3>

                <p id="lock-desc" className="mb-6 max-w-xs text-sm font-medium text-gray-600">
                    {isAuthenticated
                        ? STRINGS.COMMUNITY.LOCKED_DESC_USER
                        : STRINGS.COMMUNITY.LOCKED_DESC_GUEST}
                </p>

                <button
                    onClick={handleAction}
                    className="focus:ring-brand-500/30 rounded-full bg-brand-600 px-8 py-3 text-base font-bold text-white shadow-lg transition-all hover:scale-105 hover:bg-brand-700 focus:outline-none focus:ring-4 active:scale-95"
                    aria-label={isAuthenticated ? STRINGS.COMMUNITY.BTN_UNLOCK_USER : STRINGS.COMMUNITY.BTN_UNLOCK_GUEST}
                >
                    {isAuthenticated
                        ? STRINGS.COMMUNITY.BTN_UNLOCK_USER
                        : STRINGS.COMMUNITY.BTN_UNLOCK_GUEST}
                </button>
            </div>
        </div>
    );
});

export default PrivateWallLocked;
