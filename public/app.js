/* ---------------- static rendering data (kept client-side; the
   backend is the source of truth for THEMES/books/scoring) ---------------- */
const THEME_ICON = {
  "Family Drama":"🏠","Historical Fiction":"⏳","Mystery & Suspense":"🔍","Fantasy":"🌙",
  "Romance":"💞","Science Fiction":"🪐","Memoir & Biography":"🖋️","Social Justice":"✊",
  "Coming of Age":"🌱","War & Conflict":"🎖️","Immigration & Identity":"🧭","Grief & Loss":"🕊️",
  "Humor & Satire":"🔔","Mythology & Folklore":"🏛️","Psychological Depth":"🌀","Adventure & Survival":"🏔️"
};
const THEME_COLOR = {
  "Family Drama":"#8B5E3C","Historical Fiction":"#6B4A2F","Mystery & Suspense":"#2E3B4E","Fantasy":"#4B3B6B",
  "Romance":"#8B3A42","Science Fiction":"#2F5D62","Memoir & Biography":"#5C5240","Social Justice":"#7A4B2A",
  "Coming of Age":"#4E6B4A","War & Conflict":"#5A3A3A","Immigration & Identity":"#3A5A73","Grief & Loss":"#4A4A57",
  "Humor & Satire":"#8A6425","Mythology & Folklore":"#5B3A6B","Psychological Depth":"#43395B","Adventure & Survival":"#3D5A3A"
};

let state = { view: "setup", members: [], selection: null, loaded: false };
let lastRecs = [];
let lastOverlap = { ranked: [], totalMembers: 0 };
let errorMessage = null;

/* ---------------- API helper ---------------- */
async function api(path, opts = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts
  });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body.error) msg = body.error;
    } catch (_) {}
    throw new Error(msg);
  }
  return res.json();
}
function apiGet(path) { return api(path); }
function apiPost(path, body) { return api(path, { method: "POST", body: JSON.stringify(body || {}) }); }
function apiPatch(path, body) { return api(path, { method: "PATCH", body: JSON.stringify(body || {}) }); }
function apiDelete(path) { return api(path, { method: "DELETE" }); }

async function withErrorHandling(fn) {
  try {
    errorMessage = null;
    await fn();
  } catch (e) {
    errorMessage = e.message || "Something went wrong.";
    render();
  }
}

/* ---------------- init ---------------- */
async function init() {
  await withErrorHandling(async () => {
    const s = await apiGet("/state");
    state.members = s.members || [];
    state.selection = s.selection || null;
    state.loaded = true;
  });
  state.loaded = true;
  render();
}

/* ---------------- helpers ---------------- */
function starString(r) { return "★".repeat(r) + "☆".repeat(5 - r); }
function escapeHtml(s) {
  return (s || "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}
function chipsHtml(themes) {
  return (themes || []).map(t =>
    `<span class="chip" style="background:${THEME_COLOR[t] || "#555"}">${THEME_ICON[t] || ""} ${escapeHtml(t)}</span>`
  ).join("");
}
function shade(hex, pct) {
  const num = parseInt(hex.slice(1), 16);
  let r = (num >> 16) + Math.round(255 * pct / 100);
  let g = ((num >> 8) & 0xff) + Math.round(255 * pct / 100);
  let b = (num & 0xff) + Math.round(255 * pct / 100);
  r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
  return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
}
function coverHtml(book) {
  const main = (book.themes && book.themes[0]) || "Family Drama";
  const color = THEME_COLOR[main] || "#5C5240";
  const icon = THEME_ICON[main] || "📖";
  return `<div class="cover" style="background:linear-gradient(160deg, ${color}, ${shade(color, -25)})">
    <span class="icon">${icon}</span>
    <div class="cov-title">${escapeHtml(book.title)}</div>
  </div>`;
}
function errorBannerHtml() {
  return errorMessage ? `<div class="error-banner">⚠ ${escapeHtml(errorMessage)}</div>` : "";
}

/* ---------------- tabs ---------------- */
function renderTabs() {
  const hasMembers = state.members.some(m => m.history.length > 0);
  const hasSelection = !!state.selection;
  const tabs = [
    { id: "setup", label: "① Setup" },
    { id: "venn", label: "② Overlap", disabled: !hasMembers },
    { id: "shelf", label: "③ Shelf", disabled: !hasMembers },
    { id: "calendar", label: "④ Calendar", disabled: !hasSelection }
  ];
  document.getElementById("tabs").innerHTML = tabs.map(t =>
    `<button class="tab ${state.view === t.id ? "active" : ""}" ${t.disabled ? "disabled" : ""} data-view="${t.id}">${t.label}</button>`
  ).join("");
  document.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => switchView(btn.dataset.view));
  });
}

