/* ========================================
   DRILLDOWN — Constituency Detail Modal
   ======================================== */

window.DrilldownModule = ((Data, Utils, Agent) => {
  let overlayEl, modalEl;

  function init() {
    overlayEl = document.getElementById('modal-overlay');
    modalEl = document.getElementById('drilldown-modal');

    overlayEl.addEventListener('click', close);
    modalEl.querySelector('.modal__close')?.addEventListener('click', close);

    // Listen for clicks on feed cards and map states
    Agent.bus.on('drilldown:open', open);

    // Keyboard close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
  }

  function open(constituencyId) {
    const constituency = Data.CONSTITUENCIES.find(c => c.id === constituencyId);
    if (!constituency || !constituency.declared) return;

    renderConstituency(constituency);
    overlayEl.classList.add('visible');
    modalEl.classList.add('visible');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    overlayEl.classList.remove('visible');
    modalEl.classList.remove('visible');
    document.body.style.overflow = '';
  }

  function renderConstituency(c) {
    const body = modalEl.querySelector('.modal__body');
    const state = Data.STATES.find(s => s.id === c.stateId);
    const winnerParty = Data.PARTIES[c.result2024.winner];
    const prevParty = Data.PARTIES[c.prev2019.winner];

    // Determine badge
    let badgeClass = 'badge--hold';
    let badgeText = 'HOLD';
    if (c.result2024.isUpset) {
      badgeClass = 'badge--upset';
      badgeText = '⚡ UPSET';
    } else if (c.result2024.winner !== c.prev2019.winner) {
      badgeClass = 'badge--gain';
      badgeText = 'GAIN';
    }

    // Winner margin
    const candidates = c.result2024.candidates;
    const winnerVotes = candidates[0]?.votes || 0;
    const runnerVotes = candidates[1]?.votes || 0;
    const margin = winnerVotes - runnerVotes;
    const totalVotes = candidates.reduce((sum, cand) => sum + cand.votes, 0);

    // Build candidate rows
    const candidateRows = candidates.map((cand, i) => {
      const party = Data.PARTIES[cand.party] || Data.PARTIES.oth;
      const pct = totalVotes > 0 ? ((cand.votes / totalVotes) * 100).toFixed(1) : '0.0';
      return `
        <div class="drill-candidate ${cand.isWinner ? 'drill-candidate--winner' : ''}">
          <div class="drill-candidate__rank">${i + 1}</div>
          <div class="drill-candidate__party-dot" style="background:${party.color}"></div>
          <div class="drill-candidate__info">
            <div class="drill-candidate__name">${cand.name}</div>
            <div class="drill-candidate__party-name">${party.abbr}</div>
          </div>
          <div class="drill-candidate__bar-wrap">
            <div class="drill-candidate__bar" style="width:${pct}%; background:${party.color}"></div>
          </div>
          <div class="drill-candidate__stats">
            <span class="drill-candidate__votes">${Utils.formatIndian(cand.votes)}</span>
            <span class="drill-candidate__pct">${pct}%</span>
          </div>
          ${cand.isWinner ? '<div class="drill-candidate__winner-badge">✓ WINNER</div>' : ''}
        </div>
      `;
    }).join('');

    body.innerHTML = `
      <div class="drill-header">
        <div>
          <h2 class="drill-header__name">${c.name}</h2>
          <p class="drill-header__state">${state?.name || ''} · ${c.declaredAt ? Utils.formatTime(c.declaredAt) : ''}</p>
        </div>
        <span class="badge ${badgeClass}">${badgeText}</span>
      </div>

      <div class="drill-summary">
        <div class="drill-summary__card glass-panel glass-panel--static">
          <span class="drill-summary__label">Winner</span>
          <span class="drill-summary__value" style="color:${winnerParty?.color}">${winnerParty?.emoji} ${winnerParty?.abbr}</span>
        </div>
        <div class="drill-summary__card glass-panel glass-panel--static">
          <span class="drill-summary__label">Margin</span>
          <span class="drill-summary__value">${Utils.formatVotes(margin)}</span>
        </div>
        <div class="drill-summary__card glass-panel glass-panel--static">
          <span class="drill-summary__label">Turnout</span>
          <span class="drill-summary__value">${c.result2024.turnout}%</span>
        </div>
        <div class="drill-summary__card glass-panel glass-panel--static">
          <span class="drill-summary__label">Total Votes</span>
          <span class="drill-summary__value">${Utils.formatVotes(totalVotes)}</span>
        </div>
      </div>

      <div class="drill-section">
        <h3 class="drill-section__title">Candidate Results</h3>
        <div class="drill-candidates">${candidateRows}</div>
      </div>

      <div class="drill-section">
        <h3 class="drill-section__title">Historical Comparison (2019)</h3>
        <div class="drill-history">
          <div class="drill-history__row">
            <span class="drill-history__label">2019 Winner</span>
            <span class="drill-history__value" style="color:${prevParty?.color}">${prevParty?.emoji} ${prevParty?.abbr}</span>
          </div>
          <div class="drill-history__row">
            <span class="drill-history__label">2019 Margin</span>
            <span class="drill-history__value">${Utils.formatVotes(c.prev2019.margin)}</span>
          </div>
          <div class="drill-history__row">
            <span class="drill-history__label">2019 Turnout</span>
            <span class="drill-history__value">${c.prev2019.turnout}%</span>
          </div>
          <div class="drill-history__row">
            <span class="drill-history__label">Swing</span>
            <span class="drill-history__value">
              ${c.result2024.winner === c.prev2019.winner
                ? '<span class="badge badge--hold">Retained</span>'
                : `<span class="badge badge--gain">Flipped to ${winnerParty?.abbr}</span>`
              }
            </span>
          </div>
        </div>
      </div>
    `;
  }

  return { init, open, close };
})(window.ElectionData, window.Utils, window.Agent);
