import json
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

try:
    from .agent import run_agent_stream, analyze_portfolio, format_portfolio_summary
except ImportError:  # pragma: no cover - direct script execution
    from agent import run_agent_stream, analyze_portfolio, format_portfolio_summary

app = FastAPI(title="Portfolio Monitor Agent", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PortfolioRequest(BaseModel):
    holdings: Optional[List[Dict[str, Any]]] = None
    text: Optional[str] = None
    threshold_pct: float = 5.0
    use_ai: bool = False


@app.get("/")
def index():
    return FileResponse(os.path.join(os.path.dirname(__file__), "static", "index.html"))


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze")
def analyze(request: PortfolioRequest):
    source = request.holdings if request.holdings is not None else request.text
    result = analyze_portfolio(source, threshold_pct=request.threshold_pct, use_ai=request.use_ai)
    return {
        "summary": format_portfolio_summary(result),
        "result": result,
    }


@app.post("/stream")
def stream(request: PortfolioRequest):
    source = request.holdings if request.holdings is not None else request.text or ""

    def event_stream():
        for event in run_agent_stream(str(source), threshold_pct=request.threshold_pct, use_ai=request.use_ai):
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=False)
