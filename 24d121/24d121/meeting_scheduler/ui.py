from __future__ import annotations

import datetime
import gradio as gr

from .agents import build_meeting_plan, send_invite
from .providers import build_calendar_provider
from .schemas import MeetingRequest

provider = build_calendar_provider()


def build_availability_markdown(plan) -> str:
    if not plan.participant_profiles:
        return "**No participants configured.**"
    lines = ["### Availability Grid"]
    for participant in plan.participant_profiles:
        lines.append(f"**{participant.email}** — timezone: {participant.timezone}")
        if not participant.busy_windows:
            lines.append("- No busy windows found")
        else:
            for start_text, end_text in participant.busy_windows:
                lines.append(f"- {start_text} → {end_text}")
        lines.append("")
    return "\n".join(lines)


def build_slots_markdown(plan) -> str:
    if not plan.slot_options:
        return "**No available slots found. Try a wider window or additional hours.**"
    lines = ["### Top Candidate Slots"]
    for index, slot in enumerate(plan.slot_options, start=1):
        lines.append(f"#### Option {index}")
        lines.append(f"- **UTC**: {slot.start_utc.strftime('%Y-%m-%d %H:%M')} → {slot.end_utc.strftime('%H:%M')}")
        lines.append(f"- **Score**: {slot.score}")
        lines.append("- **Local times**:")
        for email, local_time in slot.participant_local_times.items():
            lines.append(f"  - {email}: {local_time}")
        lines.append("")
    return "\n".join(lines)


def build_invite_markdown(plan) -> str:
    if not plan.invite_draft:
        return "**No invite draft available yet. Generate a plan first.**"
    lines = ["### Invite Preview"]
    lines.append(f"**Subject:** {plan.invite_draft.subject}")
    lines.append("**Body:**")
    lines.append("```text")
    lines.append(plan.invite_draft.body)
    lines.append("```")
    lines.append("**Attendees:**")
    for attendee in plan.invite_draft.attendees:
        lines.append(f"- {attendee}")
    return "\n".join(lines)


def find_slots(email_text: str, duration_minutes: int, requester_timezone: str, window_start: str, window_end: str):
    emails = [email.strip() for email in email_text.splitlines() if email.strip()]
    if not emails:
        return (
            "**Please enter at least one participant email.**",
            "",
            "",
            None,
        )

    request = MeetingRequest(
        participant_emails=emails,
        duration_minutes=int(duration_minutes),
        requester_timezone=requester_timezone,
        preferred_window_start=window_start,
        preferred_window_end=window_end,
    )
    plan = build_meeting_plan(request, provider)
    return (
        build_availability_markdown(plan),
        build_slots_markdown(plan),
        build_invite_markdown(plan),
        plan,
    )


def send_selected_invite(plan_state):
    if plan_state is None:
        return "No plan generated yet. Click Find Slots first."
    try:
        plan = send_invite(plan_state, provider)
        return f"✅ Invite sent successfully. Event ID: {plan.invite_draft.conference_link}"
    except Exception as exc:
        return f"⚠️ Failed to send invite: {exc}"


def fill_example_values():
    return (
        "alice@example.com\nbob@example.com\ncarol@example.com",
        30,
        "UTC",
        "09:00",
        "17:00",
    )


def build_demo():
    with gr.Blocks(title="Smart Meeting Scheduler") as demo:
        gr.Markdown(
            "# Smart Meeting Scheduler\nUse the form below to enter participants and discover the best shared meeting times. "
            "Then preview the draft invite and send it with one click."
        )

        with gr.Row():
            with gr.Column(scale=2):
                emails = gr.Textbox(
                    label="Participant emails",
                    lines=6,
                    value="alice@example.com\nbob@example.com\ncarol@example.com",
                )
                example_button = gr.Button("Load example participants")
            with gr.Column(scale=1):
                duration = gr.Number(label="Duration (minutes)", value=30, precision=0)
                timezone = gr.Textbox(label="Requester timezone", value="UTC")
                window_start = gr.Textbox(label="Preferred window start", value="09:00")
                window_end = gr.Textbox(label="Preferred window end", value="17:00")
                find_button = gr.Button("Find Slots")
                send_button = gr.Button("Send Invite")

        with gr.Row():
            availability = gr.Markdown(label="Availability Grid")
            slots = gr.Markdown(label="Top Slots")

        with gr.Row():
            preview = gr.Markdown(label="Invite Preview")

        status = gr.Textbox(label="Send Status")
        plan_state = gr.State()

        find_button.click(
            find_slots,
            [emails, duration, timezone, window_start, window_end],
            [availability, slots, preview, plan_state],
        )
        send_button.click(send_selected_invite, [plan_state], [status])
        example_button.click(
            fill_example_values,
            [],
            [emails, duration, timezone, window_start, window_end],
        )

    return demo


if __name__ == "__main__":
    build_demo().launch()
