from __future__ import annotations

from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from .providers import CalendarProvider, convert_timezone
from .schemas import InviteDraft, MeetingPlan, MeetingRequest, ParticipantRequest, SlotOption


def _parse_local_time(value: str):
    return datetime.strptime(value, "%H:%M").time()


def collect_participants(request: MeetingRequest, provider: CalendarProvider) -> list[ParticipantRequest]:
    return [provider.get_participant_profile(email.strip().lower()) for email in request.participant_emails]


def build_availability_grid(participants: list[ParticipantRequest]) -> dict[str, list[tuple[str, str]]]:
    return {participant.email: participant.busy_windows for participant in participants}


def find_overlapping_slots(
    request: MeetingRequest,
    participants: list[ParticipantRequest],
    *,
    horizon_hours: int = 48,
    step_minutes: int = 30,
) -> list[SlotOption]:
    now_utc = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    window_start = _parse_local_time(request.preferred_window_start)
    window_end = _parse_local_time(request.preferred_window_end)

    busy_by_email: dict[str, list[tuple[datetime, datetime]]] = {}
    for participant in participants:
        busy_windows: list[tuple[datetime, datetime]] = []
        for start_text, end_text in participant.busy_windows:
            busy_windows.append((datetime.fromisoformat(start_text), datetime.fromisoformat(end_text)))
        busy_by_email[participant.email] = busy_windows

    options: list[SlotOption] = []
    candidate = now_utc
    end_of_horizon = now_utc + timedelta(hours=horizon_hours)
    meeting_delta = timedelta(minutes=request.duration_minutes)
    step = timedelta(minutes=step_minutes)

    while candidate + meeting_delta <= end_of_horizon:
        candidate_local_time = candidate.astimezone(ZoneInfo(request.requester_timezone)).time()
        if not (window_start <= candidate_local_time <= window_end):
            candidate += step
            continue

        candidate_end = candidate + meeting_delta
        overlaps_all = True
        participant_local_times: dict[str, str] = {}
        convenience_score = 0.0

        for participant in participants:
            local_start = convert_timezone(candidate, participant.timezone)
            participant_local_times[participant.email] = local_start.strftime("%a %H:%M")

            local_hour = local_start.hour + local_start.minute / 60.0
            convenience_score += max(0.0, 1.0 - abs(local_hour - 10.5) / 12.0)

            for busy_start, busy_end in busy_by_email[participant.email]:
                if candidate < busy_end and candidate_end > busy_start:
                    overlaps_all = False
                    break
            if not overlaps_all:
                break

        if overlaps_all:
            options.append(
                SlotOption(
                    start_utc=candidate,
                    end_utc=candidate_end,
                    score=round(convenience_score / max(1, len(participants)), 4),
                    participant_local_times=participant_local_times,
                )
            )

        candidate += step

    options.sort(key=lambda option: (option.score, option.start_utc), reverse=True)
    return options[:3]


def compose_invite(request: MeetingRequest, participants: list[ParticipantRequest], slot: SlotOption) -> InviteDraft:
    subject = f"Meeting request: {request.duration_minutes}-minute planning session"
    attendee_list = [participant.email for participant in participants]
    local_times = "\n".join(
        f"- {participant.email}: {slot.participant_local_times.get(participant.email, 'TBD')}"
        for participant in participants
    )
    body = (
        f"Proposed time in UTC: {slot.start_utc.strftime('%Y-%m-%d %H:%M')} - {slot.end_utc.strftime('%H:%M')}\n"
        f"Local times:\n{local_times}\n\n"
        "Please confirm availability."
    )
    return InviteDraft(subject=subject, body=body, attendees=attendee_list, start_utc=slot.start_utc, end_utc=slot.end_utc)


def build_meeting_plan(request: MeetingRequest, provider: CalendarProvider) -> MeetingPlan:
    participants = collect_participants(request, provider)
    availability_grid = build_availability_grid(participants)
    slot_options = find_overlapping_slots(request, participants)
    invite_draft = compose_invite(request, participants, slot_options[0]) if slot_options else None
    return MeetingPlan(
        request=request,
        participant_profiles=participants,
        availability_grid=availability_grid,
        slot_options=slot_options,
        invite_draft=invite_draft,
        status="ready" if invite_draft else "draft",
    )


def send_invite(plan: MeetingPlan, provider: CalendarProvider) -> MeetingPlan:
    if not plan.invite_draft:
        raise ValueError("No invite draft available to send")

    conference_id = provider.create_invite(
        subject=plan.invite_draft.subject,
        body=plan.invite_draft.body,
        attendees=plan.invite_draft.attendees,
        start_utc=plan.invite_draft.start_utc,
        end_utc=plan.invite_draft.end_utc,
    )
    plan.invite_draft.conference_link = conference_id
    plan.status = "sent"
    return plan
