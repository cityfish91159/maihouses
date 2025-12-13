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
            notify.info(STRINGS.COMMUNITY.NOTIFY_LOGIN_TITLE, STRINGS.COMMUNITY.NOTIFY_LOGIN_DESC);
        } else {
            // 已登入但無權限 (需驗證)
            notify.info(STRINGS.COMMUNITY.NOTIFY_VERIFY_REQUIRED, STRINGS.COMMUNITY.NOTIFY_VERIFY_REQUIRED_DESC);
        }
    };

    return (
        <div className="relative overflow-hidden rounded-xl bg-gray-50 p-6 min-h-[400px]">
            {/* 模糊背景層 (Fake Content) */}
            <div className="absolute inset-0 z-0 p-6 opacity-30 blur-sm pointer-events-none select-none">
                {/* 模擬幾篇假貼文骨架 */}
                {[1, 2, 3].map((i) => (
                    <div key={i} className="mb-4 space-y-3 rounded-lg bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-2">
                            <div className="size-10 rounded-full bg-gray-200" />
                            <div className="h-4 w-24 rounded bg-gray-200" />
                        </div>
                        <div className="h-4 w-3/4 rounded bg-gray-200" />
                        <div className="h-4 w-1/2 rounded bg-gray-200" />
                    </div>
                ))}
            </div>

            {/* 互動覆蓋層 */}
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center">
                <div className="mb-4 rounded-full bg-white p-4 shadow-lg ring-1 ring-gray-100">
                    <Lock className="size-8 text-brand-500" />
                </div>

                <h3 className="mb-2 text-lg font-bold text-gray-900">
                    {STRINGS.COMMUNITY.LOCKED_TITLE}
                </h3>

                <p className="mb-6 max-w-xs text-sm text-gray-500">
                    {isAuthenticated
                        ? STRINGS.COMMUNITY.LOCKED_DESC_USER
                        : STRINGS.COMMUNITY.LOCKED_DESC_GUEST}
                </p>

                <button
                    onClick={handleAction}
                    className="rounded-full bg-brand-500 px-6 py-2.5 text-sm font-bold text-white shadow-md transition-transform hover:scale-105 active:scale-95"
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