async function switchView(v) {
  state.view = v;
  if (v === "venn") {
    await withErrorHandling(async () => { lastOverlap = await apiGet("/overlap"); });
  } else if (v === "shelf") {
    await withErrorHandling(async () => {
      const r = await apiGet("/recommendations");
      lastRecs = r.recommendations;
    });
  }
  render();
}

/* ---------------- setup view ---------------- */
function renderSetup() {
  const membersHtml = state.members.map(m => {
    const historyHtml = m.history.length ? `<ul class="history-list">${m.history.map((h, idx) => `
      <li class="history-item">
        <div>
          <div class="htitle">${escapeHtml(h.title)}</div>
          <div>${chipsHtml(h.themes)}</div>
        </div>
        <div class="hmeta">
          <span class="stars">${starString(h.rating)}</span> · ${h.pages}pg
          <button class="hremove" data-member="${m.id}" data-idx="${idx}">remove</button>
        </div>
      </li>`).join("")}</ul>` : `<div class="empty-note">No past reads logged yet.</div>`;

    return `<div class="member-card">
      <div class="member-card-head">
        <h3>${escapeHtml(m.name)}</h3>
        <button class="remove-x" data-member="${m.id}" data-action="remove-member">remove member</button>
      </div>
      ${historyHtml}
      <div class="add-row" id="addrow-${m.id}">
        <input type="text" placeholder="Search a book title…" id="search-${m.id}" autocomplete="off">
        <div class="rating-wrap">rating
          <input type="range" min="1" max="5" value="4" id="rating-${m.id}">
        </div>
        <button class="btn small ghost" data-member="${m.id}" data-action="add-custom">＋ not listed</button>
        <div id="ac-${m.id}"></div>
      </div>
    </div>`;
  }).join("");

  const anyHistory = state.members.some(m => m.history.length > 0);

  document.getElementById("app").innerHTML = `
    <div class="sheet">
      <h2 class="section-title">Member Setup</h2>
      <p class="section-sub">Add each member, then log a few past reads so the agent can learn their taste</p>
      ${errorBannerHtml()}
      <div class="add-member-form">
        <input type="text" id="newMemberName" placeholder="Member name (e.g. Priya)">
        <button class="btn brass" id="addMemberBtn">＋ Add Member</button>
      </div>

      <div class="member-grid">${membersHtml || '<div class="empty-note">Add your first member above to get started.</div>'}</div>

      <div class="cta-row">
        <button class="btn brass" style="font-size:14px;padding:13px 28px;" id="runAgentBtn" ${!anyHistory ? "disabled" : ""}>📚 Find Our Next Book</button>
        <div class="hint">${anyHistory ? "The agent will aggregate everyone's ratings and look for overlapping interests." : "Log at least one past read for someone before running the agent."}</div>
      </div>
    </div>
  `;

  document.getElementById("addMemberBtn").addEventListener("click", addMember);
  document.getElementById("newMemberName").addEventListener("keydown", e => { if (e.key === "Enter") addMember(); });
  const runBtn = document.getElementById("runAgentBtn");
  if (runBtn) runBtn.addEventListener("click", () => switchView("venn"));

  document.querySelectorAll('[data-action="remove-member"]').forEach(btn =>
    btn.addEventListener("click", () => removeMember(btn.dataset.member))
  );
  document.querySelectorAll('[data-action="add-custom"]').forEach(btn =>
    btn.addEventListener("click", () => addCustomBook(btn.dataset.member))
  );
  document.querySelectorAll(".hremove").forEach(btn =>
    btn.addEventListener("click", () => removeHistoryItem(btn.dataset.member, parseInt(btn.dataset.idx, 10)))
  );
  state.members.forEach(m => {
    const input = document.getElementById(`search-${m.id}`);
    if (input) input.addEventListener("input", () => onSearchInput(m.id));
  });
}

