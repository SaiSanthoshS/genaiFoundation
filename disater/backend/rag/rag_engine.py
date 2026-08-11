"""
Steps 4-6 of the RAG pipeline: embed chunks with Sentence-Transformers,
store the vectors in a FAISS index, and retrieve the top matching chunks
for a given question.

The index and the chunk text are persisted to disk so uploaded knowledge
survives a backend restart.
"""
import os
import json
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from config import EMBEDDING_MODEL_NAME, FAISS_INDEX_PATH, CHUNKS_STORE_PATH, TOP_K_RESULTS


class ChunkEntry(dict):
    """Simple dict wrapper so chunk metadata is easy to extend later."""

    pass

_model = None  # lazy-loaded so the server starts quickly


def get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer(EMBEDDING_MODEL_NAME)
    return _model


class RAGEngine:
    """Wraps a FAISS index + the chunk text/metadata that goes with each vector."""

    def __init__(self):
        self.chunks = []  # list of ChunkEntry objects, index i matches vector i
        self.index = None
        self._load()

    def _load(self):
        """Load a previously saved index + chunks, if they exist."""
        if os.path.exists(FAISS_INDEX_PATH) and os.path.exists(CHUNKS_STORE_PATH):
            self.index = faiss.read_index(FAISS_INDEX_PATH)
            with open(CHUNKS_STORE_PATH, "r", encoding="utf-8") as f:
                self.chunks = json.load(f)

    def _save(self):
        faiss.write_index(self.index, FAISS_INDEX_PATH)
        with open(CHUNKS_STORE_PATH, "w", encoding="utf-8") as f:
            json.dump(self.chunks, f)

    def replace_with_chunks(self, texts, source_name):
        """Replace the existing knowledge base with chunks from the latest uploaded document."""
        if not texts:
            self.index = None
            self.chunks = []
            self._save()
            return 0

        embeddings = get_model().encode(texts, convert_to_numpy=True)
        faiss.normalize_L2(embeddings)

        dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatIP(dimension)
        self.index.add(embeddings.astype(np.float32))
        self.chunks = [ChunkEntry(text=t, source=source_name) for t in texts]
        self._save()
        return len(texts)

    def add_chunks(self, texts, source_name):
        """Backward-compatible helper retained for older call sites."""
        return self.replace_with_chunks(texts, source_name)

    def search(self, query, top_k=TOP_K_RESULTS):
        """Returns the top_k most relevant chunks (with source) for a question."""
        if self.index is None or self.index.ntotal == 0:
            return []

        query_vector = get_model().encode([query], convert_to_numpy=True)
        faiss.normalize_L2(query_vector)

        scores, indices = self.index.search(query_vector.astype(np.float32), min(top_k, self.index.ntotal))

        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx == -1:
                continue
            entry = self.chunks[idx]
            results.append({"text": entry.get("text"), "source": entry.get("source"), "score": float(score)})
        return results

    def has_documents(self):
        return self.index is not None and self.index.ntotal > 0


# Single shared instance used by the Flask app
rag_engine = RAGEngine()
