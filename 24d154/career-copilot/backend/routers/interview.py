"""
Interview router — generate questions and evaluate answers.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.database.models import InterviewSession, Resume, CandidateProfile, Job, User
from backend.database.schemas import InterviewRequest, InterviewOut
from backend.routers.auth import auth_user
from backend.services.interview_coach import generate_questions, evaluate_answer

router = APIRouter(prefix="/interview", tags=["Interview"])


@router.post("/questions", response_model=InterviewOut)
def create_interview(
    req: InterviewRequest,
    user: User = Depends(auth_user),
    db: Session = Depends(get_db),
):
    """Generate interview prep questions for a specific job."""
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

    job = db.query(Job).filter(Job.id == req.job_id).first()
    if not job:
        raise HTTPException(404, "Job not found")

    candidate_data = {
        "skills": profile.skills,
        "experience": profile.experience,
    }

    job_data = {
        "title": job.title,
        "company": job.company,
        "requirements": job.requirements,
    }

    questions = generate_questions(candidate_data, job_data, req.question_types)

    session = InterviewSession(
        user_id=user.id,
        job_id=job.id,
        questions=questions,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return session


class EvaluateRequest(BaseModel):
    question: str
    answer: str
    job_context: str = ""


@router.post("/evaluate")
def evaluate(
    req: EvaluateRequest,
    user: User = Depends(auth_user),
):
    """Evaluate an interview answer using STAR method."""
    return evaluate_answer(req.question, req.answer, req.job_context)


@router.get("/sessions", response_model=list[InterviewOut])
def list_sessions(
    user: User = Depends(auth_user),
    db: Session = Depends(get_db),
):
    """List all interview prep sessions."""
    return db.query(InterviewSession).filter(
        InterviewSession.user_id == user.id
    ).order_by(InterviewSession.created_at.desc()).all()
