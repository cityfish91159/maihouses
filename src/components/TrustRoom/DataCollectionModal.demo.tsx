/**
 * DataCollectionModal - Demo Page
 *
 * 用於展示和測試 DataCollectionModal 組件
 */

import React, { useState } from 'react';
import { DataCollectionModal } from './DataCollectionModal';
import { notify } from '../../lib/notify';

export function DataCollectionModalDemo(): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: { name: string; phone: string; email: string }) => {
    setIsSubmitting(true);

    // 模擬 API 呼叫
    await new Promise((resolve) => setTimeout(resolve, 1500));

    notify.success('資料已送出', '您的資料已安全保存用於法律留痕');

    setIsSubmitting(false);
    setIsOpen(false);
  };

  const handleSkip = () => {
    setIsOpen(false);
    notify.info('已跳過', '您可以稍後再填寫資料');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 rounded-xl bg-white p-6 shadow-md">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">DataCollectionModal 示範</h1>
          <p className="text-gray-600">此組件用於收集用戶基本資料以進行安心留痕</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-md">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">組件控制</h2>

          <button
            onClick={() => setIsOpen(true)}
            className="rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-700"
          >
            開啟資料收集 Modal
          </button>

          <div className="mt-6 border-t border-gray-200 pt-6">
            <h3 className="mb-2 text-sm font-medium text-gray-700">功能特性：</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                必填欄位驗證（姓名、電話）
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                選填欄位（Email）
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                Zod Schema 運行時驗證
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                完整無障礙性支援 (Focus Trap, ARIA, Escape key)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                Loading 狀態禁用互動
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                響應式設計
              </li>
            </ul>
          </div>

          <div className="mt-6 border-t border-gray-200 pt-6">
            <h3 className="mb-2 text-sm font-medium text-gray-700">使用方式：</h3>
            <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-xs text-gray-100">
              {`import { DataCollectionModal } from '@/components/TrustRoom';

<DataCollectionModal
  isOpen={isOpen}
  onSubmit={handleSubmit}
  onSkip={handleSkip}
  isSubmitting={isSubmitting}
/>`}
            </pre>
          </div>
        </div>
      </div>

      <DataCollectionModal
        isOpen={isOpen}
        onSubmit={handleSubmit}
        onSkip={handleSkip}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

export default DataCollectionModalDemo;
