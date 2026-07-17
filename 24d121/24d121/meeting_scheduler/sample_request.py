from __future__ import annotations

from .agents import build_meeting_plan
from .providers import MockCalendarProvider
from .schemas import MeetingRequest


def run_sample() -> dict:
    request = MeetingRequest(
        participant_emails=["alice@example.com", "bob@example.com", "carol@example.com"],
        duration_minutes=30,
        requester_timezone="UTC",
    )
    plan = build_meeting_plan(request, MockCalendarProvider())
    return {
        "status": plan.status,
        "slots": [slot.start_utc.isoformat() for slot in plan.slot_options],
        "invite_subject": plan.invite_draft.subject if plan.invite_draft else None,
    }
