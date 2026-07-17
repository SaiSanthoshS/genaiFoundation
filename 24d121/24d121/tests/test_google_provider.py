from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from meeting_scheduler.providers import GoogleCalendarAdapter


def test_google_adapter_requires_credentials():
    adapter = GoogleCalendarAdapter()
    try:
        adapter.get_participant_profile("someone@example.com")
    except NotImplementedError as exc:
        assert "credentials" in str(exc).lower() or "not wired" in str(exc).lower()
    else:
        raise AssertionError("Expected Google adapter to fail without credentials")
