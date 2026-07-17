# Fieldnotes — Science News Aggregator & Explainer

A personalised daily science digest. An "agent" pipeline polls space, biology,
and physics sources, classifies each article by domain, adapts its language to
a chosen reading level, attaches a featured image, and assembles a digest —
exactly the flow described in the brief. This build is a fully working
front-end with the agent logic implemented as real, inspectable code; swap the
one data source for live APIs and it becomes the production pipeline.

## Run it

No build step. From this folder:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080` in a browser. (Opening `index.html`
directly via `file://` also works, since the app uses plain `<script>` tags,
not ES modules.)

First visit lands on **Preferences**, where you pick domains and a reading
level and hit **Activate** — that's what triggers the first agent run.

## Pages → brief mapping

| Brief page | File | Notes |
|---|---|---|
| Preference Setup Page | `js/pages/setup.js` | Domain checkboxes + reading-level slider (beginner→expert). "Activate" streams a live agent run log, then runs the pipeline and redirects to the digest. |
| Daily Science Digest Feed | `js/pages/digest.js` | Agent-adapted cards: domain tag, reading time, featured image, per-domain filter chips, "Re-run agent." |
| Article Detail Page | `js/pages/article.js` | Agent-simplified text with a live level switcher (beginner/intermediate/advanced/expert) and a link to the original source. |
| Saved Articles Bookshelf | `js/pages/bookshelf.js` | Bookmarked articles; agent flags newer digest articles sharing a tag with each saved piece. |
| Trending Topics Word Cloud | `js/pages/trending.js` | Word cloud + ranked table generated from tag frequency across the week's digest, colour-coded by domain. |

## The agent pipeline (`js/agent.js`)

```
Agent.pollSources(domains)      → filter raw source pool to chosen domains
Agent.classify(articles)        → tag/stamp each article (classifier hook)
Agent.adapt(articles, level)    → pick/generate the reading-level version
Agent.attachImages(articles)    → attach a featured image per article
Agent.runDailyDigest(prefs)     → runs all four steps, returns the digest
```

Each article in `js/data.js` already carries four hand-written versions
(`beginner` / `intermediate` / `advanced` / `expert`) of its body text, since
this is a static demo with no live LLM call. To make this a real backend:

- Replace `RAW_ARTICLE_POOL` in `js/data.js` with a fetch from real space /
  biology / physics news APIs, run on a schedule (cron job, queue worker, or
  a scheduled cloud function) once per morning per user.
- Replace `Agent.classify` with a call to a classifier or small LLM prompt
  that assigns `domain` + `tags` to freshly polled articles.
- Replace the static `versions` object with a real-time LLM rewrite call,
  prompted with the target reading level, cached per article+level so it's
  only generated once.
- Replace `Agent.attachImages` with a real image search / stock API call.
- Move `Store` (currently `localStorage`) to a real per-user database so
  preferences, bookmarks, and cached digests sync across devices, and so the
  scheduled job has somewhere to write each morning's digest.

## Structure

```
science-news-aggregator/
├── index.html              shell: loads fonts, styles, and every script
├── css/styles.css          full visual system
├── js/
│   ├── data.js              mock source pool (15 articles, 3 domains, 4 levels each)
│   ├── storage.js           localStorage wrapper (prefs / bookmarks / digest cache)
│   ├── agent.js              the poll → classify → adapt → image pipeline
│   ├── components.js         shared article-card markup + bookmark wiring
│   ├── router.js              hash router (#/setup, #/digest, #/article/:id, ...)
│   ├── app.js                 top nav + bootstrap
│   └── pages/
│       ├── setup.js
│       ├── digest.js
│       ├── article.js
│       ├── bookshelf.js
│       └── trending.js
└── README.md
```

## Design notes

Dark "observatory field-journal" palette — deep navy background, warm paper
text, three instrument accents (space = periwinkle, biology = sage,
physics = amber). A monospace face carries all agent-generated metadata
(tags, timestamps, domain pills, the activation log); a serif carries the
human-adapted article prose — the pairing itself is meant to read as
"machine metadata vs. readable text," which is the whole premise of the app.
The signature element is the live terminal-style **agent run log** on the
Preferences page: it's the one moment the invisible daily agent becomes
visible and legible.