async function addMember() {
  const input = document.getElementById("newMemberName");
  const name = input.value.trim();
  if (!name) return;
  await withErrorHandling(async () => {
    const s = await apiPost("/members", { name });
    state.members = s.members;
  });
  render();
}

async function removeMember(id) {
  await withErrorHandling(async () => {
    const s = await apiDelete(`/members/${id}`);
    state.members = s.members;
  });
  render();
}

async function removeHistoryItem(memberId, idx) {
  await withErrorHandling(async () => {
    const s = await apiDelete(`/members/${memberId}/history/${idx}`);
    state.members = s.members;
  });
  render();
}

let searchDebounce = null;
function onSearchInput(memberId) {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => runSearch(memberId), 150);
}

async function runSearch(memberId) {
  const input = document.getElementById(`search-${memberId}`);
  const box = document.getElementById(`ac-${memberId}`);
  if (!input || !box) return;
  const q = input.value.trim();
  if (!q) { box.innerHTML = ""; return; }
  try {
    const r = await apiGet(`/books?search=${encodeURIComponent(q)}`);
    const matches = r.books || [];
    if (!matches.length) {
      box.innerHTML = `<div class="autocomplete"><div class="ac-item" style="cursor:default;color:#888;">No curated matches — try "＋ not listed"</div></div>`;
      return;
    }
    box.innerHTML = `<div class="autocomplete">${matches.map(b => `
      <div class="ac-item" data-book="${b.id}">
        ${escapeHtml(b.title)}<small>${escapeHtml(b.author)} · ${b.themes.join(", ")}</small>
      </div>`).join("")}</div>`;
    box.querySelectorAll(".ac-item[data-book]").forEach(item =>
      item.addEventListener("click", () => pickBook(memberId, item.dataset.book))
    );
  } catch (e) {
    box.innerHTML = "";
  }
}

async function pickBook(memberId, bookId) {
  const rating = parseInt(document.getElementById(`rating-${memberId}`).value, 10);
  await withErrorHandling(async () => {
    const s = await apiPost(`/members/${memberId}/history`, { bookId, rating });
    state.members = s.members;
  });
  render();
}

async function addCustomBook(memberId) {
  const searchInput = document.getElementById(`search-${memberId}`);
  const box = document.getElementById(`ac-${memberId}`);
  const title = (searchInput.value || "").trim();
  if (!title) {
    box.innerHTML = `<div class="autocomplete"><div class="ac-item" style="cursor:default;color:#a33;">Type a title in the search box first, then click "＋ not listed".</div></div>`;
    return;
  }
  const rating = parseInt(document.getElementById(`rating-${memberId}`).value, 10);
  box.innerHTML = `<div class="autocomplete"><div class="ac-item" style="cursor:default;">Fetching themes &amp; metadata…</div></div>`;
  await withErrorHandling(async () => {
    const s = await apiPost(`/members/${memberId}/history/custom`, { title, rating });
    state.members = s.state.members;
  });
  render();
}

