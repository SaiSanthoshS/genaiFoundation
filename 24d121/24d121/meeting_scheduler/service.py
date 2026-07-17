from __future__ import annotations

from dataclasses import asdict
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from .agents import build_meeting_plan, send_invite
from .providers import build_calendar_provider
from .schemas import MeetingRequest


app = FastAPI(title="Smart Meeting Scheduler", version="0.1.0")
provider = build_calendar_provider()

static_dir = Path(__file__).resolve().parent / "static"
app.mount("/static", StaticFiles(directory=static_dir), name="static")


@app.get("/")
def serve_web_app() -> FileResponse:
    return FileResponse(static_dir / "index.html")


class MeetingRequestModel(BaseModel):
    participant_emails: list[str] = Field(min_length=1)
    duration_minutes: int = Field(gt=0, le=480)
    requester_timezone: str = Field(default="UTC")
    preferred_window_start: str = Field(default="09:00")
    preferred_window_end: str = Field(default="17:00")


class SendInviteModel(BaseModel):
    participant_emails: list[str] = Field(min_length=1)
    duration_minutes: int = Field(gt=0, le=480)
    requester_timezone: str = Field(default="UTC")
    preferred_window_start: str = Field(default="09:00")
    preferred_window_end: str = Field(default="17:00")


def _build_request(payload: MeetingRequestModel | SendInviteModel) -> MeetingRequest:
    return MeetingRequest(
        participant_emails=payload.participant_emails,
        duration_minutes=payload.duration_minutes,
        requester_timezone=payload.requester_timezone,
        preferred_window_start=payload.preferred_window_start,
        preferred_window_end=payload.preferred_window_end,
    )


def _serialize_plan(plan) -> dict[str, Any]:
    invite = None
    if plan.invite_draft:
        invite = {
            "subject": plan.invite_draft.subject,
            "body": plan.invite_draft.body,
            "attendees": plan.invite_draft.attendees,
            "start_utc": plan.invite_draft.start_utc.isoformat(),
            "end_utc": plan.invite_draft.end_utc.isoformat(),
            "conference_link": plan.invite_draft.conference_link,
        }

    return {
        "request": asdict(plan.request),
        "participant_profiles": [asdict(participant) for participant in plan.participant_profiles],
        "availability_grid": plan.availability_grid,
        "slot_options": [
            {
                "start_utc": option.start_utc.isoformat(),
                "end_utc": option.end_utc.isoformat(),
                "score": option.score,
                "participant_local_times": option.participant_local_times,
            }
            for option in plan.slot_options
        ],
        "invite_draft": invite,
        "status": plan.status,
    }


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/plan")
def plan_meeting(payload: MeetingRequestModel) -> dict[str, Any]:
    request = _build_request(payload)
    plan = build_meeting_plan(request, provider)
    return _serialize_plan(plan)


@app.post("/send")
def send_meeting(payload: SendInviteModel) -> dict[str, Any]:
    request = _build_request(payload)
    plan = build_meeting_plan(request, provider)
    if not plan.invite_draft:
        raise HTTPException(status_code=400, detail="No overlapping slots found")
    plan = send_invite(plan, provider)
    return _serialize_plan(plan)
