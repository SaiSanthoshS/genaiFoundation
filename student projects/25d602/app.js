/**
 * EcoPulse Wildlife Tracker Application Logic
 * Initializes maps, charts, updates UI elements, and binds UI triggers to the Agent.
 */

// Global State
let map, radiusCircle, centerMarker;
let doughnutChart, timelineChart;
let activeObservations = [];
let targetLat = 37.7749;
let targetLng = -122.4194;
let searchRadius = 15;
let currentView = 'dashboard';

// Initialize Agent
let agent;

// Document Ready
document.addEventListener('DOMContentLoaded', () => {
    // Set default dates (1 year range)
    const endInput = document.getElementById('end-date');
    const startInput = document.getElementById('start-date');
    const today = new Date().toISOString().split('T')[0];
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    endInput.value = today;
    startInput.value = oneYearAgo.toISOString().split('T')[0];

    // Initialize Lucide Icons
    lucide.createIcons();

    // Tab view navigation
    setupNavigation();

    // Leaflet map setup
    initMap();

    // ChartJS setup
    initCharts();

    // Bind Agent
    agent = new WildlifeTrackerAgent(logToConsole, updateAgentStatus);

    // Event listeners
    setupEventListeners();

    // Run initial scan to populate dashboard
    triggerWildlifeScan();
});

// Setup sidebar view navigation
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view');
    const headerText = document.getElementById('header-text');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const viewId = item.getAttribute('data-view');
            
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            views.forEach(v => v.classList.remove('active'));
            document.getElementById(`view-${viewId}`).classList.add('active');

            currentView = viewId;

            // Header title updates
            switch (viewId) {
                case 'dashboard':
                    headerText.innerText = 'Biodiversity Dashboard';
                    break;
                case 'map':
                    headerText.innerText = 'Interactive Wildlife Map';
                    // Invalidate Leaflet size for proper rendering when tab becomes visible
                    setTimeout(() => {
                        map.invalidateSize();
                    }, 100);
                    break;
                case 'alerts':
                    headerText.innerText = 'Conservation Alert Setup';
                    break;
            }
        });
    });
}

// Leaflet Map Initialization
function initMap() {
    // CartoDB Dark Matter tile layer for premium dark aesthetic
    map = L.map('map-container', {
        zoomControl: false
    }).setView([targetLat, targetLng], 11);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    // Add Zoom control on bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initial marker & circle
    centerMarker = L.marker([targetLat, targetLng], {
        draggable: true,
        title: "Search Center Point"
    }).addTo(map);

    radiusCircle = L.circle([targetLat, targetLng], {
        color: '#58a6ff',
        fillColor: '#58a6ff',
        fillOpacity: 0.08,
        radius: searchRadius * 1000 // meters
    }).addTo(map);

    // Update location on marker drag
    centerMarker.on('dragend', function(e) {
        const position = centerMarker.getLatLng();
        updateCoordinates(position.lat, position.lng);
    });

    // Update location on map click/double click
    map.on('click', function(e) {
        updateCoordinates(e.latlng.lat, e.latlng.lng);
    });
}

// Coordinates display update helper
function updateCoordinates(lat, lng) {
    targetLat = lat;
    targetLng = lng;
    
    // Move marker and circle
    centerMarker.setLatLng([lat, lng]);
    radiusCircle.setLatLng([lat, lng]);
    
    document.getElementById('selected-coords').innerText = `Lat: ${lat.toFixed(4)} | Lng: ${lng.toFixed(4)}`;
    logToConsole('info', `Target coordinates updated: [${lat.toFixed(6)}, ${lng.toFixed(6)}]`);
}

// Chart.js Configuration
function initCharts() {
    // 1. Class doughnut chart
    const ctxDoughnut = document.getElementById('class-doughnut-chart').getContext('2d');
    doughnutChart = new Chart(ctxDoughnut, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [],
                borderWidth: 1.5,
                borderColor: '#161b22',
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#f0f6fc',
                        font: { family: 'Outfit', size: 12 },
                        padding: 15
                    }
                }
            },
            cutout: '70%'
        }
    });

    // 2. Timeline Line Chart
    const ctxLine = document.getElementById('timeline-line-chart').getContext('2d');
    timelineChart = new Chart(ctxLine, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Sightings count',
                data: [],
                borderColor: '#58a6ff',
                backgroundColor: 'rgba(88, 166, 255, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3,
                pointBackgroundColor: '#58a6ff',
                pointRadius: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#8b949e', font: { family: 'Outfit' } }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#8b949e', font: { family: 'Outfit' }, stepSize: 1 }
                }
            }
        }
    });
}

