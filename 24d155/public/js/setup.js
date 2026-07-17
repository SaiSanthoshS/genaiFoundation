const TOPICS = ['Technology', 'Finance', 'Health', 'Sports', 'World', 'Science', 'Politics', 'Entertainment'];

const SOURCES = [
  { id: 'bbc',        name: 'BBC News',         emoji: '🇬🇧' },
  { id: 'techcrunch', name: 'TechCrunch',        emoji: '🚀' },
  { id: 'reuters',    name: 'Reuters',           emoji: '📡' },
  { id: 'bloomberg',  name: 'Bloomberg',         emoji: '💼' },
  { id: 'espn',       name: 'ESPN',              emoji: '🏆' },
  { id: 'nature',     name: 'Nature',            emoji: '🌿' },
  { id: 'guardian',   name: 'The Guardian',      emoji: '🦅' },
  { id: 'wsj',        name: 'Wall St. Journal',  emoji: '📰' }
];

const TOPIC_ICONS = {
  Technology: '💻', Finance: '📈', Health: '🏥', Sports: '⚽',
  World: '🌍', Science: '🔬', Politics: '🏛️', Entertainment: '🎬'
};

let selectedTopics  = new Set();
let selectedSources = new Set();

async function init() {
  try {
    const res = await fetch('/api/profile');
    const profile = await res.json();
    if (profile && profile.isActive) {
      profile.topics.forEach(t => selectedTopics.add(t));
      profile.sources.forEach(s => selectedSources.add(s));
      document.getElementById('nav-dashboard-btn').style.display = 'inline-flex';
    }
  } catch (err) {
    console.error('No profile found or backend offline.');
  }

  renderTopics();
  renderSources();
  syncActivateBtn();
}

function renderTopics() {
  const grid = document.getElementById('topic-grid');
  grid.innerHTML = TOPICS.map(name => {
    const icon = TOPIC_ICONS[name] || '📰';
    const sel = selectedTopics.has(name);
    return `
      <div class="topic-card ${sel ? 'selected' : ''}"
           id="topic-card-${name}" role="checkbox" aria-checked="${sel}"
           tabindex="0" onclick="toggleTopic('${name}')"
           onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();toggleTopic('${name}')}">
        <span class="topic-icon" aria-hidden="true">${icon}</span>
        <span class="topic-name">${name}</span>
        <span class="topic-check" aria-hidden="true">✓</span>
      </div>`;
  }).join('');
}

function renderSources() {
  const grid = document.getElementById('source-grid');
  grid.innerHTML = SOURCES.map(src => {
    const sel = selectedSources.has(src.id);
    return `
      <div class="source-chip ${sel ? 'selected' : ''}"
           id="source-chip-${src.id}" role="checkbox" aria-checked="${sel}"
           tabindex="0" onclick="toggleSource('${src.id}')"
           onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();toggleSource('${src.id}')}">
        <span class="source-emoji" aria-hidden="true">${src.emoji}</span>
        <span class="source-name">${src.name}</span>
      </div>`;
  }).join('');
}

function toggleTopic(name) {
  selectedTopics.has(name) ? selectedTopics.delete(name) : selectedTopics.add(name);
  const sel = selectedTopics.has(name);
  const card = document.getElementById(`topic-card-${name}`);
  card.classList.toggle('selected', sel);
  card.setAttribute('aria-checked', sel);
  syncActivateBtn();
}

function toggleSource(id) {
  selectedSources.has(id) ? selectedSources.delete(id) : selectedSources.add(id);
  const sel = selectedSources.has(id);
  const chip = document.getElementById(`source-chip-${id}`);
  chip.classList.toggle('selected', sel);
  chip.setAttribute('aria-checked', sel);
}

function syncActivateBtn() {
  const btn  = document.getElementById('activate-btn');
  const hint = document.getElementById('cta-hint');
  const ok   = selectedTopics.size > 0;
  btn.disabled = !ok;
  btn.setAttribute('aria-disabled', !ok);
  hint.textContent = ok
    ? `${selectedTopics.size} topic(s) selected — ready to activate!`
    : 'Select at least one topic to continue';
}

function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  document.getElementById('toast-icon').textContent = type === 'success' ? '✅' : '❌';
  document.getElementById('toast-msg').textContent   = msg;
  toast.className = `toast ${type} show`;
  setTimeout(() => toast.classList.remove('show'), 3000);
}

async function activateAgent() {
  if (selectedTopics.size === 0) return;

  const profile = {
    topics: Array.from(selectedTopics),
    sources: Array.from(selectedSources)
  };

  try {
    await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
  } catch(err) {
    showToast('Failed to save profile', 'error');
    return;
  }

  const overlay = document.getElementById('modal-overlay');
  overlay.classList.add('active');
  const progressFill = document.getElementById('progress-fill');
  const subtitle = document.getElementById('modal-subtitle');

  // Mark all steps pending visually, except first one
  subtitle.textContent = "AI Agent is reading the news (this takes 10-20 seconds)...";
  progressFill.style.transition = 'width 15s ease-out'; 
  progressFill.style.width = '70%'; 

  try {
    const runRes = await fetch('/api/run', { method: 'POST' });
    const runData = await runRes.json();
    if (!runData.success) throw new Error(runData.error || "Unknown error");
    
    // Mark all steps done visually
    for (let i=0; i<5; i++) {
      const step = document.getElementById('step-'+i);
      step.classList.remove('active');
      step.classList.add('done');
      step.querySelector('.step-indicator').textContent = '✓';
    }

    progressFill.style.transition = 'width 0.5s ease-out';
    progressFill.style.width = '100%';
    subtitle.textContent = '✨ Your briefing is ready!';
    
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1200);

  } catch(err) {
    overlay.classList.remove('active');
    showToast('Error running agent: ' + err.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', init);
