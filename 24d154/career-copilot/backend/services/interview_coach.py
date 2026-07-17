"""
Interview Coach — generates interview questions with STAR feedback
and provides mock interview support.
"""

import json
from pathlib import Path

from groq import Groq

from backend.config import get_settings

settings = get_settings()

PROMPT_PATH = Path(__file__).resolve().parent.parent.parent / "prompts" / "interview_prep.txt"


def generate_questions(
    candidate_profile: dict,
    job: dict,
    question_types: list[str] = None,
) -> list[dict]:
    """
    Generate interview questions based on the candidate's profile and target job.

    Args:
        candidate_profile: Parsed resume data
        job: Job listing dict
        question_types: Types to generate ("hr", "technical", "behavioral")

    Returns:
        List of question dicts with type, question, sample_answer, tips
    """
    if question_types is None:
        question_types = ["hr", "technical", "behavioral"]

    prompt_template = PROMPT_PATH.read_text(encoding="utf-8")

    prompt = prompt_template.replace(
        "{{CANDIDATE_SKILLS}}", json.dumps(candidate_profile.get("skills", []))
    ).replace(
        "{{CANDIDATE_EXPERIENCE}}", json.dumps(candidate_profile.get("experience", [])[:3])
    ).replace(
        "{{JOB_TITLE}}", job.get("title", "")
    ).replace(
        "{{COMPANY_NAME}}", job.get("company", "")
    ).replace(
        "{{JOB_REQUIREMENTS}}", json.dumps(job.get("requirements", []))
    ).replace(
        "{{QUESTION_TYPES}}", json.dumps(question_types)
    )

    client = Groq(api_key=settings.GROQ_API_KEY)

    response = client.chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=[
            {
                "role": "system",
                "content": "You are an expert interview coach. Return valid JSON only.",
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.5,
        max_tokens=4000,
        response_format={"type": "json_object"},
    )

    try:
        result = json.loads(response.choices[0].message.content.strip())
        return result.get("questions", [])
    except json.JSONDecodeError:
        return [
            {
                "type": "hr",
                "question": "Tell me about yourself.",
                "sample_answer": "Use the STAR method to structure your response.",
                "tips": "Keep it concise — 2 minutes max.",
            }
        ]


def evaluate_answer(question: str, answer: str, job_context: str = "") -> dict:
    """
    Evaluate a candidate's interview answer using STAR feedback.

    Returns: { score, feedback, star_breakdown, improvement_tips }
    """
    client = Groq(api_key=settings.GROQ_API_KEY)

    prompt = f"""Evaluate this interview answer using the STAR method.

Question: {question}
Answer: {answer}
Job Context: {job_context}

Return JSON:
{{
    "score": <1-10>,
    "feedback": "Overall assessment",
    "star_breakdown": {{
        "situation": "How well they set the scene (1-10)",
        "task": "How clearly they defined the challenge (1-10)",
        "action": "How specifically they described their actions (1-10)",
        "result": "How concrete the outcomes were (1-10)"
    }},
    "improvement_tips": ["tip1", "tip2"]
}}"""

    response = client.chat.completions.create(
        model=settings.GROQ_FAST_MODEL,
        messages=[
            {"role": "system", "content": "You are an interview evaluation expert. Return valid JSON only."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.3,
        max_tokens=1000,
        response_format={"type": "json_object"},
    )

    try:
        return json.loads(response.choices[0].message.content.strip())
    except json.JSONDecodeError:
        return {
            "score": 5,
            "feedback": "Could not evaluate — try again.",
            "star_breakdown": {},
            "improvement_tips": [],
        }
