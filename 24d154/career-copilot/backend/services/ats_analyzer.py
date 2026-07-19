"""
ATS (Applicant Tracking System) Analyzer — scores a resume
for ATS compatibility and suggests improvements.
"""

import json

from groq import Groq
from pathlib import Path

from backend.config import get_settings

settings = get_settings()

PROMPT_PATH = Path(__file__).resolve().parent.parent.parent / "prompts" / "ats_analysis.txt"


def analyze_ats(parsed_resume: dict, job_description: str = "") -> dict:
    """
    Analyze a parsed resume for ATS compatibility.

    Returns:
        {
            "score": float (0-100),
            "missing_keywords": [...],
            "formatting_issues": [...],
            "suggestions": [...]
        }
    """
    prompt_template = PROMPT_PATH.read_text(encoding="utf-8")
    prompt = prompt_template.replace(
        "{{RESUME_JSON}}", json.dumps(parsed_resume, indent=2)
    ).replace(
        "{{JOB_DESCRIPTION}}", job_description or "General software engineering position"
    )

    client = Groq(api_key=settings.GROQ_API_KEY)

    response = client.chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=[
            {
                "role": "system",
                "content": "You are an ATS optimization expert. Always respond with valid JSON only.",
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
        max_tokens=2000,
        response_format={"type": "json_object"},
    )

    content = response.choices[0].message.content.strip()

    try:
        result = json.loads(content)
    except json.JSONDecodeError:
        result = {
            "score": 50.0,
            "missing_keywords": [],
            "formatting_issues": ["Could not analyze — try again"],
            "suggestions": [],
        }

    # Normalize keys
    result.setdefault("score", 50.0)
    result.setdefault("missing_keywords", [])
    result.setdefault("formatting_issues", [])
    result.setdefault("suggestions", [])

    return result
