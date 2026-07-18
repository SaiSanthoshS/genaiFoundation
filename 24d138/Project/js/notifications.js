/* ========================================
   NOTIFICATIONS — Toast System
   ======================================== */

window.NotificationsModule = ((Data, Utils, Agent) => {
  let containerEl;
  const queue = [];
  let processing = false;
  const MAX_VISIBLE = 4;
  const DISPLAY_DURATION = 5000;

  function init() {
    containerEl = document.getElementById('toast-container');
    Agent.bus.on('upset:detected', onUpset);
    Agent.bus.on('milestone:reached', onMilestone);
  }

  function onUpset(data) {
    const c = data.constituency;
    const newParty = Data.PARTIES[data.newWinner];
    const prevParty = Data.PARTIES[data.previousWinner];
    const state = Data.STATES.find(s => s.id === c.stateId);

    enqueue({
      type: 'upset',
      title: `⚡ Upset in ${c.name}`,
      body: `${newParty?.abbr} defeats ${prevParty?.abbr} in ${state?.name || ''}. This seat was held by ${prevParty?.abbr} since 2019.`,
      icon: '⚡',
    });
  }

  function onMilestone(data) {
    enqueue({
      type: data.isMajority ? 'upset' : 'milestone',
      title: data.isMajority ? '🏆 Majority Reached!' : '📊 Milestone',
      body: data.message,
      icon: data.isMajority ? '🏆' : '📊',
    });
  }

  function enqueue(notification) {
    queue.push(notification);
    processQueue();
  }

  function processQueue() {
    if (processing) return;
    processing = true;

    while (queue.length > 0 && containerEl.children.length < MAX_VISIBLE) {
      const notif = queue.shift();
      showToast(notif);
    }

    processing = false;
  }

  function showToast(notif) {
    const toast = document.createElement('div');
    toast.className = `toast toast--${notif.type}`;

    toast.innerHTML = `
      <div class="toast__header">
        <span class="toast__title">${notif.title}</span>
        <button class="toast__close" aria-label="Dismiss">✕</button>
      </div>
      <div class="toast__body">${notif.body}</div>
      <div class="toast__progress"></div>
    `;

    // Close button
    toast.querySelector('.toast__close').addEventListener('click', () => {
      dismissToast(toast);
    });

    containerEl.appendChild(toast);

    // Auto dismiss
    const timer = setTimeout(() => {
      dismissToast(toast);
    }, DISPLAY_DURATION);

    toast._timer = timer;
  }

  function dismissToast(toast) {
    if (toast._dismissed) return;
    toast._dismissed = true;
    clearTimeout(toast._timer);
    toast.classList.add('toast--exiting');

    toast.addEventListener('animationend', () => {
      toast.remove();
      processQueue(); // Show next in queue
    });
  }

  function reset() {
    queue.length = 0;
    containerEl.innerHTML = '';
  }

  Agent.bus.on('agent:reset', reset);

  return { init, enqueue };
})(window.ElectionData, window.Utils, window.Agent);
