/* ========================================
   FEED — Live Update Feed
   ======================================== */

window.FeedModule = ((Data, Utils, Agent) => {
  let listEl, filterGroup;
  let activeFilter = 'all'; // 'all' | 'upsets' | partyId
  const maxCards = 200;

  function init() {
    listEl = document.getElementById('feed-list');
    filterGroup = document.getElementById('feed-filters');

    Agent.bus.on('result:declared', onResult);
    Agent.bus.on('milestone:reached', onMilestone);
    Agent.bus.on('agent:reset', reset);

    // Filter buttons
    filterGroup?.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      filterGroup.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeFilter = chip.dataset.filter;
      applyFilter();
    });

    renderEmpty();
  }

  function onResult(data) {
    const c = data.constituency;
    const party = Data.PARTIES[c.result2024.winner];
    const state = Data.STATES.find(s => s.id === c.stateId);
    const candidates = c.result2024.candidates;
    const margin = candidates[0]?.votes - (candidates[1]?.votes || 0);

    const card = document.createElement('div');
    card.className = `feed-card ${c.result2024.isUpset ? 'feed-card--upset' : ''}`;
    card.setAttribute('data-party', c.result2024.winner);
    card.setAttribute('data-type', c.result2024.isUpset ? 'upset' : 'result');
    card.setAttribute('data-id', c.id);

    card.innerHTML = `
      <div class="feed-card__header">
        <div>
          <div class="feed-card__constituency">${c.name}</div>
          <div class="feed-card__state">${state?.name || ''}</div>
        </div>
        <span class="feed-card__time">${Utils.formatTime(c.declaredAt)}</span>
      </div>
      <div class="feed-card__result">
        <span class="feed-card__party-tag" style="${Utils.partyBgStyle(c.result2024.winner, 0.2)}">
          ${party?.emoji || ''} ${party?.abbr || ''}
        </span>
        <span class="feed-card__winner">${candidates[0]?.name || ''}</span>
        <span class="feed-card__margin">by ${Utils.formatVotes(margin)}</span>
      </div>
      ${c.result2024.isUpset ? `
        <div class="feed-card__footer">
          <span class="badge badge--upset">⚡ UPSET</span>
          <span class="text-xs text-tertiary">
            Was ${Data.PARTIES[c.prev2019.winner]?.abbr || ''} in 2019
          </span>
        </div>
      ` : ''}
    `;

    // Click to open drilldown
    card.addEventListener('click', () => {
      Agent.bus.emit('drilldown:open', c.id);
    });

    // Check filter visibility
    if (activeFilter !== 'all') {
      if (activeFilter === 'upsets' && !c.result2024.isUpset) {
        card.style.display = 'none';
      } else if (activeFilter !== 'upsets' && c.result2024.winner !== activeFilter) {
        card.style.display = 'none';
      }
    }

    // Remove empty state
    const emptyState = listEl.querySelector('.empty-state');
    if (emptyState) emptyState.remove();

    // Prepend (newest on top)
    listEl.prepend(card);

    // Cap cards
    while (listEl.children.length > maxCards) {
      listEl.lastChild.remove();
    }
  }

  function onMilestone(data) {
    const card = document.createElement('div');
    card.className = 'feed-card feed-card--milestone';
    card.setAttribute('data-type', 'milestone');

    const party = data.party ? Data.PARTIES[data.party] : null;

    card.innerHTML = `
      <div class="feed-card__header">
        <span class="feed-card__milestone-text">${data.message}</span>
        <span class="feed-card__time">${Utils.formatTime(new Date())}</span>
      </div>
    `;

    const emptyState = listEl.querySelector('.empty-state');
    if (emptyState) emptyState.remove();

    listEl.prepend(card);
  }

  function applyFilter() {
    const cards = listEl.querySelectorAll('.feed-card');
    cards.forEach(card => {
      const type = card.getAttribute('data-type');
      const partyId = card.getAttribute('data-party');

      if (activeFilter === 'all') {
        card.style.display = '';
      } else if (activeFilter === 'upsets') {
        card.style.display = type === 'upset' || type === 'milestone' ? '' : 'none';
      } else {
        card.style.display = partyId === activeFilter || type === 'milestone' ? '' : 'none';
      }
    });
  }

  function renderEmpty() {
    listEl.innerHTML = `
      <div class="empty-state">
        <span class="empty-state__icon">📡</span>
        <span class="empty-state__text">No results yet<br>Declarations will appear here live</span>
      </div>
    `;
  }

  function reset() {
    renderEmpty();
    activeFilter = 'all';
    filterGroup?.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    filterGroup?.querySelector('[data-filter="all"]')?.classList.add('active');
  }

  return { init };
})(window.ElectionData, window.Utils, window.Agent);
