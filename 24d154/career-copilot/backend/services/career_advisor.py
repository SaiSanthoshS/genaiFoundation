"""
Career Advisor — provides skills gap analysis, course recommendations,
certifications, and career roadmap suggestions.
"""

import json
from pathlib import Path

from groq import Groq

from backend.config import get_settings

settings = get_settings()

PROMPT_PATH = Path(__file__).resolve().parent.parent.parent / "prompts" / "career_advice.txt"


def get_career_advice(
    candidate_profile: dict,
    target_roles: list[str] = None,
    market_trends: list[dict] = None,
) -> dict:
    """
    Generate personalized career advice.

    Returns:
        {
            "skills_to_learn": [...],
            "recommended_courses": [...],
            "certifications": [...],
            "career_roadmap": [...],
            "industry_insights": str,
            "salary_estimate": str
        }
    """
    prompt_template = PROMPT_PATH.read_text(encoding="utf-8")

    prompt = prompt_template.replace(
        "{{CANDIDATE_SKILLS}}", json.dumps(candidate_profile.get("skills", []))
    ).replace(
        "{{CANDIDATE_EXPERIENCE}}", json.dumps(candidate_profile.get("experience", [])[:3])
    ).replace(
        "{{CANDIDATE_EDUCATION}}", json.dumps(candidate_profile.get("education", []))
    ).replace(
        "{{TARGET_ROLES}}", json.dumps(target_roles or ["Software Engineer"])
    ).replace(
        "{{YEARS_EXPERIENCE}}", str(len(candidate_profile.get("experience", [])))
    )

    client = Groq(api_key=settings.GROQ_API_KEY)

    response = client.chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=[
            {
                "role": "system",
                "content": "You are a senior career advisor with 20 years of tech industry experience. Return valid JSON only.",
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.5,
        max_tokens=3000,
        response_format={"type": "json_object"},
    )

    try:
        return json.loads(response.choices[0].message.content.strip())
    except json.JSONDecodeError:
        return {
            "skills_to_learn": [],
            "recommended_courses": [],
            "certifications": [],
            "career_roadmap": [],
            "industry_insights": "Could not generate advice — try again.",
            "salary_estimate": "",
        }
