"""
Jobs router — search jobs and get AI-matched results.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.database.models import Job, JobMatch, Resume, CandidateProfile, User
from backend.database.schemas import JobOut, JobMatchOut, JobSearchParams
from backend.routers.auth import auth_user
from backend.services.job_aggregator import search_jobs
from backend.services.job_matcher import match_jobs

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.get("/search", response_model=list[JobOut])
async def search(
    query: str = Query("software engineer", description="Search query"),
    location: str = Query("", description="Location filter"),
    remote: bool = Query(True, description="Remote only"),
    limit: int = Query(20, le=50),
    user: User = Depends(auth_user),
    db: Session = Depends(get_db),
):
    """Search jobs from multiple boards and save to DB."""
    raw_jobs = await search_jobs(query, location, remote, limit)

    saved_jobs = []
    for j in raw_jobs:
        job = Job(
            title=j["title"],
            company=j["company"],
            location=j.get("location", ""),
            salary_range=j.get("salary_range", ""),
            description=j.get("description", ""),
            requirements=j.get("requirements", []),
            source=j.get("source", ""),
            source_url=j.get("source_url", ""),
        )
        db.add(job)
        db.flush()
        j["id"] = job.id
        saved_jobs.append(job)

    db.commit()
    return saved_jobs


@router.post("/match", response_model=list[JobMatchOut])
async def match(
    resume_id: str,
    query: str = Query("software engineer"),
    limit: int = Query(10, le=30),
    user: User = Depends(auth_user),
    db: Session = Depends(get_db),
):
    """Match jobs against a user's resume profile."""
    # Get candidate profile
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == user.id,
    ).first()
    if not resume:
        raise HTTPException(404, "Resume not found")

    profile = db.query(CandidateProfile).filter(
        CandidateProfile.resume_id == resume.id
    ).first()
    if not profile:
        raise HTTPException(404, "Resume not parsed yet")

    candidate_data = {
        "skills": profile.skills,
        "education": profile.education,
        "experience": profile.experience,
        "projects": profile.projects,
        "certifications": profile.certifications,
        "keywords": profile.keywords,
        "summary": profile.summary,
    }

    # Fetch fresh jobs
    raw_jobs = await search_jobs(query, limit=limit * 2)

    # Save jobs to DB
    db_jobs = []
    for j in raw_jobs:
        job = Job(
            title=j["title"],
            company=j["company"],
            location=j.get("location", ""),
            salary_range=j.get("salary_range", ""),
            description=j.get("description", ""),
            requirements=j.get("requirements", []),
            source=j.get("source", ""),
            source_url=j.get("source_url", ""),
        )
        db.add(job)
        db.flush()
        j["id"] = job.id
        db_jobs.append(job)

    # AI matching
    matches = match_jobs(candidate_data, raw_jobs, top_k=limit)

    # Save matches and build response
    response = []
    for m in matches:
        job_idx = m.get("job_index", 0)
        if job_idx >= len(db_jobs):
            continue
        job = db_jobs[job_idx]

        db_match = JobMatch(
            user_id=user.id,
            job_id=job.id,
            fit_score=m.get("fit_score", 0),
            skill_match=m.get("skill_match", 0),
            experience_match=m.get("experience_match", 0),
            education_match=m.get("education_match", 0),
            keyword_match=m.get("keyword_match", 0),
            missing_skills=m.get("missing_skills", []),
            match_reasons=m.get("match_reasons", []),
        )
        db.add(db_match)

        response.append(JobMatchOut(
            job=JobOut.model_validate(job),
            fit_score=m.get("fit_score", 0),
            skill_match=m.get("skill_match", 0),
            experience_match=m.get("experience_match", 0),
            education_match=m.get("education_match", 0),
            keyword_match=m.get("keyword_match", 0),
            missing_skills=m.get("missing_skills", []),
            match_reasons=m.get("match_reasons", []),
        ))

    db.commit()
    return response


@router.get("/saved", response_model=list[JobOut])
def get_saved_jobs(
    user: User = Depends(auth_user),
    db: Session = Depends(get_db),
    limit: int = Query(50, le=100),
):
    """Get previously saved/fetched jobs."""
    jobs = db.query(Job).order_by(Job.fetched_at.desc()).limit(limit).all()
    return jobs
