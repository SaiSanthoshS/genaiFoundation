const express = require('express');
const fs = require('fs');
const path = require('path');
const { fetchLatestNews } = require('../newsService');
const { processArticles } = require('../agent');

const router = express.Router();
const DB_FILE = path.join(__dirname, '../db.json');

function readDb() {
  if (!fs.existsSync(DB_FILE)) {
    return { profile: null, briefing: null };
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeDb(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

router.get('/profile', (req, res) => {
  res.json(readDb().profile || null);
});

router.post('/profile', (req, res) => {
  const db = readDb();
  db.profile = {
    ...req.body,
    isActive: true,
    activatedAt: new Date().toISOString()
  };
  writeDb(db);
  res.json({ success: true, profile: db.profile });
});

router.get('/briefing', (req, res) => {
  res.json(readDb().briefing || null);
});

router.post('/run', async (req, res) => {
  try {
    const db = readDb();
    if (!db.profile || !db.profile.isActive) {
      return res.status(400).json({ error: 'Profile not set up yet.' });
    }

    const { topics, sources } = db.profile;
    
    console.log(`[Agent] Fetching articles from ${sources.length} sources...`);
    const rawArticles = await fetchLatestNews(sources);
    console.log(`[Agent] Fetched ${rawArticles.length} raw articles.`);

    if (rawArticles.length === 0) {
      throw new Error("No articles fetched from RSS. Check your source selections.");
    }

    console.log(`[Agent] Processing with Gemini API...`);
    const categorizedNews = await processArticles(rawArticles, topics);
    console.log(`[Agent] Processing complete.`);

    const newBriefing = {
      id: new Date().toISOString().split('T')[0],
      generatedAt: new Date().toISOString(),
      categories: categorizedNews
    };

    db.briefing = newBriefing;
    writeDb(db);

    res.json({ success: true, briefing: newBriefing });
  } catch (err) {
    console.error('Agent error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
