# Disaster Alert Aggregator

A lightweight full-stack app that:

1. Tracks live disaster alerts (earthquakes + other hazards) near a location you choose, and plots them on an interactive map.
2. Answers questions from a chatbot that is restricted to only what you upload — a simple RAG (Retrieval-Augmented Generation) pipeline built with FAISS + Sentence-Transformers + Google Gemini.

## Tech Stack

| Layer     | Tech                                             |
|-----------|---------------------------------------------------|
| Frontend  | React (Vite) + Tailwind CSS + Leaflet (map)       |
| Backend   | Flask (Python)                                    |
| Database  | SQLite                                            |
| RAG       | FAISS + Sentence-Transformers                     |
| LLM       | Google Gemini API                                 |
| Live data | USGS Earthquake API, NASA EONET                   |

## Project Structure

```
disaster-alert-aggregator/
├── backend/
│   ├── app.py                     # Flask routes
│   ├── config.py                  # paths, constants
│   ├── database.py                # SQLite helpers
│   ├── rag/
│   │   ├── document_processor.py  # extract + chunk text
│   │   ├── rag_engine.py          # embeddings + FAISS
│   │   └── gemini_client.py       # calls Gemini with retrieved context
│   ├── services/
│   │   ├── geocode_service.py     # city/address -> lat/lon
│   │   └── alerts_service.py      # USGS + EONET fetch, distance, severity
│   ├── uploads/                   # uploaded documents land here
│   ├── data/                      # SQLite DB + FAISS index (created at runtime)
│   └── requirements.txt
└── frontend/
    └── src/
        ├── pages/                 # Home, LocationSetup, DisasterAlerts, Chatbot, Settings
        ├── components/            # Navbar, AlertsMap
        └── api.js                 # axios wrapper around the backend
```

## 1. Installation

**Requirements:** Python 3.10+, Node.js 18+

```bash
git clone <this-repo>
cd disaster-alert-aggregator
```

### Backend setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

> The first time you upload a document, `sentence-transformers` will download
> the `all-MiniLM-L6-v2` embedding model (~80 MB) from Hugging Face. This
> needs an internet connection once; after that it's cached locally.

### Frontend setup

```bash
cd frontend
npm install
```

## 2. Running the Backend

```bash
cd backend
source venv/bin/activate
python app.py
```

The API runs at **http://localhost:5000**. It creates `data/app.db` (SQLite) automatically on first run.

## 3. Running the Frontend

In a separate terminal:

```bash
cd frontend
npm run dev
```

The app runs at **http://localhost:5173** and talks directly to the Flask backend on port 5000 (CORS is already enabled).

## 4. Adding a Gemini API Key

1. Get a free key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Open the app → **Settings** page.
3. Paste the key and click **Save API Key**.

The key is stored in the local SQLite database (`backend/data/app.db`) and is **never** hardcoded anywhere in the code.

## 5. Setting Your Location & Viewing Alerts

1. Go to **Location Setup** → enter a city/address and pick a radius (10–200 km) → **Save Location**.
2. Go to **Disaster Alerts** to see:
   - A map centered on your location, with a dashed circle showing your alert radius, and colored markers for every disaster-prone area found nearby (🟢 low, 🟡 moderate, 🟠 high, 🔴 critical).
   - A table with the same alerts (type, location, severity, distance, date/time).
   - The page auto-refreshes every 3 minutes, or click **Refresh Now**.

Earthquake data comes from USGS (last 24 hours, worldwide, filtered to your radius). NASA EONET adds wildfires, storms, and other hazards when available.

## 6. Uploading Documents & Using the Chatbot

1. Go to **RAG Chatbot**.
2. In the **Knowledge Base** panel, click the upload box and choose a `.pdf`, `.txt`, or `.docx` file.
   - The file is saved on the backend, text is extracted, split into overlapping chunks, embedded with Sentence-Transformers, and stored in a FAISS index (persisted to disk, so it survives a restart).
3. Type a question in the chat box and hit **Ask**.
   - The backend retrieves the most relevant chunks from FAISS and sends them, along with your question, to Gemini.
   - If nothing relevant was found in your documents, the chatbot replies: *"I couldn't find this information in the uploaded knowledge base."*
   - Answered messages show which uploaded file(s) the answer drew from.

You can upload multiple documents — they all get added to the same knowledge base.

## API Reference

| Method | Route       | Description                                   |
|--------|-------------|------------------------------------------------|
| POST   | `/location` | Save `{ place_name, radius_km }`               |
| GET    | `/location` | Get the currently saved location               |
| GET    | `/alerts`   | Get live alerts near the saved location        |
| POST   | `/upload`   | Upload a document (`multipart/form-data`, field `file`) |
| POST   | `/chat`     | Ask a question: `{ question }`                 |
| POST   | `/apikey`   | Save the Gemini key: `{ api_key }`              |
| GET    | `/apikey`   | Check whether a key is set (`{ is_set }`)       |

## Notes

- This is intentionally a mini-project scope: one saved location at a time, a single shared knowledge base, no user accounts. It's meant to be easy to read, run, and explain — not a production system.
- If a public API (USGS, EONET, or the geocoder) is briefly unavailable, the backend fails quietly for that source rather than crashing the page.