// Set up UI Event Listeners
function setupEventListeners() {
    const findBtn = document.getElementById('find-wildlife-btn');
    const radiusSlider = document.getElementById('radius-slider');
    const radiusValText = document.getElementById('radius-val');

    findBtn.addEventListener('click', triggerWildlifeScan);

    // Radius slider changes
    radiusSlider.addEventListener('input', (e) => {
        searchRadius = parseInt(e.target.value);
        radiusValText.innerText = `${searchRadius} km`;
        document.getElementById('stat-radius').innerText = `${searchRadius} km`;
        
        // Update circle radius
        radiusCircle.setRadius(searchRadius * 1000);
    });

    // Alert simulation presets
    const presetButtons = document.querySelectorAll('.preset-btn');
    presetButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.getAttribute('data-preset');
            simulateSighting(type);
        });
    });

    // Modal Close
    document.getElementById('modal-close').addEventListener('click', () => {
        document.getElementById('species-modal').classList.remove('active');
    });

    document.getElementById('species-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('species-modal')) {
            document.getElementById('species-modal').classList.remove('active');
        }
    });
}

// Trigger Agent scan process
async function triggerWildlifeScan() {
    const loader = document.getElementById('loading-overlay');
    const loaderText = document.getElementById('loading-text');
    const findBtn = document.getElementById('find-wildlife-btn');
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;

    loader.classList.add('active');
    findBtn.disabled = true;
    loaderText.innerText = "Initializing Biodiversity Agent...";

    // Stream fake typing steps for loader text
    const loaderSteps = [
        "Analyzing search parameters...",
        "Querying iNaturalist public database...",
        "Filtering observation coords...",
        "Running conservation matching...",
        "Agent rendering results..."
    ];
    let stepIndex = 0;
    const loaderInterval = setInterval(() => {
        if (stepIndex < loaderSteps.length) {
            loaderText.innerText = loaderSteps[stepIndex++];
        }
    }, 1200);

    // Trigger agent task run
    const result = await agent.queryArea(targetLat, targetLng, searchRadius, startDate, endDate);
    
    clearInterval(loaderInterval);
    loader.classList.remove('active');
    findBtn.disabled = false;

    if (result) {
        activeObservations = result.observations;
        updateDashboard(result.summary);
        plotMapMarkers(result.observations);
        
        // Check for active alerts in the freshly loaded dataset
        evaluateDatasetAlerts(result.observations);
    }
}

// Update dashboard analytics metrics
function updateDashboard(summary) {
    document.getElementById('stat-total-sightings').innerText = activeObservations.length;
    document.getElementById('stat-unique-species').innerText = summary.uniqueSpeciesCount;
    document.getElementById('stat-threatened-count').innerText = summary.threatenedCount;

    // Update IUCN alert tag description
    const threatenedTrend = document.getElementById('threatened-trend');
    if (summary.threatenedCount > 0) {
        threatenedTrend.className = 'trend danger';
        threatenedTrend.innerHTML = `<i data-lucide="shield-alert"></i><span>Critical attention needed</span>`;
    } else {
        threatenedTrend.className = 'trend success';
        threatenedTrend.innerHTML = `<i data-lucide="shield-check"></i><span>Species stable locally</span>`;
    }

    // Refresh charts
    updateCharts(summary.classCounts, activeObservations);
    lucide.createIcons();
}

// Update charts with retrieved metrics
function updateCharts(classCounts, observations) {
    const classColors = {
        'Mammalia': '#ff9f43',
        'Aves': '#00d2d3',
        'Reptilia': '#10ac84',
        'Amphibia': '#9b59b6',
        'Actinopterygii': '#54a0ff',
        'Insecta': '#ff6b6b',
        'Plantae': '#2ecc71',
        'Other': '#a4b0be'
    };

    // 1. Update Doughnut Chart (Class counts)
    const labels = Object.keys(classCounts);
    const data = Object.values(classCounts);
    const bgColors = labels.map(c => classColors[c] || classColors['Other']);

    doughnutChart.data.labels = labels;
    doughnutChart.data.datasets[0].data = data;
    doughnutChart.data.datasets[0].backgroundColor = bgColors;
    doughnutChart.update();

    // 2. Update Line Chart (Observation date counts)
    // Sort observations by date
    const dateCounts = {};
    observations.forEach(o => {
        if (o.date && o.date !== 'Unknown date') {
            const d = o.date;
            dateCounts[d] = (dateCounts[d] || 0) + 1;
        }
    });

    const sortedDates = Object.keys(dateCounts).sort((a,b) => new Date(a) - new Date(b));
    // Limit to latest 10 data points for readability
    const recentDates = sortedDates.slice(-10);
    const recentCounts = recentDates.map(d => dateCounts[d]);

    timelineChart.data.labels = recentDates;
    timelineChart.data.datasets[0].data = recentCounts;
    timelineChart.update();
}

