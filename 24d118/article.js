/* ============================================================
   PAGE: Article Detail
   ============================================================ */

Pages = window.Pages || {};

Pages.article = function (root, id) {
  const raw = RAW_ARTICLE_POOL.find((a) => a.id === id);
  if (!raw) {
    root.innerHTML = `<div class="shell"><div class="empty-state" style="margin-top:60px;">Article not found. <a href="#/digest" style="color:var(--space)">Back to digest</a></div></div>`;
    return;
  }

  const prefs = Store.getPrefs();
  let currentLevel = prefs.level;
  const meta = DOMAIN_META[raw.domain];

  root.innerHTML = `
    <div class="shell">
      <div style="margin-top:36px;">
        <a href="#/digest" class="eyebrow" style="text-decoration:none;">← Back to digest</a>
      </div>
      <div class="article-header">
        <span class="domain-pill ${raw.domain}">${meta.glyph} ${meta.label}</span>
        <h1>${raw.title}</h1>
        <div class="byline">
          <span>${raw.source}</span><span>·</span><span>${Components.formatDate(raw.date)}</span><span>·</span>
          <span id="read-time-label"></span>
        </div>
      </div>

      <img class="article-hero" src="https://picsum.photos/seed/${raw.imageSeed}/1200/600" alt="" />

      <div class="level-switcher" id="level-switcher"></div>

      <div class="article-body" id="article-body"></div>

      <div class="article-footer">
        <a class="source-link" href="${raw.sourceUrl}" target="_blank" rel="noopener">Read original source →</a>
        <div style="display:flex; gap:8px; align-items:center;">
          ${raw.tags.map((t) => `<span class="tag">${t}</span>`).join("")}
        </div>
      </div>

      <div style="margin-top:20px;">
        <button class="btn small" id="save-btn"></button>
      </div>

      <div class="related-block" id="related-block"></div>
    </div>
  `;

  const bodyEl = root.querySelector("#article-body");
  const switcherEl = root.querySelector("#level-switcher");
  const readTimeLabel = root.querySelector("#read-time-label");
  const saveBtn = root.querySelector("#save-btn");
  const relatedBlock = root.querySelector("#related-block");

  function renderLevelSwitcher() {
    switcherEl.innerHTML = READING_LEVELS.map(
      (lvl) => `<button data-level="${lvl}" class="${lvl === currentLevel ? "active" : ""}">${lvl}</button>`
    ).join("");
    switcherEl.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        currentLevel = btn.dataset.level;
        renderLevelSwitcher();
        renderBody();
      });
    });
  }

  function renderBody() {
    bodyEl.innerHTML = `<p>${raw.versions[currentLevel]}</p>`;
    readTimeLabel.textContent = READ_TIME_BY_LEVEL[currentLevel];
  }

  function renderSaveBtn() {
    const saved = Store.isBookmarked(raw.id);
    saveBtn.textContent = saved ? "★ Saved to bookshelf" : "☆ Save to bookshelf";
    saveBtn.classList.toggle("primary", saved);
  }

  saveBtn.addEventListener("click", () => {
    Store.toggleBookmark(raw.id);
    renderSaveBtn();
  });

  function renderRelated() {
    const digest = Store.getDigest() || [];
    const related = digest.filter((a) => a.id !== raw.id && a.tags.some((t) => raw.tags.includes(t))).slice(0, 3);
    if (related.length === 0) {
      relatedBlock.innerHTML = "";
      return;
    }
    relatedBlock.innerHTML = `
      <div class="panel-label">More on this topic</div>
      <div class="card-grid">${related.map((a) => Components.articleCardHTML(a)).join("")}</div>
    `;
    Components.wireBookmarkButtons(relatedBlock);
  }

  renderLevelSwitcher();
  renderBody();
  renderSaveBtn();
  renderRelated();
};
