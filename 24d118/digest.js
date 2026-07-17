/* ============================================================
   PAGE: Daily Science Digest Feed
   ============================================================ */

Pages = window.Pages || {};

Pages.digest = function (root) {
  const prefs = Store.getPrefs();
  let digest = Store.getDigest();
  if (!digest) {
    digest = Agent.runDailyDigest(prefs);
    Store.setDigest(digest);
  }

  const lastRun = Store.getLastRun();
  const lastRunLabel = lastRun
    ? new Date(lastRun).toLocaleString(undefined, { hour: "numeric", minute: "2-digit", month: "short", day: "numeric" })
    : "just now";

  let activeFilter = "all";

  root.innerHTML = `
    <div class="shell">
      <div class="eyebrow" style="margin-top:36px;">Today's digest</div>
      <h1 class="page-title">Your daily science digest</h1>
      <p class="page-sub">Adapted to <strong style="color:var(--space)">${prefs.level}</strong> reading level across ${prefs.domains.length} domain${prefs.domains.length === 1 ? "" : "s"}. Last agent run: ${lastRunLabel}.</p>

      <div class="feed-toolbar">
        <div id="filter-chips" style="display:flex; gap:8px; flex-wrap:wrap;"></div>
        <div style="display:flex; align-items:center; gap:14px;">
          <span class="feed-meta" id="result-count"></span>
          <button class="btn small" id="rerun-btn">↻ Re-run agent</button>
        </div>
      </div>

      <div id="card-grid" class="card-grid"></div>
      <div id="empty-slot"></div>
    </div>
  `;

  const chipsEl = root.querySelector("#filter-chips");
  const gridEl = root.querySelector("#card-grid");
  const emptySlot = root.querySelector("#empty-slot");
  const countEl = root.querySelector("#result-count");
  const rerunBtn = root.querySelector("#rerun-btn");

  function renderChips() {
    const chips = ["all", ...prefs.domains];
    chipsEl.innerHTML = chips
      .map((d) => {
        const label = d === "all" ? "All" : DOMAIN_META[d].label;
        const active = activeFilter === d;
        const accent = d === "all" ? "var(--paper)" : DOMAIN_META[d].accent;
        return `<button class="btn small" data-filter="${d}" style="${active ? `background:${accent};color:#0E1220;border-color:${accent};font-weight:700;` : ""}">${label}</button>`;
      })
      .join("");
    chipsEl.querySelectorAll("[data-filter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeFilter = btn.dataset.filter;
        renderChips();
        renderGrid();
      });
    });
  }

  function renderGrid() {
    const list = activeFilter === "all" ? digest : digest.filter((a) => a.domain === activeFilter);
    countEl.textContent = `${list.length} article${list.length === 1 ? "" : "s"}`;
    if (list.length === 0) {
      gridEl.style.display = "none";
      emptySlot.innerHTML = `
        <div class="empty-state">
          <div class="eyebrow">No articles</div>
          Nothing classified under this domain today. Try "All" or adjust your preferences.
        </div>`;
      return;
    }
    gridEl.style.display = "";
    emptySlot.innerHTML = "";
    gridEl.innerHTML = list.map((a) => Components.articleCardHTML(a)).join("");
    Components.wireBookmarkButtons(gridEl);
  }

  rerunBtn.addEventListener("click", () => {
    rerunBtn.textContent = "Running…";
    rerunBtn.disabled = true;
    setTimeout(() => {
      digest = Agent.runDailyDigest(prefs);
      Store.setDigest(digest);
      rerunBtn.textContent = "↻ Re-run agent";
      rerunBtn.disabled = false;
      renderGrid();
    }, 500);
  });

  renderChips();
  renderGrid();
};
