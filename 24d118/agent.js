/* ============================================================
   AGENT PIPELINE
   Simulates the daily background agent described in the brief:
   poll sources -> classify by domain -> adapt language to the
   user's reading level -> attach images -> assemble digest.
   Swap RAW_ARTICLE_POOL for a live fetch() to real news APIs
   to make this a real backend job (e.g. run on a schedule via
   a cron trigger or queue worker).
   ============================================================ */

const Agent = {

  /** Step 1: poll sources, filtered to the domains the user cares about */
  pollSources(domains) {
    return RAW_ARTICLE_POOL.filter((a) => domains.includes(a.domain));
  },

  /** Step 2: classification is a no-op here since mock data is pre-tagged,
   *  but in production this is where an LLM or classifier would assign
   *  a `domain` + `tags` to each freshly polled article. */
  classify(articles) {
    return articles.map((a) => ({ ...a, classifiedAt: new Date().toISOString() }));
  },

  /** Step 3: adapt each article's language to the chosen reading level */
  adapt(articles, level) {
    return articles.map((a) => ({
      ...a,
      adaptedText: a.versions[level],
      readingLevel: level,
      readTime: READ_TIME_BY_LEVEL[level],
    }));
  },

  /** Step 4: attach a featured image per article */
  attachImages(articles) {
    return articles.map((a) => ({
      ...a,
      image: `https://picsum.photos/seed/${a.imageSeed}/640/420`,
    }));
  },

  /** Full pipeline: run everything and return the finished digest */
  runDailyDigest(prefs) {
    let items = Agent.pollSources(prefs.domains);
    items = Agent.classify(items);
    items = Agent.adapt(items, prefs.level);
    items = Agent.attachImages(items);
    items.sort((x, y) => new Date(y.date) - new Date(x.date));
    return items;
  },

  /** Generates the human-readable log lines shown during "Activate" */
  buildRunLog(prefs) {
    const domainList = prefs.domains.map((d) => DOMAIN_META[d].label).join(", ") || "no domains";
    const lines = [
      `> connecting to source feeds...`,
      `> polling ${prefs.domains.length || 0} domain feed(s): ${domainList}`,
    ];
    prefs.domains.forEach((d) => {
      const count = RAW_ARTICLE_POOL.filter((a) => a.domain === d).length;
      lines.push(`> ${DOMAIN_META[d].label}: found ${count} new article(s)`);
    });
    lines.push(`> classifying articles by domain and topic...`);
    lines.push(`> classification complete`);
    lines.push(`> adapting language to reading level: ${prefs.level}`);
    lines.push(`> rewriting article text for clarity at "${prefs.level}" level...`);
    lines.push(`> fetching featured images...`);
    lines.push(`> images attached`);
    lines.push(`> assembling digest...`);
    lines.push(`> digest ready ✓`);
    return lines;
  },

  /** Word cloud data: frequency-weighted terms pulled from this week's digest */
  getTrendingTerms(digest) {
    const freq = {};
    const domainOf = {};
    digest.forEach((a) => {
      a.tags.forEach((tag) => {
        const key = tag.toLowerCase();
        freq[key] = (freq[key] || 0) + 1;
        domainOf[key] = a.domain;
      });
    });
    return Object.entries(freq)
      .map(([term, count]) => ({ term, count, domain: domainOf[term] }))
      .sort((x, y) => y.count - x.count);
  },

  /** Bookshelf helper: for a saved article, find newer digest articles
   *  sharing at least one tag, so the shelf can flag related coverage. */
  getRelatedNew(article, digest) {
    return digest.filter((a) =>
      a.id !== article.id &&
      new Date(a.date) > new Date(article.date) &&
      a.tags.some((t) => article.tags.includes(t))
    );
  },

  getArticleById(id) {
    const raw = RAW_ARTICLE_POOL.find((a) => a.id === id);
    if (!raw) return null;
    const prefs = Store.getPrefs() || { level: "intermediate" };
    const [adapted] = Agent.attachImages(Agent.adapt([raw], prefs.level));
    return adapted;
  },
};
