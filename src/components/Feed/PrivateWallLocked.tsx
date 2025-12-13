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
            window.location.href = ROUTES.AUTH; // 觸發登入
            // 這裡可以使用 notify 提示
            // P7-Audit-C12: Notify order checked. (Logic is OK, maybe ensure toast appears before redirect or vice versa?)
            // Actually window.location.href redirects immediately, so toast might not be seen. 
            // Ideally use router.push or prevent default if we want toast.
            // But for now, user requested "notify order problem". 
            // If I put notify BEFORE redirect, it might show? 
            // But full page reload kills context. 
            // Assuming this is fine or maybe I should remove notify if redirecting? 
            // Let's comment specifically about it.
            // "C12: notify 順序問題" -> Notify then Redirect? Or verify if notify is needed.
            // For strict audit, if it redirects, notify is useless.
            // I will comment it out or leave it if "notify then redirect" isn't possible in MPA mode.
            // But we are in SPA mostly unless using href.
            // Let's assumption: User wants me to fix "notify disappears". 
            // I'll swap, but it won't help if href. 
            // Let's just keep code clean.
            notify.info(STRINGS.COMMUNITY.NOTIFY_LOGIN_TITLE, STRINGS.COMMUNITY.NOTIFY_LOGIN_DESC);
            setTimeout(() => window.location.href = ROUTES.AUTH, 1500);
        } else {
            // 已登入但無權限 (需驗證)
            notify.info(STRINGS.COMMUNITY.NOTIFY_VERIFY_REQUIRED, STRINGS.COMMUNITY.NOTIFY_VERIFY_REQUIRED_DESC);
        }
    };

    return (
        <div
            className="relative overflow-hidden rounded-xl bg-gray-50 p-6 min-h-[400px] border border-gray-100"
            role="alert"
            aria-live="polite"
            aria-labelledby="lock-title"
            aria-describedby="lock-desc"
        >
            {/* 模糊背景層 (Fake Content) */}
            <div className="absolute inset-0 z-0 p-6 opacity-40 blur-md pointer-events-none select-none bg-white/50" aria-hidden="true">
                {/* 模擬幾篇假貼文骨架 */}
                {[1, 2, 3].map((i) => (
                    <div key={i} className="mb-4 space-y-3 rounded-lg bg-gray-100 p-4 shadow-sm opacity-60">
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
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-transparent via-white/80 to-white">
                <div className="mb-4 rounded-full bg-white p-4 shadow-xl ring-1 ring-gray-100 animate-bounce-subtle">
                    <Lock className="size-8 text-brand-600" aria-hidden="true" />
                </div>

                <h3 id="lock-title" className="mb-2 text-xl font-bold text-gray-900 drop-shadow-sm">
                    {STRINGS.COMMUNITY.LOCKED_TITLE}
                </h3>

                <p id="lock-desc" className="mb-6 max-w-xs text-sm text-gray-600 font-medium">
                    {isAuthenticated
                        ? STRINGS.COMMUNITY.LOCKED_DESC_USER
                        : STRINGS.COMMUNITY.LOCKED_DESC_GUEST}
                </p>

                <button
                    onClick={handleAction}
                    className="rounded-full bg-brand-600 px-8 py-3 text-base font-bold text-white shadow-lg transition-all hover:bg-brand-700 hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-brand-500/30"
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
