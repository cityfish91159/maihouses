import React from 'react';

export const UAGLoadingSkeleton = () => (
  <div className="p-6 text-center">
    <div className="flex animate-pulse justify-center space-x-4">
      <div className="max-w-md flex-1 space-y-4 py-1">
        <div className="mx-auto h-4 w-3/4 rounded bg-gray-200"></div>
        <div className="space-y-2">
          <div className="h-4 rounded bg-gray-200"></div>
          <div className="mx-auto h-4 w-5/6 rounded bg-gray-200"></div>
        </div>
      </div>
    </div>
    <div className="mt-4 text-gray-500">載入中...</div>
  </div>
);
