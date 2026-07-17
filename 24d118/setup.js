/* ============================================================
   PAGE: Preference Setup
   ============================================================ */

const LEVEL_DESCRIPTIONS = {
  beginner: "Plain words, short sentences, no jargon. A gentle first pass through any topic.",
  intermediate: "Clear, everyday explanations with technical terms defined as they come up.",
  advanced: "Assumes general science literacy. Field terminology used with light context.",
  expert: "The original technical register: methods, statistics, and jargon left intact.",
};

Pages = window.Pages || {};

Pages.setup = function (root) {
  const existing = Store.getPrefs() || { domains: ["space", "biology", "physics"], level: "intermediate" };
  const state = { domains: [...existing.domains], levelIndex: READING_LEVELS.indexOf(existing.level) };
  if (state.levelIndex < 0) state.levelIndex = 1;

  const domainCounts = Object.fromEntries(
    Object.keys(DOMAIN_META).map((d) => [d, RAW_ARTICLE_POOL.filter((a) => a.domain === d).length])
  );

  root.innerHTML = `
    <div class="shell">
      <div class="eyebrow" style="margin-top:36px;">Preferences</div>
      <h1 class="page-title">Tell the agent what to watch, and how to explain it.</h1>
      <p class="page-sub">Pick the domains it should poll every morning and how technical the write-ups should be. It re-adapts every article to your level automatically&nbsp;&mdash; you can still switch levels per-article later.</p>

      <div class="setup-grid">
        <div class="panel">
          <div class="panel-label">01 &nbsp;Domains to monitor</div>
          <div id="domain-list"></div>
        </div>

        <div class="panel">
          <div class="panel-label">02 &nbsp;Reading level</div>
          <div class="level-slider-wrap">
            <input type="range" id="level-slider" min="0" max="3" step="1" value="${state.levelIndex}" />
            <div class="level-labels">
              <span>Beginner</span><span>Intermediate</span><span>Advanced</span><span>Expert</span>
            </div>
            <div class="level-current" id="level-current"></div>
            <div class="level-desc" id="level-desc"></div>
          </div>
        </div>
      </div>

      <div class="activate-row">
        <button class="btn primary" id="activate-btn">Activate daily digest</button>
        <span class="eyebrow" id="activate-hint">Runs the agent now, then every morning.</span>
      </div>

      <div class="agent-log" id="agent-log" hidden>
        <div class="agent-log-head"><span class="led" id="led"></span> agent run &mdash; today</div>
        <div class="agent-log-body" id="agent-log-body"></div>
      </div>

      <div class="foot-note">
        Preferences are stored locally in this browser. In a deployed version, this step registers a scheduled job
        that polls sources, classifies, and re-adapts language every morning without you opening the app.
      </div>
    </div>
  `;

  const domainListEl = root.querySelector("#domain-list");
  const levelSlider = root.querySelector("#level-slider");
  const levelCurrent = root.querySelector("#level-current");
  const levelDesc = root.querySelector("#level-desc");
  const activateBtn = root.querySelector("#activate-btn");
  const activateHint = root.querySelector("#activate-hint");
  const agentLog = root.querySelector("#agent-log");
  const agentLogBody = root.querySelector("#agent-log-body");
  const led = root.querySelector("#led");

  function renderDomains() {
    domainListEl.innerHTML = Object.entries(DOMAIN_META)
      .map(([key, meta]) => {
        const checked = state.domains.includes(key);
        return `
          <label class="domain-check ${checked ? "checked-" + key : ""}" data-domain="${key}">
            <input type="checkbox" ${checked ? "checked" : ""} data-domain-checkbox="${key}" />
            <span class="glyph" style="color:${meta.accent}">${meta.glyph}</span>
            <span class="name">${meta.label}</span>
            <span class="count">${domainCounts[key]} today</span>
          </label>
        `;
      })
      .join("");

    domainListEl.querySelectorAll("input[data-domain-checkbox]").forEach((cb) => {
      cb.addEventListener("change", () => {
        const d = cb.dataset.domainCheckbox;
        if (cb.checked) {
          if (!state.domains.includes(d)) state.domains.push(d);
        } else {
          state.domains = state.domains.filter((x) => x !== d);
        }
        renderDomains();
        updateActivateState();
      });
    });
  }

  function renderLevel() {
    const level = READING_LEVELS[state.levelIndex];
    levelCurrent.textContent = `→ ${level[0].toUpperCase()}${level.slice(1)}`;
    levelDesc.textContent = LEVEL_DESCRIPTIONS[level];
  }

  function updateActivateState() {
    const disabled = state.domains.length === 0;
    activateBtn.disabled = disabled;
    activateHint.textContent = disabled
      ? "Select at least one domain to activate."
      : "Runs the agent now, then every morning.";
  }

  levelSlider.addEventListener("input", () => {
    state.levelIndex = Number(levelSlider.value);
    renderLevel();
  });

  activateBtn.addEventListener("click", () => runAgentActivation());

  function runAgentActivation() {
    const prefs = { domains: [...state.domains], level: READING_LEVELS[state.levelIndex] };
    activateBtn.disabled = true;
    activateBtn.textContent = "Running agent…";
    agentLog.hidden = false;
    led.classList.add("live");
    agentLogBody.innerHTML = "";

    const lines = Agent.buildRunLog(prefs);
    let i = 0;

    function appendNext() {
      if (i >= lines.length) {
        led.classList.remove("live");
        const digest = Agent.runDailyDigest(prefs);
        Store.setPrefs(prefs);
        Store.setDigest(digest);
        setTimeout(() => Router.navigate("/digest"), 450);
        return;
      }
      const line = document.createElement("div");
      line.className = "agent-log-line";
      const isLast = i === lines.length - 1;
      line.innerHTML = lines[i].includes("✓")
        ? lines[i].replace("digest ready ✓", '<span class="ok">digest ready ✓</span>')
        : lines[i];
      if (isLast) line.classList.add("cursor");
      else agentLogBody.querySelectorAll(".cursor").forEach((n) => n.classList.remove("cursor"));
      agentLogBody.appendChild(line);
      agentLogBody.scrollTop = agentLogBody.scrollHeight;
      i += 1;
      setTimeout(appendNext, 190);
    }
    appendNext();
  }

  renderDomains();
  renderLevel();
  updateActivateState();
};