// Clear map and plot markers
let markerGroup = null;
function plotMapMarkers(observations) {
    if (markerGroup) {
        map.removeLayer(markerGroup);
    }
    
    // Create new marker group for cluster mapping
    markerGroup = L.markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 40
    });

    const classColors = {
        'Mammalia': '#ff9f43',
        'Aves': '#00d2d3',
        'Reptilia': '#10ac84',
        'Amphibia': '#9b59b6',
        'Actinopterygii': '#54a0ff',
        'Insecta': '#ff6b6b',
        'Plantae': '#2ecc71',
        'Other': '#a4b0be'
    };

    observations.forEach(obs => {
        const color = classColors[obs.class] || classColors['Other'];
        
        // Custom circular marker with custom styling matches
        const markerHtml = `<div class="custom-leaflet-marker" style="background-color: ${color};"></div>`;
        const customIcon = L.divIcon({
            html: markerHtml,
            className: 'div-icon-wrapper',
            iconSize: [14, 14],
            iconAnchor: [7, 7]
        });

        const marker = L.marker([obs.lat, obs.lng], { icon: customIcon });
        
        // Setup popup bind
        const popupContent = `
            <div>
                <h5>${obs.commonName}</h5>
                <p><em>${obs.scientificName}</em></p>
                <p>Observed: ${obs.date} | Class: ${obs.class}</p>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
                    <span class="badge-status" style="font-size:9px; padding:3px 6px; background-color: var(--iucn-${obs.iucnCode.toLowerCase()});">${obs.iucnName}</span>
                    <button onclick="viewSpeciesDetails(${obs.id})">Details</button>
                </div>
            </div>
        `;
        
        marker.bindPopup(popupContent);
        markerGroup.addLayer(marker);
    });

    map.addLayer(markerGroup);
}

// Display species detail modal overlay
async function viewSpeciesDetails(id) {
    // Find observation
    const obs = activeObservations.find(o => o.id === id);
    if (!obs) return;

    const modal = document.getElementById('species-modal');
    const modalImage = document.getElementById('modal-image');
    const commonName = document.getElementById('modal-common-name');
    const scientificName = document.getElementById('modal-scientific-name');
    const statusBadge = document.getElementById('modal-status-badge');
    const descText = document.getElementById('modal-description');
    
    // Stats column
    document.getElementById('modal-class').innerText = obs.class;
    document.getElementById('modal-date').innerText = obs.date;
    document.getElementById('modal-lat').innerText = obs.lat.toFixed(4);
    document.getElementById('modal-lng').innerText = obs.lng.toFixed(4);
    
    // Set headers
    modalImage.style.backgroundImage = `url('${obs.photo}')`;
    commonName.innerText = obs.commonName;
    scientificName.innerText = obs.scientificName;
    statusBadge.innerText = obs.iucnName;
    statusBadge.style.backgroundColor = `var(--iucn-${obs.iucnCode.toLowerCase()})`;

    // External link
    document.getElementById('modal-link').onclick = () => {
        if (obs.wikiUrl) window.open(obs.wikiUrl, '_blank');
        else window.open(`https://www.inaturalist.org/observations/${obs.id}`, '_blank');
    };

    // Show modal and query Wikipedia description
    descText.innerText = "Agent fetching encyclopedic description from Wikipedia database...";
    modal.classList.add('active');
    lucide.createIcons();

    // Query description from Wikipedia
    const description = await agent.fetchWikipediaDescription(obs.scientificName, obs.wikiUrl);
    descText.innerText = description;
}

// Connect window scope to details trigger so inline HTML button in leaflet popup can call it
window.viewSpeciesDetails = viewSpeciesDetails;

