const express = require("express");
const crypto = require("crypto");
const store = require("../lib/store");
const engine = require("../lib/engine");
const { CURATED_BOOKS, THEMES } = require("../lib/books");
const { fetchBookMetadata } = require("../lib/claude");

const router = express.Router();

function uid() {
  return crypto.randomBytes(4).toString("hex");
}

function findMember(state, id) {
  return state.members.find((m) => m.id === id);
}

/* ---------- state / bootstrap ---------- */

router.get("/state", (req, res) => {
  const state = store.readState();
  res.json(state);
});

router.get("/books", (req, res) => {
  const q = (req.query.search || "").toLowerCase();
  const matches = q
    ? CURATED_BOOKS.filter((b) => b.title.toLowerCase().includes(q)).slice(0, 8)
    : CURATED_BOOKS;
  res.json({ books: matches, themes: THEMES });
});

/* ---------- members ---------- */

router.post("/members", async (req, res) => {
  const name = (req.body.name || "").trim();
  if (!name) return res.status(400).json({ error: "name is required" });

  const { state } = await store.update((s) => {
    s.members.push({ id: uid(), name, history: [] });
  });
  res.status(201).json(state);
});

router.delete("/members/:id", async (req, res) => {
  const { state } = await store.update((s) => {
    s.members = s.members.filter((m) => m.id !== req.params.id);
  });
  res.json(state);
});

router.post("/members/:id/history", async (req, res) => {
  const { bookId, rating } = req.body;
  const book = CURATED_BOOKS.find((b) => b.id === bookId);
  if (!book) return res.status(404).json({ error: "unknown bookId" });
  const r = Math.max(1, Math.min(5, parseInt(rating, 10) || 4));

  let notFound = false;
  const { state } = await store.update((s) => {
    const member = findMember(s, req.params.id);
    if (!member) {
      notFound = true;
      return;
    }
    member.history.push({
      title: book.title,
      author: book.author,
      pages: book.pages,
      themes: book.themes,
      rating: r
    });
  });
  if (notFound) return res.status(404).json({ error: "member not found" });
  res.status(201).json(state);
});

router.post("/members/:id/history/custom", async (req, res) => {
  const title = (req.body.title || "").trim();
  const authorGuess = (req.body.author || "").trim();
  const rating = Math.max(1, Math.min(5, parseInt(req.body.rating, 10) || 4));
  if (!title) return res.status(400).json({ error: "title is required" });

  const memberExists = findMember(store.readState(), req.params.id);
  if (!memberExists) return res.status(404).json({ error: "member not found" });

  // Metadata fetch happens outside the write-lock since it's a slow network call.
  const meta = await fetchBookMetadata(title, authorGuess);

  const { state } = await store.update((s) => {
    const member = findMember(s, req.params.id);
    if (!member) return;
    member.history.push({
      title,
      author: meta.author,
      pages: meta.pages,
      themes: meta.themes,
      rating
    });
  });

  res.status(201).json({ state, meta });
});

router.delete("/members/:id/history/:index", async (req, res) => {
  const idx = parseInt(req.params.index, 10);
  const { state } = await store.update((s) => {
    const member = findMember(s, req.params.id);
    if (!member) return;
    member.history.splice(idx, 1);
  });
  res.json(state);
});

/* ---------- agent: overlap + recommendations ---------- */

router.get("/overlap", (req, res) => {
  const state = store.readState();
  const { ranked, totalMembers } = engine.rankedOverlap(state.members, 4);
  res.json({ ranked, totalMembers });
});

router.get("/recommendations", (req, res) => {
  const state = store.readState();
  const recs = engine.computeRecommendations(state.members, 6);
  res.json({ recommendations: recs });
});

/* ---------- selection + schedule ---------- */

router.post("/selection", async (req, res) => {
  const { bookId } = req.body;
  const state = store.readState();
  const recs = engine.computeRecommendations(state.members, 50);
  const book = recs.find((b) => b.id === bookId) || CURATED_BOOKS.find((b) => b.id === bookId);
  if (!book) return res.status(404).json({ error: "book not found among recommendations" });

  const today = new Date();
  const meeting = new Date(today.getTime() + 21 * 24 * 3600 * 1000);

  const selection = {
    title: book.title,
    author: book.author,
    pages: book.pages,
    themes: book.themes,
    startDate: today.toISOString().slice(0, 10),
    meetingDate: meeting.toISOString().slice(0, 10),
    progress: {}
  };
  selection.schedule = engine.buildSchedule(selection);

  const result = await store.update((s) => {
    s.selection = selection;
  });
  res.status(201).json(result.state);
});

router.patch("/selection/dates", async (req, res) => {
  const { field, value } = req.body;
  if (!["startDate", "meetingDate"].includes(field)) {
    return res.status(400).json({ error: "field must be startDate or meetingDate" });
  }
  let notFound = false;
  const { state } = await store.update((s) => {
    if (!s.selection) {
      notFound = true;
      return;
    }
    s.selection[field] = value;
    s.selection.schedule = engine.buildSchedule(s.selection);
  });
  if (notFound) return res.status(404).json({ error: "no active selection" });
  res.json(state);
});

router.patch("/selection/progress", async (req, res) => {
  const { date } = req.body;
  let notFound = false;
  const { state } = await store.update((s) => {
    if (!s.selection) {
      notFound = true;
      return;
    }
    s.selection.progress[date] = !s.selection.progress[date];
  });
  if (notFound) return res.status(404).json({ error: "no active selection" });
  res.json(state);
});

/* ---------- reset ---------- */

router.post("/reset", async (req, res) => {
  const { state } = await store.update((s) => {
    s.members = [];
    s.selection = null;
  });
  res.json(state);
});

module.exports = router;
