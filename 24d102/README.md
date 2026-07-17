# Historical Currency & Inflation Analyser

A full-stack app that compares nominal exchange rates with inflation-adjusted (real) rates, estimates purchasing power over time, annotates visible market inflections with major economic events, and exports a PDF report.

## Stack

- Backend: Node.js + Express
- Frontend: React + Vite + Recharts
- Data sources:
  - Frankfurter API (historical FX rates)
  - World Bank API (inflation indicators)

## Quick start

1. Install dependencies from repo root:

```bash
npm install
```

2. Start backend + frontend:

```bash
npm run dev
```

3. Open the app:

- Frontend: http://localhost:5173
- Backend API: http://localhost:4000

## Features implemented

- Currency and date-range selector
- Agent-style analysis endpoint that:
  - fetches daily FX rates
  - fetches inflation series per country
  - computes inflation-adjusted exchange rate series
  - computes purchasing power timeline for a fixed amount
  - detects inflection points and maps them to major events
- Dual-line exchange chart (nominal vs real)
- Purchasing power timeline chart
- Event markers with explanations
- PDF export with charts + written analysis

## Notes

- Inflation data is annual and mapped to daily rates by year.
- Event annotation combines deterministic inflection detection and a curated global event catalog.
