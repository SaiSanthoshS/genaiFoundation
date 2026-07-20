# 🌍 QuakeWatch

**QuakeWatch** is a premium, real-time Earthquake Early Warning Notifier built as a lightweight Single Page Application (SPA). Its primary goal is to monitor global seismic activity and calculate how strongly you might feel an earthquake based on your specific location.

Because performance and zero-dependency deployment were priorities, the entire app is built using **Vanilla JavaScript, HTML, and CSS** without any heavy frameworks like React or Vue.

## Project Architecture

Here is a clear breakdown of how the code is organized across the three main files:

### 1. `app.js` (The Brains / Logic)
This file handles all state management, API polling, mathematical calculations, and UI interactions. It's roughly divided into these core systems:

* **The Seismic Agent**: A background loop that polls the live [USGS GeoJSON feed](https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson) every 60 seconds. It tracks which event IDs it has already seen so it doesn't alert you twice for the same quake.
* **The IPE Engine (Intensity Prediction Equation)**: When an earthquake occurs, the app calculates the distance from the epicenter to your saved coordinates using the Haversine formula. It then uses a mathematical model to estimate the **MMI (Modified Mercalli Intensity)**—which is how much shaking you will actually feel.
* **The Globe Renderer**: We use `Globe.GL` for the 3D earth. Instead of rendering WebGL polygons, we use `htmlElementsData` to overlay pure HTML/CSS elements onto the globe coordinates. This is how we get perfectly smooth, glowing dots and animated ripple rings for recent earthquakes.
* **State & Persistence**: All your settings, saved locations, and alert history are automatically saved to your browser's `localStorage` so they persist when you refresh or return later.
* **Charts**: It interfaces with the USGS FDSN API to fetch historical data and uses `Chart.js` to draw the magnitude distribution bars and monthly trend lines.

### 2. `styles.css` (The Design System)
This is a comprehensive, modern CSS architecture utilizing a strict "Design Token" approach via CSS variables (`:root`).
* **3-Tier Elevation**: Instead of random transparency, the UI uses three strict tiers of glassmorphism (`--surface`, `--elevated`, `--overlay`), each with increasing opacity and blur to create a sense of depth in the dark space theme.
* **Seismic Palette**: A standardized color scale representing risk (Green = Low, Yellow = Moderate, Orange = High, Red = Extreme, Deep Red = Critical). This palette is mapped consistently across the globe markers, notification pills, and charts.
* **Responsive Breakpoints**: The layout uses flexbox and grid to adapt seamlessly. On desktop, you see a full left sidebar. On a tablet, it collapses to icons. On a mobile phone, the sidebar moves to the bottom like an iOS tab bar.

### 3. `index.html` (The Structure)
This is the single HTML shell that holds the entire app. It never reloads.
* **Page Sections**: The main content area contains 5 `<section>` tags (Globe, Alerts, History, Tips, Settings). The JavaScript simply toggles the `active` CSS class to hide and show these sections when you click the navigation rail.
* **Overlays**: It includes hidden structural elements for the Onboarding Wizard (the modal that pops up when you first arrive), the Command Bar (the search overlay triggered by `Ctrl+K`), and the Event Detail Panel (the slide-out drawer on the right).
* **CDN Dependencies**: It imports fonts (Google Inter, Material Symbols) and our two external libraries (`Globe.GL` and `Chart.js`) directly from fast content delivery networks so there is no build step required.

## How it flows together

When you open the app, `index.html` loads and `app.js` checks your `localStorage`. If it's your first time, it triggers the Onboarding Wizard to get your GPS coordinates. Once you have a location, the Seismic Agent starts polling the USGS. When it finds a new earthquake, it calculates the distance, figures out the shaking intensity, plots a glowing dot on the 3D globe, and if the intensity passes your threshold, it fires a native browser push notification directly to your desktop.

## Data Policy

**NO MOCK DATA:** QuakeWatch is built to rely exclusively on real, live data. There is no mocked, fabricated, or simulated earthquake data anywhere in the codebase. All historical and live alerts fetch directly from USGS endpoints, and empty/error states are designed to honestly reflect periods of zero seismic activity or network outages.
