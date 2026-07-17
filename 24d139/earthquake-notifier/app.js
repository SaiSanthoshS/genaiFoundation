/* ========================================================================
   QUAKEWATCH v3 — Backend Integration
   Fetches all state, settings, locations, and events from Express API
   ======================================================================== */

(function () {
  'use strict';

  // ===================================================================
  // 1. STATE & CONSTANTS
  // ===================================================================
  const API_URL = 'http://127.0.0.1:3000/api';
  
  const state = {
    locations: [],
    settings: { mmiThreshold: 4.0, units: 'km', soundAlerts: false, highContrast: false },
    earthquakes: [],
    notifications: [],
    pollInterval: null,
    pollIntervalMs: 30000, // Poll backend every 30s
    globe: null,
    globeInitialized: false,
    magChart: null,
    trendChart: null,
    historyScope: 'global',
    historicalData: [],
    riskLevel: 'unknown',
  };

  const PAGE_TITLES = {
    globe: 'Live Seismic Globe',
    notifications: 'Alert History',
    history: 'Historical Analysis',
    tips: 'Preparedness Guide',
    settings: 'Settings',
  };

  const SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';
  let audioContext = null;

  // ===================================================================
  // 2. API WRAPPERS
  // ===================================================================
  async function apiGet(endpoint) {
    const res = await fetch(`${API_URL}${endpoint}`);
    if (!res.ok) throw new Error(`GET ${endpoint} failed`);
    return res.json();
  }
  
  async function apiPost(endpoint, body) {
    const res = await fetch(`${API_URL}${endpoint}`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`POST ${endpoint} failed`);
    return res.json();
  }

  async function apiPut(endpoint, body) {
    const res = await fetch(`${API_URL}${endpoint}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body || {}) });
    if (!res.ok) throw new Error(`PUT ${endpoint} failed`);
    return res.json();
  }

  async function apiDelete(endpoint) {
    const res = await fetch(`${API_URL}${endpoint}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`DELETE ${endpoint} failed`);
    return res.json();
  }

  // ===================================================================
  // 3. UTILITIES & MATH
  // ===================================================================
  function haversine(lat1, lng1, lat2, lng2) {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function formatDist(km) {
    return state.settings.units === 'mi' ? `${Math.round(km * 0.621371)} mi` : `${Math.round(km)} km`;
  }

  function estimateMMI(magnitude, distanceKm, depthKm) {
    const hypocentral = Math.sqrt(distanceKm ** 2 + (depthKm || 10) ** 2);
    const R = Math.max(hypocentral, 1);
    const mmi = 2.085 + 1.428 * magnitude - 1.402 * Math.log(R) - 0.00346 * R;
    return Math.max(1, Math.min(12, Math.round(mmi * 10) / 10));
  }

  function classifyRisk(mmi) {
    if (mmi < 2) return { level: 'none', label: 'None' };
    if (mmi < 4) return { level: 'low', label: 'Low' };
    if (mmi < 6) return { level: 'moderate', label: 'Moderate' };
    if (mmi < 8) return { level: 'high', label: 'High' };
    if (mmi < 10) return { level: 'extreme', label: 'Extreme' };
    return { level: 'critical', label: 'Critical' };
  }

  function depthColorHex(depth) {
    if (depth < 70) return '#ef4444'; 
    if (depth < 300) return '#f97316';
    return '#eab308';
  }

  function timeAgo(timestamp) {
    const s = Math.floor((Date.now() - timestamp) / 1000);
    if (s < 60) return 'just now';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  function formatTime(timestamp) {
    return new Date(timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function playSound() {
    if (!state.settings.soundAlerts) return;
    if (!audioContext) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioContext = new AudioContext();
    }
    if (audioContext && audioContext.state === 'suspended') audioContext.resume();
    new Audio(SOUND_URL).play().catch(e => console.log('Audio prevented', e));
  }

  // ===================================================================
  // 4. TOASTS & UI HELPERS
  // ===================================================================
  function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    let icon = type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info';
    toast.innerHTML = `<span class="material-symbols-outlined">${icon}</span> <span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('removing');
      toast.addEventListener('animationend', () => toast.remove());
    }, duration);
  }

  function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.settings.highContrast ? 'high-contrast' : 'dark');
  }

  // ===================================================================
  // 5. NAVIGATION
  // ===================================================================
  function initNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => navigateTo(item.dataset.page));
    });

    document.getElementById('theme-toggle').addEventListener('click', async () => {
      state.settings.highContrast = !state.settings.highContrast;
      await apiPut('/settings', state.settings);
      applyTheme();
      updateSettingsUI();
    });

    const cmdOverlay = document.getElementById('cmd-overlay');
    const cmdInput = document.getElementById('cmd-input');
    
    document.getElementById('search-trigger').addEventListener('click', () => {
      cmdOverlay.classList.add('open');
      cmdInput.focus();
    });
    
    cmdOverlay.addEventListener('click', e => {
      if (e.target === cmdOverlay) cmdOverlay.classList.remove('open');
    });

    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        cmdOverlay.classList.toggle('open');
        if (cmdOverlay.classList.contains('open')) cmdInput.focus();
      }
      if (e.key === 'Escape' && cmdOverlay.classList.contains('open')) cmdOverlay.classList.remove('open');
    });

    const locSwitcherBtn = document.getElementById('loc-switcher-btn');
    const locDropdown = document.getElementById('loc-dropdown');
    locSwitcherBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      locDropdown.classList.toggle('open');
      renderLocationDropdown();
    });
    document.addEventListener('click', e => {
      if (!e.target.closest('#loc-switcher')) locDropdown.classList.remove('open');
    });
  }

  function navigateTo(page) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (navItem) navItem.classList.add('active');

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const pageEl = document.getElementById(`page-${page}`);
    if (pageEl) pageEl.classList.add('active');

    document.getElementById('page-title').textContent = PAGE_TITLES[page] || '';

    if (page === 'globe') {
      if (!state.globeInitialized) setTimeout(initGlobe, 100);
      else requestAnimationFrame(resizeGlobe);
    }
    if (page === 'history') {
      if (!state.magChart) setTimeout(initHistoricalChart, 200);
    }
    if (page === 'tips') renderTips();
    if (page === 'settings') updateSettingsUI();
  }

  // ===================================================================
  // 6. LOCATIONS
  // ===================================================================
  function getActiveLocation() {
    return state.locations.find(l => l.active) || null;
  }

  async function setActiveLocation(id) {
    try {
      await apiPut(`/locations/${id}/active`);
      state.locations.forEach(l => l.active = (l.id === id));
      updateLocationUI();
      
      const act = getActiveLocation();
      if (act && state.globe) {
        state.globe.pointOfView({ lat: act.lat, lng: act.lng, altitude: 2.2 }, 1500);
        updateGlobeData();
      }
      if (state.historyScope === 'local' && state.magChart) fetchHistoricalData();
    } catch(e) {
      showToast('Failed to switch location', 'error');
    }
  }

  function updateLocationUI() {
    const act = getActiveLocation();
    const nameEl = document.getElementById('loc-active-name');
    nameEl.textContent = act ? act.name.split(',')[0] : 'No location';
    renderSettingsLocations();
  }

  function renderLocationDropdown() {
    const dd = document.getElementById('loc-dropdown');
    let html = '';
    state.locations.forEach(l => {
      html += `<div class="loc-option ${l.active ? 'active' : ''}" data-id="${l.id}">
        <span class="material-symbols-outlined">location_on</span>
        <span class="loc-opt-name">${escapeHtml(l.name.split(',')[0])}</span>
        ${l.active ? '<span class="loc-opt-label">Active</span>' : ''}
      </div>`;
    });
    html += `<div class="loc-option loc-add" id="dd-add-loc"><span class="material-symbols-outlined">add</span><span>Add Location</span></div>`;
    dd.innerHTML = html;
    
    dd.querySelectorAll('.loc-option[data-id]').forEach(opt => {
      opt.addEventListener('click', () => {
        setActiveLocation(opt.dataset.id);
        dd.classList.remove('open');
      });
    });
    document.getElementById('dd-add-loc').addEventListener('click', () => {
      dd.classList.remove('open');
      startOnboarding(false);
    });
  }

  // ===================================================================
  // 7. ONBOARDING WIZARD
  // ===================================================================
  let onboardingMode = 'initial';

  function initOnboarding() {
    document.getElementById('ob-gps').addEventListener('click', useGPS);
    document.getElementById('ob-geocode').addEventListener('click', () => geocodeAddress(document.getElementById('ob-address').value));
    document.getElementById('ob-address').addEventListener('keydown', e => { if (e.key === 'Enter') geocodeAddress(e.target.value); });
    document.getElementById('ob-next1').addEventListener('click', () => switchOnboardStep(2));
    
    document.getElementById('ob-enable-notif').addEventListener('click', () => {
      if ('Notification' in window) {
        Notification.requestPermission().then(() => switchOnboardStep(3));
      } else switchOnboardStep(3);
    });
    document.getElementById('ob-skip-notif').addEventListener('click', () => switchOnboardStep(3));
    
    document.getElementById('ob-finish').addEventListener('click', () => {
      document.getElementById('onboarding').classList.remove('open');
      if (onboardingMode === 'initial') startAppSync();
    });
  }

  function startOnboarding(isInitial = true) {
    onboardingMode = isInitial ? 'initial' : 'add';
    document.getElementById('onboarding').classList.add('open');
    switchOnboardStep(1);
    document.getElementById('ob-result').style.display = 'none';
    document.getElementById('ob-next1').disabled = true;
    document.getElementById('ob-address').value = '';
    
    if (!isInitial) {
      document.getElementById('onboard-s2').style.display = 'none';
      document.getElementById('onboard-s3').querySelector('h2').textContent = 'Location Added';
      document.getElementById('ob-next1').onclick = () => switchOnboardStep(3);
    } else {
      document.getElementById('onboard-s2').style.display = 'block';
      document.getElementById('onboard-s3').querySelector('h2').textContent = 'You\'re All Set';
      document.getElementById('ob-next1').onclick = () => switchOnboardStep(2);
    }
  }

  function switchOnboardStep(step) {
    document.querySelectorAll('.onboard-step').forEach(el => el.classList.remove('active'));
    document.getElementById(`onboard-s${step}`)?.classList.add('active');
    
    document.querySelectorAll('.onboard-dot').forEach((el, idx) => {
      el.classList.remove('active', 'done');
      if (idx + 1 < step) el.classList.add('done');
      if (idx + 1 === step) el.classList.add('active');
    });

    if (step === 3) {
      const act = getActiveLocation();
      if (act) document.getElementById('ob-summary-loc').textContent = act.name;
    }
  }

  async function addLocationResult(lat, lng, name) {
    const id = Date.now().toString();
    try {
      await apiPost('/locations', { id, name, lat, lng, active: true });
      state.locations.forEach(l => l.active = false);
      state.locations.push({ id, name, lat, lng, active: true });
      updateLocationUI();

      const res = document.getElementById('ob-result');
      res.style.display = 'block';
      res.innerHTML = `<div class="or-name">${escapeHtml(name)}</div><div class="or-coords">${lat.toFixed(4)}, ${lng.toFixed(4)}</div>`;
      document.getElementById('ob-next1').disabled = false;
      
      if (state.globe) {
        state.globe.pointOfView({ lat, lng, altitude: 2.2 }, 1500);
        updateGlobeData();
      }
    } catch(e) {
      alert('Failed to save location to backend.');
    }
  }

  function useGPS() {
    const btn = document.getElementById('ob-gps');
    btn.innerHTML = 'Detecting…'; btn.disabled = true;
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const lat = pos.coords.latitude; const lng = pos.coords.longitude;
        let name = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        try {
          const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`);
          const data = await resp.json();
          if (data.display_name) name = data.display_name;
        } catch (e) {}
        addLocationResult(lat, lng, name);
        btn.innerHTML = '<span class="material-symbols-outlined">gps_fixed</span>Use GPS'; btn.disabled = false;
      },
      err => {
        alert('Geolocation failed. Please enter an address.');
        btn.innerHTML = '<span class="material-symbols-outlined">gps_fixed</span>Use GPS'; btn.disabled = false;
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function geocodeAddress(address) {
    if (!address.trim()) return;
    const btn = document.getElementById('ob-geocode');
    btn.disabled = true;
    try {
      const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`);
      const results = await resp.json();
      if (results.length > 0) {
        addLocationResult(parseFloat(results[0].lat), parseFloat(results[0].lon), results[0].display_name);
      } else alert('Location not found.');
    } catch (e) { alert('Search failed.'); }
    btn.disabled = false;
  }

  // ===================================================================
  // 8. BACKEND SYNC (Polling Server, not USGS directly)
  // ===================================================================
  function startAppSync() {
    updateAgentUI(true);
    syncData().then(() => {
      if (state.pollInterval) clearInterval(state.pollInterval);
      state.pollInterval = setInterval(syncData, state.pollIntervalMs);
    });
  }

  function updateAgentUI(active) {
    const dot = document.getElementById('status-dot');
    const text = document.getElementById('status-text');
    const badge = document.getElementById('live-badge');
    
    if (active) {
      dot.classList.add('active'); text.textContent = 'Monitoring API'; badge.classList.add('visible');
    } else {
      dot.classList.remove('active'); text.textContent = 'Idle'; badge.classList.remove('visible');
    }
  }

  async function syncData() {
    try {
      // Fetch latest earthquakes and notifications from backend
      state.earthquakes = await apiGet('/earthquakes');
      
      const newNotifs = await apiGet('/notifications');
      const prevCount = state.notifications.length;
      state.notifications = newNotifs;

      // Check if there are newly added notifications to trigger push/sound
      if (state.notifications.length > prevCount && prevCount !== 0) {
        const latest = state.notifications[0];
        if (latest.mmi >= state.settings.mmiThreshold || latest.mag >= 6.5) {
          sendBrowserNotification(latest);
          if (latest.mmi >= 6) playSound();
        }
      }

      if (state.globe) updateGlobeData();
      updateGlobeStats();
      renderNotifications();
      
      const uEl = document.getElementById('stat-updated');
      if(uEl) uEl.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    } catch (e) {
      console.error('Backend Sync failed:', e);
      showToast('Backend API disconnected', 'error');
    }
  }

  function sendBrowserNotification(notif) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try {
      new Notification(`M${notif.mag.toFixed(1)} Earthquake (${notif.riskLabel})`, {
        body: `${notif.title}\\n${formatDist(notif.distance)} away · Est. MMI ${notif.mmi}`,
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🚨</text></svg>',
        tag: notif.id,
        requireInteraction: notif.mmi >= 6,
      });
    } catch (e) {}
  }

  // ===================================================================
  // 9. GLOBE RENDERER
  // ===================================================================
  function initGlobe() {
    if (state.globeInitialized) return;
    state.globeInitialized = true;
    const container = document.getElementById('globe-container');
    const loading = document.getElementById('globe-loading');

    state.globe = Globe()
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
      .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
      .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
      .showAtmosphere(true).atmosphereColor('#6366f1').atmosphereAltitude(0.15)
      .htmlElementsData([])
      .htmlElement(d => {
        const el = document.createElement('div');
        if (d.id === '__user__') {
          el.innerHTML = `<div class="qm-wrap" title="${escapeHtml(d.properties.title)}"><div class="qm-dot qm-user"><div class="qm-user-ring"></div></div></div>`;
        } else {
          const size = Math.max(6, (d.properties.mag || 1) * 3.5);
          const color = depthColorHex(d.depth || 0);
          const age = Date.now() - d.properties.time;
          let ringHtml = (age < 7200000 && d.properties.mag >= 2.5) ? `<div class="qm-ring" style="border-color:${color}"></div>` : '';
          
          el.innerHTML = `<div class="qm-wrap"><div class="qm-dot" style="width:${size}px; height:${size}px; background:${color}; box-shadow: 0 0 ${size*1.5}px ${color}">${ringHtml}</div></div>`;
        }
        el.querySelector('.qm-wrap').addEventListener('mouseenter', () => handlePointHover(d));
        el.querySelector('.qm-wrap').addEventListener('mouseleave', () => handlePointHover(null));
        el.querySelector('.qm-wrap').addEventListener('click', () => openEventDetail(d));
        return el;
      })(container);

    state.globe.controls().autoRotate = true; state.globe.controls().autoRotateSpeed = 0.5;
    state.globe.controls().enableDamping = true; state.globe.controls().dampingFactor = 0.08;

    const act = getActiveLocation();
    if (act) state.globe.pointOfView({ lat: act.lat, lng: act.lng, altitude: 2.2 }, 0);

    resizeGlobe();
    window.addEventListener('resize', resizeGlobe);

    state.globe.onGlobeReady(() => loading.classList.add('hidden'));
    setTimeout(() => loading.classList.add('hidden'), 6000);

    document.getElementById('legend-toggle').addEventListener('click', (e) => {
      e.stopPropagation(); document.getElementById('legend-panel').classList.toggle('open');
    });
    document.addEventListener('click', e => {
      if (!e.target.closest('.globe-legend-wrap')) document.getElementById('legend-panel').classList.remove('open');
    });

    if (state.earthquakes.length > 0) updateGlobeData();
  }

  function resizeGlobe() {
    if (!state.globe) return;
    const container = document.getElementById('globe-container');
    if (container) { state.globe.width(container.clientWidth); state.globe.height(container.clientHeight); }
  }

  function updateGlobeData() {
    if (!state.globe) return;
    const elements = state.earthquakes.map(eq => ({
      lat: eq.geometry.coordinates[1], lng: eq.geometry.coordinates[0], depth: eq.geometry.coordinates[2],
      id: eq.id, properties: eq.properties
    }));
    const act = getActiveLocation();
    if (act) elements.push({ lat: act.lat, lng: act.lng, id: '__user__', properties: { title: 'Your Location' } });
    state.globe.htmlElementsData(elements);
  }

  function handlePointHover(point) {
    const tooltip = document.getElementById('globe-tooltip');
    if (!point || point.id === '__user__') { tooltip.classList.remove('visible'); return; }
    const p = point.properties;
    document.getElementById('tip-title').textContent = p.place || 'Unknown';
    document.getElementById('tip-mag').innerHTML = `<span class="material-symbols-outlined">crisis_alert</span> Magnitude: ${p.mag}`;
    document.getElementById('tip-depth').innerHTML = `<span class="material-symbols-outlined">arrow_downward</span> Depth: ${Math.round(point.depth)} km`;
    document.getElementById('tip-time').innerHTML = `<span class="material-symbols-outlined">schedule</span> ${formatTime(p.time)}`;
    tooltip.classList.add('visible');
  }

  function updateGlobeStats() {
    if (!state.earthquakes.length) return;
    document.getElementById('stat-events').textContent = state.earthquakes.length.toLocaleString();
    const max = state.earthquakes.reduce((a, b) => (b.properties.mag > (a.properties?.mag || 0) ? b : a), state.earthquakes[0]);
    document.getElementById('stat-strongest').textContent = `M ${max.properties.mag.toFixed(1)}`;
    const act = getActiveLocation();
    if (act) {
      let nearest = Infinity;
      state.earthquakes.forEach(eq => {
        const d = haversine(act.lat, act.lng, eq.geometry.coordinates[1], eq.geometry.coordinates[0]);
        if (d < nearest) nearest = d;
      });
      document.getElementById('stat-nearest').textContent = nearest < 1 ? '< 1' : formatDist(nearest);
    }
  }

  // ===================================================================
  // 10. NOTIFICATIONS PANEL
  // ===================================================================
  function initNotifications() {
    document.getElementById('btn-clear-notifs').addEventListener('click', async () => {
      if(confirm('Clear all alert history?')) {
        try {
          await apiDelete('/notifications');
          state.notifications = [];
          renderNotifications();
          showToast('Alerts cleared', 'success');
        } catch(e) { showToast('Failed to clear alerts', 'error'); }
      }
    });
    document.getElementById('notif-filter-risk').addEventListener('change', renderNotifications);
    document.getElementById('notif-filter-time').addEventListener('change', renderNotifications);
    document.getElementById('notif-search').addEventListener('input', renderNotifications);
  }

  function renderNotifications() {
    const listWrap = document.getElementById('notif-list-wrap');
    const fRisk = document.getElementById('notif-filter-risk').value;
    const fTime = document.getElementById('notif-filter-time').value;
    const fSearch = document.getElementById('notif-search').value.toLowerCase();

    let filtered = state.notifications.filter(n => {
      if (fRisk !== 'all' && n.risk !== fRisk) return false;
      if (fSearch && !n.title.toLowerCase().includes(fSearch)) return false;
      const ageDays = (Date.now() - n.time) / (1000 * 60 * 60 * 24);
      if (fTime === 'today' && ageDays > 1) return false;
      if (fTime === 'week' && ageDays > 7) return false;
      if (fTime === 'month' && ageDays > 30) return false;
      return true;
    });

    document.getElementById('notif-count').textContent = filtered.length;

    if (filtered.length === 0) {
      listWrap.innerHTML = `<div class="empty-state"><span class="material-symbols-outlined">notifications_off</span><h3>No Alerts Found</h3><p>No alerts match your current filters or location setup.</p></div>`;
      return;
    }

    const groups = { today: [], week: [], older: [] };
    filtered.forEach(n => {
      const age = (Date.now() - n.time) / (1000 * 60 * 60 * 24);
      if (age <= 1) groups.today.push(n);
      else if (age <= 7) groups.week.push(n);
      else groups.older.push(n);
    });

    const buildGroup = (title, items) => {
      if (!items.length) return '';
      return `<div class="notif-group-label">${title}</div><div class="notif-list">` + items.map((n, idx) => `
        <div class="notif-card" style="animation-delay:${Math.min(idx*0.04, 0.2)}s" data-id="${n.id}">
          <div class="notif-mag-circle ${n.risk}">${n.mag.toFixed(1)}<span class="mag-label">Mag</span></div>
          <div class="notif-body">
            <div class="notif-top"><span class="notif-title" title="${escapeHtml(n.title)}">${escapeHtml(n.title)}</span><span class="risk-pill ${n.risk}">${n.riskLabel} Risk</span><span class="notif-time">${timeAgo(n.time)}</span></div>
            <div class="notif-meta">
              <span class="notif-meta-item"><span class="material-symbols-outlined">straighten</span>${formatDist(n.distance)} away</span>
              <span class="notif-meta-item"><span class="material-symbols-outlined">speed</span>MMI ${n.mmi}</span>
              <span class="notif-meta-item"><span class="material-symbols-outlined">arrow_downward</span>${Math.round(n.depthKm)} km</span>
              ${n.locName ? `<span class="notif-meta-item"><span class="material-symbols-outlined">location_on</span>${escapeHtml(n.locName)}</span>` : ''}
            </div>
          </div>
        </div>`).join('') + '</div>';
    };

    listWrap.innerHTML = buildGroup('Today', groups.today) + buildGroup('This Week', groups.week) + buildGroup('Older', groups.older);
    listWrap.querySelectorAll('.notif-card').forEach(card => card.addEventListener('click', () => {
      const notif = state.notifications.find(n => n.id === card.dataset.id);
      if (notif) openEventDetail(notif);
    }));
  }

  // ===================================================================
  // 11. EVENT DETAIL PANEL
  // ===================================================================
  function openEventDetail(data) {
    const isGlobeData = !!data.properties;
    const mag = isGlobeData ? data.properties.mag : data.mag;
    const title = isGlobeData ? data.properties.place : data.title;
    const time = isGlobeData ? data.properties.time : data.time;
    const depth = isGlobeData ? data.depth : data.depthKm;
    const lat = isGlobeData ? data.lat : data.lat;
    const lng = isGlobeData ? data.lng : data.lng;
    
    document.getElementById('ep-mag-num').textContent = mag ? mag.toFixed(1) : '?';
    document.getElementById('ep-title').textContent = title || 'Unknown Location';
    document.getElementById('ep-depth').textContent = `${Math.round(depth)} km`;
    document.getElementById('ep-time').textContent = formatTime(time);
    document.getElementById('ep-coords').textContent = `${lat.toFixed(3)}, ${lng.toFixed(3)}`;

    const act = getActiveLocation();
    if (act) {
      const dist = haversine(act.lat, act.lng, lat, lng);
      const mmi = estimateMMI(mag, dist, depth);
      const risk = classifyRisk(mmi);
      document.getElementById('ep-distance').textContent = formatDist(dist);
      document.getElementById('ep-mmi').textContent = mmi.toFixed(1);
      document.getElementById('ep-risk').innerHTML = `<span style="color:var(--seismic-${risk.level})">${risk.label}</span>`;
    } else {
      document.getElementById('ep-distance').textContent = '—';
      document.getElementById('ep-mmi').textContent = '—';
      document.getElementById('ep-risk').textContent = '—';
    }

    const url = isGlobeData ? data.properties.url : `https://earthquake.usgs.gov/earthquakes/eventpage/${data.event_id}`;
    document.getElementById('ep-usgs').href = url;
    document.getElementById('ep-share').onclick = () => {
      navigator.clipboard.writeText(`Earthquake M${mag.toFixed(1)} at ${title}. Details: ${url}`);
      showToast('Link copied to clipboard', 'success');
    };

    document.getElementById('event-panel').classList.add('open');
    if (state.globe && !document.getElementById('page-globe').classList.contains('active')) navigateTo('globe');
    if (state.globe) state.globe.pointOfView({ lat, lng, altitude: 1.5 }, 1000);
  }

  document.getElementById('ep-close').addEventListener('click', () => document.getElementById('event-panel').classList.remove('open'));

  // ===================================================================
  // 12. HISTORICAL CHART (Live USGS FDSN Query)
  // ===================================================================
  function initHistoricalChart() {
    const end = new Date(); const start = new Date(); start.setMonth(start.getMonth() - 6);
    document.getElementById('history-start').value = start.toISOString().split('T')[0];
    document.getElementById('history-end').value = end.toISOString().split('T')[0];
    document.getElementById('btn-apply-dates').addEventListener('click', fetchHistoricalData);
    document.getElementById('btn-scope-global').addEventListener('click', () => setHistoryScope('global'));
    document.getElementById('btn-scope-local').addEventListener('click', () => setHistoryScope('local'));
    fetchHistoricalData();
  }

  function setHistoryScope(scope) {
    if (scope === 'local' && !getActiveLocation()) return showToast('Please set a location first', 'error');
    state.historyScope = scope;
    document.getElementById('btn-scope-global').classList.toggle('active', scope === 'global');
    document.getElementById('btn-scope-local').classList.toggle('active', scope === 'local');
    fetchHistoricalData();
  }

  async function fetchHistoricalData() {
    const loading = document.getElementById('chart-loading'); loading.style.display = 'flex';
    const start = document.getElementById('history-start').value;
    const end = document.getElementById('history-end').value;
    let url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${start}&endtime=${end}&orderby=time&limit=20000`;
    if (state.historyScope === 'global') url += '&minmagnitude=5.0';
    else {
      const act = getActiveLocation();
      url += `&latitude=${act.lat}&longitude=${act.lng}&maxradiuskm=500&minmagnitude=2.5`;
    }

    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('USGS API error');
      const data = await resp.json();
      state.historicalData = data.features || [];
      if (state.historicalData.length === 0) showToast('No seismic activity found in this range.', 'info');
      renderCharts(); renderHistoryStats();
    } catch (e) {
      showToast('Unable to reach USGS FDSN API.', 'error');
      state.historicalData = []; renderCharts(); renderHistoryStats();
    }
    loading.style.display = 'none';
  }

  function renderCharts() {
    const events = state.historicalData;
    const fontConfig = { family: 'Inter', size: 12, color: '#94a3b8' };
    const buckets = { '2-3':0, '3-4':0, '4-5':0, '5-6':0, '6-7':0, '7+':0 };
    events.forEach(eq => {
      const m = eq.properties.mag || 0;
      if (m>=7) buckets['7+']++; else if (m>=6) buckets['6-7']++; else if (m>=5) buckets['5-6']++;
      else if (m>=4) buckets['4-5']++; else if (m>=3) buckets['3-4']++; else if (m>=2) buckets['2-3']++;
    });
    const colors = ['#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444', '#dc2626'];

    if (state.magChart) state.magChart.destroy();
    state.magChart = new Chart(document.getElementById('mag-chart').getContext('2d'), {
      type: 'bar', data: { labels: Object.keys(buckets), datasets: [{ data: Object.values(buckets), backgroundColor: colors.map(c => c + '33'), borderColor: colors, borderWidth: 1.5, borderRadius: 4 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: {color: 'rgba(148,163,184,0.06)'}, ticks: { font: fontConfig } }, y: { grid: {color: 'rgba(148,163,184,0.06)'}, ticks: { font: fontConfig } } } }
    });

    const monthlyData = {};
    events.forEach(eq => {
      const d = new Date(eq.properties.time);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      monthlyData[key] = (monthlyData[key] || 0) + 1;
    });
    const sortedKeys = Object.keys(monthlyData).sort();
    const trendLabels = sortedKeys.map(k => { const [y, m] = k.split('-'); return new Date(y, m-1).toLocaleString(undefined, {month:'short', year:'2-digit'}); });
    
    if (state.trendChart) state.trendChart.destroy();
    const ctx2 = document.getElementById('trend-chart').getContext('2d');
    const grad = ctx2.createLinearGradient(0,0,0,250); grad.addColorStop(0, 'rgba(99,102,241,0.25)'); grad.addColorStop(1, 'rgba(99,102,241,0.01)');

    state.trendChart = new Chart(ctx2, {
      type: 'line', data: { labels: trendLabels, datasets: [{ data: sortedKeys.map(k => monthlyData[k]), borderColor: '#6366f1', backgroundColor: grad, borderWidth: 2, fill: true, tension: 0.3, pointBackgroundColor: '#6366f1', pointRadius: 3 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: {color: 'rgba(148,163,184,0.06)'}, ticks: { font: fontConfig } }, y: { grid: {color: 'rgba(148,163,184,0.06)'}, ticks: { font: fontConfig } } } }
    });
  }

  function renderHistoryStats() {
    const events = state.historicalData;
    document.getElementById('hist-total').textContent = events.length.toLocaleString();
    if (!events.length) {
      document.getElementById('hist-largest').textContent = '—'; document.getElementById('hist-average').textContent = '—'; document.getElementById('hist-month').textContent = '—'; return;
    }
    const mags = events.map(e => e.properties.mag || 0);
    document.getElementById('hist-largest').textContent = `M ${Math.max(...mags).toFixed(1)}`;
    document.getElementById('hist-average').textContent = `M ${(mags.reduce((a,b)=>a+b,0)/mags.length).toFixed(1)}`;
    const now = new Date();
    document.getElementById('hist-month').textContent = events.filter(e => { const d = new Date(e.properties.time); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length.toLocaleString();

    if (state.historyScope === 'local') {
      const maxMag = Math.max(...mags);
      if (events.length > 100 || maxMag >= 6.5) state.riskLevel = 'extreme';
      else if (events.length > 40 || maxMag >= 5.5) state.riskLevel = 'high';
      else if (events.length > 10 || maxMag >= 4.0) state.riskLevel = 'moderate';
      else state.riskLevel = 'low';
    } else state.riskLevel = 'unknown';
  }

  // ===================================================================
  // 13. PREPAREDNESS TIPS
  // ===================================================================
  const TIPS_DATA = {
    before: { title: 'Before', icon: 'shield', class: 'before', items: ['Secure heavy furniture', 'Create family emergency plan', 'Identify safe spots', 'Store breakables low'] },
    during: { title: 'During', icon: 'emergency_home', class: 'during', items: ['DROP, COVER, and HOLD ON', 'Stay away from buildings', 'Pull over safely if driving', 'Do NOT use elevators'] },
    after: { title: 'After', icon: 'health_and_safety', class: 'after', items: ['Expect aftershocks', 'Check for gas leaks', 'Use text messages instead of calls', 'Monitor official channels'] }
  };
  const SUPPLY = ['Water (1 gal/person/day)', 'Non-perishable food', 'First aid kit', 'Flashlight & batteries', 'Radio', 'Dust masks'];

  function renderTips() {
    const iconBox = document.getElementById('risk-icon-box');
    iconBox.className = `risk-icon-box ${state.riskLevel}`;
    const cfg = {
      low: { icon: 'verified_user', t: 'Low Risk', d: 'Minimal historical activity. Basic prep recommended.' },
      moderate: { icon: 'shield', t: 'Moderate Risk', d: 'Occasional activity. Have a plan and basic kit.' },
      high: { icon: 'warning', t: 'High Risk', d: 'Significant activity. Ensure home is secured.' },
      extreme: { icon: 'crisis_alert', t: 'Extreme Risk', d: 'Major seismic zone. Maximum preparedness critical.' },
      unknown: { icon: 'help', t: 'Risk Unknown', d: 'Check Historical Analysis (Near Me) to calculate.' }
    }[state.riskLevel] || { icon: 'help', t: 'Risk Unknown', d: 'Check History tab.' };
    
    iconBox.innerHTML = `<span class="material-symbols-outlined">${cfg.icon}</span>`;
    document.getElementById('risk-title').textContent = cfg.t;
    document.getElementById('risk-desc').textContent = cfg.d;
    
    const riskIdx = { low: 0, moderate: 1, high: 2, extreme: 3, unknown: -1 }[state.riskLevel] ?? -1;
    document.querySelectorAll('.mmi-seg').forEach((seg, i) => seg.style.opacity = i <= riskIdx ? '1' : '0.2');

    const grid = document.getElementById('tips-grid');
    if (!grid.children.length) {
      Object.values(TIPS_DATA).forEach(sec => {
        grid.insertAdjacentHTML('beforeend', `<div class="tip-card"><div class="tip-card-header"><div class="tip-icon ${sec.class}"><span class="material-symbols-outlined">${sec.icon}</span></div><h4 style="color:var(--text-primary); text-transform:none">${sec.title}</h4></div>${sec.items.map(i => `<div class="tip-item"><span class="material-symbols-outlined">check_circle</span>${i}</div>`).join('')}</div>`);
      });
      const checkWrap = document.getElementById('checklist-items');
      const savedChecks = JSON.parse(localStorage.getItem('quakewatch_check') || '{}');
      SUPPLY.forEach((item, i) => {
        checkWrap.insertAdjacentHTML('beforeend', `<label class="check-item ${savedChecks[i] ? 'done' : ''}"><input type="checkbox" data-idx="${i}" ${savedChecks[i] ? 'checked' : ''}><span class="check-label">${item}</span></label>`);
      });
      checkWrap.addEventListener('change', e => {
        if(e.target.tagName === 'INPUT') {
          e.target.closest('.check-item').classList.toggle('done', e.target.checked);
          const st = {}; checkWrap.querySelectorAll('input').forEach(cb => { if(cb.checked) st[cb.dataset.idx] = true; });
          localStorage.setItem('quakewatch_check', JSON.stringify(st));
        }
      });
    }
  }

  // ===================================================================
  // 14. SETTINGS PAGE
  // ===================================================================
  function updateSettingsUI() {
    document.getElementById('set-mmi').value = state.settings.mmiThreshold;
    document.getElementById('set-mmi-val').textContent = parseFloat(state.settings.mmiThreshold).toFixed(1);
    document.getElementById('set-km').classList.toggle('active', state.settings.units === 'km');
    document.getElementById('set-mi').classList.toggle('active', state.settings.units === 'mi');
    document.getElementById('set-sound').checked = state.settings.soundAlerts;
    document.getElementById('set-contrast').checked = state.settings.highContrast;
    renderSettingsLocations();
  }

  function initSettings() {
    const range = document.getElementById('set-mmi');
    const rangeVal = document.getElementById('set-mmi-val');
    range.addEventListener('input', e => rangeVal.textContent = parseFloat(e.target.value).toFixed(1));
    range.addEventListener('change', async e => {
      state.settings.mmiThreshold = parseFloat(e.target.value);
      await apiPut('/settings', state.settings);
      showToast(`Threshold set to MMI ${state.settings.mmiThreshold}`);
    });

    document.getElementById('set-km').addEventListener('click', async () => { state.settings.units = 'km'; await apiPut('/settings', state.settings); updateSettingsUI(); });
    document.getElementById('set-mi').addEventListener('click', async () => { state.settings.units = 'mi'; await apiPut('/settings', state.settings); updateSettingsUI(); });
    document.getElementById('set-sound').addEventListener('change', async e => {
      state.settings.soundAlerts = e.target.checked;
      await apiPut('/settings', state.settings);
      if(state.settings.soundAlerts) playSound();
    });
    document.getElementById('set-contrast').addEventListener('change', async e => {
      state.settings.highContrast = e.target.checked;
      await apiPut('/settings', state.settings);
      applyTheme();
    });

    document.getElementById('btn-add-loc').addEventListener('click', () => startOnboarding(false));

    document.getElementById('btn-clear-data').addEventListener('click', async () => {
      if(confirm('Are you sure? This deletes all saved locations, settings, and history from the backend.')) {
        await apiDelete('/all');
        location.reload();
      }
    });
  }

  function renderSettingsLocations() {
    const wrap = document.getElementById('settings-locations');
    if(!wrap) return;
    if (state.locations.length === 0) { wrap.innerHTML = '<p class="text-sm text-muted">No locations saved.</p>'; return; }
    
    let html = '';
    state.locations.forEach(l => {
      html += `<div style="display:flex;align-items:center;justify-content:space-between;padding:10px;background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--r-sm);margin-bottom:8px">
        <div><div style="font-size:var(--text-sm);font-weight:500;color:var(--text-primary)">${escapeHtml(l.name.split(',')[0])}</div><div style="font-size:var(--text-xs);color:var(--text-muted)">${l.lat.toFixed(3)}, ${l.lng.toFixed(3)} ${l.active ? '· Active' : ''}</div></div>
        <button class="btn btn-ghost del-loc" data-id="${l.id}"><span class="material-symbols-outlined">delete</span></button>
      </div>`;
    });
    wrap.innerHTML = html;
    
    wrap.querySelectorAll('.del-loc').forEach(btn => {
      btn.addEventListener('click', async e => {
        const id = e.currentTarget.dataset.id;
        try {
          await apiDelete(`/locations/${id}`);
          state.locations = await apiGet('/locations');
          updateSettingsUI();
          updateLocationUI();
        } catch(err) { showToast('Failed to delete location', 'error'); }
      });
    });
  }

  // ===================================================================
  // 15. BOOTSTRAP
  // ===================================================================
  async function init() {
    try {
      state.settings = await apiGet('/settings');
      state.locations = await apiGet('/locations');
      applyTheme();
    } catch (e) {
      console.error('Backend unreachable. Using defaults.', e);
    }

    initNavigation();
    initOnboarding();
    initNotifications();
    initSettings();
    updateLocationUI();

    if (state.locations.length === 0) {
      startOnboarding(true);
    } else {
      startAppSync();
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
