import React from 'react';
import { FallbackProps } from 'react-error-boundary';

export const UAGErrorState: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => (
  <div role="alert" className="p-6 text-center text-red-600">
    <p className="mb-2 text-lg font-bold">系統發生錯誤</p>
    <pre className="mx-auto mb-4 max-w-lg overflow-auto rounded bg-red-50 p-4 text-sm">{error.message}</pre>
    <button 
      onClick={resetErrorBoundary} 
      className="rounded bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
    >
      重試
    </button>
  </div>
);
