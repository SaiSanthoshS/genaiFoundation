"""
Vector Store — ChromaDB wrapper with sentence-transformers embeddings.
Used for semantic job matching.
"""

from pathlib import Path
from typing import Optional

import chromadb

from backend.config import get_settings

settings = get_settings()

# Ensure vector DB directory exists
Path(settings.VECTOR_DB_DIR).mkdir(parents=True, exist_ok=True)

# Initialize ChromaDB client (persistent, file-based)
_chroma_client = chromadb.PersistentClient(path=settings.VECTOR_DB_DIR)


def get_or_create_collection(name: str = "job_embeddings"):
    """Get or create a ChromaDB collection."""
    return _chroma_client.get_or_create_collection(
        name=name,
        metadata={"hnsw:space": "cosine"},
    )


def add_documents(
    documents: list[str],
    metadatas: list[dict],
    ids: list[str],
    collection_name: str = "job_embeddings",
):
    """Add documents (job descriptions) to the vector store."""
    collection = get_or_create_collection(collection_name)
    collection.add(
        documents=documents,
        metadatas=metadatas,
        ids=ids,
    )


def query_similar(
    query_text: str,
    n_results: int = 10,
    collection_name: str = "job_embeddings",
) -> dict:
    """Query the vector store for similar documents."""
    collection = get_or_create_collection(collection_name)

    if collection.count() == 0:
        return {"ids": [[]], "documents": [[]], "metadatas": [[]], "distances": [[]]}

    results = collection.query(
        query_texts=[query_text],
        n_results=min(n_results, collection.count()),
    )
    return results


def delete_collection(collection_name: str = "job_embeddings"):
    """Delete a collection (e.g., to refresh job data)."""
    try:
        _chroma_client.delete_collection(collection_name)
    except Exception:
        pass
