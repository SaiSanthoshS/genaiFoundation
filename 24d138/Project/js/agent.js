/* ========================================
   AGENT — Election Result Simulation Engine
   ======================================== */

window.Agent = ((Data, Utils) => {
  const bus = new Utils.EventBus();
  let queue = [];
  let timer = null;
  let speed = 1;       // 1x, 2x, 5x, 10x
  let paused = false;
  let running = false;
  let declaredCount = 0;
  let filterState = null; // state ID filter
  const milestonesFired = new Set();

  // Tally
  const tally = {};
  const voteTally = {};
  for (const key of Object.keys(Data.PARTIES)) {
    tally[key] = 0;
    voteTally[key] = 0;
  }

  function init() {
    // Shuffle constituencies for random declaration order
    queue = Utils.shuffle([...Data.CONSTITUENCIES]);
    declaredCount = 0;
    running = false;
    paused = false;
    for (const key of Object.keys(tally)) {
      tally[key] = 0;
      voteTally[key] = 0;
    }
    milestonesFired.clear();
  }

  function start() {
    if (running && !paused) return;
    if (!running) init();
    running = true;
    paused = false;
    bus.emit('agent:status', { status: 'running', speed });
    scheduleNext();
  }

  function pause() {
    paused = true;
    clearTimeout(timer);
    bus.emit('agent:status', { status: 'paused', speed });
  }

  function resume() {
    if (!running) return start();
    paused = false;
    bus.emit('agent:status', { status: 'running', speed });
    scheduleNext();
  }

  function togglePause() {
    if (paused) resume();
    else pause();
  }

  function reset() {
    clearTimeout(timer);
    running = false;
    paused = false;
    // Reset all constituencies
    for (const c of Data.CONSTITUENCIES) {
      c.declared = false;
      c.declaredAt = null;
    }
    init();
    bus.emit('agent:reset');
    bus.emit('agent:status', { status: 'idle', speed });
  }

  function setSpeed(s) {
    speed = s;
    bus.emit('agent:speed', speed);
    if (running && !paused) {
      clearTimeout(timer);
      scheduleNext();
    }
  }

  function setFilter(stateId) {
    filterState = stateId;
    // Re-sort queue: prioritize filtered state
    if (stateId) {
      const filtered = queue.filter(c => c.stateId === stateId);
      const rest = queue.filter(c => c.stateId !== stateId);
      queue = [...filtered, ...rest];
    }
    bus.emit('agent:filter', stateId);
  }

  function scheduleNext() {
    if (paused || !running || queue.length === 0) {
      if (queue.length === 0 && running) {
        running = false;
        bus.emit('agent:complete');
        bus.emit('agent:status', { status: 'complete', speed });
      }
      return;
    }

    // Interval: 1500ms at 1x, 750 at 2x, 300 at 5x, 150 at 10x
    const baseInterval = 1200 + Math.random() * 800; // 1200-2000ms
    const interval = baseInterval / speed;

    timer = setTimeout(() => {
      declareNext();
      scheduleNext();
    }, interval);
  }

  function declareNext() {
    if (queue.length === 0) return;

    const constituency = queue.shift();
    constituency.declared = true;
    constituency.declaredAt = new Date();
    declaredCount++;

    const winner = constituency.result2024.winner;
    tally[winner] = (tally[winner] || 0) + 1;

    // Aggregate votes
    for (const cand of constituency.result2024.candidates) {
      voteTally[cand.party] = (voteTally[cand.party] || 0) + cand.votes;
    }

    // Emit result
    bus.emit('result:declared', {
      constituency,
      tally: { ...tally },
      voteTally: { ...voteTally },
      declaredCount,
      remaining: queue.length,
    });

    // Check for upset
    if (constituency.result2024.isUpset) {
      bus.emit('upset:detected', {
        constituency,
        previousWinner: constituency.prev2019.winner,
        newWinner: winner,
      });
    }

    // Check milestones
    checkMilestones(winner);
  }

  function checkMilestones(latestWinnerParty) {
    const partyName = Data.PARTIES[latestWinnerParty]?.abbr || latestWinnerParty;

    // Party milestone checks: 25, 50, 100, 150, 200, 250, 272 (majority), 300, 350, 400
    const thresholds = [25, 50, 100, 150, 200, 250, Data.MAJORITY_MARK, 300, 350, 400];
    for (const t of thresholds) {
      const key = `${latestWinnerParty}_${t}`;
      if (tally[latestWinnerParty] === t && !milestonesFired.has(key)) {
        milestonesFired.add(key);
        const msg = t === Data.MAJORITY_MARK
          ? `🏆 ${partyName} has crossed the MAJORITY mark of ${Data.MAJORITY_MARK} seats!`
          : `📊 ${partyName} has reached ${t} seats`;
        bus.emit('milestone:reached', {
          party: latestWinnerParty,
          seats: t,
          message: msg,
          isMajority: t === Data.MAJORITY_MARK,
        });
      }
    }

    // Total declared milestones
    const totalThresholds = [100, 200, 272, 300, 400, 500, Data.TOTAL_SEATS];
    for (const t of totalThresholds) {
      const key = `total_${t}`;
      if (declaredCount === t && !milestonesFired.has(key)) {
        milestonesFired.add(key);
        const msg = t === Data.TOTAL_SEATS
          ? `🎉 All ${Data.TOTAL_SEATS} results have been declared!`
          : `📢 ${t} out of ${Data.TOTAL_SEATS} results declared`;
        bus.emit('milestone:reached', {
          party: null,
          seats: t,
          message: msg,
          isMajority: false,
          isTotal: true,
        });
      }
    }
  }

  // Public API
  return {
    bus,
    start,
    pause,
    resume,
    togglePause,
    reset,
    setSpeed,
    setFilter,
    getTally: () => ({ ...tally }),
    getVoteTally: () => ({ ...voteTally }),
    getDeclaredCount: () => declaredCount,
    getSpeed: () => speed,
    isPaused: () => paused,
    isRunning: () => running,
    getQueue: () => queue,
  };
})(window.ElectionData, window.Utils);
