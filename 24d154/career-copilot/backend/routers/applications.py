"""
Application Tracker router — Kanban-style tracking of job applications.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.database.models import Application, Job, User
from backend.database.schemas import ApplicationCreate, ApplicationUpdate, ApplicationOut, JobOut
from backend.routers.auth import auth_user

router = APIRouter(prefix="/applications", tags=["Application Tracker"])


@router.post("/", response_model=ApplicationOut)
def create_application(
    req: ApplicationCreate,
    user: User = Depends(auth_user),
    db: Session = Depends(get_db),
):
    """Track a new job application."""
    job = db.query(Job).filter(Job.id == req.job_id).first()
    if not job:
        raise HTTPException(404, "Job not found")

    app = Application(
        user_id=user.id,
        job_id=req.job_id,
        cover_letter_id=req.cover_letter_id,
        notes=req.notes,
    )
    db.add(app)
    db.commit()
    db.refresh(app)

    return ApplicationOut(
        id=app.id,
        job=JobOut.model_validate(job),
        status=app.status,
        notes=app.notes,
        applied_at=app.applied_at,
        updated_at=app.updated_at,
    )


@router.get("/", response_model=list[ApplicationOut])
def list_applications(
    user: User = Depends(auth_user),
    db: Session = Depends(get_db),
):
    """List all applications (for Kanban board)."""
    apps = db.query(Application).filter(
        Application.user_id == user.id
    ).order_by(Application.updated_at.desc()).all()

    results = []
    for app in apps:
        job = db.query(Job).filter(Job.id == app.job_id).first()
        if job:
            results.append(ApplicationOut(
                id=app.id,
                job=JobOut.model_validate(job),
                status=app.status,
                notes=app.notes,
                applied_at=app.applied_at,
                updated_at=app.updated_at,
            ))
    return results


@router.put("/{app_id}", response_model=ApplicationOut)
def update_application(
    app_id: str,
    updates: ApplicationUpdate,
    user: User = Depends(auth_user),
    db: Session = Depends(get_db),
):
    """Update application status (drag in Kanban)."""
    app = db.query(Application).filter(
        Application.id == app_id,
        Application.user_id == user.id,
    ).first()
    if not app:
        raise HTTPException(404, "Application not found")

    if updates.status:
        app.status = updates.status
    if updates.notes is not None:
        app.notes = updates.notes

    db.commit()
    db.refresh(app)

    job = db.query(Job).filter(Job.id == app.job_id).first()

    return ApplicationOut(
        id=app.id,
        job=JobOut.model_validate(job),
        status=app.status,
        notes=app.notes,
        applied_at=app.applied_at,
        updated_at=app.updated_at,
    )


@router.delete("/{app_id}")
def delete_application(
    app_id: str,
    user: User = Depends(auth_user),
    db: Session = Depends(get_db),
):
    """Remove an application."""
    app = db.query(Application).filter(
        Application.id == app_id,
        Application.user_id == user.id,
    ).first()
    if not app:
        raise HTTPException(404, "Application not found")
    db.delete(app)
    db.commit()
    return {"status": "deleted"}
