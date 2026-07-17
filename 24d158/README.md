# Symptom Navigator

A prototype healthcare symptom-navigator web app. Static HTML/CSS/JS — no build step, no server required.

## Run it
Open `index.html` directly in a browser, or serve the folder locally:
```
python3 -m http.server 8000
```
then visit `http://localhost:8000`.

## Pages / agent flow
1. **index.html** — Symptom Chat Interface. Chat with the agent, tap the body map, or quick-add symptoms; list current medications. "Analyze Symptoms" simulates the agent querying its database.
2. **results.html** — Condition Results Page. Agent-ranked conditions with likelihood %, severity badges, plain-language explanations, and medication interaction warnings.
3. **clinics.html** — Clinic Map. Nearby mock clinics matched to your top condition's specialty, with a stylized interactive map.
4. **report.html** — Report Download Page. A compiled, printable summary (use "Download / Print Report" to save as PDF via your browser's print dialog).

## Notes
- All medical data (`js/data.js`) — symptoms, conditions, drug interactions, clinics — is mock/demo data for illustration only.
- The "agent" (`js/agent.js`) is a deterministic scoring simulation, not a real diagnostic engine.
- State is passed between pages via `localStorage` (`symptomNavigatorState`).
- This is a UI/UX prototype and **not** a medical device or source of medical advice.

## Structure
```
index.html
results.html
clinics.html
report.html
css/style.css
js/data.js      mock symptom/condition/drug/clinic database
js/agent.js     mock agent pipeline (rank, interactions, clinics, report)
js/app.js       shared UI (header, body map, chat, page renderers)
```
