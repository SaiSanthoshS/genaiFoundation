# agent.py

import os
from dotenv import load_dotenv
from google import genai

from tools import (
    get_drug_info,
    check_interactions,
    generate_reminders,
    calculate_refill,
)

# Load .env from the same folder as this file
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError("GEMINI_API_KEY not found. Check your .env file.")

client = genai.Client(api_key=api_key)


def medication_agent(medications):

    drug_names = [m["name"] for m in medications]

    drug_info = [get_drug_info(name) for name in drug_names]
    interactions = check_interactions(drug_names)

    refill_info = []
    reminders = []

    for med in medications:
        refill_info.append(
            calculate_refill(
                med["stock"],
                med["doses_per_day"]
            )
        )

        reminders.append(
            generate_reminders(
                med["frequency"]
            )
        )

    prompt = f"""
You are a Smart Medication Reminder Agent.

Drug Information:
{drug_info}

Interactions:
{interactions}

Reminder Schedule:
{reminders}

Refill Status:
{refill_info}

Explain everything clearly for the user.
"""

    response = client.models.generate_content(
        model="gemini-flash-latest",
        contents=prompt
    )

    return response.text