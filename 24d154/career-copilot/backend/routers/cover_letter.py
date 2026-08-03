"""
Cover Letter router — generate and manage cover letters.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.database.models import CoverLetter, Resume, CandidateProfile, Job, User
from backend.database.schemas import CoverLetterRequest, CoverLetterOut
from backend.routers.auth import auth_user
from backend.services.cover_letter_gen import generate_cover_letter

router = APIRouter(prefix="/cover-letter", tags=["Cover Letter"])


@router.post("/generate", response_model=CoverLetterOut)
def generate(
    req: CoverLetterRequest,
    user: User = Depends(auth_user),
    db: Session = Depends(get_db),
):
    """Generate an AI cover letter for a specific job."""
    # Get resume profile
    resume = db.query(Resume).filter(
        Resume.id == req.resume_id,
        Resume.user_id == user.id,
    ).first()
    if not resume:
        raise HTTPException(404, "Resume not found")

    profile = db.query(CandidateProfile).filter(
        CandidateProfile.resume_id == resume.id
    ).first()
    if not profile:
        raise HTTPException(404, "Resume not parsed yet")

    # Get job
    job = db.query(Job).filter(Job.id == req.job_id).first()
    if not job:
        raise HTTPException(404, "Job not found")

    candidate_data = {
        "skills": profile.skills,
        "experience": profile.experience,
        "projects": profile.projects,
    }

    job_data = {
        "title": job.title,
        "company": job.company,
        "description": job.description,
        "requirements": job.requirements,
    }

    content = generate_cover_letter(candidate_data, job_data, user.name)

    # Save to DB
    cl = CoverLetter(
        user_id=user.id,
        job_id=job.id,
        content=content,
    )
    db.add(cl)
    db.commit()
    db.refresh(cl)

    return cl


@router.get("/{letter_id}", response_model=CoverLetterOut)
def get_cover_letter(
    letter_id: str,
    user: User = Depends(auth_user),
    db: Session = Depends(get_db),
):
    """Get a specific cover letter."""
    cl = db.query(CoverLetter).filter(
        CoverLetter.id == letter_id,
        CoverLetter.user_id == user.id,
    ).first()
    if not cl:
        raise HTTPException(404, "Cover letter not found")
    return cl


@router.get("/", response_model=list[CoverLetterOut])
def list_cover_letters(
    user: User = Depends(auth_user),
    db: Session = Depends(get_db),
):
    """List all cover letters."""
    return db.query(CoverLetter).filter(CoverLetter.user_id == user.id).all()


@router.put("/{letter_id}", response_model=CoverLetterOut)
def update_cover_letter(
    letter_id: str,
    content: str,
    user: User = Depends(auth_user),
    db: Session = Depends(get_db),
):
    """Update cover letter content (manual edits)."""
    cl = db.query(CoverLetter).filter(
        CoverLetter.id == letter_id,
        CoverLetter.user_id == user.id,
    ).first()
    if not cl:
        raise HTTPException(404, "Cover letter not found")
    cl.content = content
    db.commit()
    db.refresh(cl)
    return cl
