"""
SQLAlchemy ORM models — all 10 tables from the spec.
"""

import datetime
import uuid

from sqlalchemy import (
    Column, String, Integer, Float, Text, Boolean,
    DateTime, ForeignKey, JSON,
)
from sqlalchemy.orm import relationship

from backend.database.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


# ── Users ────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    linkedin_url = Column(String, default="")
    github_url = Column(String, default="")
    portfolio_url = Column(String, default="")
    preferred_roles = Column(JSON, default=list)       # ["Backend", "ML"]
    preferred_locations = Column(JSON, default=list)
    salary_expectation = Column(String, default="")
    work_authorization = Column(String, default="")
    years_of_experience = Column(Integer, default=0)
    employment_type = Column(String, default="full-time")
    priority_skills = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


# ── Resumes ──────────────────────────────────────────────────────────────────

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    raw_text = Column(Text, default="")
    parsed_data = Column(JSON, default=dict)   # structured resume JSON
    ats_score = Column(Float, default=0.0)
    ats_feedback = Column(JSON, default=dict)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="resumes")
    profile = relationship("CandidateProfile", back_populates="resume", uselist=False)


# ── Candidate Profiles ───────────────────────────────────────────────────────

class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"

    id = Column(String, primary_key=True, default=_uuid)
    resume_id = Column(String, ForeignKey("resumes.id"), nullable=False)
    skills = Column(JSON, default=list)
    education = Column(JSON, default=list)
    experience = Column(JSON, default=list)
    projects = Column(JSON, default=list)
    certifications = Column(JSON, default=list)
    keywords = Column(JSON, default=list)
    summary = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    resume = relationship("Resume", back_populates="profile")


# ── Jobs ─────────────────────────────────────────────────────────────────────

class Job(Base):
    __tablename__ = "jobs"

    id = Column(String, primary_key=True, default=_uuid)
    title = Column(String, nullable=False)
    company = Column(String, nullable=False)
    location = Column(String, default="")
    salary_range = Column(String, default="")
    description = Column(Text, default="")
    requirements = Column(JSON, default=list)
    source = Column(String, default="")            # RemoteOK, Remotive, etc.
    source_url = Column(String, default="")
    company_rating = Column(Float, default=0.0)
    posted_at = Column(DateTime, default=None)
    fetched_at = Column(DateTime, default=datetime.datetime.utcnow)

    matches = relationship("JobMatch", back_populates="job", cascade="all, delete-orphan")


# ── Job Matches ──────────────────────────────────────────────────────────────

class JobMatch(Base):
    __tablename__ = "job_matches"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False)
    fit_score = Column(Float, default=0.0)
    skill_match = Column(Float, default=0.0)
    experience_match = Column(Float, default=0.0)
    education_match = Column(Float, default=0.0)
    keyword_match = Column(Float, default=0.0)
    missing_skills = Column(JSON, default=list)
    match_reasons = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    job = relationship("Job", back_populates="matches")


# ── Applications ─────────────────────────────────────────────────────────────

class Application(Base):
    __tablename__ = "applications"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False)
    status = Column(String, default="applied")     # applied | interview | offer | rejected
    cover_letter_id = Column(String, ForeignKey("cover_letters.id"), default=None)
    applied_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    notes = Column(Text, default="")

    user = relationship("User", back_populates="applications")
    job = relationship("Job")
    cover_letter = relationship("CoverLetter", back_populates="application", uselist=False)


# ── Cover Letters ────────────────────────────────────────────────────────────

class CoverLetter(Base):
    __tablename__ = "cover_letters"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    application = relationship("Application", back_populates="cover_letter", uselist=False)


# ── Interview Sessions ───────────────────────────────────────────────────────

class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False)
    questions = Column(JSON, default=list)       # [{type, question, answer, feedback}]
    score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


# ── Notifications ────────────────────────────────────────────────────────────

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, default="")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="notifications")


# ── Analytics ────────────────────────────────────────────────────────────────

class Analytics(Base):
    __tablename__ = "analytics"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    metric = Column(String, nullable=False)        # e.g., "applications_sent"
    value = Column(Float, default=0.0)
    date = Column(DateTime, default=datetime.datetime.utcnow)
