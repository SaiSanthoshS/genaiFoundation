# Fake News Detector

A full-stack demo app for analyzing article credibility with a mock FastAPI backend and a React + Tailwind frontend.

## Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

The UI will call the backend at http://localhost:8000/analyze.
