// State
let map;
let routes = [];
let routeLines = [];
let riskThreshold = 75;

// DOM Elements
const navLinks = document.querySelectorAll('nav a');
const contentAreas = document.querySelectorAll('.content-area');
const routeForm = document.getElementById('route-form');
const alertForm = document.getElementById('alert-form');
const riskTableBody = document.querySelector('#risk-table tbody');
const generateReportBtn = document.getElementById('generate-report');
const reportContent = document.getElementById('report-content');

// Initialize Map
function initMap() {
    if (!map) {
        map = L.map('map').setView([20, 0], 2);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(map);
    }
    
    // Invalidate size to ensure it renders correctly after being hidden
    setTimeout(() => {
        map.invalidateSize();
    }, 100);
}

// Navigation Logic
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = e.target.getAttribute('data-view');
        
        // Update active link
        navLinks.forEach(l => l.classList.remove('active'));
        e.target.classList.add('active');
        
        // Show target view
        contentAreas.forEach(area => {
            if (area.id === `view-${targetView}`) {
                area.classList.remove('hidden');
                if (targetView === 'dashboard') {
                    initMap();
                }
            } else {
                area.classList.add('hidden');
            }
        });
    });
});

// Mock Agent Logic
function simulateAgentRiskAnalysis(origin, destination) {
    // Generate random mock data
    const weatherScore = Math.floor(Math.random() * 100);
    const congestionScore = Math.floor(Math.random() * 100);
    const geoScore = Math.floor(Math.random() * 100);
    
    // Weighted total risk
    const totalRisk = Math.round((weatherScore * 0.4) + (congestionScore * 0.3) + (geoScore * 0.3));
    
    return {
        weather: weatherScore,
        congestion: congestionScore,
        geo: geoScore,
        total: totalRisk
    };
}

function getRiskClass(score) {
    if (score < 40) return 'risk-low';
    if (score < riskThreshold) return 'risk-med';
    return 'risk-high';
}

function getRiskLabel(score) {
    if (score < 40) return 'Low';
    if (score < riskThreshold) return 'Moderate';
    return 'Critical';
}

function getRiskColor(score) {
    if (score < 40) return '#10b981'; // Green
    if (score < riskThreshold) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
}

// Map Geocoding Mock
async function mockGeocode(location) {
    // Very simple mock geocoding based on common locations for demo purposes
    const coords = {
        'shanghai': [31.2304, 121.4737],
        'los angeles': [34.0522, -118.2437],
        'rotterdam': [51.9244, 4.4777],
        'singapore': [1.3521, 103.8198],
        'new york': [40.7128, -74.0060],
        'dubai': [25.2048, 55.2708]
    };
    
    const lowerLoc = location.toLowerCase();
    if (coords[lowerLoc]) return coords[lowerLoc];
    
    // Random fallback
    return [
        (Math.random() * 140) - 70, // Lat -70 to 70
        (Math.random() * 360) - 180 // Lng -180 to 180
    ];
}

// Add Route Logic
routeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const origin = document.getElementById('origin').value;
    const destination = document.getElementById('destination').value;
    const cargoType = document.getElementById('cargo-type').value;
    
    // Show toast
    showToast(`Agent analyzing route: ${origin} to ${destination}...`);
    
    // Simulate agent work
    setTimeout(async () => {
        const riskData = simulateAgentRiskAnalysis(origin, destination);
        
        const route = {
            id: Date.now(),
            origin,
            destination,
            cargoType,
            riskData
        };
        
        routes.push(route);
        updateTable();
        await updateMap(route);
        
        // Switch to dashboard view to see the new route
        navLinks[0].click();
        
        // Alert check
        if (riskData.total >= riskThreshold) {
            setTimeout(() => {
                showToast(`⚠️ ALERT: Route ${origin}-${destination} exceeded risk threshold (${riskData.total}/100)`);
            }, 1000);
        }
        
        routeForm.reset();
    }, 1500);
});

