require('dotenv').config();

const express = require('express');
const path = require('path');
const reviewRoutes = require('./routes/review');

const app = express();

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', reviewRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    anthropicKeyConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
    githubTokenConfigured: Boolean(process.env.GITHUB_TOKEN)
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Scanline is running at http://localhost:${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('Warning: ANTHROPIC_API_KEY is not set. Copy .env.example to .env and add your key.');
  }
});
