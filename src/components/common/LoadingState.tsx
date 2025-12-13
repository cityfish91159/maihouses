import React from 'react';
import { STRINGS } from '../../constants/strings';

/**
 * LoadingState
 * 
 * 標準 Loading 狀態組件
 * 用於頁面或區塊載入時顯示
 */
export function LoadingState() {
    return (
        <div className="flex h-40 w-full flex-col items-center justify-center space-y-3 rounded-lg bg-gray-50 p-6">
            <div className="size-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
            <span className="text-sm font-medium text-gray-500">
                {STRINGS.WALL_STATES.LOADING_LABEL}
            </span>
        </div>
    );
}
