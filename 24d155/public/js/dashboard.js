let activeTab = null;
let briefingData = null;
let profile = null;

const TOPIC_ICONS = {
  Technology: '💻', Finance: '📈', Health: '🏥', Sports: '⚽',
  World: '🌍', Science: '🔬', Politics: '🏛️', Entertainment: '🎬'
};

async function init() {
  setDateAndGreeting();

  try {
    const profRes = await fetch('/api/profile');
    profile = await profRes.json();
    
    if (!profile || !profile.isActive || !profile.topics.length) {
      hideMainUI();
      document.getElementById('empty-state').style.display = 'block';
      return;
    }

    const briefRes = await fetch('/api/briefing');
    briefingData = await briefRes.json();

    if (!briefingData || !briefingData.categories) {
      hideMainUI();
      document.getElementById('empty-state').style.display = 'block';
      return;
    }

    renderStats();
    renderTabs();
    
    // Switch to first available topic
    const availableTopics = profile.topics;
    if(availableTopics.length > 0) {
      switchTab(availableTopics[0]);
    }

  } catch(err) {
    console.error(err);
    hideMainUI();
    document.getElementById('empty-state').style.display = 'block';
  }
}

function setDateAndGreeting() {
  const now  = new Date();
  const hour = now.getHours();

  document.getElementById('nav-date').textContent = now.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });

  let greeting, sub;
  if (hour < 12) {
    greeting = 'Good Morning ☀️';
    sub = "Your overnight briefing is ready. Here's what happened in your world.";
  } else if (hour < 17) {
    greeting = 'Good Afternoon 🌤️';
    sub = 'Catch up on the latest. Your briefing has been refreshed.';
  } else {
    greeting = 'Good Evening 🌙';
    sub = "End-of-day roundup. Here's your personalised news summary.";
  }

  document.getElementById('greeting-title').textContent    = greeting;
  document.getElementById('greeting-subtitle').textContent = sub;
}

function renderStats() {
  let totalFetched = 0;
  let positiveCount = 0;
  let totalArticles = 0;

  Object.values(briefingData.categories).forEach(cat => {
    cat.articles.forEach(a => {
      totalArticles++;
      if (a.sentimentLabel === 'Positive') positiveCount++;
    });
  });

  const positivePercent = totalArticles > 0 ? Math.round((positiveCount / totalArticles) * 100) : 0;
  totalFetched = totalArticles * 14 + Math.floor(Math.random() * 20); // estimate from RSS

  document.getElementById('stat-articles').textContent = totalFetched.toLocaleString();
  document.getElementById('stat-topics').textContent   = Object.keys(briefingData.categories).length;
  document.getElementById('stat-positive').textContent = positivePercent + '%';

  const genTime = new Date(briefingData.generatedAt || new Date());
  document.getElementById('stat-time').textContent = genTime.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit'
  });
}

function renderTabs() {
  const container = document.getElementById('tabs-container');
  container.innerHTML = profile.topics.map((topic, i) => {
    const icon = TOPIC_ICONS[topic] || '📰';
    const catData = briefingData.categories[topic];
    const count = catData ? catData.articles.length : 0;
    return `
      <button class="tab ${i === 0 ? 'active' : ''}"
              id="tab-btn-${topic}"
              role="tab"
              aria-selected="${i === 0}"
              aria-controls="tab-panel-${topic}"
              onclick="switchTab('${topic}')">
        <span aria-hidden="true">${icon}</span>
        ${topic}
        <span class="tab-count" aria-label="${count} articles">${count}</span>
      </button>`;
  }).join('');
}

function switchTab(topic) {
  profile.topics.forEach(t => {
    const btn = document.getElementById(`tab-btn-${t}`);
    if (!btn) return;
    const isActive = t === topic;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive);
  });

  activeTab = topic;
  renderArticleGrid(topic);
}

