/* ========================================
   LEADERBOARD — Party Stats & Swing
   ======================================== */

window.LeaderboardModule = ((Data, Utils, Agent) => {
  let listEl, majorityBarEl, sentimentEl;
  let currentView = 'parties'; // 'parties' | 'alliances'
  const previousValues = {};

  function init() {
    listEl = document.getElementById('leaderboard-list');
    majorityBarEl = document.getElementById('majority-bar');
    sentimentEl = document.getElementById('sentiment-section');

    Agent.bus.on('result:declared', update);
    Agent.bus.on('agent:reset', reset);

    renderEmpty();
    renderMajorityBar({});

    // Tab switching
    document.querySelectorAll('.leaderboard-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.leaderboard-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentView = tab.dataset.view;
        const tally = Agent.getTally();
        renderList(tally);
      });
    });
  }

  function update(data) {
    renderList(data.tally);
    renderMajorityBar(data.tally);
    updateHeaderStats(data);
  }

  function renderList(tally) {
    if (currentView === 'alliances') {
      renderAllianceView(tally);
    } else {
      renderPartyView(tally);
    }
  }

  function renderPartyView(tally) {
    // Sort parties by seats
    const sorted = Object.entries(tally)
      .filter(([_, seats]) => seats > 0)
      .sort((a, b) => b[1] - a[1]);

    if (sorted.length === 0) {
      renderEmpty();
      return;
    }

    const voteTally = Agent.getVoteTally();
    const totalVotes = Object.values(voteTally).reduce((a, b) => a + b, 0);
    const maxSeats = sorted[0]?.[1] || 1;

    listEl.innerHTML = sorted.map(([partyId, seats], i) => {
      const party = Data.PARTIES[partyId];
      if (!party) return '';
      const baseline = Data.BASELINE_2019[partyId] || 0;
      const swing = Utils.getSwing(seats, baseline);
      const votes = voteTally[partyId] || 0;
      const voteShare = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : '0.0';
      const barWidth = (seats / Data.TOTAL_SEATS) * 100;

      const prev = previousValues[partyId] || 0;
      const seatChanged = prev !== seats;
      previousValues[partyId] = seats;

      return `
        <div class="party-row ${seatChanged ? 'animate-fadeInUp' : ''}" data-party="${partyId}">
          <span class="party-row__rank">${i + 1}</span>
          <div class="party-row__logo" style="background:${Utils.hexToRgba(party.color, 0.15)}; color:${party.color}">
            ${party.emoji}
          </div>
          <div class="party-row__info">
            <div class="party-row__name">
              ${party.abbr}
            </div>
            <div class="party-row__bar-wrap">
              <div class="party-row__bar" style="width:${barWidth}%; background:${party.color}"></div>
            </div>
          </div>
          <div class="party-row__stats">
            <div class="party-stat">
              <span class="party-stat__value" style="color:${party.color}">${seats}</span>
              <span class="party-stat__label">Seats</span>
            </div>
            <div class="party-stat">
              <span class="party-stat__value">${voteShare}%</span>
              <span class="party-stat__label">Vote %</span>
            </div>
            <div class="party-stat">
              <span class="swing swing--${swing.direction}">
                <span class="swing__arrow">${swing.direction === 'up' ? '▲' : swing.direction === 'down' ? '▼' : '●'}</span>
                ${swing.text}
              </span>
              <span class="party-stat__label">Swing</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderAllianceView(tally) {
    const allianceData = {};
    for (const [allianceId, alliance] of Object.entries(Data.ALLIANCES)) {
      let seats = 0;
      for (const pid of alliance.parties) {
        seats += tally[pid] || 0;
      }
      allianceData[allianceId] = { ...alliance, seats };
    }

    const sorted = Object.entries(allianceData).sort((a, b) => b[1].seats - a[1].seats);

    if (sorted.every(([_, a]) => a.seats === 0)) {
      renderEmpty();
      return;
    }

    const voteTally = Agent.getVoteTally();

    listEl.innerHTML = sorted.map(([allianceId, alliance], i) => {
      if (alliance.seats === 0) return '';

      // Calculate alliance vote share
      let allianceVotes = 0;
      const totalVotes = Object.values(voteTally).reduce((a, b) => a + b, 0);
      for (const pid of alliance.parties) {
        allianceVotes += voteTally[pid] || 0;
      }
      const voteShare = totalVotes > 0 ? ((allianceVotes / totalVotes) * 100).toFixed(1) : '0.0';

      // Calculate baseline
      let baseline = 0;
      for (const pid of alliance.parties) {
        baseline += Data.BASELINE_2019[pid] || 0;
      }
      const swing = Utils.getSwing(alliance.seats, baseline);

      const barWidth = (alliance.seats / Data.TOTAL_SEATS) * 100;

      // Party breakdown
      const partyBreakdown = alliance.parties
        .map(pid => ({ id: pid, seats: tally[pid] || 0, ...Data.PARTIES[pid] }))
        .filter(p => p.seats > 0)
        .sort((a, b) => b.seats - a.seats)
        .map(p => `<span style="color:${p.color}">${p.abbr}: ${p.seats}</span>`)
        .join(' · ');

      return `
        <div class="party-row" data-alliance="${allianceId}">
          <span class="party-row__rank">${i + 1}</span>
          <div class="party-row__logo" style="background:${Utils.hexToRgba(alliance.color, 0.15)}; color:${alliance.color}; font-size:0.7rem; font-weight:700">
            ${allianceId}
          </div>
          <div class="party-row__info">
            <div class="party-row__name">${alliance.name}</div>
            <div class="party-row__bar-wrap">
              <div class="party-row__bar" style="width:${barWidth}%; background:${alliance.color}"></div>
            </div>
            <div style="font-size:11px; color:var(--text-tertiary); margin-top:4px">${partyBreakdown}</div>
          </div>
          <div class="party-row__stats">
            <div class="party-stat">
              <span class="party-stat__value" style="color:${alliance.color}">${alliance.seats}</span>
              <span class="party-stat__label">Seats</span>
            </div>
            <div class="party-stat">
              <span class="party-stat__value">${voteShare}%</span>
              <span class="party-stat__label">Vote %</span>
            </div>
            <div class="party-stat">
              <span class="swing swing--${swing.direction}">
                <span class="swing__arrow">${swing.direction === 'up' ? '▲' : swing.direction === 'down' ? '▼' : '●'}</span>
                ${swing.text}
              </span>
              <span class="party-stat__label">Swing</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderMajorityBar(tally) {
    if (!majorityBarEl) return;

    // Top parties for the bar
    const sorted = Object.entries(tally)
      .filter(([_, s]) => s > 0)
      .sort((a, b) => b[1] - a[1]);

    const segments = sorted.map(([partyId, seats]) => {
      const party = Data.PARTIES[partyId];
      const width = (seats / Data.TOTAL_SEATS) * 100;
      return `<div class="majority-bar__segment" style="width:${width}%; background:${party?.color || '#666'};" title="${party?.abbr}: ${seats}"></div>`;
    }).join('');

    majorityBarEl.querySelector('.majority-bar').innerHTML = segments + '<div class="majority-line"></div>';

    // Labels
    const labelsEl = majorityBarEl.querySelector('.majority-labels');
    if (labelsEl && sorted.length > 0) {
      const top2 = sorted.slice(0, 3).map(([pid, seats]) => {
        const p = Data.PARTIES[pid];
        return `<span class="majority-label">
          <span class="majority-label__dot" style="background:${p?.color}"></span>
          ${p?.abbr}: ${seats}
        </span>`;
      }).join('');
      labelsEl.innerHTML = top2;
    }
  }

  function updateHeaderStats(data) {
    const declaredEl = document.getElementById('stat-declared');
    const remainingEl = document.getElementById('stat-remaining');
    const leadEl = document.getElementById('stat-lead');

    if (declaredEl) {
      Utils.animateNumber(declaredEl, parseInt(declaredEl.textContent.replace(/,/g, '')) || 0, data.declaredCount, 400);
    }
    if (remainingEl) {
      remainingEl.textContent = data.remaining;
    }

    // Leading party
    if (leadEl) {
      const sorted = Object.entries(data.tally).sort((a, b) => b[1] - a[1]);
      if (sorted.length > 0) {
        const [pid, seats] = sorted[0];
        const party = Data.PARTIES[pid];
        leadEl.innerHTML = `<span style="color:${party?.color}">${party?.abbr}</span> <span class="font-mono">${seats}</span>`;
      }
    }
  }

  function renderEmpty() {
    listEl.innerHTML = `
      <div class="empty-state">
        <span class="empty-state__icon">🗳️</span>
        <span class="empty-state__text">Waiting for results...<br>Click Start to begin the simulation</span>
      </div>
    `;
  }

  function reset() {
    for (const key of Object.keys(previousValues)) {
      previousValues[key] = 0;
    }
    renderEmpty();
    renderMajorityBar({});
    const declaredEl = document.getElementById('stat-declared');
    const remainingEl = document.getElementById('stat-remaining');
    const leadEl = document.getElementById('stat-lead');
    if (declaredEl) declaredEl.textContent = '0';
    if (remainingEl) remainingEl.textContent = Data.TOTAL_SEATS;
    if (leadEl) leadEl.innerHTML = '—';
  }

  return { init };
})(window.ElectionData, window.Utils, window.Agent);
