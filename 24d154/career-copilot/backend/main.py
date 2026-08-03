"""
AI Career Copilot — FastAPI Application

Main entry point. Run with:
    cd career-copilot
    uvicorn backend.main:app --reload --port 8000
"""

import os
import sys
from pathlib import Path

# Add project root to Python path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.database.database import init_db
from backend.config import get_settings

settings = get_settings()

# ── App Setup ────────────────────────────────────────────────────────────────

app = FastAPI(
    title="AI Career Copilot",
    description="AI-powered career assistant — resume parsing, job matching, cover letters, interview prep",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS (allow Next.js frontend) ───────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register Routers ────────────────────────────────────────────────────────

from backend.routers import auth, resume, jobs, cover_letter, interview, applications, analytics, notifications

app.include_router(auth.router)
app.include_router(resume.router)
app.include_router(jobs.router)
app.include_router(cover_letter.router)
app.include_router(interview.router)
app.include_router(applications.router)
app.include_router(analytics.router)
app.include_router(notifications.router)


# ── Startup Events ──────────────────────────────────────────────────────────

@app.on_event("startup")
def on_startup():
    """Initialize database and create upload directories."""
    init_db()
    Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
    Path(settings.VECTOR_DB_DIR).mkdir(parents=True, exist_ok=True)
    print("[OK] Database initialized")
    print("[OK] Upload directory ready")
    print("[OK] API docs: http://localhost:8000/docs")


# ── Health Check ─────────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "app": "AI Career Copilot",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
