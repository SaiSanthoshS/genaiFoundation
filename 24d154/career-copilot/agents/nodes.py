"""
LangGraph Node Functions — each node performs one step of the pipeline.
"""

from __future__ import annotations

import asyncio

from agents.state import CareerCopilotState
from backend.services.resume_parser import extract_text, parse_resume
from backend.services.ats_analyzer import analyze_ats
from backend.services.job_aggregator import search_jobs
from backend.services.job_matcher import match_jobs
from backend.services.cover_letter_gen import generate_cover_letter
from backend.services.resume_tailor import tailor_resume
from backend.services.interview_coach import generate_questions
from backend.services.career_advisor import get_career_advice


def parse_resume_node(state: CareerCopilotState) -> CareerCopilotState:
    """Node 1: Parse resume text into structured data."""
    try:
        resume_text = state.get("resume_text", "")
        if not resume_text and state.get("resume_path"):
            resume_text = extract_text(state["resume_path"])

        parsed = parse_resume(resume_text)
        return {
            **state,
            "parsed_resume": parsed,
            "candidate_profile": parsed,
            "resume_text": resume_text,
            "current_step": "parsed",
        }
    except Exception as e:
        errors = state.get("errors", [])
        errors.append(f"Resume parsing failed: {str(e)}")
        return {**state, "errors": errors, "current_step": "error"}


def ats_analysis_node(state: CareerCopilotState) -> CareerCopilotState:
    """Node 2: Run ATS analysis on parsed resume."""
    try:
        parsed = state.get("parsed_resume", {})
        result = analyze_ats(parsed)
        return {
            **state,
            "ats_score": result.get("score", 0.0),
            "ats_feedback": result,
            "current_step": "ats_analyzed",
        }
    except Exception as e:
        errors = state.get("errors", [])
        errors.append(f"ATS analysis failed: {str(e)}")
        return {**state, "errors": errors, "current_step": "error"}


def search_jobs_node(state: CareerCopilotState) -> CareerCopilotState:
    """Node 3: Search for matching jobs."""
    try:
        query = state.get("job_query", "software engineer")
        location = state.get("target_location", "")

        # Run async function in sync context
        raw_jobs = asyncio.run(search_jobs(query, location))

        return {
            **state,
            "raw_jobs": raw_jobs,
            "current_step": "jobs_fetched",
        }
    except Exception as e:
        errors = state.get("errors", [])
        errors.append(f"Job search failed: {str(e)}")
        return {**state, "errors": errors, "raw_jobs": [], "current_step": "error"}


def match_jobs_node(state: CareerCopilotState) -> CareerCopilotState:
    """Node 4: Score and rank jobs against candidate profile."""
    try:
        profile = state.get("candidate_profile", {})
        raw_jobs = state.get("raw_jobs", [])

        if not raw_jobs:
            return {**state, "matched_jobs": [], "current_step": "no_jobs"}

        matches = match_jobs(profile, raw_jobs, top_k=10)

        top_match = {}
        if matches:
            top_idx = matches[0].get("job_index", 0)
            if top_idx < len(raw_jobs):
                top_match = raw_jobs[top_idx]
                top_match["match_score"] = matches[0]

        return {
            **state,
            "matched_jobs": matches,
            "top_match": top_match,
            "current_step": "jobs_matched",
        }
    except Exception as e:
        errors = state.get("errors", [])
        errors.append(f"Job matching failed: {str(e)}")
        return {**state, "errors": errors, "current_step": "error"}


def generate_cover_letter_node(state: CareerCopilotState) -> CareerCopilotState:
    """Node 5: Generate cover letter for the top match."""
    try:
        profile = state.get("candidate_profile", {})
        top_match = state.get("top_match", {})

        if not top_match:
            return {**state, "cover_letter": "", "current_step": "no_top_match"}

        letter = generate_cover_letter(profile, top_match)

        return {
            **state,
            "cover_letter": letter,
            "current_step": "cover_letter_generated",
        }
    except Exception as e:
        errors = state.get("errors", [])
        errors.append(f"Cover letter generation failed: {str(e)}")
        return {**state, "errors": errors, "current_step": "error"}


def tailor_resume_node(state: CareerCopilotState) -> CareerCopilotState:
    """Node 6: Tailor resume for the top match."""
    try:
        profile = state.get("candidate_profile", {})
        top_match = state.get("top_match", {})

        if not top_match:
            return {**state, "tailored_resume": {}, "current_step": "no_top_match"}

        tailored = tailor_resume(profile, top_match)

        return {
            **state,
            "tailored_resume": tailored,
            "current_step": "resume_tailored",
        }
    except Exception as e:
        errors = state.get("errors", [])
        errors.append(f"Resume tailoring failed: {str(e)}")
        return {**state, "errors": errors, "current_step": "error"}


def interview_prep_node(state: CareerCopilotState) -> CareerCopilotState:
    """Node 7: Generate interview questions for the top match."""
    try:
        profile = state.get("candidate_profile", {})
        top_match = state.get("top_match", {})

        if not top_match:
            return {**state, "interview_questions": [], "current_step": "no_top_match"}

        questions = generate_questions(profile, top_match)

        return {
            **state,
            "interview_questions": questions,
            "current_step": "interview_prepared",
        }
    except Exception as e:
        errors = state.get("errors", [])
        errors.append(f"Interview prep failed: {str(e)}")
        return {**state, "errors": errors, "current_step": "error"}


def career_advice_node(state: CareerCopilotState) -> CareerCopilotState:
    """Node 8: Generate career advice."""
    try:
        profile = state.get("candidate_profile", {})
        advice = get_career_advice(profile)

        return {
            **state,
            "career_advice": advice,
            "current_step": "career_advised",
        }
    except Exception as e:
        errors = state.get("errors", [])
        errors.append(f"Career advice failed: {str(e)}")
        return {**state, "errors": errors, "current_step": "error"}
