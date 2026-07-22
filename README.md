# Common Chapter — Book Club Recommendation Engine

A small full-stack app that helps a book club agree on what to read next.

**Agent flow:** members log ratings for books they've already read → the
engine aggregates each member's theme preferences → finds the curated
titles with the strongest overlap across the whole group → and, once a
book is picked, builds a daily page-target reading schedule up to your
next meeting date.

## Stack

- **Backend:** Node.js + Express (`server.js`, `routes/api.js`, `lib/*`)
- **Storage:** a single JSON file (`data/db.json`), created automatically.
  Good for a demo / small group; swap `lib/store.js` for a real database
  if you need multi-instance or concurrent-write safety.
- **Frontend:** plain HTML/CSS/JS (`public/`), no build step, no framework.
- **AI step:** when a member adds a book that isn't in the curated list,
  the backend calls the Claude API (server-side, using your own API key)
  to infer its themes, page count, and author. If no API key is
  configured, it falls back to reasonable generic defaults so the app
  still works end to end.

## Project layout

```
common-chapter/
├── server.js              # Express entrypoint
├── routes/api.js           # REST API routes
├── lib/
│   ├── books.js             # curated book dataset + theme vocabulary
│   ├── engine.js            # theme-overlap scoring + schedule builder
│   ├── claude.js            # Claude API call for custom book metadata
│   └── store.js             # JSON-file persistence
├── public/
│   ├── index.html
│   ├── styles.css
│   └── app.js               # frontend, talks to /api/* via fetch
├── data/                   # db.json lives here at runtime (gitignored)
├── package.json
├── .env.example
└── .gitignore
```

## Running it locally

```bash
npm install
cp .env.example .env     # then optionally add your ANTHROPIC_API_KEY
npm start
```

Then open **http://localhost:3000**.

`ANTHROPIC_API_KEY` is optional. Without it, adding a book that isn't in
the curated list still works, just with placeholder theme/page data
instead of an AI-classified one.

## API summary

| Method | Path                              | Purpose                                   |
|--------|-----------------------------------|--------------------------------------------|
| GET    | `/api/state`                      | full current state (members + selection)   |
| GET    | `/api/books?search=`              | curated-book autocomplete                  |
| POST   | `/api/members`                    | add a member `{name}`                      |
| DELETE | `/api/members/:id`                | remove a member                            |
| POST   | `/api/members/:id/history`        | log a curated read `{bookId, rating}`      |
| POST   | `/api/members/:id/history/custom` | log a non-curated read `{title, rating}`   |
| DELETE | `/api/members/:id/history/:index` | remove one history entry                   |
| GET    | `/api/overlap`                    | ranked group theme-overlap scores          |
| GET    | `/api/recommendations`            | top recommended books                      |
| POST   | `/api/selection`                  | pick a book `{bookId}`, builds a schedule   |
| PATCH  | `/api/selection/dates`            | update start/meeting date `{field,value}`  |
| PATCH  | `/api/selection/progress`         | toggle a day done `{date}`                 |
| POST   | `/api/reset`                      | clear all club data                        |

## Pushing to GitHub

```bash
git init
git add .
git commit -m "Common Chapter: book club recommendation engine"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

`data/db.json`, `node_modules/`, and `.env` are already gitignored.

## Notes / known simplifications

- Single JSON file for storage — fine for a personal project or small
  group, not meant for high-concurrency production use.
- No authentication — anyone with the URL can see and edit the club's
  data, same as the original prototype.
- The reset button uses a two-step "click again to confirm" pattern
  instead of `window.confirm`, since blocking dialogs aren't guaranteed
  to work in every embedding context.
