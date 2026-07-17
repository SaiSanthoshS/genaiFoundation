const TOPIC_ICONS = {
  Technology: '💻', Finance: '📈', Health: '🏥', Sports: '⚽',
  World: '🌍', Science: '🔬', Politics: '🏛️', Entertainment: '🎬'
};

function getSentimentColor(score) {
  if (score >  0.25) return 'var(--positive)';
  if (score < -0.25) return 'var(--negative)';
  return 'var(--neutral)';
}

function getSentimentClass(label) {
  if (label === 'Positive') return 'badge-positive';
  if (label === 'Negative') return 'badge-negative';
  return 'badge-neutral';
}
function getSentimentIcon(label) {
  if (label === 'Positive') return '▲';
  if (label === 'Negative') return '▼';
  return '●';
}

function getRelativeTime(isoString) {
  const date  = new Date(isoString);
  const diffH = Math.floor((new Date() - date) / 3600000);
  if (diffH < 1)  return 'Just now';
  if (diffH === 1) return '1 hour ago';
  if (diffH < 24) return `${diffH} hours ago`;
  return `${Math.floor(diffH / 24)} days ago`;
}

function scoreToPercent(score) {
  return ((Number(score) + 1) / 2) * 100;
}

async function init() {
  const params  = new URLSearchParams(window.location.search);
  const id      = params.get('id');
  
  if (!id) {
    renderNotFound();
    return;
  }

  try {
    const res = await fetch('/api/briefing');
    const briefingData = await res.json();
    let foundArticle = null;
    
    if (briefingData && briefingData.categories) {
      for (const [topic, catData] of Object.entries(briefingData.categories)) {
        const article = catData.articles.find(a => a.id === id);
        if (article) {
          foundArticle = { ...article, category: topic, categoryIcon: TOPIC_ICONS[topic] || '📰' };
          break;
        }
      }
    }

    if (!foundArticle) {
      renderNotFound();
      return;
    }

    document.title = `${foundArticle.title} — NewsBrief`;
    renderArticle(foundArticle);
  } catch(err) {
    console.error(err);
    renderNotFound();
  }
}

function renderNotFound() {
  document.getElementById('article-view').innerHTML = `
    <div class="empty-state">
      <span class="empty-icon" aria-hidden="true">🔍</span>
      <h1 class="empty-title">Article not found</h1>
      <p class="empty-subtitle">The article you're looking for doesn't exist or may have been removed.</p>
      <a href="dashboard.html" class="btn btn-primary">← Back to Dashboard</a>
    </div>`;
}

function renderArticle(article) {
  const {
    title, source, publishedAt,
    sentiment, sentimentLabel, summary, highlights,
    category, categoryIcon, url
  } = article;

  const numSentiment = Number(sentiment);
  const sentColor   = getSentimentColor(numSentiment);
  const sentClass   = getSentimentClass(sentimentLabel);
  const sentIcon    = getSentimentIcon(sentimentLabel);
  const sentPct     = scoreToPercent(numSentiment);
  const timeAgo     = getRelativeTime(publishedAt);
  const pubDate     = new Date(publishedAt).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const highlightsHtml = (highlights || []).map((point, i) => `
    <li class="key-point" id="kp-${i}">
      <span class="key-point-num" aria-hidden="true">${i + 1}</span>
      <p class="key-point-text">${point}</p>
    </li>`).join('');

  document.getElementById('article-view').innerHTML = `
    <a href="dashboard.html" class="back-btn" aria-label="Return to dashboard">
      <span aria-hidden="true">←</span> Back to Dashboard
    </a>
    <div class="article-category-row">
      <span class="badge badge-source"><span aria-hidden="true">${categoryIcon}</span> ${category}</span>
      <span class="badge badge-source"><span aria-hidden="true">📰</span> ${source}</span>
      <span class="badge ${sentClass}"><span aria-hidden="true">${sentIcon}</span> ${sentimentLabel}</span>
    </div>
    <h1 class="article-title">${title}</h1>
    <div class="article-meta">
      <span><span aria-hidden="true">🕐</span> ${timeAgo}</span>
      <span><span aria-hidden="true">📅</span> ${pubDate}</span>
    </div>
    <div class="card sentiment-bar-wrapper">
      <div class="sentiment-bar-label">
        <span style="color: var(--negative);">🔴 Negative</span>
        <span class="center-label">Sentiment Analysis</span>
        <span style="color: var(--positive);">🟢 Positive</span>
      </div>
      <div class="sentiment-track">
        <div class="sentiment-marker" id="sent-marker"
             style="left: 50%; background: ${sentColor}; border-color: ${sentColor}; box-shadow: 0 0 12px ${sentColor}50;">
        </div>
      </div>
      <div class="sentiment-score-display">
        <span class="badge ${sentClass}">${sentIcon} ${sentimentLabel}</span>
        <span style="color: ${sentColor}; font-weight: 700;">
          ${(numSentiment > 0 ? '+' : '') + numSentiment.toFixed(2)}
        </span>
        <span style="color: var(--text-muted); font-size: 12px;">(scale: −1.0 to +1.0)</span>
      </div>
    </div>
    <div class="card summary-box">
      <div class="summary-label">🤖 AI-Generated Summary</div>
      <p class="summary-text">${summary}</p>
    </div>
    <section class="key-points-section">
      <h2 class="key-points-title">⚡ Key Highlights</h2>
      <ol class="key-points-list">${highlightsHtml}</ol>
    </section>
    <div class="text-center" style="padding-bottom: 48px;">
      <a href="${url || '#'}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-lg">
        <span aria-hidden="true">🔗</span> Read Original Article
      </a>
    </div>
  `;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const marker = document.getElementById('sent-marker');
      if (marker) marker.style.left = `calc(${sentPct}% - 9px)`;
    });
  });

  (highlights || []).forEach((_, i) => {
    setTimeout(() => {
      const el = document.getElementById(`kp-${i}`);
      if (el) el.classList.add('visible');
    }, 350 + i * 130);
  });
}

document.addEventListener('DOMContentLoaded', init);
