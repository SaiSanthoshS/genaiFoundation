"""
Application configuration — loads environment variables.
"""

import os
from pathlib import Path
from functools import lru_cache

from pydantic_settings import BaseSettings

# Project root is two levels up from this file (backend/ -> career-copilot/)
PROJECT_ROOT = Path(__file__).resolve().parent.parent

# Look for .env in multiple locations
ENV_PATHS = [
    PROJECT_ROOT / ".env",
    PROJECT_ROOT.parent.parent / ".env",  # genaiFoundation/.env
]


class Settings(BaseSettings):
    """Central configuration — every setting has a sensible default."""

    # ── LLM ──────────────────────────────────────────────────────────────
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    GROQ_FAST_MODEL: str = "llama-3.1-8b-instant"

    # ── Database ─────────────────────────────────────────────────────────
    DATABASE_URL: str = f"sqlite:///{PROJECT_ROOT / 'data' / 'career_copilot.db'}"

    # ── Auth (JWT) ───────────────────────────────────────────────────────
    JWT_SECRET: str = "change-me-in-production-please"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7  # 1 week

    # ── Storage ──────────────────────────────────────────────────────────
    UPLOAD_DIR: str = str(PROJECT_ROOT / "data" / "uploads")
    VECTOR_DB_DIR: str = str(PROJECT_ROOT / "data" / "vectordb")

    # ── External APIs ────────────────────────────────────────────────────
    RESEND_API_KEY: str = ""

    class Config:
        env_file = str(ENV_PATHS[0])
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """Return a cached Settings instance."""
    # Try to find an .env that exists
    for p in ENV_PATHS:
        if p.exists():
            return Settings(_env_file=str(p))
    return Settings()


# Also map the legacy key names from the existing .env
_settings = get_settings()
if not _settings.GROQ_API_KEY:
    # Fallback: read Groq_key (case-insensitive) from environment
    _settings.GROQ_API_KEY = os.getenv("Groq_key", os.getenv("GROQ_KEY", ""))
