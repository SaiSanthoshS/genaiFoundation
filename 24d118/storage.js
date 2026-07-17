/* ============================================================
   STORAGE LAYER
   Thin wrapper around localStorage. In a real deployment this
   is where calls to the backend agent's user-preferences and
   bookmarks API would live instead.
   ============================================================ */

const STORE_KEYS = {
  prefs: "ssa.prefs",
  bookmarks: "ssa.bookmarks",
  digest: "ssa.digest",
  lastRun: "ssa.lastRun",
};

const Store = {
  getPrefs() {
    const raw = localStorage.getItem(STORE_KEYS.prefs);
    return raw ? JSON.parse(raw) : null;
  },
  setPrefs(prefs) {
    localStorage.setItem(STORE_KEYS.prefs, JSON.stringify(prefs));
  },

  getBookmarks() {
    const raw = localStorage.getItem(STORE_KEYS.bookmarks);
    return raw ? JSON.parse(raw) : [];
  },
  setBookmarks(list) {
    localStorage.setItem(STORE_KEYS.bookmarks, JSON.stringify(list));
  },
  toggleBookmark(articleId) {
    const list = Store.getBookmarks();
    const idx = list.indexOf(articleId);
    if (idx >= 0) list.splice(idx, 1);
    else list.push(articleId);
    Store.setBookmarks(list);
    return list;
  },
  isBookmarked(articleId) {
    return Store.getBookmarks().includes(articleId);
  },

  getDigest() {
    const raw = localStorage.getItem(STORE_KEYS.digest);
    return raw ? JSON.parse(raw) : null;
  },
  setDigest(digest) {
    localStorage.setItem(STORE_KEYS.digest, JSON.stringify(digest));
    localStorage.setItem(STORE_KEYS.lastRun, new Date().toISOString());
  },
  getLastRun() {
    return localStorage.getItem(STORE_KEYS.lastRun);
  },

  clearAll() {
    Object.values(STORE_KEYS).forEach((k) => localStorage.removeItem(k));
  },
};
