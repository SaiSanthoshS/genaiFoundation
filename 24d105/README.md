# Scanline — PR review agent

Point it at a GitHub pull request. It fetches the diff, analyzes every changed
file for logic errors, code smells, and known security vulnerabilities using
Claude, annotates the diff inline, scores the PR pass/fail, and can post the
findings back to GitHub as real review comments.

## Stack

- **Backend**: Node.js + Express (`server.js`, `routes/`, `services/`)
- **Frontend**: plain HTML/CSS/JS served as static files from `public/`
- **AI**: Anthropic Claude API (server-side, via `ANTHROPIC_API_KEY`)
- **GitHub**: GitHub REST API (PR metadata, diff files, review comments)
- **PDF export**: jsPDF, generated client-side from the report data

No React/build step required — open the folder in VS Code, install, run.

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env` and add your Anthropic API key:

```
ANTHROPIC_API_KEY=sk-ant-...
```

`GITHUB_TOKEN` is optional — without it, the server uses GitHub's unauthenticated
rate limit (60 requests/hour) and can only read public repos. Add a token to
raise that limit or default to reading your own private repos.

## Run

```bash
npm start
```

Then open **http://localhost:3000**.

For auto-restart on file changes during development:

```bash
npm run dev
```

## Using it

1. Paste a repo URL (`https://github.com/owner/repo`) and a PR number.
2. Click **Review pull request**. The server fetches the diff and sends each
   changed file to Claude for analysis.
3. Browse results in three tabs:
   - **Diff viewer** — the raw diff with inline annotation boxes on flagged lines
   - **Findings** — a filterable, severity-sorted table of every issue
   - **Report** — pass/fail verdict, severity breakdown, and a PDF export button
4. To post the findings back to the PR as real inline review comments, open
   **advanced**, paste a GitHub personal access token with `repo` scope
   (or `pull_requests: write` for fine-grained tokens), then use **Post inline
   comments to GitHub** on the Report tab. This asks for confirmation before
   writing anything, since it's a real, irreversible action on your repo.

## Project layout

```
scanline-pr-review-agent/
├── server.js               # Express app entry point
├── routes/
│   └── review.js           # POST /api/review, POST /api/post-comments
├── services/
│   ├── github.js            # GitHub REST API calls (PR, files, comments)
│   └── analyzer.js          # Per-file Claude analysis + JSON parsing
├── public/
│   ├── index.html
│   ├── styles.css
│   └── app.js                # Frontend: rendering, PDF export, GitHub posting
├── .env.example
└── package.json
```

## API

### `POST /api/review`
```json
{ "repoUrl": "https://github.com/owner/repo", "prNumber": "482", "githubToken": "optional" }
```
Returns `{ owner, repo, prNumber, headSha, files, findings }`.

### `POST /api/post-comments`
```json
{
  "repoUrl": "https://github.com/owner/repo",
  "prNumber": "482",
  "githubToken": "required, needs write access",
  "headSha": "...",
  "comments": [{ "body": "...", "path": "src/index.js", "line": 42 }]
}
```
Returns `{ posted, failed }`.

## Notes and limits

- Scans are capped at the first 15 changed files per PR to keep reviews fast;
  larger PRs get a note about the files that were skipped.
- Each file's diff patch is truncated to ~6000 characters before being sent
  to Claude, so very large single-file diffs may get partial analysis.
- Findings are Claude's assessment of the diff, not a substitute for human
  review — treat the pass/fail verdict as a triage signal, not a merge gate.
