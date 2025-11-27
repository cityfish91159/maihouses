import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

const rootElement = document.getElementById('root');
if (rootElement) {
  // 智能判斷 basename：如果網址包含 /maihouses 則使用之，否則使用根目錄
  // 這能同時支援 https://.../maihouses/property/1 和 https://.../property/1
  const basename = window.location.pathname.startsWith('/maihouses') 
    ? '/maihouses' 
    : '/';

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <BrowserRouter basename={basename}>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}