/* ---------------- venn view ---------------- */
function renderVenn() {
  const { ranked, totalMembers } = lastOverlap;

  let svgCircles = "";
  const cx = 300, cy = 210;
  const positions = [[-70, -40], [70, -40], [-45, 60], [45, 60]];
  const maxR = 130, minR = 70;
  ranked.forEach((r, i) => {
    const [dx, dy] = positions[i] || [0, 0];
    const radius = minR + (maxR - minR) * r.score;
    const color = THEME_COLOR[r.theme] || "#555";
    svgCircles += `
      <circle cx="${cx+dx}" cy="${cy+dy}" r="${radius}" fill="${color}" fill-opacity="0.16" stroke="${color}" stroke-opacity="0.55" stroke-width="7"/>
      <circle cx="${cx+dx}" cy="${cy+dy}" r="${radius-8}" fill="none" stroke="${color}" stroke-opacity="0.25" stroke-width="3"/>
      <text x="${cx+dx}" y="${cy+dy-radius-12}" text-anchor="middle" font-family="Courier Prime, monospace" font-size="12" fill="#2b2417" font-weight="700">${THEME_ICON[r.theme] || ""} ${escapeHtml(r.theme)}</text>
      <text x="${cx+dx}" y="${cy+dy-radius+2}" text-anchor="middle" font-family="Courier Prime, monospace" font-size="10" fill="#524A38">${r.count}/${totalMembers} members</text>
    `;
  });

  const legend = ranked.map(r =>
    `<div class="legend-item"><span class="legend-swatch" style="background:${THEME_COLOR[r.theme] || "#555"}"></span>${escapeHtml(r.theme)} — overlap ${Math.round(r.score * 100)}</div>`
  ).join("");

  document.getElementById("app").innerHTML = `
    <div class="sheet">
      <h2 class="section-title">Group Preference Overlap</h2>
      <p class="section-sub">Ring size = how strongly the group leans toward that theme · Coffee-ring stains where interests overlap</p>
      ${errorBannerHtml()}
      <div class="venn-wrap">
        <svg viewBox="0 0 600 420" width="100%" style="max-width:560px;">
          <rect x="0" y="0" width="600" height="420" fill="#F3ECD9"/>
          ${svgCircles || '<text x="300" y="210" text-anchor="middle" font-family="Courier Prime" font-size="14" fill="#888">Not enough rated history yet.</text>'}
        </svg>
        <div class="theme-legend">${legend}</div>
        <p class="venn-caption">${ranked.length ? "These are the themes the whole group shares to some degree — the recommendation shelf is built from these overlaps." : "Add a few more rated books per member, then re-run the agent."}</p>
        <button class="btn brass" id="toShelfBtn">See Recommended Shelf →</button>
      </div>
    </div>
  `;
  document.getElementById("toShelfBtn").addEventListener("click", () => switchView("shelf"));
}

/* ---------------- shelf view ---------------- */
function renderShelf() {
  const cards = lastRecs.map((b, i) => `
    <div class="book-card">
      <div class="stamp"><div class="pct">${b.matchPercent}%</div><div class="lbl">match</div></div>
      ${coverHtml(b)}
      <div class="book-meta">
        <div class="author">by ${escapeHtml(b.author)}</div>
        <div class="pages">${b.pages} pages · ${b.coverageCount}/${b.totalMembers} members drawn to it</div>
      </div>
      <div class="book-chips">${chipsHtml(b.themes)}</div>
      <button class="btn pick-btn" data-idx="${i}">Pick This Book</button>
    </div>
  `).join("");

  document.getElementById("app").innerHTML = `
    <div class="sheet">
      <h2 class="section-title">Recommended Shelf</h2>
      <p class="section-sub">Ranked by group match — books already read by any member are excluded</p>
      ${errorBannerHtml()}
      <div class="book-grid">${cards || '<div class="empty-note">No recommendations yet — log more history and re-run the agent.</div>'}</div>
    </div>
  `;
  document.querySelectorAll(".pick-btn").forEach(btn =>
    btn.addEventListener("click", () => selectBookByIndex(parseInt(btn.dataset.idx, 10)))
  );
}

async function selectBookByIndex(i) {
  const book = lastRecs[i];
  if (!book) return;
  await withErrorHandling(async () => {
    const s = await apiPost("/selection", { bookId: book.id });
    state.selection = s.selection;
  });
  state.view = "calendar";
  render();
}

/* ---------------- calendar view ---------------- */
async function updateDates(field, value) {
  await withErrorHandling(async () => {
    const s = await apiPatch("/selection/dates", { field, value });
    state.selection = s.selection;
  });
  render();
}

async function toggleProgress(date) {
  await withErrorHandling(async () => {
    const s = await apiPatch("/selection/progress", { date });
    state.selection = s.selection;
  });
  render();
}

