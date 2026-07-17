"""
Analytics router — dashboard stats and career progress.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.database.database import get_db
from backend.database.models import Application, JobMatch, Resume, User
from backend.database.schemas import AnalyticsOut
from backend.routers.auth import auth_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/", response_model=AnalyticsOut)
def get_analytics(
    user: User = Depends(auth_user),
    db: Session = Depends(get_db),
):
    """Get dashboard analytics for the current user."""

    # Applications sent
    apps_count = db.query(func.count(Application.id)).filter(
        Application.user_id == user.id
    ).scalar() or 0

    # Interview rate
    interview_count = db.query(func.count(Application.id)).filter(
        Application.user_id == user.id,
        Application.status.in_(["interview", "offer"]),
    ).scalar() or 0
    interview_rate = (interview_count / apps_count * 100) if apps_count > 0 else 0.0

    # Average fit score
    avg_fit = db.query(func.avg(JobMatch.fit_score)).filter(
        JobMatch.user_id == user.id
    ).scalar() or 0.0

    # Latest ATS score
    latest_resume = db.query(Resume).filter(
        Resume.user_id == user.id
    ).order_by(Resume.uploaded_at.desc()).first()
    ats_score = latest_resume.ats_score if latest_resume else 0.0

    # Skill gaps (from latest matches)
    recent_matches = db.query(JobMatch).filter(
        JobMatch.user_id == user.id
    ).order_by(JobMatch.created_at.desc()).limit(10).all()

    skill_gaps = set()
    for m in recent_matches:
        if m.missing_skills:
            skill_gaps.update(m.missing_skills)

    return AnalyticsOut(
        applications_sent=apps_count,
        interview_rate=round(interview_rate, 1),
        average_fit_score=round(float(avg_fit), 1),
        ats_score=round(ats_score, 1),
        skill_gaps=list(skill_gaps)[:10],
    )
