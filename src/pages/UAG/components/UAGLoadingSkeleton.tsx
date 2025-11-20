import React from 'react';

export const UAGLoadingSkeleton = () => (
  <div className="p-6 text-center">
    <div className="animate-pulse flex space-x-4 justify-center">
      <div className="flex-1 space-y-4 py-1 max-w-md">
        <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6 mx-auto"></div>
        </div>
      </div>
    </div>
    <div className="mt-4 text-gray-500">載入中...</div>
  </div>
);
