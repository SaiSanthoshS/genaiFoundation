"""
Resume router — upload, parse, and retrieve resumes.
"""

import shutil
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from backend.config import get_settings
from backend.database.database import get_db
from backend.database.models import Resume, CandidateProfile, User
from backend.database.schemas import ResumeOut
from backend.routers.auth import auth_user
from backend.services.resume_parser import extract_text, parse_resume
from backend.services.ats_analyzer import analyze_ats

router = APIRouter(prefix="/resume", tags=["Resume"])
settings = get_settings()


@router.post("/upload", response_model=ResumeOut)
async def upload_resume(
    file: UploadFile = File(...),
    user: User = Depends(auth_user),
    db: Session = Depends(get_db),
):
    """Upload a PDF/DOCX resume — automatically parses and ATS-scores it."""

    # Validate file type
    allowed = {".pdf", ".docx", ".doc"}
    ext = Path(file.filename).suffix.lower()
    if ext not in allowed:
        raise HTTPException(400, f"Unsupported file type: {ext}. Use PDF or DOCX.")

    # Save file to disk
    upload_dir = Path(settings.UPLOAD_DIR) / user.id
    upload_dir.mkdir(parents=True, exist_ok=True)
    file_path = upload_dir / file.filename

    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Extract text
    raw_text = extract_text(str(file_path))
    if not raw_text.strip():
        raise HTTPException(400, "Could not extract text from the file.")

    # Parse resume via LLM
    parsed_data = parse_resume(raw_text)

    # ATS analysis
    ats_result = analyze_ats(parsed_data)

    # Save to DB
    resume = Resume(
        user_id=user.id,
        filename=file.filename,
        file_path=str(file_path),
        raw_text=raw_text,
        parsed_data=parsed_data,
        ats_score=ats_result.get("score", 0.0),
        ats_feedback=ats_result,
    )
    db.add(resume)
    db.flush()

    # Create candidate profile
    profile = CandidateProfile(
        resume_id=resume.id,
        skills=parsed_data.get("skills", []),
        education=parsed_data.get("education", []),
        experience=parsed_data.get("experience", []),
        projects=parsed_data.get("projects", []),
        certifications=parsed_data.get("certifications", []),
        keywords=parsed_data.get("keywords", []),
        summary=parsed_data.get("summary", ""),
    )
    db.add(profile)
    db.commit()
    db.refresh(resume)

    return resume


@router.get("/{resume_id}", response_model=ResumeOut)
def get_resume(
    resume_id: str,
    user: User = Depends(auth_user),
    db: Session = Depends(get_db),
):
    """Get a specific resume by ID."""
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == user.id,
    ).first()
    if not resume:
        raise HTTPException(404, "Resume not found")
    return resume


@router.get("/", response_model=list[ResumeOut])
def list_resumes(
    user: User = Depends(auth_user),
    db: Session = Depends(get_db),
):
    """List all resumes for the current user."""
    return db.query(Resume).filter(Resume.user_id == user.id).all()


@router.post("/{resume_id}/reparse", response_model=ResumeOut)
def reparse_resume(
    resume_id: str,
    user: User = Depends(auth_user),
    db: Session = Depends(get_db),
):
    """Re-parse an existing resume (e.g., after model improvement)."""
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == user.id,
    ).first()
    if not resume:
        raise HTTPException(404, "Resume not found")

    parsed_data = parse_resume(resume.raw_text)
    ats_result = analyze_ats(parsed_data)

    resume.parsed_data = parsed_data
    resume.ats_score = ats_result.get("score", 0.0)
    resume.ats_feedback = ats_result

    # Update profile
    profile = db.query(CandidateProfile).filter(
        CandidateProfile.resume_id == resume.id
    ).first()
    if profile:
        profile.skills = parsed_data.get("skills", [])
        profile.education = parsed_data.get("education", [])
        profile.experience = parsed_data.get("experience", [])
        profile.projects = parsed_data.get("projects", [])
        profile.certifications = parsed_data.get("certifications", [])
        profile.keywords = parsed_data.get("keywords", [])
        profile.summary = parsed_data.get("summary", "")

    db.commit()
    db.refresh(resume)
    return resume
