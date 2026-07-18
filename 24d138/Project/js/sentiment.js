/* ========================================
   SENTIMENT — News Sentiment Scoring
   ======================================== */

window.SentimentModule = ((Data, Utils, Agent) => {
  let containerEl;
  const sentimentScores = {};
  const headlines = {};

  // Prediction baselines (expected seats based on exit polls for sentiment scoring)
  const PREDICTIONS = {
    bjp: 350, inc: 60, sp: 15, tmc: 25, dmk: 30, tdp: 12, jdu: 15,
    ssubt: 8, ncpsp: 6, shs: 10, ljprv: 4, ysrcp: 18, rjd: 8, cpim: 5,
    aap: 6, bjd: 10, 
  };

  const HEADLINE_TEMPLATES = {
    surge: [
      '{party} surging ahead, exceeding all predictions',
      'Massive wave for {party} as seats pile up',
      '{party} dominance continues, analysts surprised',
    ],
    strong: [
      '{party} performing strongly as expected',
      '{party} on track to meet prediction targets',
      'Steady gains for {party} across key states',
    ],
    weak: [
      '{party} falling short of predicted numbers',
      'Disappointing trends emerging for {party}',
      '{party} struggling in traditional strongholds',
    ],
    collapse: [
      'Electoral shock: {party} facing unprecedented losses',
      '{party} support crumbling across regions',
      'Analysts stunned as {party} numbers plummet',
    ],
  };

  function init() {
    containerEl = document.getElementById('sentiment-section');
    Agent.bus.on('result:declared', update);
    Agent.bus.on('agent:reset', reset);
  }

  function update(data) {
    // Update every 5 results
    if (data.declaredCount % 5 !== 0) return;

    for (const [partyId, seats] of Object.entries(data.tally)) {
      if (seats === 0) continue;
      const predicted = PREDICTIONS[partyId];
      if (!predicted) continue;

      // Calculate performance ratio
      const expectedAtThisPoint = (predicted / Data.TOTAL_SEATS) * data.declaredCount;
      const ratio = seats / Math.max(expectedAtThisPoint, 1);

      // Generate sentiment score: -100 to +100
      let score;
      let category;
      if (ratio > 1.3) {
        score = 60 + Math.min(40, Math.round((ratio - 1.3) * 100));
        category = 'surge';
      } else if (ratio > 0.9) {
        score = 20 + Math.round((ratio - 0.9) * 100);
        category = 'strong';
      } else if (ratio > 0.5) {
        score = -20 - Math.round((0.9 - ratio) * 80);
        category = 'weak';
      } else {
        score = -60 - Math.min(40, Math.round((0.5 - ratio) * 120));
        category = 'collapse';
      }

      score = Math.max(-100, Math.min(100, score));
      sentimentScores[partyId] = score;

      // Generate headline
      const templates = HEADLINE_TEMPLATES[category];
      const template = templates[Math.floor(Math.random() * templates.length)];
      const party = Data.PARTIES[partyId];
      headlines[partyId] = template.replace('{party}', party?.abbr || partyId);
    }

    render();
  }

  function render() {
    if (!containerEl) return;

    const sorted = Object.entries(sentimentScores)
      .filter(([_, s]) => s !== undefined)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    if (sorted.length === 0) return;

    containerEl.innerHTML = `
      <div class="section-header">
        <span class="section-title">
          <span class="section-title__icon">📰</span>
          News Sentiment
        </span>
      </div>
      ${sorted.map(([partyId, score]) => {
        const party = Data.PARTIES[partyId];
        const positive = Math.max(0, score);
        const negative = Math.abs(Math.min(0, score));
        const neutral = 100 - positive - negative;
        const scoreClass = score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral';
        const headline = headlines[partyId] || '';

        return `
          <div class="sentiment-row" title="${headline}">
            <span style="min-width:40px; font-size:12px; font-weight:600; color:${party?.color}">${party?.abbr}</span>
            <div class="sentiment-bar-wrap">
              <div class="sentiment-bar--positive" style="width:${positive}%"></div>
              <div class="sentiment-bar--neutral" style="width:${neutral}%"></div>
              <div class="sentiment-bar--negative" style="width:${negative}%"></div>
            </div>
            <span class="sentiment-score sentiment-score--${scoreClass}">
              ${score > 0 ? '+' : ''}${score}
            </span>
          </div>
        `;
      }).join('')}
      <div style="margin-top:8px; font-size:11px; color:var(--text-muted)">
        ${headlines[sorted[0]?.[0]] || ''}
      </div>
    `;
  }

  function reset() {
    for (const key of Object.keys(sentimentScores)) delete sentimentScores[key];
    for (const key of Object.keys(headlines)) delete headlines[key];
    if (containerEl) containerEl.innerHTML = '';
  }

  return { init, getScores: () => ({ ...sentimentScores }) };
})(window.ElectionData, window.Utils, window.Agent);
