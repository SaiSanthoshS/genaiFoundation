"""
Disaster Alert Aggregator — Flask backend.

Routes:
  POST /location  -> save the user's city/address + alert radius
  GET  /alerts     -> live disaster alerts near the saved location
  POST /upload     -> upload a document into the RAG knowledge base
  POST /chat       -> ask the RAG chatbot a question
  POST /apikey     -> save the Gemini API key
"""
import os
import uuid
from flask import Flask, request, jsonify
from flask_cors import CORS

from pathlib import Path

import database
from config import UPLOAD_DIR
from services.geocode_service import geocode_place
from services.alerts_service import get_all_alerts
from rag.document_processor import extract_text, chunk_text
from rag.rag_engine import rag_engine
from rag.gemini_client import ask_gemini

AWARENESS_FILE = Path(__file__).resolve().parent / "data" / "disaster_awareness.txt"

app = Flask(__name__)
CORS(app)  # allow the Vite dev server (different port) to call this API

database.init_db()

ALLOWED_EXTENSIONS = {".pdf", ".txt", ".docx"}


# ---------------------------------------------------------------------------
# Location
# ---------------------------------------------------------------------------
@app.route("/location", methods=["POST"])
def save_location():
    data = request.get_json(silent=True) or {}
    place_name = (data.get("place_name") or "").strip()
    radius_km = data.get("radius_km")

    if not place_name:
        return jsonify({"error": "place_name is required"}), 400
    if not radius_km or not (10 <= int(radius_km) <= 200):
        return jsonify({"error": "radius_km must be between 10 and 200"}), 400

    lat, lon, resolved_name = geocode_place(place_name)
    if lat is None:
        return jsonify({"error": f"Could not find a location matching '{place_name}'"}), 404

    database.save_location(resolved_name, lat, lon, int(radius_km))

    return jsonify({
        "place_name": resolved_name,
        "latitude": lat,
        "longitude": lon,
        "radius_km": int(radius_km),
    })


@app.route("/location", methods=["GET"])
def load_location():
    location = database.get_location()
    if not location:
        return jsonify(None)
    return jsonify(location)


# ---------------------------------------------------------------------------
# Disaster alerts
# ---------------------------------------------------------------------------
@app.route("/alerts", methods=["GET"])
def get_alerts():
    location = database.get_location()
    if not location:
        return jsonify({"error": "No location saved yet. Set one on the Location Setup page."}), 400

    alerts = get_all_alerts(location["latitude"], location["longitude"], location["radius_km"])
    return jsonify({"location": location, "alerts": alerts})


# ---------------------------------------------------------------------------
# RAG document upload
# ---------------------------------------------------------------------------
@app.route("/upload", methods=["POST"])
def upload_document():
    if "file" not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return jsonify({"error": f"Unsupported file type. Use: {', '.join(ALLOWED_EXTENSIONS)}"}), 400

    # Save with a unique name to avoid collisions, but keep the original for display
    saved_name = f"{uuid.uuid4().hex}{ext}"
    saved_path = os.path.join(UPLOAD_DIR, saved_name)
    file.save(saved_path)

    try:
        text = extract_text(saved_path)
        chunks = chunk_text(text)
        added = rag_engine.replace_with_chunks(chunks, source_name=file.filename)
    except Exception as exc:
        return jsonify({"error": f"Failed to process document: {exc}"}), 500

    return jsonify({
        "message": f"Uploaded and indexed '{file.filename}'",
        "chunks_added": added,
    })


# ---------------------------------------------------------------------------
# RAG chatbot
# ---------------------------------------------------------------------------
@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True) or {}
    question = (data.get("question") or "").strip()

    if not question:
        return jsonify({"error": "question is required"}), 400

    location = database.get_location()
    alerts = []
    if location:
        alerts = get_all_alerts(location["latitude"], location["longitude"], location["radius_km"])

    awareness_context = []
    if AWARENESS_FILE.exists():
        awareness_text = AWARENESS_FILE.read_text(encoding="utf-8")
        awareness_context.append({
            "text": awareness_text,
            "source": "builtin_disaster_awareness.txt",
            "score": 1.0,
        })

    alert_context = []
    if alerts:
        alert_summary = "\n".join(
            f"- {alert['type']} at {alert['location']} ({alert['severity']}, {alert['distance_km']} km away, {alert['datetime']})"
            for alert in alerts[:3]
        )
        alert_context.append({
            "text": f"Nearby alerts for the user's location:\n{alert_summary}",
            "source": "nearby_alerts",
            "score": 1.0,
        })

    if not rag_engine.has_documents():
        top_chunks = awareness_context + alert_context
    else:
        top_chunks = awareness_context + alert_context + rag_engine.search(question)

    try:
        answer = ask_gemini(question, top_chunks, api_key=database.get_setting("gemini_api_key"))
    except Exception as exc:
        return jsonify({"error": f"Gemini request failed: {exc}"}), 500

    sources = sorted({c["source"] for c in top_chunks})
    return jsonify({"answer": answer, "sources": sources})


# ---------------------------------------------------------------------------
# Settings / API key
# ---------------------------------------------------------------------------
@app.route("/apikey", methods=["POST"])
def save_api_key():
    data = request.get_json(silent=True) or {}
    api_key = (data.get("api_key") or "").strip()

    if not api_key:
        return jsonify({"error": "api_key is required"}), 400

    database.save_setting("gemini_api_key", api_key)
    return jsonify({"message": "API key saved"})


@app.route("/apikey", methods=["GET"])
def has_api_key():
    # Never return the key itself to the frontend — only whether one is set
    api_key = database.get_setting("gemini_api_key")
    return jsonify({"is_set": bool(api_key)})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
