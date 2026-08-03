"""
LangGraph State — TypedDict for the agent workflow.
"""

from __future__ import annotations

from typing import TypedDict, Optional


class CareerCopilotState(TypedDict, total=False):
    """State schema for the LangGraph career copilot workflow."""

    # ── Input ────────────────────────────────────────────────────────────
    user_id: str
    resume_path: str
    resume_text: str
    job_query: str
    target_location: str

    # ── Resume Parsing ───────────────────────────────────────────────────
    parsed_resume: dict        # Structured resume JSON
    candidate_profile: dict    # Skills, experience, etc.

    # ── ATS Analysis ─────────────────────────────────────────────────────
    ats_score: float
    ats_feedback: dict

    # ── Job Search & Matching ────────────────────────────────────────────
    raw_jobs: list[dict]       # Jobs from aggregator
    matched_jobs: list[dict]   # Scored & ranked matches
    top_match: dict            # Best matching job

    # ── Output ───────────────────────────────────────────────────────────
    cover_letter: str          # Generated cover letter
    tailored_resume: dict      # Tailored resume for top match
    interview_questions: list[dict]
    career_advice: dict

    # ── Metadata ─────────────────────────────────────────────────────────
    errors: list[str]
    current_step: str