// Evaluates freshly loaded datasets for threatened species and fires notification toasts
function evaluateDatasetAlerts(observations) {
    observations.forEach(obs => {
        // Only alert for Threatened categories by default inside current boundaries
        if (['VU', 'EN', 'CR'].includes(obs.iucnCode)) {
            // Check if alert preferences match
            const classMatch = document.getElementById(`alert-class-${obs.class.toLowerCase()}`)?.checked;
            const levelMatch = document.getElementById(`alert-level-${obs.iucnCode.toLowerCase()}`)?.checked;
            
            if (classMatch && levelMatch) {
                dispatchAlertToast(obs, 'database');
            }
        }
    });
}

// Simulated real-time alert trigger preset
function simulateSighting(presetType) {
    const presets = {
        'condor': {
            commonName: 'California Condor',
            scientificName: 'Gymnogyps californianus',
            class: 'Aves',
            photo: 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=500&auto=format&fit=crop',
            iucnCode: 'CR',
            iucnName: 'Critically Endangered',
            wikiUrl: 'https://en.wikipedia.org/wiki/California_condor',
            distMultiplier: 0.1 // close 
        },
        'puma': {
            commonName: 'Mountain Lion',
            scientificName: 'Puma concolor',
            class: 'Mammalia',
            photo: 'https://images.unsplash.com/photo-1533743983669-94fa5c4338ec?w=500&auto=format&fit=crop',
            iucnCode: 'LC',
            iucnName: 'Least Concern',
            wikiUrl: 'https://en.wikipedia.org/wiki/Cougar',
            distMultiplier: 0.3
        },
        'seaotter': {
            commonName: 'Southern Sea Otter',
            scientificName: 'Enhydra lutris nereis',
            class: 'Mammalia',
            photo: 'https://images.unsplash.com/photo-1603096007431-11618a8d1002?w=500&auto=format&fit=crop',
            iucnCode: 'EN',
            iucnName: 'Endangered',
            wikiUrl: 'https://en.wikipedia.org/wiki/Southern_sea_otter',
            distMultiplier: 0.4
        },
        'redleggedfrog': {
            commonName: 'California Red-legged Frog',
            scientificName: 'Rana draytonii',
            class: 'Amphibia',
            photo: 'https://images.unsplash.com/photo-1507988379812-73a0058c734b?w=500&auto=format&fit=crop',
            iucnCode: 'NT',
            iucnName: 'Near Threatened',
            wikiUrl: 'https://en.wikipedia.org/wiki/California_red-legged_frog',
            distMultiplier: 0.08
        }
    };

    const template = presets[presetType];
    if (!template) return;

    // Place simulated point offset
    const angle = Math.random() * Math.PI * 2;
    const distance = template.distMultiplier * searchRadius; // km
    const latOffset = (distance * Math.sin(angle)) / 111;
    const lngOffset = (distance * Math.cos(angle)) / (111 * Math.cos(targetLat * Math.PI / 180));

    const simulatedObs = {
        id: Math.floor(Math.random() * 9000000) + 1000000,
        commonName: template.commonName,
        scientificName: template.scientificName,
        class: template.class,
        photo: template.photo,
        date: new Date().toISOString().split('T')[0],
        lat: targetLat + latOffset,
        lng: targetLng + lngOffset,
        iucnCode: template.iucnCode,
        iucnName: template.iucnName,
        wikiUrl: template.wikiUrl
    };

    // Add to datasets
    activeObservations.unshift(simulatedObs);
    
    // Add to map markers list dynamically
    if (markerGroup) {
        const classColors = {
            'Mammalia': '#ff9f43',
            'Aves': '#00d2d3',
            'Reptilia': '#10ac84',
            'Amphibia': '#9b59b6',
            'Actinopterygii': '#54a0ff',
            'Insecta': '#ff6b6b',
            'Plantae': '#2ecc71',
            'Other': '#a4b0be'
        };
        const color = classColors[simulatedObs.class] || classColors['Other'];
        
        const markerHtml = `<div class="custom-leaflet-marker" style="background-color: ${color}; border-color: #ff7b72; transform: scale(1.4); animation: alert-pulse 1.2s infinite alternate;"></div>`;
        const customIcon = L.divIcon({
            html: markerHtml,
            className: 'div-icon-wrapper',
            iconSize: [14, 14],
            iconAnchor: [7, 7]
        });

        const marker = L.marker([simulatedObs.lat, simulatedObs.lng], { icon: customIcon });
        const popupContent = `
            <div>
                <h5 style="color: #ff7b72;">[SIMULATED SIGHTING]</h5>
                <h5>${simulatedObs.commonName}</h5>
                <p><em>${simulatedObs.scientificName}</em></p>
                <p>Observed: ${simulatedObs.date} | Class: ${simulatedObs.class}</p>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
                    <span class="badge-status" style="font-size:9px; padding:3px 6px; background-color: var(--iucn-${simulatedObs.iucnCode.toLowerCase()});">${simulatedObs.iucnName}</span>
                    <button onclick="viewSpeciesDetails(${simulatedObs.id})">Details</button>
                </div>
            </div>
        `;
        marker.bindPopup(popupContent);
        markerGroup.addLayer(marker);
        
        // Pan map to simulated sighting
        map.panTo([simulatedObs.lat, simulatedObs.lng]);
    }

    // Trigger log inside agent console
    logToConsole('alert', `ALERT AGENT: Simulated sighting of ${template.commonName} (${template.iucnName}) reported ${distance.toFixed(2)}km away.`);

    // Evaluate alert rule
    const classMatch = document.getElementById(`alert-class-${simulatedObs.class.toLowerCase()}`)?.checked;
    const levelMatch = document.getElementById(`alert-level-${simulatedObs.iucnCode.toLowerCase()}`)?.checked || simulatedObs.iucnCode === 'LC'; // LC allowed for sim warnings
    
    if (classMatch && levelMatch) {
        dispatchAlertToast(simulatedObs, 'simulation');
    }
}

