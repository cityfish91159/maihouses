import React from 'react';
import { FallbackProps } from 'react-error-boundary';

export const UAGErrorState: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => (
  <div role="alert" className="p-6 text-center text-red-600">
    <p className="font-bold text-lg mb-2">系統發生錯誤</p>
    <pre className="bg-red-50 p-4 rounded text-sm mb-4 overflow-auto max-w-lg mx-auto">{error.message}</pre>
    <button 
      onClick={resetErrorBoundary} 
      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
    >
      重試
    </button>
  </div>
);
