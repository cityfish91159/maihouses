// UAG Tracker v8.2 - Production Optimized
// Implements: Enhanced Session Recovery, Event Batching, Fingerprinting, Entry Tracking

class EnhancedTracker {
  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.fingerprint = this.generateFingerprint();
    this.agentId = this.getAgentId();
    this.entryRef = this.getEntryRef(); // 新增: 來源追蹤
    this.batcher = new EventBatcher(this);
    this.enterTime = Date.now();
    this.actions = { click_photos: 0, click_map: 0, click_line: 0, click_call: 0, scroll_depth: 0 };
    this.hasExited = false; // 新增: 防止重複送出 page_exit
    
    this.initListeners();
    this.recoverSession();
    this.trackImmediate('page_view');
  }

  getOrCreateSessionId() {
    // 1. LocalStorage
    let sid = localStorage.getItem('uag_session');
    // 2. SessionStorage
    if (!sid) sid = sessionStorage.getItem('uag_session_temp');
    // 3. Cookie
    if (!sid) sid = this.getCookie('uag_sid');
    // 4. New
    if (!sid) {
      sid = `u_${Math.random().toString(36).substr(2, 9)}`;
      this.persistSession(sid);
    }
    return sid;
  }

  persistSession(sid) {
    localStorage.setItem('uag_session', sid);
    sessionStorage.setItem('uag_session_temp', sid);
    this.setCookie('uag_sid', sid, 30);
  }

  getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  }

  setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/`;
  }

  getAgentId() {
    let aid = new URLSearchParams(location.search).get('aid');
    if (!aid) aid = localStorage.getItem('uag_last_aid');
    if (aid && aid !== 'unknown') localStorage.setItem('uag_last_aid', aid);
    return aid || 'unknown';
  }

  // 新增: 取得流量來源
  getEntryRef() {
    const params = new URLSearchParams(location.search);
    const src = params.get('src');
    const sid = params.get('sid');
    
    // 記錄到 sessionStorage（同一頁面 session 內保持一致）
    if (src) {
      sessionStorage.setItem('uag_entry_ref', src);
      if (sid) sessionStorage.setItem('uag_share_id', sid);
    }
    
    return {
      source: src || sessionStorage.getItem('uag_entry_ref') || 'direct',
      shareId: sid || sessionStorage.getItem('uag_share_id') || null
    };
  }

  generateFingerprint() {
    try {
      const fp = {
        screen: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        platform: navigator.platform,
        cores: navigator.hardwareConcurrency,
        memory: navigator.deviceMemory
      };
      return btoa(JSON.stringify(fp));
    } catch (e) {
      return 'unknown_fp';
    }
  }

  async recoverSession() {
    // If this is a fresh session (just created), try to recover from backend
    if (!localStorage.getItem('uag_session_recovered')) {
      try {
        const res = await fetch('/api/session-recovery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fingerprint: this.fingerprint, agentId: this.agentId })
        });
        const data = await res.json();
        if (data.recovered) {
          this.sessionId = data.session_id;
          this.persistSession(this.sessionId);
          localStorage.setItem('uag_session_recovered', 'true');
          console.log('[UAG] Session Recovered:', this.sessionId);
        }
      } catch (e) { 
        // 靜默處理，不影響用戶體驗
        console.warn('[UAG] Recovery skipped:', e.message); 
      }
    }
  }

  initListeners() {
    // Click Tracking
    document.addEventListener('click', e => {
      const t = e.target.closest('a, button, div, img');
      if (!t) return;
      const text = (t.innerText || '').toLowerCase();
      const classList = t.classList || [];
      
      // LINE 點擊
      if (text.includes('line') || t.href?.includes('line.me')) {
        this.actions.click_line++;
        this.trackImmediate('click_line');
      }
      // 電話點擊
      if (text.includes('電話') || text.includes('撥打') || t.href?.includes('tel:')) {
        this.actions.click_call++;
        this.trackImmediate('click_call');
      }
      // 地圖點擊（新增）
      if (text.includes('地圖') || text.includes('map') || 
          classList.contains('open-map') || classList.contains('map-btn') ||
          t.closest('.map-container, [data-map]')) {
        this.actions.click_map++;
        this.trackImmediate('click_map');
      }
      // 照片點擊
      if (t.tagName === 'IMG' || classList.contains('photo') || 
          classList.contains('gallery') || t.closest('.photo-gallery, .image-slider')) {
        this.actions.click_photos++;
      }
    });

    // Scroll Tracking
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const depth = Math.round((window.scrollY + window.innerHeight) / document.body.scrollHeight * 100);
        if (depth > this.actions.scroll_depth) this.actions.scroll_depth = depth;
      }, 100);
    });

    // Visibility & Unload - 使用 hasExited 防重複
    const sendFinal = () => {
      if (this.hasExited) return;
      this.hasExited = true;
      this.trackImmediate('page_exit');
    };
    
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') sendFinal();
    });
    window.addEventListener('pagehide', sendFinal);
    window.addEventListener('beforeunload', sendFinal);
  }

  trackImmediate(type) {
    this.batcher.add({
      type,
      property_id: window.propertyId || location.pathname.split('/').pop(),
      district: window.propertyDistrict || 'unknown',
      duration: Math.round((Date.now() - this.enterTime) / 1000),
      actions: { ...this.actions },
      entry_ref: this.entryRef.source,    // 新增: 流量來源
      share_id: this.entryRef.shareId,    // 新增: 分享連結 ID
      focus: []
    }, true);
  }
}

class EventBatcher {
  constructor(tracker) {
    this.tracker = tracker;
    this.queue = [];
    this.timer = null;
  }

  add(event, immediate = false) {
    this.queue.push(event);
    if (immediate || this.queue.length >= 5) {
      this.flush();
    } else {
      this.scheduleFlush();
    }
  }

  scheduleFlush() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), 5000);
  }

  flush() {
    if (this.queue.length === 0) return;
    
    // Take the last state of actions/duration for the "current" event if multiple are queued for same page
    // But here we just send the batch.
    // For v8.0, we send single event payload or batch. The API supports single event in the spec example, 
    // but let's support batching by sending the last state as the "event" to update.
    // Actually, the API `track_uag_event_v8` takes a single event. 
    // So we should iterate or send the most significant one.
    // To keep it simple and robust: We send the LATEST state of the page as ONE event update.
    // Because `duration` and `actions` are cumulative on the client side.
    
    const latestEvent = this.queue[this.queue.length - 1];
    this.queue = []; // Clear queue

    const payload = {
      session_id: this.tracker.sessionId,
      agent_id: this.tracker.agentId,
      fingerprint: this.tracker.fingerprint,
      event: latestEvent
    };

    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    navigator.sendBeacon('/api/uag-track', blob);
  }
}

// Initialize
window.uagTracker = new EnhancedTracker();