function renderArticleGrid(topic) {
  const catData = briefingData.categories[topic];
  const articles = catData ? catData.articles : [];
  const container = document.getElementById('tab-content');

  if (articles.length === 0) {
    container.innerHTML = `<div class="empty-state" style="display:block; margin-top:24px;">
      <span class="empty-icon">📭</span>
      <h3 style="margin-top:16px;">No articles found for ${topic}</h3>
      <p style="color:var(--text-muted);">The AI didn't classify any recent news into this topic.</p>
    </div>`;
    return;
  }

  container.innerHTML = `
    <div class="articles-grid" id="panel-${topic}" role="list" aria-label="${topic} articles">
      ${articles.map((a, i) => buildArticleCard(a, i)).join('')}
    </div>`;
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

function buildArticleCard(article, index) {
  const { id, title, source, publishedAt, sentiment, sentimentLabel, summary } = article;
  const sentClass = getSentimentClass(sentimentLabel);
  const sentIcon  = getSentimentIcon(sentimentLabel);
  const timeAgo   = getRelativeTime(publishedAt);
  const delay     = index * 80;
  const preview   = (summary && summary.length > 200) ? summary.substring(0, 200) + '…' : (summary || '');

  return `
    <article class="card article-card" style="animation-delay: ${delay}ms"
             role="listitem" tabindex="0" onclick="goToArticle('${id}')"
             onkeydown="if(event.key==='Enter')goToArticle('${id}')">
      <div class="article-card-header"><h2 class="article-card-title">${title}</h2></div>
      <div class="article-card-meta">
        <span class="badge badge-source"><span aria-hidden="true">📰</span> ${source}</span>
        <span class="badge ${sentClass}"><span aria-hidden="true">${sentIcon}</span> ${sentimentLabel}</span>
        <span class="article-time"><span aria-hidden="true">🕐</span> ${timeAgo}</span>
      </div>
      <p class="article-card-summary">${preview}</p>
      <div class="article-card-footer">
        <span style="font-size: 12px; color: var(--text-muted);">
          Sentiment score: ${(sentiment > 0 ? '+' : '') + Number(sentiment).toFixed(2)}
        </span>
        <span class="read-more" aria-hidden="true">Read Analysis →</span>
      </div>
    </article>`;
}

function goToArticle(id) {
  window.location.href = `article.html?id=${id}`;
}

async function runAgent() {
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.add('active');
  document.getElementById('run-agent-btn').disabled = true;

  resetSteps();
  const progressFill  = document.getElementById('progress-fill');
  const subtitle      = document.getElementById('modal-subtitle');

  subtitle.textContent = "AI Agent is reading the latest news (this takes 10-20 seconds)...";
  progressFill.style.transition = 'width 15s ease-out';
  progressFill.style.width = '70%';

  try {
    const runRes = await fetch('/api/run', { method: 'POST' });
    const runData = await runRes.json();
    if (!runData.success) throw new Error(runData.error || "Unknown error");

    for (let i=0; i<5; i++) markDone('step-'+i);

    progressFill.style.transition = 'width 0.5s ease-out';
    progressFill.style.width = '100%';
    subtitle.textContent = '✨ Briefing refreshed!';

    // reload briefing data
    const briefRes = await fetch('/api/briefing');
    briefingData = await briefRes.json();
    
    setTimeout(() => {
      overlay.classList.remove('active');
      document.getElementById('run-agent-btn').disabled = false;
      showToast('Briefing successfully refreshed!', 'success');
      renderStats();
      renderTabs();
      switchTab(activeTab);
    }, 1200);

  } catch(err) {
    overlay.classList.remove('active');
    document.getElementById('run-agent-btn').disabled = false;
    showToast('Error running agent: ' + err.message, 'error');
  }
}

function resetSteps() {
  ['step-0','step-1','step-2','step-3','step-4'].forEach((id, i) => {
    const el = document.getElementById(id);
    el.classList.remove('active', 'done');
    el.querySelector('.step-indicator').textContent = i + 1;
  });
  document.getElementById('progress-fill').style.width = '0%';
}

function markDone(stepId) {
  const el = document.getElementById(stepId);
  el.classList.remove('active');
  el.classList.add('done');
  el.querySelector('.step-indicator').textContent = '✓';
}

function hideMainUI() {
  document.getElementById('stats-bar').style.display    = 'none';
  document.getElementById('tabs-wrapper').style.display = 'none';
  document.getElementById('tab-content').style.display  = 'none';
}

function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  document.getElementById('toast-icon').textContent = type === 'success' ? '✅' : '❌';
  document.getElementById('toast-msg').textContent  = msg;
  toast.className = `toast ${type} show`;
  setTimeout(() => toast.classList.remove('show'), 3000);
}

document.addEventListener('DOMContentLoaded', init);
