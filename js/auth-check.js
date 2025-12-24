/**
 * auth-check.js
 * 
 * 靜態頁面專用的輕量級身份檢查腳本。
 * 用於在不載入完整 React/Supabase SDK 的情況下，
 * 快速判斷使用者是否已登入，並調整 Header UI。
 * 
 * 依賴：
 * - localStorage 中的 Supabase Token (key: sb-<ref>-auth-token)
 * - DOM 結構必須符合 GlobalHeader 的規範 (.menu, .tools)
 */

(function() {
  // 1. 檢查 LocalStorage 中是否有 Supabase Token
  // 注意：這裡假設 Supabase Project ID 是固定的或可以模糊匹配
  // 通常 key 格式為: sb-<project-ref>-auth-token
  function checkAuth() {
    let hasToken = false;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        try {
          const session = JSON.parse(localStorage.getItem(key));
          // 檢查 token 是否過期 (簡易檢查，不驗證簽名)
          if (session && session.access_token && session.expires_at) {
            // expires_at 是秒數
            if (session.expires_at * 1000 > Date.now()) {
              hasToken = true;
              break;
            }
          }
        } catch (e) {
          // ignore parse error
        }
      }
    }
    return hasToken;
  }

  // 2. 調整 UI
  function updateUI(isAuthenticated) {
    const menu = document.querySelector('.menu');
    const tools = document.querySelector('.tools');
    
    if (!menu || !tools) return;

    if (!isAuthenticated) {
      // 未登入：隱藏 User Menu，顯示登入按鈕
      menu.style.display = 'none';
      
      // 檢查是否已經有登入按鈕，避免重複添加
      if (!document.getElementById('static-login-btn')) {
        const loginBtn = document.createElement('a');
        loginBtn.id = 'static-login-btn';
        loginBtn.href = '/maihouses/auth/login';
        loginBtn.className = 'icon'; // 复用 icon 样式或自定义
        loginBtn.style.cssText = 'text-decoration:none;font-weight:700;padding:8px 16px;border-radius:99px;background:var(--brand);color:white;border:none;';
        loginBtn.textContent = '登入 / 註冊';
        tools.appendChild(loginBtn);
      }
      
      // 隱藏通知與訊息 icon (可選)
      const icons = tools.querySelectorAll('.icon:not(#static-login-btn)');
      icons.forEach(icon => icon.style.display = 'none');
    } else {
      // 已登入：確保 User Menu 顯示
      menu.style.display = '';
      const loginBtn = document.getElementById('static-login-btn');
      if (loginBtn) loginBtn.remove();
      
      const icons = tools.querySelectorAll('.icon');
      icons.forEach(icon => icon.style.display = '');
    }
  }

  // 執行
  const isAuth = checkAuth();
  // 等待 DOM Ready 以防腳本在 head 中執行找不到元素
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => updateUI(isAuth));
  } else {
    updateUI(isAuth);
  }
})();
