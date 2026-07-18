/* ========================================
   UTILS — Formatting, Animation Helpers
   ======================================== */

window.Utils = (() => {
  /**
   * Animate a number from `from` to `to` in an element
   */
  function animateNumber(el, from, to, duration = 600) {
    const start = performance.now();
    const diff = to - from;

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.round(from + diff * eased);
      el.textContent = current.toLocaleString('en-IN');
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  /**
   * Format large vote counts: 1,23,456 → "1.2L" or "45K"
   */
  function formatVotes(n) {
    if (n >= 10000000) return (n / 10000000).toFixed(1) + 'Cr';
    if (n >= 100000) return (n / 100000).toFixed(1) + 'L';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toLocaleString('en-IN');
  }

  /**
   * Format number with Indian commas
   */
  function formatIndian(n) {
    return n.toLocaleString('en-IN');
  }

  /**
   * Time ago string
   */
  function timeAgo(date) {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  }

  /**
   * Format time as HH:MM:SS
   */
  function formatTime(date) {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  }

  /**
   * Debounce
   */
  function debounce(fn, delay = 250) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  /**
   * Throttle
   */
  function throttle(fn, limit = 100) {
    let inThrottle = false;
    return (...args) => {
      if (!inThrottle) {
        fn(...args);
        inThrottle = true;
        setTimeout(() => { inThrottle = false; }, limit);
      }
    };
  }

  /**
   * Simple event emitter
   */
  class EventBus {
    constructor() {
      this._listeners = {};
    }

    on(event, callback) {
      if (!this._listeners[event]) this._listeners[event] = [];
      this._listeners[event].push(callback);
      return () => this.off(event, callback);
    }

    off(event, callback) {
      if (!this._listeners[event]) return;
      this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
    }

    emit(event, data) {
      if (!this._listeners[event]) return;
      this._listeners[event].forEach(cb => cb(data));
    }
  }

  /**
   * Generate a party-colored background style
   */
  function partyBgStyle(partyId, opacity = 0.15) {
    const party = window.ElectionData.PARTIES[partyId];
    if (!party) return '';
    return `background: ${hexToRgba(party.color, opacity)}; color: ${party.color};`;
  }

  /**
   * Hex to rgba
   */
  function hexToRgba(hex, alpha = 1) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /**
   * Get swing text and direction
   */
  function getSwing(current, previous) {
    const diff = current - previous;
    if (diff > 0) return { text: `+${diff}`, direction: 'up', value: diff };
    if (diff < 0) return { text: `${diff}`, direction: 'down', value: diff };
    return { text: '0', direction: 'neutral', value: 0 };
  }

  /**
   * Calculate vote share percentage
   */
  function voteSharePct(votes, total) {
    if (total === 0) return '0.0';
    return ((votes / total) * 100).toFixed(1);
  }

  /**
   * Ordinal suffix (1st, 2nd, 3rd...)
   */
  function ordinal(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  /**
   * Shuffle array (Fisher-Yates)
   */
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /**
   * Create DOM element with classes
   */
  function el(tag, classes = '', attrs = {}) {
    const elem = document.createElement(tag);
    if (classes) elem.className = classes;
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'text') elem.textContent = v;
      else if (k === 'html') elem.innerHTML = v;
      else elem.setAttribute(k, v);
    }
    return elem;
  }

  return {
    animateNumber,
    formatVotes,
    formatIndian,
    timeAgo,
    formatTime,
    debounce,
    throttle,
    EventBus,
    partyBgStyle,
    hexToRgba,
    getSwing,
    voteSharePct,
    ordinal,
    shuffle,
    el,
  };
})();
