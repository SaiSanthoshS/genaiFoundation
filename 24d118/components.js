/* ============================================================
   SHARED COMPONENTS
   ============================================================ */

const Components = {
  articleCardHTML(article) {
    const meta = DOMAIN_META[article.domain];
    const bookmarked = Store.isBookmarked(article.id);
    return `
      <a class="article-card" href="#/article/${article.id}" data-card-id="${article.id}">
        <button class="bookmark-btn ${bookmarked ? "active" : ""}" data-bookmark-toggle="${article.id}" title="Save to bookshelf" aria-label="Save to bookshelf">
          ${bookmarked ? "★" : "☆"}
        </button>
        <img class="thumb" src="${article.image}" alt="" loading="lazy" />
        <div class="card-body">
          <div class="card-top-row">
            <span class="domain-pill ${article.domain}">${meta.glyph} ${meta.label}</span>
          </div>
          <h3>${article.title}</h3>
          <p class="dek">${Components.truncate(article.adaptedText || article.versions.intermediate, 130)}</p>
          <div class="card-foot">
            <span>${Components.formatDate(article.date)}</span>
            <span>${article.readTime || READ_TIME_BY_LEVEL[article.readingLevel || "intermediate"]}</span>
          </div>
        </div>
      </a>
    `;
  },

  wireBookmarkButtons(container, onToggle) {
    container.querySelectorAll("[data-bookmark-toggle]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const id = btn.dataset.bookmarkToggle;
        Store.toggleBookmark(id);
        const active = Store.isBookmarked(id);
        btn.classList.toggle("active", active);
        btn.textContent = active ? "★" : "☆";
        if (onToggle) onToggle(id, active);
      });
    });
  },

  truncate(str, n) {
    if (!str) return "";
    return str.length > n ? str.slice(0, n).replace(/\s+\S*$/, "") + "…" : str;
  },

  formatDate(iso) {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  },
};