// Dispatches a visual slide-in notification toast
function dispatchAlertToast(observation, source) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    const isCritical = ['CR', 'EN', 'VU'].includes(observation.iucnCode);
    toast.className = `toast glass ${isCritical ? 'danger' : 'warning'}`;
    
    const iconName = isCritical ? 'shield-alert' : 'bell';
    const sourceLabel = source === 'simulation' ? 'REAL-TIME SIGNAL ALERT' : 'AGENT ARCHIVE CAPTURE';

    toast.innerHTML = `
        <div class="toast-icon">
            <i data-lucide="${iconName}"></i>
        </div>
        <div class="toast-content">
            <h5 style="color: ${isCritical ? 'var(--iucn-cr)' : 'var(--iucn-vu)'}; font-size: 11px; text-transform: uppercase; letter-spacing:1px; margin-bottom: 2px;">
                ${sourceLabel}
            </h5>
            <h5 style="font-size: 14px; font-weight:600; margin-bottom: 2px;">${observation.commonName} Detected</h5>
            <p>
                A threatened <strong>${observation.class}</strong> species (${observation.scientificName}) has been logged nearby. Conservation Status: <strong>${observation.iucnName} (${observation.iucnCode})</strong>.
            </p>
        </div>
        <button class="toast-close">&times;</button>
    `;

    container.appendChild(toast);
    lucide.createIcons();

    // Trigger warning beep
    if (isCritical) {
        playEmergencySound();
    } else {
        playAlertSound();
    }

    // Close binding
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.style.animation = 'toast-slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) reverse forwards';
        setTimeout(() => toast.remove(), 300);
    });

    // Auto-remove after 8 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'toast-slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) reverse forwards';
            setTimeout(() => toast.remove(), 300);
        }
    }, 8000);
}

// Sound Synthesizers (Web Audio API)
function playAlertSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
        
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
        console.warn("Audio Context blocked by browser safety standard.");
    }
}

function playEmergencySound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(554.37, ctx.currentTime); // C#5
        osc.frequency.linearRampToValueAtTime(830.61, ctx.currentTime + 0.2); // G#5
        osc.frequency.linearRampToValueAtTime(554.37, ctx.currentTime + 0.4);
        
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
        console.warn("Audio Context blocked by browser safety standard.");
    }
}

// Writes text logs to the sidebar reasoning console
function logToConsole(tag, text) {
    const logsBox = document.getElementById('logs-display');
    if (!logsBox) return;

    const timeStr = new Date().toTimeString().split(' ')[0];
    
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `
        <span class="log-time">[${timeStr}]</span>
        <span class="log-tag ${tag}">[${tag.toUpperCase()}]</span>
        <span>${text}</span>
    `;

    logsBox.appendChild(entry);
    
    // Auto scroll to bottom
    logsBox.scrollTop = logsBox.scrollHeight;
}

// Update running state badge of the agent
function updateAgentStatus(status, text) {
    const badge = document.getElementById('agent-status');
    const badgeText = document.getElementById('agent-status-text');
    
    badge.className = `agent-status-badge ${status}`;
    badgeText.innerText = text;
}
