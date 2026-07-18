# EcoPulse — Biodiversity & Wildlife Tracker

EcoPulse is a premium dark-themed, glassmorphic single-page web application designed to track biodiversity, explore species occurrence statistics, map sightings, and register custom conservation alerts. It simulates an intelligent AI Agent running ReAct style reasoning loops while querying real-world observation registries.

## Key Features

1. **AI Agent Reasoning Log Console**: Displays real-time scrolling thoughts, API requests, data cleaning steps, and alert checks made by the tracking agent.
2. **Interactive Map (Leaflet.js)**: Features custom CartoDB Dark Matter mapping with click-to-center querying, dynamic search radius sliders, and taxonomic class color-coded observation markers.
3. **Biodiversity Analytics Dashboard**: Renders real-time statistics cards alongside dynamic Chart.js charts (species class counts doughnut chart & sightings over time line chart).
4. **Conservation Status badges (IUCN)**: Connects with Wikipedia pages dynamically to fetch descriptions and displays high-visibility badges (EX, EW, CR, EN, VU, NT, LC).
5. **Real-time Alert Simulations**: Users can customize species and conservation-tier watching checklists, then trigger simulated reports in their proximity, generating immediate desktop warning banners with synthesized sound alerts.

## Technology Stack

- **Markup & Structure**: Semantic HTML5.
- **Styling**: Modern, premium Vanilla CSS with glassmorphism backdrop filters and custom typography.
- **Dynamic Logic**: Pure JavaScript.
- **APIs Integrated**: iNaturalist Occurrence API & Wikipedia Query API.
- **External Frameworks (via CDN)**: Leaflet.js (maps), Chart.js (graphs), Lucide Icons.

## How to Run the Application

Since the application leverages public APIs, it is completely lightweight and has no build dependencies. 

To run it locally:

### Option 1: Double-Click
Simply navigate to the project directory:
`C:\Users\ChimeekhaRajathi\.gemini\antigravity\scratch\biodiversity_tracker`
And double-click on `index.html` to open it directly in your web browser.

### Option 2: Serve using Python (Recommended)
Open a terminal in the project directory and run:
```bash
python -m http-server 8000
```
Then visit `http://localhost:8000` in your web browser.

### Option 3: Serve using Node.js
If you have node installed, run:
```bash
npx -y http-server
```
This will spin up a static server instantly.
