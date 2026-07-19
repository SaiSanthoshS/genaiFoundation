# 🚀 AI Career Copilot

An AI-powered career assistant that helps you upload resumes, find matching jobs, generate cover letters, prepare for interviews, and track applications.

## Tech Stack

| Layer | Choice |
|---|---|
| **Backend** | FastAPI (Python) |
| **Database** | SQLite + SQLAlchemy |
| **AI/LLM** | Groq API (Llama 3.3 70B) |
| **AI Orchestration** | LangGraph |
| **Vector Store** | ChromaDB |
| **Embeddings** | ChromaDB default (sentence-transformers) |
| **Frontend** | Vanilla HTML/CSS/JS (premium dark UI) |
| **Auth** | JWT (bcrypt + python-jose) |

## Quick Start

### 1. Setup Environment

```bash
cd career-copilot

# Create & copy .env
cp .env.example .env
# Edit .env and add your Groq API key (get free at https://console.groq.com)
```

> **Note:** The existing `genaiFoundation/.env` already has `Groq_key` — the backend will auto-detect it.

### 2. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 3. Start Backend

```bash
# From the career-copilot directory
cd ..
uvicorn backend.main:app --reload --port 8000
```

The API will be available at:
- **API:** http://localhost:8000
- **Docs:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

### 4. Start Frontend

Simply open `frontend/index.html` in your browser, or use a local server:

```bash
cd frontend
python -m http.server 3000
```

Then visit http://localhost:3000

## Features

| Feature | Description |
|---|---|
| 📄 **Resume Parser** | Upload PDF/DOCX → AI extracts skills, experience, projects |
| 🎯 **ATS Analyzer** | Scores resume for ATS compatibility with suggestions |
| 🔍 **Job Search** | Searches RemoteOK, Remotive, Arbeitnow simultaneously |
| 🤖 **AI Matching** | Vector similarity + LLM scoring → fit scores per job |
| ✉️ **Cover Letter** | AI generates personalized cover letters |
| 📝 **Resume Tailoring** | Rewrites resume sections for specific jobs |
| 🎤 **Interview Coach** | Generates HR/tech/behavioral questions + STAR feedback |
| 🗺️ **Career Advisor** | Skills gap analysis + learning roadmap |
| 📋 **Kanban Tracker** | Track applications: Applied → Interview → Offer |
| 📊 **Analytics** | Dashboard with ATS score, interview rate, fit scores |

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Login |
| GET | `/auth/me` | Get profile |
| POST | `/resume/upload` | Upload & parse resume |
| GET | `/jobs/search` | Search jobs |
| POST | `/jobs/match` | AI-match jobs to resume |
| POST | `/cover-letter/generate` | Generate cover letter |
| POST | `/interview/questions` | Generate interview questions |
| GET | `/applications/` | List tracked applications |
| PUT | `/applications/{id}` | Update application status |
| GET | `/analytics/` | Dashboard analytics |

## Folder Structure

```
career-copilot/
├── backend/
│   ├── main.py              # FastAPI app entry
│   ├── config.py             # Environment settings
│   ├── requirements.txt      # Python dependencies
│   ├── database/
│   │   ├── database.py       # SQLite engine
│   │   ├── models.py         # 10 SQLAlchemy models
│   │   └── schemas.py        # Pydantic schemas
│   ├── routers/
│   │   ├── auth.py           # JWT auth
│   │   ├── resume.py         # Resume CRUD
│   │   ├── jobs.py           # Job search + matching
│   │   ├── cover_letter.py   # Cover letter generation
│   │   ├── interview.py      # Interview prep
│   │   ├── applications.py   # Kanban tracker
│   │   ├── analytics.py      # Dashboard stats
│   │   └── notifications.py  # Notification feed
│   └── services/
│       ├── resume_parser.py  # PDF/DOCX → Groq LLM
│       ├── ats_analyzer.py   # ATS scoring
│       ├── job_aggregator.py # Multi-API fetcher
│       ├── job_matcher.py    # Vector + LLM matching
│       ├── vector_store.py   # ChromaDB wrapper
│       ├── cover_letter_gen.py
│       ├── resume_tailor.py
│       ├── interview_coach.py
│       └── career_advisor.py
├── agents/
│   ├── state.py              # LangGraph state
│   ├── nodes.py              # Pipeline nodes
│   └── graph.py              # LangGraph workflow
├── prompts/                   # LLM prompt templates
├── frontend/
│   ├── index.html            # SPA with all pages
│   ├── styles.css            # Premium dark theme
│   └── app.js                # All frontend logic
├── data/                      # Auto-created (DB, uploads, vectors)
└── docs/                      # Documentation
```

## Development Roadmap

- [x] Phase 1: Auth + Resume Upload
- [x] Phase 2: Parsing + ATS
- [x] Phase 3: Job Search + Matching
- [x] Phase 4: Resume Tailoring + Cover Letters
- [x] Phase 5: Tracker + Analytics
- [x] Phase 6: Interview Coach + Career Advisor
- [x] Phase 7: Frontend UI
