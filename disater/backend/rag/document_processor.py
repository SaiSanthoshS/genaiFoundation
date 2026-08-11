"""
Step 1-3 of the RAG pipeline: extract raw text from an uploaded file, then
split it into overlapping chunks small enough to embed and retrieve well.
"""
import os
from pypdf import PdfReader
from docx import Document
from config import CHUNK_SIZE, CHUNK_OVERLAP


def extract_text(file_path):
    """Extract plain text from a PDF, DOCX, or TXT file based on its extension."""
    ext = os.path.splitext(file_path)[1].lower()

    if ext == ".pdf":
        reader = PdfReader(file_path)
        return "\n".join(page.extract_text() or "" for page in reader.pages)

    if ext == ".docx":
        doc = Document(file_path)
        return "\n".join(paragraph.text for paragraph in doc.paragraphs)

    if ext == ".txt":
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()

    raise ValueError(f"Unsupported file type: {ext}")


def chunk_text(text, chunk_size=CHUNK_SIZE, overlap=CHUNK_OVERLAP):
    """
    Splits text into overlapping character chunks.
    Overlap keeps context from being cut off awkwardly at chunk boundaries.
    """
    text = " ".join(text.split())  # normalize whitespace
    if not text:
        return []

    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap

    return chunks
