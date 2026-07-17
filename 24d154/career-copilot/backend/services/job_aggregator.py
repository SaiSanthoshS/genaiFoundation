"""
Job Aggregator — fetches job listings from free public APIs.

Sources:
  - RemoteOK   (https://remoteok.com/api)
  - Remotive   (https://remotive.com/api/remote-jobs)
  - Arbeitnow  (https://www.arbeitnow.com/api/job-board-api)
"""

import datetime
from typing import Optional

import httpx

from backend.database.models import Job


# ── API fetchers ─────────────────────────────────────────────────────────────

async def _fetch_remoteok(query: str = "", limit: int = 20) -> list[dict]:
    """Fetch jobs from RemoteOK API."""
    url = "https://remoteok.com/api"
    headers = {"User-Agent": "CareerCopilot/1.0"}

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url, headers=headers)
            resp.raise_for_status()
            data = resp.json()

        # First item is metadata, skip it
        jobs = data[1:] if len(data) > 1 else []

        results = []
        for j in jobs[:limit]:
            if query and query.lower() not in (j.get("position", "") + j.get("description", "")).lower():
                continue
            results.append({
                "title": j.get("position", ""),
                "company": j.get("company", ""),
                "location": j.get("location", "Remote"),
                "salary_range": f"{j.get('salary_min', '')}-{j.get('salary_max', '')}".strip("-"),
                "description": j.get("description", "")[:2000],
                "requirements": j.get("tags", []),
                "source": "RemoteOK",
                "source_url": j.get("url", ""),
                "posted_at": j.get("date", None),
            })
        return results[:limit]
    except Exception:
        return []


async def _fetch_remotive(query: str = "", limit: int = 20) -> list[dict]:
    """Fetch jobs from Remotive API."""
    url = "https://remotive.com/api/remote-jobs"
    params = {"limit": limit}
    if query:
        params["search"] = query

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()

        jobs = data.get("jobs", [])
        results = []
        for j in jobs[:limit]:
            results.append({
                "title": j.get("title", ""),
                "company": j.get("company_name", ""),
                "location": j.get("candidate_required_location", "Remote"),
                "salary_range": j.get("salary", ""),
                "description": j.get("description", "")[:2000],
                "requirements": j.get("tags", []),
                "source": "Remotive",
                "source_url": j.get("url", ""),
                "posted_at": j.get("publication_date", None),
            })
        return results[:limit]
    except Exception:
        return []


async def _fetch_arbeitnow(query: str = "", limit: int = 20) -> list[dict]:
    """Fetch jobs from Arbeitnow API."""
    url = "https://www.arbeitnow.com/api/job-board-api"
    params = {}
    if query:
        params["search"] = query

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()

        jobs = data.get("data", [])
        results = []
        for j in jobs[:limit]:
            if query and query.lower() not in (j.get("title", "") + j.get("description", "")).lower():
                continue
            results.append({
                "title": j.get("title", ""),
                "company": j.get("company_name", ""),
                "location": j.get("location", ""),
                "salary_range": "",
                "description": j.get("description", "")[:2000],
                "requirements": j.get("tags", []),
                "source": "Arbeitnow",
                "source_url": j.get("url", ""),
                "posted_at": j.get("created_at", None),
            })
        return results[:limit]
    except Exception:
        return []


# ── Main aggregator ──────────────────────────────────────────────────────────

async def search_jobs(
    query: str = "",
    location: str = "",
    remote: bool = True,
    limit: int = 20,
) -> list[dict]:
    """
    Search all sources in parallel and return merged, deduplicated results.
    """
    import asyncio

    search_term = query or "software engineer"

    tasks = [
        _fetch_remoteok(search_term, limit),
        _fetch_remotive(search_term, limit),
        _fetch_arbeitnow(search_term, limit),
    ]

    results_lists = await asyncio.gather(*tasks, return_exceptions=True)

    all_jobs: list[dict] = []
    seen_titles: set[str] = set()

    for result in results_lists:
        if isinstance(result, Exception):
            continue
        for job in result:
            key = f"{job['title']}_{job['company']}".lower()
            if key not in seen_titles:
                seen_titles.add(key)
                all_jobs.append(job)

    # Filter by location if specified
    if location:
        loc_lower = location.lower()
        all_jobs = [
            j for j in all_jobs
            if loc_lower in j.get("location", "").lower() or "remote" in j.get("location", "").lower()
        ]

    return all_jobs[:limit]
