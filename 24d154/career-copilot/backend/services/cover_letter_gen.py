"""
Cover Letter Generator — creates personalized cover letters
using resume data + job description via Groq LLM.
"""

import json
from pathlib import Path

from groq import Groq

from backend.config import get_settings

settings = get_settings()

PROMPT_PATH = Path(__file__).resolve().parent.parent.parent / "prompts" / "cover_letter.txt"


def generate_cover_letter(
    candidate_profile: dict,
    job: dict,
    user_name: str = "",
) -> str:
    """
    Generate a personalized cover letter.

    Args:
        candidate_profile: Parsed resume data
        job: Job listing dict (title, company, description, requirements)
        user_name: User's full name

    Returns:
        Cover letter text (markdown-formatted)
    """
    prompt_template = PROMPT_PATH.read_text(encoding="utf-8")

    prompt = prompt_template.replace(
        "{{CANDIDATE_NAME}}", user_name or "Candidate"
    ).replace(
        "{{CANDIDATE_SKILLS}}", json.dumps(candidate_profile.get("skills", []))
    ).replace(
        "{{CANDIDATE_EXPERIENCE}}", json.dumps(candidate_profile.get("experience", [])[:3])
    ).replace(
        "{{CANDIDATE_PROJECTS}}", json.dumps(candidate_profile.get("projects", [])[:3])
    ).replace(
        "{{JOB_TITLE}}", job.get("title", "")
    ).replace(
        "{{COMPANY_NAME}}", job.get("company", "")
    ).replace(
        "{{JOB_DESCRIPTION}}", job.get("description", "")[:1500]
    ).replace(
        "{{JOB_REQUIREMENTS}}", json.dumps(job.get("requirements", []))
    )

    client = Groq(api_key=settings.GROQ_API_KEY)

    response = client.chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=[
            {
                "role": "system",
                "content": "You are an expert cover letter writer. Write professional, compelling cover letters.",
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
        max_tokens=2000,
    )

    return response.choices[0].message.content.strip()
