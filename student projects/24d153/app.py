"""
OSINT Domain Intelligence Tool — Flask Web Server
===================================================
Serves the premium frontend and exposes the OSINT agent via REST API.

Endpoints:
  GET  /                    → Serves the SPA frontend
  POST /api/investigate     → Runs the OSINT agent (returns SSE stream)
  GET  /api/reports/<id>    → Retrieves a cached report by ID
"""

import os, json, uuid, threading, time
from datetime import datetime
from flask import Flask, request, jsonify, render_template, Response, stream_with_context
from flask_cors import CORS

from agent import run_osint_agent

app = Flask(__name__)
CORS(app)

# In-memory report cache
reports_cache = {}
# Active investigations (for progress streaming)
active_investigations = {}


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    """Serve the main SPA frontend."""
    return render_template("index.html")


@app.route("/api/investigate", methods=["POST"])
def investigate():
    """Run an OSINT investigation against the specified target.

    Request body:
        { "target": "example.com", "scopes": ["github", "whois", "dns", "services", "ssl"] }

    Returns:
        Server-Sent Events stream with progress updates, then final JSON report.
    """
    data = request.get_json(force=True)
    target = data.get("target", "").strip()
    scopes = data.get("scopes", ["github", "whois", "dns", "services", "ssl"])

    if not target:
        return jsonify({"error": "Target is required"}), 400

    investigation_id = str(uuid.uuid4())[:8]

    def generate():
        """SSE generator — streams agent progress and final report."""
        progress_events = []
        lock = threading.Lock()

        def progress_callback(event_type, tool_name, data):
            with lock:
                event = {
                    "type": event_type,
                    "tool": tool_name,
                    "data": _safe_serialize(data),
                    "timestamp": datetime.now().isoformat(),
                }
                progress_events.append(event)

        # Run agent in a thread so we can stream progress
        result_holder = [None]
        error_holder = [None]

        def run_agent():
            try:
                result = run_osint_agent(
                    target=target,
                    scopes=scopes,
                    progress_callback=progress_callback,
                )
                result_holder[0] = result
            except Exception as e:
                error_holder[0] = str(e)

        agent_thread = threading.Thread(target=run_agent, daemon=True)
        agent_thread.start()

        # Stream progress events as SSE
        sent_count = 0
        while agent_thread.is_alive() or sent_count < len(progress_events):
            with lock:
                while sent_count < len(progress_events):
                    event = progress_events[sent_count]
                    yield f"data: {json.dumps(event)}\n\n"
                    sent_count += 1
            time.sleep(0.3)

        # Send any remaining events
        with lock:
            while sent_count < len(progress_events):
                event = progress_events[sent_count]
                yield f"data: {json.dumps(event)}\n\n"
                sent_count += 1

        # Send final result
        if error_holder[0]:
            yield f"data: {json.dumps({'type': 'error', 'message': error_holder[0]})}\n\n"
        elif result_holder[0]:
            result = result_holder[0]
            result["investigation_id"] = investigation_id
            # Cache the report
            reports_cache[investigation_id] = result
            yield f"data: {json.dumps({'type': 'result', 'data': _safe_serialize(result)})}\n\n"

        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        }
    )


@app.route("/api/reports/<report_id>", methods=["GET"])
def get_report(report_id):
    """Retrieve a cached report by ID."""
    report = reports_cache.get(report_id)
    if not report:
        return jsonify({"error": "Report not found"}), 404
    return jsonify(report)


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _safe_serialize(obj, max_depth=5):
    """Convert an object to a JSON-safe dict, truncating deep nesting."""
    if max_depth <= 0:
        return str(obj)[:200]
    if isinstance(obj, dict):
        return {k: _safe_serialize(v, max_depth - 1) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_safe_serialize(item, max_depth - 1) for item in obj[:50]]
    if isinstance(obj, (str, int, float, bool)) or obj is None:
        return obj
    return str(obj)[:200]


# ─── Main ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 60)
    print("🔍 OSINT Domain Intelligence Tool")
    print("=" * 60)
    print(f"  → Server: http://localhost:5000")
    print(f"  → Press Ctrl+C to stop")
    print("=" * 60)
    app.run(debug=True, host="0.0.0.0", port=5000, threaded=True)
