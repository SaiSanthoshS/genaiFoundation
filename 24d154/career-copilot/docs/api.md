# API Reference

## Authentication

### POST `/auth/register`
Create a new user account.

**Request Body:**
```json
{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword"
}
```

**Response:**
```json
{
    "access_token": "eyJ...",
    "token_type": "bearer",
    "user_id": "uuid",
    "name": "John Doe"
}
```

### POST `/auth/login`
Authenticate and get a JWT.

**Request Body:**
```json
{
    "email": "john@example.com",
    "password": "securepassword"
}
```

### GET `/auth/me`
Get current user profile. Requires `Authorization: Bearer <token>`.

---

## Resume

### POST `/resume/upload`
Upload a PDF/DOCX resume — automatically parses and ATS-scores.

**Request:** `multipart/form-data` with `file` field.

**Response:**
```json
{
    "id": "uuid",
    "filename": "resume.pdf",
    "ats_score": 72.5,
    "parsed_data": {
        "skills": ["Python", "React", "Docker"],
        "education": [...],
        "experience": [...],
        "projects": [...],
        "certifications": [...],
        "keywords": [...]
    },
    "ats_feedback": {
        "score": 72.5,
        "missing_keywords": ["Kubernetes"],
        "formatting_issues": [],
        "suggestions": ["Add quantified achievements"]
    }
}
```

---

## Jobs

### GET `/jobs/search?query=react&location=remote&limit=20`
Search multiple job boards.

### POST `/jobs/match?resume_id=uuid&query=react&limit=10`
AI-match jobs against a resume profile.

**Response:**
```json
[
    {
        "job": { "title": "...", "company": "...", ... },
        "fit_score": 85.2,
        "skill_match": 90.0,
        "experience_match": 80.0,
        "missing_skills": ["GraphQL"],
        "match_reasons": ["Strong React experience"]
    }
]
```

---

## Cover Letter

### POST `/cover-letter/generate`
```json
{
    "job_id": "uuid",
    "resume_id": "uuid"
}
```

---

## Interview

### POST `/interview/questions`
```json
{
    "job_id": "uuid",
    "resume_id": "uuid",
    "question_types": ["hr", "technical", "behavioral"]
}
```

---

## Applications

### POST `/applications/`
Track a new application.

### GET `/applications/`
List all (for Kanban board).

### PUT `/applications/{id}`
Update status: `applied` | `interview` | `offer` | `rejected`.

---

## Analytics

### GET `/analytics/`
Dashboard stats: applications_sent, interview_rate, average_fit_score, ats_score, skill_gaps.
