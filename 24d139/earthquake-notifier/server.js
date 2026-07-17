const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize SQLite database
const dbPath = path.join(__dirname, 'earthquakes.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Create tables
  db.run(`CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    mmiThreshold REAL,
    units TEXT,
    soundAlerts INTEGER,
    highContrast INTEGER
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS locations (
    id TEXT PRIMARY KEY,
    name TEXT,
    lat REAL,
    lng REAL,
    active INTEGER
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS earthquakes (
    id TEXT PRIMARY KEY,
    mag REAL,
    place TEXT,
    time INTEGER,
    lat REAL,
    lng REAL,
    depth REAL,
    raw_geojson TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    title TEXT,
    mag REAL,
    distance REAL,
    mmi REAL,
    risk TEXT,
    riskLabel TEXT,
    depthKm REAL,
    lat REAL,
    lng REAL,
    time INTEGER,
    locId TEXT,
    locName TEXT,
    event_id TEXT
  )`);

  // Initialize default settings if empty
  db.get('SELECT * FROM settings WHERE id = 1', (err, row) => {
    if (!row) {
      db.run(`INSERT INTO settings (id, mmiThreshold, units, soundAlerts, highContrast) 
              VALUES (1, 4.0, 'km', 0, 0)`);
    }
  });
});

// ===================================================================
// UTILITIES
// ===================================================================
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateMMI(magnitude, distanceKm, depthKm) {
  const hypocentral = Math.sqrt(distanceKm ** 2 + (depthKm || 10) ** 2);
  const R = Math.max(hypocentral, 1);
  const a = 2.085, b = 1.428, c = -1.402, d = -0.00346;
  let mmi = a + b * magnitude + c * Math.log(R) + d * R;
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

// ===================================================================
// BACKGROUND POLLING (USGS)
// ===================================================================
async function pollUSGS() {
  try {
    const resp = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson');
    if (!resp.ok) return;
    const data = await resp.json();
    
    // Get active location
    db.get('SELECT * FROM locations WHERE active = 1', (err, activeLoc) => {
      if (err) return;

      data.features.forEach(eq => {
        const id = eq.id;
        const [lng, lat, depth] = eq.geometry.coordinates;
        const mag = eq.properties.mag || 0;
        const place = eq.properties.place || 'Unknown';
        const time = eq.properties.time;

        // Insert into earthquakes
        db.run(`INSERT OR IGNORE INTO earthquakes (id, mag, place, time, lat, lng, depth, raw_geojson) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
                 [id, mag, place, time, lat, lng, depth, JSON.stringify(eq)]);

        // Process notification if active location exists
        if (activeLoc) {
          db.get('SELECT id FROM notifications WHERE event_id = ? AND locId = ?', [id, activeLoc.id], (err, row) => {
            if (!row) {
              const dist = haversine(activeLoc.lat, activeLoc.lng, lat, lng);
              const mmi = estimateMMI(mag, dist, depth);
              const risk = classifyRisk(mmi);

              if (mmi >= 2 || mag >= 5.0) {
                const notifId = `${id}_${activeLoc.id}`;
                db.run(`INSERT OR IGNORE INTO notifications 
                        (id, title, mag, distance, mmi, risk, riskLabel, depthKm, lat, lng, time, locId, locName, event_id)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [notifId, place, mag, dist, mmi, risk.level, risk.label, depth, lat, lng, time, activeLoc.id, activeLoc.name.split(',')[0], id]);
              }
            }
          });
        }
      });
    });
  } catch (e) {
    console.error('USGS Polling failed:', e.message);
  }
}

setInterval(pollUSGS, 60000);
setTimeout(pollUSGS, 1000); // Initial fetch

// ===================================================================
// API ENDPOINTS
// ===================================================================

// --- SETTINGS ---
app.get('/api/settings', (req, res) => {
  db.get('SELECT * FROM settings WHERE id = 1', (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      mmiThreshold: row.mmiThreshold,
      units: row.units,
      soundAlerts: !!row.soundAlerts,
      highContrast: !!row.highContrast
    });
  });
});

app.put('/api/settings', (req, res) => {
  const { mmiThreshold, units, soundAlerts, highContrast } = req.body;
  db.run(`UPDATE settings SET mmiThreshold = ?, units = ?, soundAlerts = ?, highContrast = ? WHERE id = 1`,
    [mmiThreshold, units, soundAlerts ? 1 : 0, highContrast ? 1 : 0],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
});

// --- LOCATIONS ---
app.get('/api/locations', (req, res) => {
  db.all('SELECT * FROM locations', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    rows.forEach(r => r.active = !!r.active);
    res.json(rows);
  });
});

app.post('/api/locations', (req, res) => {
  const { id, name, lat, lng, active } = req.body;
  if (active) db.run('UPDATE locations SET active = 0'); // Only one active
  db.run('INSERT INTO locations (id, name, lat, lng, active) VALUES (?, ?, ?, ?, ?)',
    [id, name, lat, lng, active ? 1 : 0],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
});

app.delete('/api/locations/:id', (req, res) => {
  db.run('DELETE FROM locations WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    // If active was deleted, make first remaining active
    db.get('SELECT count(*) as count FROM locations WHERE active = 1', (err, row) => {
      if (row && row.count === 0) {
        db.run('UPDATE locations SET active = 1 WHERE id = (SELECT id FROM locations LIMIT 1)');
      }
      res.json({ success: true });
    });
  });
});

app.put('/api/locations/:id/active', (req, res) => {
  db.serialize(() => {
    db.run('UPDATE locations SET active = 0');
    db.run('UPDATE locations SET active = 1 WHERE id = ?', [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });
});

// --- EARTHQUAKES (For Globe) ---
app.get('/api/earthquakes', (req, res) => {
  // Return last 24h of events matching the USGS feed timeline
  const yesterday = Date.now() - (24 * 60 * 60 * 1000);
  db.all('SELECT raw_geojson FROM earthquakes WHERE time >= ?', [yesterday], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(r => JSON.parse(r.raw_geojson)));
  });
});

// --- NOTIFICATIONS ---
app.get('/api/notifications', (req, res) => {
  db.all('SELECT * FROM notifications ORDER BY time DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.delete('/api/notifications', (req, res) => {
  db.run('DELETE FROM notifications', (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// --- CLEAR ALL DATA ---
app.delete('/api/all', (req, res) => {
  db.serialize(() => {
    db.run('DELETE FROM locations');
    db.run('DELETE FROM earthquakes');
    db.run('DELETE FROM notifications');
    db.run(`UPDATE settings SET mmiThreshold = 4.0, units = 'km', soundAlerts = 0, highContrast = 0 WHERE id = 1`);
    res.json({ success: true });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`QuakeWatch API running on http://127.0.0.1:${PORT}`);
});
