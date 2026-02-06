import React from 'react';

/**
 * TrustServiceBanner Error Boundary Fallback Component
 *
 * 當 TrustServiceBanner 發生錯誤時顯示的降級 UI
 *
 * @remarks
 * 遵循 CLAUDE.md 規範:
 * - 無 any 類型
 * - 完整錯誤處理
 * - TypeScript strict mode
 */

export const TrustBannerFallback: React.FC = () => (
  <div className="mx-auto my-4 max-w-4xl px-4">
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
      <p className="text-sm text-gray-500">安心留痕資訊暫時無法載入</p>
    </div>
  </div>
);
