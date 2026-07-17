/* ============================================================
   PAGE: Saved Articles Bookshelf
   ============================================================ */

Pages = window.Pages || {};

Pages.bookshelf = function (root) {
  const bookmarkIds = Store.getBookmarks();
  const digest = Store.getDigest() || [];
  const saved = bookmarkIds
    .map((id) => RAW_ARTICLE_POOL.find((a) => a.id === id))
    .filter(Boolean)
    .sort((x, y) => new Date(y.date) - new Date(x.date));

  root.innerHTML = `
    <div class="shell">
      <div class="eyebrow" style="margin-top:36px;">Bookshelf</div>
      <h1 class="page-title">Saved articles</h1>
      <p class="page-sub">Everything you've bookmarked. The agent checks each saved topic against today's digest and flags anything new that's related.</p>
      <div id="shelf-list"></div>
    </div>
  `;

  const listEl = root.querySelector("#shelf-list");

  if (saved.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="eyebrow">Bookshelf is empty</div>
        Tap the star on any article in your digest to save it here.
      </div>`;
    return;
  }

  listEl.innerHTML = saved
    .map((article) => {
      const meta = DOMAIN_META[article.domain];
      const related = Agent.getRelatedNew(article, digest);
      return `
        <div class="shelf-item">
          <a href="#/article/${article.id}"><img src="https://picsum.photos/seed/${article.imageSeed}/200/140" alt="" /></a>
          <div class="shelf-body">
            <span class="domain-pill ${article.domain}">${meta.glyph} ${meta.label}</span>
            <h4><a href="#/article/${article.id}" style="text-decoration:none; color:inherit;">${article.title}</a></h4>
            <span class="feed-meta">Saved · ${Components.formatDate(article.date)}</span>
            ${
              related.length > 0
                ? `<div class="related-flag">✦ ${related.length} new article${related.length > 1 ? "s" : ""} on this topic — <a href="#/article/${related[0].id}" style="color:inherit;">${Components.truncate(related[0].title, 46)}</a></div>`
                : ""
            }
          </div>
          <button class="btn small" data-bookmark-toggle="${article.id}" style="align-self:flex-start;">Remove</button>
        </div>
      `;
    })
    .join("");

  listEl.querySelectorAll("[data-bookmark-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      Store.toggleBookmark(btn.dataset.bookmarkToggle);
      Pages.bookshelf(root);
    });
  });
};
