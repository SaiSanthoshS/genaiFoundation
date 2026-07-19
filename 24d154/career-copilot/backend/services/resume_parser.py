"""
Resume Parser Service — extracts text from PDF/DOCX and uses Groq LLM
to produce structured resume JSON.
"""

import json
from pathlib import Path

import pdfplumber
from docx import Document as DocxDocument
from groq import Groq

from backend.config import get_settings

settings = get_settings()

# Load prompt template
PROMPT_PATH = Path(__file__).resolve().parent.parent.parent / "prompts" / "resume_parse.txt"


def _extract_text_pdf(file_path: str) -> str:
    """Extract all text from a PDF."""
    text_parts: list[str] = []
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    return "\n".join(text_parts)


def _extract_text_docx(file_path: str) -> str:
    """Extract all text from a DOCX."""
    doc = DocxDocument(file_path)
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip())


def extract_text(file_path: str) -> str:
    """Auto-detect file type and extract text."""
    ext = Path(file_path).suffix.lower()
    if ext == ".pdf":
        return _extract_text_pdf(file_path)
    elif ext in (".docx", ".doc"):
        return _extract_text_docx(file_path)
    else:
        # Fallback: try reading as plain text
        return Path(file_path).read_text(encoding="utf-8", errors="ignore")


def parse_resume(raw_text: str) -> dict:
    """
    Send raw resume text to Groq LLM and get structured JSON back.

    Returns a dict with keys:
        skills, education, experience, projects, certifications, keywords, summary
    """
    prompt_template = PROMPT_PATH.read_text(encoding="utf-8")
    prompt = prompt_template.replace("{{RESUME_TEXT}}", raw_text)

    client = Groq(api_key=settings.GROQ_API_KEY)

    response = client.chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=[
            {
                "role": "system",
                "content": "You are a resume parsing expert. Always respond with valid JSON only.",
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.1,
        max_tokens=4000,
        response_format={"type": "json_object"},
    )

    content = response.choices[0].message.content.strip()

    try:
        parsed = json.loads(content)
    except json.JSONDecodeError:
        # Fallback: return minimal structure
        parsed = {
            "skills": [],
            "education": [],
            "experience": [],
            "projects": [],
            "certifications": [],
            "keywords": [],
            "summary": content,
        }

    # Ensure all expected keys exist
    for key in ("skills", "education", "experience", "projects", "certifications", "keywords", "summary"):
        parsed.setdefault(key, [] if key != "summary" else "")

    return parsed
