// UAG Tracker v8.4 - Link Tracking Enhancement
// Fixes: click_line/call flag, page_exit duplicate, event batching
// New: listing_id, search_query tracking for source attribution

class EnhancedTracker {
  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.fingerprint = this.generateFingerprint();
    this.agentId = this.getAgentId();
    this.entryRef = this.getEntryRef();
    this.batcher = new EventBatcher(this);
    this.enterTime = Date.now();
    // 🔧 修復: 改成旗標制 (0 或 1)，不計次數，避免 SQL 判斷失效
    this.actions = { click_photos: 0, click_map: 0, click_line: 0, click_call: 0, scroll_depth: 0 };
    this.hasExited = false;
    
    this.initListeners();
    this.recoverSession();
    this.trackImmediate('page_view');
  }

  getOrCreateSessionId() {
    let sid = localStorage.getItem('uag_session');
    if (!sid) sid = sessionStorage.getItem('uag_session_temp');
    if (!sid) sid = this.getCookie('uag_sid');
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

  getEntryRef() {
    const params = new URLSearchParams(location.search);
    const src = params.get('src');
    const sid = params.get('sid');
    const lid = params.get('lid');  // listing_id (從列表頁來)
    const q = params.get('q');      // search_query (搜尋關鍵字)
    
    if (src) {
      sessionStorage.setItem('uag_entry_ref', src);
      if (sid) sessionStorage.setItem('uag_share_id', sid);
      if (lid) sessionStorage.setItem('uag_listing_id', lid);
      if (q) sessionStorage.setItem('uag_search_query', q);
    }
    
    return {
      source: src || sessionStorage.getItem('uag_entry_ref') || 'direct',
      shareId: sid || sessionStorage.getItem('uag_share_id') || null,
      listingId: lid || sessionStorage.getItem('uag_listing_id') || null,
      searchQuery: q || sessionStorage.getItem('uag_search_query') || null
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
        memory: navigator.deviceMemory,
        // 🔧 強化: 加入更多識別資訊
        colorDepth: screen.colorDepth,
        touch: navigator.maxTouchPoints > 0
      };
      return btoa(JSON.stringify(fp));
    } catch (e) {
      return 'unknown_fp';
    }
  }

  async recoverSession() {
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
        }
      } catch (e) { 
        // 靜默處理
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
      const href = t.href || '';
      
      // 🔧 修復: LINE 點擊改成旗標制 (=1)，不是 ++
      if (text.includes('line') || href.includes('line.me')) {
        if (this.actions.click_line === 0) {
          this.actions.click_line = 1;
          this.trackImmediate('click_line');  // 強信號立即送出
        }
      }
      
      // 🔧 修復: 電話點擊改成旗標制
      if (text.includes('電話') || text.includes('撥打') || text.includes('call') || href.includes('tel:')) {
        if (this.actions.click_call === 0) {
          this.actions.click_call = 1;
          this.trackImmediate('click_call');  // 強信號立即送出
        }
      }
      
      // 地圖點擊
      if (text.includes('地圖') || text.includes('map') || 
          classList.contains('open-map') || classList.contains('map-btn') ||
          t.id?.includes('map') || t.closest('.map-container, [data-map]')) {
        if (this.actions.click_map === 0) {
          this.actions.click_map = 1;
          this.trackImmediate('click_map');
        }
      }
      
      // 照片點擊 (這個可以累計，用於計算互動深度)
      if (t.tagName === 'IMG' || classList.contains('photo') || 
          classList.contains('gallery') || t.closest('.photo-gallery, .image-slider')) {
        this.actions.click_photos++;
      }
    });

    // Scroll Tracking (with debounce)
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const depth = Math.round((window.scrollY + window.innerHeight) / document.body.scrollHeight * 100);
        if (depth > this.actions.scroll_depth) this.actions.scroll_depth = depth;
      }, 100);
    });

    // 🔧 修復: page_exit 防重複送出 (hasExited flag)
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
    
    // 🔧 新增: 每 30 秒發送 heartbeat (解決 duration 不準問題)
    setInterval(() => {
      if (!this.hasExited) {
        this.batcher.add({
          type: 'heartbeat',
          property_id: window.propertyId || location.pathname.split('/').pop(),
          district: window.propertyDistrict || 'unknown',
          duration: Math.round((Date.now() - this.enterTime) / 1000),
          actions: { ...this.actions },
          entry_ref: this.entryRef.source,
          share_id: this.entryRef.shareId,
          listing_id: this.entryRef.listingId,
          search_query: this.entryRef.searchQuery,
          focus: []
        }, false);  // heartbeat 不需要 immediate
      }
    }, 30000);
  }

  trackImmediate(type) {
    this.batcher.add({
      type,
      property_id: window.propertyId || location.pathname.split('/').pop(),
      district: window.propertyDistrict || 'unknown',
      duration: Math.round((Date.now() - this.enterTime) / 1000),
      actions: { ...this.actions },
      entry_ref: this.entryRef.source,
      share_id: this.entryRef.shareId,
      listing_id: this.entryRef.listingId,
      search_query: this.entryRef.searchQuery,
      focus: []
    }, true);
  }
}

class EventBatcher {
  constructor(tracker) {
    this.tracker = tracker;
    this.queue = [];
    this.timer = null;
    this.strongSignalsSent = new Set();  // 🔧 記錄已送出的強信號
  }

  add(event, immediate = false) {
    // 🔧 修復: 強信號 (click_line, click_call, click_map) 一定要送，不進 queue
    const isStrongSignal = ['click_line', 'click_call', 'click_map'].includes(event.type);
    
    if (isStrongSignal) {
      // 強信號只送一次
      if (!this.strongSignalsSent.has(event.type)) {
        this.strongSignalsSent.add(event.type);
        this.sendEvent(event);
      }
      return;
    }
    
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
    
    // 送最新狀態 (累計的 duration 和 actions)
    const latestEvent = this.queue[this.queue.length - 1];
    this.queue = [];
    this.sendEvent(latestEvent);
  }
  
  sendEvent(event) {
    const payload = {
      session_id: this.tracker.sessionId,
      agent_id: this.tracker.agentId,
      fingerprint: this.tracker.fingerprint,
      event: event
    };

    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    navigator.sendBeacon('/api/uag-track', blob);
  }
}

// Initialize
window.uagTracker = new EnhancedTracker();

