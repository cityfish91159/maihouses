// UAG Tracker v8.0 - Ultimate Optimization
// Implements: Enhanced Session Recovery, Event Batching, Fingerprinting

class EnhancedTracker {
  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.fingerprint = this.generateFingerprint();
    this.agentId = this.getAgentId();
    this.batcher = new EventBatcher(this);
    this.enterTime = Date.now();
    this.actions = { click_photos: 0, click_map: 0, click_line: 0, click_call: 0, scroll_depth: 0 };
    
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
      } catch (e) { console.error('Recovery failed', e); }
    }
  }

  initListeners() {
    // Click Tracking
    document.addEventListener('click', e => {
      const t = e.target.closest('a, button, div');
      if (!t) return;
      const text = (t.innerText || '').toLowerCase();
      
      if (text.includes('line') || t.href?.includes('line.me')) {
        this.actions.click_line++;
        this.trackImmediate('click_line');
      }
      if (text.includes('電話') || t.href?.includes('tel:')) {
        this.actions.click_call++;
        this.trackImmediate('click_call');
      }
      if (t.tagName === 'IMG' || t.classList.contains('photo')) this.actions.click_photos++;
    });

    // Scroll Tracking
    window.addEventListener('scroll', () => {
      const depth = Math.round((window.scrollY + window.innerHeight) / document.body.scrollHeight * 100);
      if (depth > this.actions.scroll_depth) this.actions.scroll_depth = depth;
    });

    // Visibility & Unload
    const sendFinal = () => this.trackImmediate('page_exit');
    window.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && sendFinal());
    window.addEventListener('pagehide', sendFinal);
  }

  trackImmediate(type) {
    this.batcher.add({
      type,
      property_id: window.propertyId || location.pathname.split('/').pop(),
      district: window.propertyDistrict || 'unknown',
      duration: Math.round((Date.now() - this.enterTime) / 1000),
      actions: { ...this.actions },
      focus: [] // Can implement IntersectionObserver here
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

