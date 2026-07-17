"""
Pydantic schemas for request / response validation.
"""

from __future__ import annotations

import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


# ═══════════════════════════  Auth  ═══════════════════════════════════════════

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    name: str


# ═══════════════════════════  User / Profile  ════════════════════════════════

class UserProfile(BaseModel):
    id: str
    name: str
    email: str
    linkedin_url: str = ""
    github_url: str = ""
    portfolio_url: str = ""
    preferred_roles: list[str] = []
    preferred_locations: list[str] = []
    salary_expectation: str = ""
    work_authorization: str = ""
    years_of_experience: int = 0
    employment_type: str = "full-time"
    priority_skills: list[str] = []

    class Config:
        from_attributes = True


class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    preferred_roles: Optional[list[str]] = None
    preferred_locations: Optional[list[str]] = None
    salary_expectation: Optional[str] = None
    work_authorization: Optional[str] = None
    years_of_experience: Optional[int] = None
    employment_type: Optional[str] = None
    priority_skills: Optional[list[str]] = None


# ═══════════════════════════  Resume  ════════════════════════════════════════

class ResumeOut(BaseModel):
    id: str
    filename: str
    ats_score: float
    parsed_data: dict
    ats_feedback: dict
    uploaded_at: datetime.datetime

    class Config:
        from_attributes = True


class ParsedResume(BaseModel):
    skills: list[str] = []
    education: list[dict] = []
    experience: list[dict] = []
    projects: list[dict] = []
    certifications: list[str] = []
    keywords: list[str] = []
    summary: str = ""


class ATSFeedback(BaseModel):
    score: float = 0.0
    missing_keywords: list[str] = []
    formatting_issues: list[str] = []
    suggestions: list[str] = []


# ═══════════════════════════  Jobs  ══════════════════════════════════════════

class JobOut(BaseModel):
    id: str
    title: str
    company: str
    location: str = ""
    salary_range: str = ""
    description: str = ""
    requirements: list[str] = []
    source: str = ""
    source_url: str = ""
    company_rating: float = 0.0
    posted_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True


class JobMatchOut(BaseModel):
    job: JobOut
    fit_score: float
    skill_match: float
    experience_match: float
    education_match: float
    keyword_match: float
    missing_skills: list[str] = []
    match_reasons: list[str] = []


class JobSearchParams(BaseModel):
    query: str = ""
    location: str = ""
    remote: bool = True
    limit: int = 20


# ═══════════════════════════  Cover Letter  ══════════════════════════════════

class CoverLetterRequest(BaseModel):
    job_id: str
    resume_id: str


class CoverLetterOut(BaseModel):
    id: str
    content: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# ═══════════════════════════  Interview  ═════════════════════════════════════

class InterviewRequest(BaseModel):
    job_id: str
    resume_id: str
    question_types: list[str] = ["hr", "technical", "behavioral"]


class InterviewQuestion(BaseModel):
    type: str
    question: str
    sample_answer: str = ""
    tips: str = ""


class InterviewOut(BaseModel):
    id: str
    questions: list[dict]
    score: float
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# ═══════════════════════════  Application Tracker  ═══════════════════════════

class ApplicationCreate(BaseModel):
    job_id: str
    cover_letter_id: Optional[str] = None
    notes: str = ""


class ApplicationUpdate(BaseModel):
    status: Optional[str] = None   # applied | interview | offer | rejected
    notes: Optional[str] = None


class ApplicationOut(BaseModel):
    id: str
    job: JobOut
    status: str
    notes: str
    applied_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True


# ═══════════════════════════  Analytics  ═════════════════════════════════════

class AnalyticsOut(BaseModel):
    applications_sent: int = 0
    interview_rate: float = 0.0
    average_fit_score: float = 0.0
    ats_score: float = 0.0
    skill_gaps: list[str] = []
    top_matches: list[JobMatchOut] = []


# ═══════════════════════════  Notifications  ═════════════════════════════════

class NotificationOut(BaseModel):
    id: str
    title: str
    message: str
    is_read: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True