// Update Table
function updateTable() {
    riskTableBody.innerHTML = '';
    
    routes.forEach(route => {
        const tr = document.createElement('tr');
        
        const rClass = getRiskClass(route.riskData.total);
        const rLabel = getRiskLabel(route.riskData.total);
        
        tr.innerHTML = `
            <td><strong>${route.origin}</strong> → <strong>${route.destination}</strong></td>
            <td>${route.cargoType}</td>
            <td>${route.riskData.weather}/100</td>
            <td>${route.riskData.congestion}/100</td>
            <td>${route.riskData.geo}/100</td>
            <td><strong>${route.riskData.total}/100</strong></td>
            <td><span class="risk-badge ${rClass}">${rLabel}</span></td>
        `;
        riskTableBody.appendChild(tr);
    });
}

// Update Map
async function updateMap(route) {
    const originCoords = await mockGeocode(route.origin);
    const destCoords = await mockGeocode(route.destination);
    
    const color = getRiskColor(route.riskData.total);
    
    // Add markers
    L.circleMarker(originCoords, { radius: 6, color: '#fff', fillColor: color, fillOpacity: 1 }).addTo(map).bindPopup(route.origin);
    L.circleMarker(destCoords, { radius: 6, color: '#fff', fillColor: color, fillOpacity: 1 }).addTo(map).bindPopup(route.destination);
    
    // Draw line
    const line = L.polyline([originCoords, destCoords], {
        color: color,
        weight: 3,
        opacity: 0.8,
        dashArray: '10, 10'
    }).addTo(map);
    
    routeLines.push(line);
    
    // Fit bounds
    const group = new L.featureGroup(routeLines);
    map.fitBounds(group.getBounds(), { padding: [50, 50] });
}

// Alert Config
alertForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newThreshold = parseInt(document.getElementById('threshold').value, 10);
    if (!isNaN(newThreshold) && newThreshold >= 0 && newThreshold <= 100) {
        riskThreshold = newThreshold;
        showToast('Alert configuration updated successfully.');
        updateTable(); // Re-evaluate table colors if threshold changes
    }
});

// Reports
generateReportBtn.addEventListener('click', () => {
    generateReportBtn.textContent = 'Agent generating report...';
    generateReportBtn.disabled = true;
    
    setTimeout(() => {
        const avgRisk = routes.length > 0 ? 
            Math.round(routes.reduce((acc, r) => acc + r.riskData.total, 0) / routes.length) : 0;
            
        let criticalRoutes = routes.filter(r => r.riskData.total >= riskThreshold);
        
        let reportHTML = `
            <h3>Weekly Summary (Last 7 Days)</h3>
            <p>The AI Agent monitored <strong>${routes.length}</strong> active shipping routes.</p>
            <br>
            <h4>Key Metrics:</h4>
            <ul>
                <li>Average Global Risk Score: <strong>${avgRisk}/100</strong></li>
                <li>Critical Routes Identified: <strong>${criticalRoutes.length}</strong></li>
                <li>Primary Disruption Factor: <strong>${Math.random() > 0.5 ? 'Weather Events' : 'Port Congestion'}</strong></li>
            </ul>
        `;
        
        if (criticalRoutes.length > 0) {
            reportHTML += `<br><h4>Critical Routes Action Required:</h4><ul>`;
            criticalRoutes.forEach(r => {
                reportHTML += `<li>${r.origin} to ${r.destination} - Cargo: ${r.cargoType} (Score: ${r.riskData.total})</li>`;
            });
            reportHTML += `</ul>`;
        }
        
        reportContent.innerHTML = reportHTML;
        
        generateReportBtn.textContent = 'Generate Latest Report';
        generateReportBtn.disabled = false;
        showToast('Weekly report generated.');
    }, 2000);
});

// Toast Utility
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
    initMap();
});
