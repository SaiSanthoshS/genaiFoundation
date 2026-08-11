"""
Central configuration for the Disaster Alert Aggregator backend.
Keeping all paths and constants in one place makes the app easy to follow.
"""
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# SQLite database file
DB_PATH = os.path.join(BASE_DIR, "data", "app.db")

# Where uploaded knowledge-base documents are stored
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")

# FAISS index + chunk store files (persisted RAG memory)
FAISS_INDEX_PATH = os.path.join(BASE_DIR, "data", "faiss.index")
CHUNKS_STORE_PATH = os.path.join(BASE_DIR, "data", "chunks.json")

# Sentence-Transformers embedding model (small + fast, good for a mini-project)
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"

# Text chunking parameters for the RAG pipeline
CHUNK_SIZE = 500       # characters per chunk
CHUNK_OVERLAP = 50     # overlap between consecutive chunks

# How many chunks to retrieve from FAISS per question
TOP_K_RESULTS = 3

# Gemini model used to generate chatbot answers
GEMINI_MODEL_NAME = "gemini-3.6-flash"

# External disaster-data APIs (no key required)
USGS_EARTHQUAKE_API = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson"
NASA_EONET_API = "https://eonet.gsfc.nasa.gov/api/v3/events"

os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
os.makedirs(UPLOAD_DIR, exist_ok=True)
