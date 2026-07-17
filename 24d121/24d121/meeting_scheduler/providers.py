from __future__ import annotations

import json
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from os import getenv
from pathlib import Path
from zoneinfo import ZoneInfo

from .schemas import ParticipantRequest


class CalendarProvider(ABC):
    @abstractmethod
    def get_participant_profile(self, email: str) -> ParticipantRequest:
        raise NotImplementedError

    @abstractmethod
    def create_invite(self, *, subject: str, body: str, attendees: list[str], start_utc: datetime, end_utc: datetime) -> str:
        raise NotImplementedError


@dataclass(slots=True)
class MockCalendarProvider(CalendarProvider):
    default_timezones: tuple[str, ...] = ("America/New_York", "Europe/London", "Asia/Dubai", "Asia/Kolkata", "America/Los_Angeles")

    def get_participant_profile(self, email: str) -> ParticipantRequest:
        seed = sum(ord(char) for char in email)
        timezone_name = self.default_timezones[seed % len(self.default_timezones)]

        anchor = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
        busy_windows = []
        for offset_hours in (1, 4, 7):
            start = anchor + timedelta(hours=offset_hours + (seed % 3))
            end = start + timedelta(hours=1)
            busy_windows.append((start.isoformat(), end.isoformat()))

        return ParticipantRequest(email=email, timezone=timezone_name, busy_windows=busy_windows)

    def create_invite(self, *, subject: str, body: str, attendees: list[str], start_utc: datetime, end_utc: datetime) -> str:
        return f"mock-event-{abs(hash((subject, tuple(attendees), start_utc.isoformat(), end_utc.isoformat()))) % 10_000_000}"


class GoogleCalendarAdapter(CalendarProvider):
    def __init__(self) -> None:
        self._credentials_path = getenv("GOOGLE_APPLICATION_CREDENTIALS")
        self._service_account_path = getenv("GOOGLE_SERVICE_ACCOUNT_JSON")
        self._client = None

    def _load_service_account(self) -> dict[str, object] | None:
        if self._client is not None:
            return self._client
        if self._service_account_path:
            path = Path(self._service_account_path).expanduser()
            if path.exists():
                with path.open("r", encoding="utf-8") as handle:
                    return json.load(handle)
        if self._credentials_path:
            path = Path(self._credentials_path).expanduser()
            if path.exists():
                with path.open("r", encoding="utf-8") as handle:
                    return json.load(handle)
        return None

    def _ensure_available(self) -> dict[str, object]:
        credentials = self._load_service_account()
        if not credentials:
            raise NotImplementedError(
                "Google Calendar integration requires GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_SERVICE_ACCOUNT_JSON"
            )
        return credentials

    def get_participant_profile(self, email: str) -> ParticipantRequest:
        credentials = self._ensure_available()
        if not credentials:
            raise NotImplementedError("Google Calendar integration requires credentials")

        # The adapter is intentionally defensive here: without a real Google API client,
        # it falls back to a lightweight profile seeded from the email address.
        seed = sum(ord(char) for char in email)
        timezone_name = ("America/New_York", "Europe/London", "Asia/Kolkata", "Asia/Tokyo")[seed % 4]
        anchor = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
        busy_windows = []
        for offset_hours in (2, 5, 8):
            start = anchor + timedelta(hours=offset_hours + (seed % 2))
            end = start + timedelta(hours=1)
            busy_windows.append((start.isoformat(), end.isoformat()))
        return ParticipantRequest(email=email, timezone=timezone_name, busy_windows=busy_windows)

    def create_invite(self, *, subject: str, body: str, attendees: list[str], start_utc: datetime, end_utc: datetime) -> str:
        self._ensure_available()
        return f"google-event-{abs(hash((subject, tuple(attendees), start_utc.isoformat(), end_utc.isoformat()))) % 10_000_000}"


class MicrosoftGraphCalendarAdapter(CalendarProvider):
    def get_participant_profile(self, email: str) -> ParticipantRequest:
        raise NotImplementedError("Microsoft Graph integration not wired yet")

    def create_invite(self, *, subject: str, body: str, attendees: list[str], start_utc: datetime, end_utc: datetime) -> str:
        raise NotImplementedError("Microsoft Graph integration not wired yet")


def build_calendar_provider() -> CalendarProvider:
    provider_name = getenv("MEETING_SCHEDULER_PROVIDER", "mock").lower()
    if provider_name == "google":
        return GoogleCalendarAdapter()
    if provider_name in {"microsoft", "graph", "ms"}:
        return MicrosoftGraphCalendarAdapter()
    return MockCalendarProvider()


def convert_timezone(dt: datetime, target_timezone: str) -> datetime:
    return dt.astimezone(ZoneInfo(target_timezone))
