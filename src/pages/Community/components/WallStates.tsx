import React from 'react';

// Loading State
export const WallLoading: React.FC = () => {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="h-4 w-20 rounded bg-gray-200"></div>
              <div className="h-4 w-12 rounded bg-gray-200"></div>
            </div>
            <div className="h-3 w-16 rounded bg-gray-200"></div>
          </div>
          <div className="mb-2 h-6 w-3/4 rounded bg-gray-200"></div>
          <div className="mb-4 space-y-2">
            <div className="h-4 w-full rounded bg-gray-200"></div>
            <div className="h-4 w-5/6 rounded bg-gray-200"></div>
          </div>
          <div className="flex gap-4">
            <div className="h-3 w-12 rounded bg-gray-200"></div>
            <div className="h-3 w-12 rounded bg-gray-200"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Error State
interface WallErrorProps {
  message?: string;
  onRetry?: () => void;
}

export const WallError: React.FC<WallErrorProps> = ({ 
  message = "載入失敗，請稍後再試", 
  onRetry 
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 text-4xl">😵</div>
      <h3 className="mb-2 text-lg font-medium text-gray-900">發生錯誤</h3>
      <p className="mb-6 text-gray-500">{message}</p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="rounded-md bg-brand-500 px-4 py-2 text-white transition-colors hover:bg-brand-600"
        >
          重試
        </button>
      )}
    </div>
  );
};

// Empty State
interface WallEmptyProps {
  message?: string;
}

export const WallEmpty: React.FC<WallEmptyProps> = ({ 
  message = "目前沒有任何貼文" 
}) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 py-12 text-center">
      <div className="mb-4 text-4xl">🍃</div>
      <h3 className="mb-2 text-lg font-medium text-gray-900">這裡空空的</h3>
      <p className="text-gray-500">{message}</p>
    </div>
  );
};
