import hashlib
import time
from collections import defaultdict, deque
from typing import Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .agent import analyze_content

app = FastAPI(title="Fake News Detector API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

RATE_LIMIT_WINDOW_SECONDS = 60
RATE_LIMIT_MAX_REQUESTS = 20
rate_limit_store = defaultdict(deque)
cache_store = {}
CACHE_TTL_SECONDS = 60 * 15


class AnalyzeRequest(BaseModel):
    url: Optional[str] = None
    text: Optional[str] = None


class Claim(BaseModel):
    text: str
    verdict: str
    evidence: str
    sources: list[str]


class SourceCredibility(BaseModel):
    score: int
    domain: str
    reasoning: str


class CrossReference(BaseModel):
    title: str
    outlet: str
    url: str
    stance: str


class OverallVerdict(BaseModel):
    label: str
    explanation: str


class AnalyzeResponse(BaseModel):
    claims: list[Claim]
    sourceCredibility: SourceCredibility
    crossReferences: list[CrossReference]
    overallVerdict: OverallVerdict


@app.get("/health")
def health():
    return {"status": "ok"}


def _get_client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def _check_rate_limit(request: Request) -> None:
    ip = _get_client_ip(request)
    now = time.time()
    history = rate_limit_store[ip]
    while history and now - history[0] > RATE_LIMIT_WINDOW_SECONDS:
        history.popleft()
    if len(history) >= RATE_LIMIT_MAX_REQUESTS:
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Please try again shortly.")
    history.append(now)


def _hash_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _build_agent_result(url: Optional[str], text: Optional[str]) -> AnalyzeResponse:
    data = analyze_content(url, text)
    claims = [
        Claim(
            text=item["text"],
            verdict=item["verdict"],
            evidence=item["evidence"],
            sources=item["sources"],
        )
        for item in data["claims"]
    ]
    return AnalyzeResponse(
        claims=claims,
        sourceCredibility=SourceCredibility(
            score=data["sourceCredibility"]["score"],
            domain=data["sourceCredibility"]["domain"],
            reasoning=data["sourceCredibility"]["reasoning"],
        ),
        crossReferences=[
            CrossReference(
                title=item["title"],
                outlet=item["outlet"],
                url=item["url"],
                stance=item["stance"],
            )
            for item in data["crossReferences"]
        ],
        overallVerdict=OverallVerdict(
            label=data["overallVerdict"]["label"],
            explanation=data["overallVerdict"]["explanation"],
        ),
    )


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(request: Request, payload: AnalyzeRequest):
    _check_rate_limit(request)
    if not payload.url and not payload.text:
        raise HTTPException(status_code=400, detail="Provide either a URL or raw text.")

    source_key = payload.url or payload.text or ""
    cache_key = _hash_text(source_key)
    now = time.time()
    if cache_key in cache_store and now - cache_store[cache_key]["timestamp"] < CACHE_TTL_SECONDS:
        return cache_store[cache_key]["result"]

    result = _build_agent_result(payload.url, payload.text)
    cache_store[cache_key] = {"timestamp": now, "result": result}
    return result
