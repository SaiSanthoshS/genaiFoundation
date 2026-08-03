"""
Resume Tailoring Service — generates a customized resume
targeted at a specific job description.
"""

import json

from groq import Groq

from backend.config import get_settings

settings = get_settings()


def tailor_resume(
    candidate_profile: dict,
    job: dict,
) -> dict:
    """
    Generate a tailored resume optimized for a specific job.

    Returns a dict with:
        - tailored_summary: str
        - highlighted_skills: list[str]
        - tailored_experience: list[dict]
        - tailored_projects: list[dict]
        - keywords_added: list[str]
        - tips: list[str]
    """
    prompt = f"""You are a resume optimization expert.

Given a candidate's profile and a target job, create a TAILORED version of their resume
that maximizes ATS compatibility and recruiter appeal for THIS specific role.

Candidate Profile:
- Skills: {json.dumps(candidate_profile.get('skills', []))}
- Experience: {json.dumps(candidate_profile.get('experience', []))}
- Projects: {json.dumps(candidate_profile.get('projects', []))}
- Education: {json.dumps(candidate_profile.get('education', []))}
- Summary: {candidate_profile.get('summary', '')}

Target Job:
- Title: {job.get('title', '')}
- Company: {job.get('company', '')}
- Requirements: {json.dumps(job.get('requirements', []))}
- Description: {job.get('description', '')[:1000]}

Return JSON:
{{
    "tailored_summary": "A compelling 2-3 sentence professional summary targeting this role",
    "highlighted_skills": ["skill1", "skill2", ...],
    "tailored_experience": [
        {{
            "title": "...",
            "company": "...",
            "description": "Rewritten to emphasize relevant achievements",
            "technologies": ["..."]
        }}
    ],
    "tailored_projects": [
        {{
            "name": "...",
            "description": "Rewritten to highlight relevant aspects"
        }}
    ],
    "keywords_added": ["keyword1", "keyword2"],
    "tips": ["tip1", "tip2"]
}}

Rules:
- Do NOT fabricate experience — only reframe existing content
- Emphasize metrics and achievements relevant to the target role
- Add job-relevant keywords naturally
- Reorder skills to put most relevant first
"""

    client = Groq(api_key=settings.GROQ_API_KEY)

    response = client.chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=[
            {"role": "system", "content": "You are a resume tailoring expert. Return valid JSON only."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.3,
        max_tokens=3000,
        response_format={"type": "json_object"},
    )

    try:
        return json.loads(response.choices[0].message.content.strip())
    except json.JSONDecodeError:
        return {
            "tailored_summary": candidate_profile.get("summary", ""),
            "highlighted_skills": candidate_profile.get("skills", []),
            "tailored_experience": candidate_profile.get("experience", []),
            "tailored_projects": candidate_profile.get("projects", []),
            "keywords_added": [],
            "tips": ["Could not generate tailored resume — try again"],
        }
