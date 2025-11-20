// ====== CONSTANTS ======
const CONSTANTS = {
  PROTECTION_HOURS: {
    S: 120,
    A: 72,
    B: 336,
    C: 336,
    F: 336
  },
  API_TIMEOUT: 10000,
  CACHE_TTL: 120000 // 2 minutes
};

// ====== CONFIG ======
const CONFIG = {
  USE_MOCK: true,
  API_BASE: 'http://localhost:3000'
};

// ====== Mode Initialization ======
(function initModeFromEnv() {
  try {
    const params = new URLSearchParams(window.location.search);
    const urlMode = params.get('mode');
    if (urlMode === 'mock' || urlMode === 'live') {
      CONFIG.USE_MOCK = urlMode === 'mock';
      localStorage.setItem('uag_mode', urlMode);
    } else {
      const saved = localStorage.getItem('uag_mode');
      if (saved === 'mock' || saved === 'live') {
        CONFIG.USE_MOCK = saved === 'mock';
      }
    }
  } catch (e) {
    console.warn('initModeFromEnv error', e);
  }
})();

// ====== Global State ======
const app = (() => {
  let appData = {};
  let selectedLead = null;

  // ====== Utility Functions ======
  const utils = {
    sanitize: (str) => {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    },
    
    createElement: (html) => {
      const template = document.createElement('template');
      template.innerHTML = html.trim();
      return template.content.firstChild;
    },

    fetchWithTimeout: async (url, options = {}, timeout = CONSTANTS.API_TIMEOUT) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);
      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });
        clearTimeout(timer);
        return response;
      } catch (error) {
        clearTimeout(timer);
        throw error;
      }
    }
  };

  // ====== API Service Layer ======
  const api = {
    getDashboard: async () => {
      if (CONFIG.USE_MOCK) {
        return Promise.resolve({ success: true, data: window.MOCK_DB });
      }

      try {
        const res = await utils.fetchWithTimeout(`${CONFIG.API_BASE}/api/dashboard`);
        if (!res.ok) {
          return { success: false, message: `伺服器錯誤 (${res.status})` };
        }
        return await res.json();
      } catch (e) {
        console.error("API Error:", e);
        return { success: false, message: e.name === 'AbortError' ? "請求超時" : "無法連線到伺服器" };
      }
    },

    buyLead: async (leadId) => {
      if (CONFIG.USE_MOCK) {
        const lead = window.MOCK_DB.leads.find(l => l.id === leadId);
        if (!lead) return { success: false, message: "客戶不存在" };
        if (lead.status !== 'new') return { success: false, message: "此客戶已被購買" };
        if (window.MOCK_DB.user.points < lead.price) return { success: false, message: "點數不足 (Mock)" };
        
        window.MOCK_DB.user.points -= lead.price;
        if (lead.grade === 'S') window.MOCK_DB.user.quota.s--;
        if (lead.grade === 'A') window.MOCK_DB.user.quota.a--;
        
        lead.status = 'purchased';
        lead.purchasedAt = Date.now();
        lead.remainingHours = CONSTANTS.PROTECTION_HOURS[lead.grade];

        return Promise.resolve({ success: true, message: "交易成功 (Mock)", data: { user: window.MOCK_DB.user } });
      }

      try {
        const res = await utils.fetchWithTimeout(`${CONFIG.API_BASE}/api/buy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leadId })
        });

        if (!res.ok) {
          return { success: false, message: `交易失敗 (${res.status})` };
        }
        return await res.json();
      } catch (e) {
        console.error("Buy Error:", e);
        return { success: false, message: e.name === 'AbortError' ? "請求超時" : "交易請求失敗" };
      }
    }
  };

  // ====== UI Rendering Functions ======
  const ui = {
    showLoading: () => {
      const existing = document.getElementById('global-spinner');
      if (existing) return;
      
      const spinner = utils.createElement(`
        <div id="global-spinner" style="position:fixed;inset:0;background:rgba(255,255,255,0.9);display:grid;place-items:center;z-index:9999;">
          <div style="text-align:center;">
            <div class="skeleton" style="width:60px;height:60px;border-radius:50%;margin:0 auto 16px;"></div>
            <div>載入中...</div>
          </div>
        </div>
      `);
      document.body.appendChild(spinner);
    },

    hideLoading: () => {
      const spinner = document.getElementById('global-spinner');
      if (spinner) spinner.remove();
    },

    updateHeader: () => {
      const pointsEl = document.getElementById('user-points');
      const quotaSEl = document.getElementById('quota-s');
      const quotaAEl = document.getElementById('quota-a');
      
      if (pointsEl) pointsEl.textContent = appData.user.points;
      if (quotaSEl) quotaSEl.textContent = appData.user.quota.s;
      if (quotaAEl) quotaAEl.textContent = appData.user.quota.a;
    },

    renderRadar: () => {
      const container = document.getElementById('radar-container');
      if (!container) return;

      // Base structure
      container.innerHTML = `
        <div style="position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); width:300px; height:300px; border:1px dashed #cbd5e1; border-radius:50%; pointer-events:none;"></div>
        <div style="position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); width:150px; height:150px; border:1px dashed #cbd5e1; border-radius:50%; pointer-events:none;"></div>
        <div style="position:absolute;left:16px;top:16px;background:rgba(255,255,255,0.9);padding:6px 12px;border-radius:20px;font-size:12px;color:#0f172a;box-shadow:0 1px 2px rgba(0,0,0,0.05);border:1px solid #e2e8f0;z-index:5;">
          <span style="width:8px;height:8px;background:#22c55e;border-radius:50%;display:inline-block;margin-right:4px;"></span>
          <span style="font-weight:700;">Live 監控中</span>
        </div>
      `;

      const liveLeads = appData.leads.filter(l => l.status === 'new');
      const fragment = document.createDocumentFragment();

      liveLeads.forEach(lead => {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        bubble.setAttribute('data-grade', lead.grade);
        bubble.setAttribute('tabindex', '0');
        bubble.setAttribute('role', 'button');
        bubble.setAttribute('aria-label', `${lead.grade}級客戶 ${lead.name}`);
        
        const x = lead.x != null ? lead.x : 50; 
        const y = lead.y != null ? lead.y : 50;
        const size = lead.grade === 'S' ? 120 : lead.grade === 'A' ? 100 : lead.grade === 'B' ? 90 : lead.grade === 'C' ? 80 : 60;
        
        bubble.style.setProperty('--w', size + 'px');
        bubble.style.setProperty('--float', (5 + Math.random() * 3) + 's');
        bubble.style.left = x + '%';
        bubble.style.top = y + '%';

        const gradeText = utils.sanitize(lead.grade);
        const idText = utils.sanitize(lead.id);
        const intentText = utils.sanitize(String(lead.intent));
        const propText = utils.sanitize(lead.prop);

        bubble.innerHTML = `
          <div class="grade-tag" style="background:var(--grade-${lead.grade.toLowerCase()}); color:#fff;">${gradeText}</div>
          <div style="text-align:center; line-height:1.2;">
            <div style="font-weight:800; font-size:14px;">${idText}</div>
            <div style="font-size:11px; color:#64748b;">${intentText}%</div>
          </div>
          <div class="label">${propText}</div>
        `;

        bubble.onclick = () => ui.selectLead(lead);
        bubble.onkeydown = (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            ui.selectLead(lead);
          }
        };
        
        fragment.appendChild(bubble);
      });

      // Use requestIdleCallback for better performance
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => container.appendChild(fragment));
      } else {
        container.appendChild(fragment);
      }
    },

    selectLead: (lead) => {
      selectedLead = lead;
      const panel = document.getElementById('action-panel');
      if (!panel) return;

      const isExclusive = (lead.grade === 'S' || lead.grade === 'A');
      const exclusiveHTML = isExclusive 
        ? `<div style="background:#fff7ed; color:#ea580c; font-weight:700; font-size:12px; text-align:center; padding:6px; border-radius:4px; border:1px solid #ffedd5; margin-bottom:10px;">✨ 此客戶包含獨家聯絡權 ✨</div>` 
        : '';

      const nameText = utils.sanitize(lead.name);
      const propText = utils.sanitize(lead.prop);
      const intentText = utils.sanitize(String(lead.intent));
      const visitText = utils.sanitize(String(lead.visit));
      const priceText = utils.sanitize(String(lead.price));
      const aiText = utils.sanitize(lead.ai);

      panel.innerHTML = `
        <div class="ap-head">
          <span class="badge ${lead.grade.toLowerCase()}">${lead.grade}級｜${nameText}</span>
        </div>
        <div class="ap-body">
          <div class="ap-stats-group">
            <div class="ap-stat"><span>關注房源</span><b>${propText}</b></div>
            <div class="ap-stat"><span>意向分數</span><b style="color:var(--brand)">${intentText}%</b></div>
            <div class="ap-stat"><span>瀏覽次數</span><b>${visitText} 次</b></div>
            <div class="ap-stat"><span>購買成本</span><b>${priceText} 點</b></div>
          </div>
          
          <div class="ai-box urgent">
            <div>${aiText}</div>
          </div>

          <div class="action-zone">
            ${exclusiveHTML}
            <button class="btn-attack" id="btn-buy-${lead.id}" data-lead-id="${lead.id}">
              🚀 立即購買聯絡
            </button>
            <div style="text-align:center; font-size:11px; color:#94a3b8; margin-top:8px;">符合個資法規範</div>
          </div>
        </div>
      `;

      const buyBtn = panel.querySelector(`#btn-buy-${lead.id}`);
      if (buyBtn) {
        buyBtn.addEventListener('click', () => ui.handleBuy(lead.id));
      }
      
      if (window.innerWidth <= 1024) {
        const container = document.getElementById('action-panel-container');
        if (container) {
          container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    },

    handleBuy: async (id) => {
      const btn = document.getElementById(`btn-buy-${id}`);
      if (btn) {
        btn.disabled = true;
        btn.textContent = "處理中...";
      }

      const res = await api.buyLead(id);
      
      if (res.success) {
        alert(res.message);
        const panel = document.getElementById('action-panel');
        if (panel) {
          panel.innerHTML = `
            <div style="height:100%; min-height: 200px; display:grid; place-items:center; color:var(--ink-300); text-align:center;">
              <div>
                <div style="font-size:40px; margin-bottom:10px;">✅</div>
                <div>購買成功<br>請至下方監控區管理</div>
              </div>
            </div>`;
        }
        await renderApp();
      } else {
        alert(res.message);
        if (btn) {
          btn.disabled = false;
          btn.textContent = "🚀 立即購買聯絡";
        }
      }
    },

    renderAssets: () => {
      const tbody = document.getElementById('asset-list');
      if (!tbody) return;

      const boughtLeads = appData.leads.filter(l => l.status === 'purchased');
      
      if (boughtLeads.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:#94a3b8;">尚無已購資產，請從上方雷達進攻。</td></tr>`;
        return;
      }

      tbody.innerHTML = boughtLeads.map(lead => {
        const total = CONSTANTS.PROTECTION_HOURS[lead.grade];
        const remaining = lead.remainingHours != null ? lead.remainingHours : total; 
        const percent = Math.max(0, Math.min(100, (remaining / total) * 100));
        
        const colorVar = `var(--grade-${lead.grade.toLowerCase()})`;
        const isExclusive = (lead.grade === 'S' || lead.grade === 'A');
        const protectText = isExclusive ? '獨家鎖定中' : '去重保護中';
        
        let timeDisplay = '';
        if (isExclusive) {
          timeDisplay = `${remaining.toFixed(1)} 小時`;
        } else {
          const days = (remaining/24).toFixed(1);
          timeDisplay = `${days} 天`;
        }

        const nameText = utils.sanitize(lead.name);
        const propText = utils.sanitize(lead.prop);

        return `
          <tr>
            <td data-label="客戶等級/名稱">
              <div style="display:flex;align-items:center;">
                <span style="display:inline-grid; place-items:center; width:24px; height:24px; border-radius:50%; font-size:11px; font-weight:900; color:#fff; margin-right:8px; background:${colorVar}">${lead.grade}</span>
                <div>
                  <div style="font-weight:800;color:var(--ink-100)">${nameText}</div>
                  <div style="font-size:11px; color:var(--ink-300);">${propText}</div>
                </div>
              </div>
            </td>
            <td data-label="保護期倒數">
              <div style="font-size:11px; font-weight:700; margin-bottom:2px; display:flex; justify-content:space-between;">
                <span style="color:${colorVar}">${protectText}</span>
                <span class="t-countdown">${timeDisplay}</span>
              </div>
              <div class="progress-bg"><div class="progress-fill" style="width:${percent}%; background:${colorVar}"></div></div>
            </td>
            <td data-label="目前狀態"><span class="badge" style="background:#f0fdf4;color:#16a34a; border:none;">簡訊已發送</span></td>
            <td data-label="操作"><button class="btn primary" style="padding:4px 12px;font-size:12px;">寫紀錄 / 預約</button></td>
          </tr>
        `;
      }).join('');
    },

    renderListings: () => {
      const container = document.getElementById('listing-container');
      if (!container) return;

      if (!appData.listings || appData.listings.length === 0) {
        container.innerHTML = `<div style="padding:12px; font-size:13px; color:#94a3b8;">尚無房源資料。</div>`;
        return;
      }

      container.innerHTML = appData.listings.map(item => {
        const titleText = utils.sanitize(item.title);
        const tagsHtml = item.tags.map(t => `<span class="l-tag">${utils.sanitize(t)}</span>`).join('');
        
        return `
          <article class="listing-item">
            <div class="l-thumb" style="background:${item.thumbColor};"></div>
            <div>
              <div class="l-title">${titleText}</div>
              <div class="l-tags">${tagsHtml}</div>
              <div class="l-kpi">
                <span>曝光 <b>${item.view}</b></span>
                <span>點擊 <b>${item.click}</b></span>
                <span>收藏 <b>${item.fav}</b></span>
              </div>
            </div>
          </article>
        `;
      }).join('');
    },

    renderFeed: () => {
      const container = document.getElementById('feed-container');
      if (!container) return;

      if (!appData.feed || appData.feed.length === 0) {
        container.innerHTML = `<div style="padding:12px; font-size:13px; color:#94a3b8;">尚無社區牆互動。</div>`;
        return;
      }

      container.innerHTML = appData.feed.map(post => {
        const titleText = utils.sanitize(post.title);
        const metaText = utils.sanitize(post.meta);
        const bodyText = utils.sanitize(post.body);
        
        return `
          <article class="feed-post">
            <div class="fp-title">${titleText}</div>
            <div class="fp-meta">${metaText}</div>
            <div class="fp-body">${bodyText}</div>
          </article>
        `;
      }).join('');
    }
  };

  // ====== Public API ======
  async function initApp() {
    const modeEl = document.getElementById('system-mode');
    if (modeEl) {
      modeEl.textContent = CONFIG.USE_MOCK ? "Local Mock" : "Live API";
      modeEl.style.color = CONFIG.USE_MOCK ? "#f59e0b" : "#16a34a";
    }
    await renderApp();
  }

  function toggleMode() {
    CONFIG.USE_MOCK = !CONFIG.USE_MOCK;
    localStorage.setItem('uag_mode', CONFIG.USE_MOCK ? 'mock' : 'live');
    initApp();
  }

  async function renderApp() {
    ui.showLoading();
    
    try {
      const res = await api.getDashboard();
      if (res.success) {
        appData = res.data;
        ui.updateHeader();
        ui.renderRadar();
        ui.renderAssets();
        ui.renderListings();
        ui.renderFeed();
      } else {
        alert(res.message || "載入失敗");
      }
    } catch (error) {
      console.error('Render error:', error);
      alert("系統錯誤，請重新整理頁面");
    } finally {
      ui.hideLoading();
    }
  }

  return {
    init: initApp,
    toggleMode,
    render: renderApp
  };
})();

// ====== Event Listeners ======
document.addEventListener('DOMContentLoaded', () => {
  app.init();
  
  // Attach event listeners without inline handlers
  const toggleBtn = document.querySelector('[onclick="toggleMode()"]');
  if (toggleBtn) {
    toggleBtn.removeAttribute('onclick');
    toggleBtn.addEventListener('click', app.toggleMode);
  }
  
  const refreshBtn = document.querySelector('[onclick="initApp()"]');
  if (refreshBtn) {
    refreshBtn.removeAttribute('onclick');
    refreshBtn.addEventListener('click', app.init);
  }
});

// Expose for backward compatibility
window.initApp = app.init;
window.toggleMode = app.toggleMode;
