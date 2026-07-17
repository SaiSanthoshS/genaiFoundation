from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Literal


@dataclass(slots=True)
class ParticipantRequest:
    email: str
    timezone: str
    busy_windows: list[tuple[str, str]] = field(default_factory=list)


@dataclass(slots=True)
class MeetingRequest:
    participant_emails: list[str]
    duration_minutes: int
    requester_timezone: str
    preferred_window_start: str = "09:00"
    preferred_window_end: str = "17:00"


@dataclass(slots=True)
class SlotOption:
    start_utc: datetime
    end_utc: datetime
    score: float
    participant_local_times: dict[str, str]


@dataclass(slots=True)
class InviteDraft:
    subject: str
    body: str
    attendees: list[str]
    start_utc: datetime
    end_utc: datetime
    conference_link: str | None = None


@dataclass(slots=True)
class MeetingPlan:
    request: MeetingRequest
    participant_profiles: list[ParticipantRequest]
    availability_grid: dict[str, list[tuple[str, str]]]
    slot_options: list[SlotOption]
    invite_draft: InviteDraft | None
    status: Literal["draft", "ready", "sent"] = "draft"
