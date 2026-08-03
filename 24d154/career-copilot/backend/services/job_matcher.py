"""
Job Matching Engine — scores jobs against a candidate profile
using vector similarity + LLM-based scoring.
"""

import json

from groq import Groq

from backend.config import get_settings
from backend.services.vector_store import add_documents, query_similar

settings = get_settings()


def _build_candidate_text(profile: dict) -> str:
    """Create a searchable text representation of the candidate."""
    parts = []
    if profile.get("summary"):
        parts.append(profile["summary"])
    if profile.get("skills"):
        parts.append("Skills: " + ", ".join(profile["skills"]))
    if profile.get("keywords"):
        parts.append("Keywords: " + ", ".join(profile["keywords"]))
    for exp in profile.get("experience", []):
        parts.append(f"{exp.get('title', '')} at {exp.get('company', '')}: {exp.get('description', '')}")
    for proj in profile.get("projects", []):
        parts.append(f"Project {proj.get('name', '')}: {proj.get('description', '')}")
    return "\n".join(parts)


def index_jobs(jobs: list[dict]) -> None:
    """Index job listings into the vector store."""
    documents = []
    metadatas = []
    ids = []

    for i, job in enumerate(jobs):
        doc = f"{job.get('title', '')} at {job.get('company', '')}. {job.get('description', '')}"
        documents.append(doc[:5000])
        metadatas.append({
            "title": job.get("title", ""),
            "company": job.get("company", ""),
            "source": job.get("source", ""),
        })
        ids.append(job.get("id", f"job_{i}"))

    if documents:
        add_documents(documents, metadatas, ids)


def match_jobs(
    candidate_profile: dict,
    jobs: list[dict],
    top_k: int = 10,
) -> list[dict]:
    """
    Match candidate against jobs using vector similarity + LLM scoring.

    Returns a list of matches sorted by fit_score (descending).
    """
    # Step 1: Vector similarity search
    candidate_text = _build_candidate_text(candidate_profile)

    # Index jobs first
    index_jobs(jobs)

    # Query for similar
    results = query_similar(candidate_text, n_results=top_k)

    # Step 2: LLM-based detailed scoring for top matches
    matched_indices = set()
    if results["ids"] and results["ids"][0]:
        for job_id in results["ids"][0]:
            # Find the job index
            for i, job in enumerate(jobs):
                if job.get("id", f"job_{i}") == job_id:
                    matched_indices.add(i)

    # If no vector matches, just use first top_k jobs
    if not matched_indices:
        matched_indices = set(range(min(top_k, len(jobs))))

    # Score each matched job with LLM
    scored_matches = []
    client = Groq(api_key=settings.GROQ_API_KEY)

    for idx in matched_indices:
        if idx >= len(jobs):
            continue
        job = jobs[idx]
        score = _score_match(client, candidate_profile, job)
        score["job_index"] = idx
        scored_matches.append(score)

    # Sort by fit score
    scored_matches.sort(key=lambda x: x.get("fit_score", 0), reverse=True)

    return scored_matches[:top_k]


def _score_match(client: Groq, profile: dict, job: dict) -> dict:
    """Use LLM to generate detailed match scores."""
    prompt = f"""Score this candidate-job match. Return JSON only.

Candidate:
- Skills: {json.dumps(profile.get('skills', []))}
- Experience: {json.dumps(profile.get('experience', [])[:3])}
- Keywords: {json.dumps(profile.get('keywords', []))}

Job:
- Title: {job.get('title', '')}
- Company: {job.get('company', '')}
- Requirements: {json.dumps(job.get('requirements', []))}
- Description: {job.get('description', '')[:500]}

Return:
{{
    "fit_score": <0-100>,
    "skill_match": <0-100>,
    "experience_match": <0-100>,
    "education_match": <0-100>,
    "keyword_match": <0-100>,
    "missing_skills": ["skill1", ...],
    "match_reasons": ["reason1", ...]
}}"""

    try:
        response = client.chat.completions.create(
            model=settings.GROQ_FAST_MODEL,  # Use fast model for batch scoring
            messages=[
                {"role": "system", "content": "You are a job matching expert. Return valid JSON only."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.1,
            max_tokens=500,
            response_format={"type": "json_object"},
        )
        return json.loads(response.choices[0].message.content.strip())
    except Exception:
        return {
            "fit_score": 50.0,
            "skill_match": 50.0,
            "experience_match": 50.0,
            "education_match": 50.0,
            "keyword_match": 50.0,
            "missing_skills": [],
            "match_reasons": ["Could not analyze match"],
        }