function renderCalendar() {
  const sel = state.selection;
  if (!sel) {
    document.getElementById("app").innerHTML = `<div class="sheet">${errorBannerHtml()}<p class="empty-note">No book selected yet. Head to the Shelf and pick one.</p></div>`;
    return;
  }
  const rows = (sel.schedule || []).map((s, i) => {
    const dObj = new Date(s.date + "T00:00:00");
    const dayLabel = dObj.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    const isMonday = dObj.getDay() === 1 && i > 0;
    const done = !!sel.progress[s.date];
    return `<tr class="${done ? "done" : ""} ${isMonday ? "week-sep" : ""}">
      <td><input type="checkbox" class="check" data-date="${s.date}" ${done ? "checked" : ""}></td>
      <td>${dayLabel}</td>
      <td>Read through page <strong>${s.target}</strong> of ${sel.pages}</td>
    </tr>`;
  }).join("");

  const completedCount = Object.values(sel.progress || {}).filter(Boolean).length;
  const totalDays = (sel.schedule || []).length;
  const pct = totalDays ? Math.round(100 * completedCount / totalDays) : 0;
  const main = sel.themes[0];

  document.getElementById("app").innerHTML = `
    <div class="sheet">
      <h2 class="section-title">Reading Schedule</h2>
      <p class="section-sub">Daily page milestones mapped to your meeting date</p>
      ${errorBannerHtml()}
      <div class="selected-banner">
        <div class="icon">${THEME_ICON[main] || "📖"}</div>
        <div>
          <h3>${escapeHtml(sel.title)}</h3>
          <div class="meta">by ${escapeHtml(sel.author)} · ${sel.pages} pages · ${chipsHtml(sel.themes)}</div>
        </div>
      </div>

      <div class="date-row">
        <div class="date-field">
          <label>Start reading</label>
          <input type="date" id="startDateInput" value="${sel.startDate}">
        </div>
        <div class="date-field">
          <label>Book club meeting</label>
          <input type="date" id="meetingDateInput" value="${sel.meetingDate}" min="${sel.startDate}">
        </div>
        <button class="btn ghost small" id="backToShelfBtn">← pick a different book</button>
      </div>

      <div class="progress-bar-wrap"><div class="progress-bar" style="width:${pct}%"></div></div>
      <div class="progress-label">${completedCount}/${totalDays} days checked off</div>

      <table class="ledger">
        <thead><tr><th></th><th>Date</th><th>Page target</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;

  document.getElementById("startDateInput").addEventListener("change", e => updateDates("startDate", e.target.value));
  document.getElementById("meetingDateInput").addEventListener("change", e => updateDates("meetingDate", e.target.value));
  document.getElementById("backToShelfBtn").addEventListener("click", () => switchView("shelf"));
  document.querySelectorAll(".check").forEach(cb =>
    cb.addEventListener("change", () => toggleProgress(cb.dataset.date))
  );
}

/* ---------------- reset (two-step, no window.confirm) ---------------- */
let resetArmed = false;
let resetArmedTimeout = null;
function renderResetLink() {
  const el = document.getElementById("resetLink");
  if (!el) return;
  el.textContent = resetArmed ? "click again to confirm erase" : "reset club data";
  el.style.color = resetArmed ? "#C97B7B" : "#B7B096";
}
async function resetClub() {
  if (!resetArmed) {
    resetArmed = true;
    renderResetLink();
    clearTimeout(resetArmedTimeout);
    resetArmedTimeout = setTimeout(() => { resetArmed = false; renderResetLink(); }, 4000);
    return;
  }
  clearTimeout(resetArmedTimeout);
  resetArmed = false;
  await withErrorHandling(async () => {
    const s = await apiPost("/reset", {});
    state.members = s.members;
    state.selection = s.selection;
  });
  state.view = "setup";
  render();
}

/* ---------------- main render ---------------- */
function render() {
  if (!state.loaded) {
    document.getElementById("app").innerHTML = `<div class="sheet"><p class="empty-note">Loading club data…</p></div>`;
    return;
  }
  renderTabs();
  if (state.view === "setup") renderSetup();
  else if (state.view === "venn") renderVenn();
  else if (state.view === "shelf") renderShelf();
  else if (state.view === "calendar") renderCalendar();
}

document.getElementById("resetLink").addEventListener("click", resetClub);
init();
