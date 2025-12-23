import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async';
import App from './App'
import './index.css'

import ErrorBoundary from './app/ErrorBoundary';

// Mobile Debugger (Eruda)
// Usage: Add ?eruda=true to the URL
if (new URLSearchParams(window.location.search).get('eruda') === 'true') {
  import('eruda').then((eruda) => eruda.default.init());
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  // 容錯處理：root element 不存在時顯示錯誤
  document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#333;">頁面載入失敗，請重新整理</div>';
  throw new Error('Root element not found');
} else {
  // 智能判斷 basename：如果網址包含 /maihouses 則使用之，否則使用根目錄
  // 這能同時支援 https://.../maihouses/property/1 和 https://.../property/1
  const basename = window.location.pathname.startsWith('/maihouses')
    ? '/maihouses'
    : '/';

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <HelmetProvider>
        <ErrorBoundary>
          <BrowserRouter
            basename={basename}
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <App />
          </BrowserRouter>
        </ErrorBoundary>
      </HelmetProvider>
    </React.StrictMode>
  );
}

