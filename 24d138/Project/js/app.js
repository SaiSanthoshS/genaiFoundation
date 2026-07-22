/* ========================================
   APP — Main Orchestrator
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
  const Data = window.ElectionData;
  const Utils = window.Utils;
  const Agent = window.Agent;

  // ---- Init all modules ----
  window.MapModule.init();
  window.LeaderboardModule.init();
  window.FeedModule.init();
  window.DrilldownModule.init();
  window.SentimentModule.init();
  window.NotificationsModule.init();

  // ---- Region Selector ----
  const chipsContainer = document.getElementById('region-chips');
  const searchInput = document.getElementById('region-search');
  const searchResults = document.getElementById('search-results');
  let selectedState = null;

  // Render state chips
  function renderChips() {
    // Group by region
    const regions = {};
    Data.STATES.forEach(s => {
      if (!regions[s.region]) regions[s.region] = [];
      regions[s.region].push(s);
    });

    // Show "All" chip + top states by seats
    const topStates = [...Data.STATES].sort((a, b) => b.seats - a.seats).slice(0, 15);

    chipsContainer.innerHTML = `
      <button class="chip active" data-state="all">
        All India
        <span class="chip__count">${Data.TOTAL_SEATS}</span>
      </button>
      ${topStates.map(s => `
        <button class="chip" data-state="${s.id}">
          ${s.name}
          <span class="chip__count">${s.seats}</span>
        </button>
      `).join('')}
    `;

    chipsContainer.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;

      chipsContainer.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const stateId = chip.dataset.state;
      if (stateId === 'all') {
        selectedState = null;
        Agent.setFilter(null);
        window.MapModule.highlightState(null);
      } else {
        selectedState = stateId;
        Agent.setFilter(stateId);
        window.MapModule.highlightState(stateId);
      }
    });
  }
  renderChips();

  // ---- Search Autocomplete ----
  const allSearchItems = Data.CONSTITUENCIES.map(c => {
    const state = Data.STATES.find(s => s.id === c.stateId);
    return { id: c.id, name: c.name, state: state?.name || '', stateId: c.stateId };
  });

  searchInput?.addEventListener('input', Utils.debounce((e) => {
    const query = e.target.value.trim().toLowerCase();
    if (query.length < 2) {
      searchResults.classList.remove('visible');
      return;
    }

    const matches = allSearchItems
      .filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.state.toLowerCase().includes(query)
      )
      .slice(0, 10);

    if (matches.length === 0) {
      searchResults.classList.remove('visible');
      return;
    }

    searchResults.innerHTML = matches.map(m => `
      <div class="search-result-item" data-id="${m.id}" data-state="${m.stateId}">
        <span>${m.name}</span>
        <span class="search-result-item__state">${m.state}</span>
      </div>
    `).join('');

    searchResults.classList.add('visible');
  }, 150));

  searchResults?.addEventListener('click', (e) => {
    const item = e.target.closest('.search-result-item');
    if (!item) return;

    const id = parseInt(item.dataset.id);
    const stateId = item.dataset.state;
    searchInput.value = '';
    searchResults.classList.remove('visible');

    // Focus state
    Agent.setFilter(stateId);
    window.MapModule.highlightState(stateId);

    // Open drilldown if declared
    const constituency = Data.CONSTITUENCIES.find(c => c.id === id);
    if (constituency?.declared) {
      Agent.bus.emit('drilldown:open', id);
    }

    // Highlight chip
    chipsContainer.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    const stateChip = chipsContainer.querySelector(`[data-state="${stateId}"]`);
    if (stateChip) stateChip.classList.add('active');
  });

  // Close search on click outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-box')) {
      searchResults?.classList.remove('visible');
    }
  });

  // ---- Map State Click → Region Select ----
  Agent.bus.on('map:stateClick', (stateId) => {
    selectedState = stateId;
    Agent.setFilter(stateId);
    window.MapModule.highlightState(stateId);

    chipsContainer.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    const stateChip = chipsContainer.querySelector(`[data-state="${stateId}"]`);
    if (stateChip) {
      stateChip.classList.add('active');
      stateChip.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  });

  // ---- Controls: Start / Pause / Reset ----
  const startBtn = document.getElementById('btn-start');
  const pauseBtn = document.getElementById('btn-pause');
  const resetBtn = document.getElementById('btn-reset');
  const liveBadge = document.getElementById('live-badge');
  const liveBadgeDot = liveBadge?.querySelector('.live-badge__dot');

  startBtn?.addEventListener('click', () => {
    Agent.start();
  });

  pauseBtn?.addEventListener('click', () => {
    Agent.togglePause();
  });

  resetBtn?.addEventListener('click', () => {
    Agent.reset();
  });

  // Agent status updates
  Agent.bus.on('agent:status', ({ status }) => {
    if (status === 'running') {
      startBtn.classList.add('hidden');
      pauseBtn.classList.remove('hidden');
      pauseBtn.innerHTML = '⏸ Pause';
      liveBadge.classList.remove('live-badge--paused');
      liveBadge.querySelector('.live-badge__text').textContent = 'LIVE';
    } else if (status === 'paused') {
      pauseBtn.innerHTML = '▶ Resume';
      liveBadge.classList.add('live-badge--paused');
      liveBadge.querySelector('.live-badge__text').textContent = 'PAUSED';
    } else if (status === 'idle' || status === 'complete') {
      startBtn.classList.remove('hidden');
      pauseBtn.classList.add('hidden');
      if (status === 'complete') {
        liveBadge.querySelector('.live-badge__text').textContent = 'COMPLETE';
        liveBadge.classList.add('live-badge--paused');
      } else {
        liveBadge.querySelector('.live-badge__text').textContent = 'READY';
        liveBadge.classList.add('live-badge--paused');
      }
    }
  });

  // ---- Speed Controls ----
  const speedBtns = document.querySelectorAll('.speed-btn');
  speedBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const speed = parseInt(btn.dataset.speed);
      Agent.setSpeed(speed);
      speedBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // ---- Clock ----
  const clockEl = document.getElementById('header-clock');
  function updateClock() {
    if (clockEl) {
      clockEl.textContent = new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      });
    }
  }
  updateClock();
  setInterval(updateClock, 1000);

  // ---- Keyboard Shortcuts ----
  document.addEventListener('keydown', (e) => {
    // Don't trigger when typing in inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        if (Agent.isRunning()) Agent.togglePause();
        else Agent.start();
        break;
      case 'KeyR':
        if (!e.ctrlKey && !e.metaKey) Agent.reset();
        break;
      case 'Digit1': Agent.setSpeed(1); activateSpeedBtn(1); break;
      case 'Digit2': Agent.setSpeed(2); activateSpeedBtn(2); break;
      case 'Digit5': Agent.setSpeed(5); activateSpeedBtn(5); break;
      case 'Digit0': Agent.setSpeed(10); activateSpeedBtn(10); break;
    }
  });

  function activateSpeedBtn(speed) {
    speedBtns.forEach(b => {
      b.classList.toggle('active', parseInt(b.dataset.speed) === speed);
    });
  }

  // ---- Init stats ----
  const remainingEl = document.getElementById('stat-remaining');
  if (remainingEl) remainingEl.textContent = Data.TOTAL_SEATS;
});
