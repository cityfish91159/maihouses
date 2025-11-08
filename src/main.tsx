import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <BrowserRouter basename={(import.meta as any).env?.BASE_URL || '/'}>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}
