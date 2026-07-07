import os
import json
import logging

from groq import Groq
from dotenv import load_dotenv

from prompts.scheduling_prompt import get_scheduling_prompt
from models.scheduling_schemas import SchedulingResponse, TimeSlot

# ─────────────────────────────────────────────────────────────
# ENV
# ─────────────────────────────────────────────────────────────

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise ValueError(
        "GROQ_API_KEY not found in environment variables."
    )

client = Groq(api_key=GROQ_API_KEY)

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────
# Scheduling Email Generator
# ─────────────────────────────────────────────────────────────

def draft_scheduling_email(
    candidate_name: str,
    candidate_email: str,
    job_title: str,
    duration_minutes: int,
    recruiter_name: str,
    recruiter_company: str,
    slots: list[dict],
    calendar_provider: str,
) -> SchedulingResponse:

    prompt = get_scheduling_prompt(
        candidate_name=candidate_name,
        candidate_email=candidate_email,
        job_title=job_title,
        duration_minutes=duration_minutes,
        recruiter_name=recruiter_name,
        recruiter_company=recruiter_company,
        slots=slots,
    )

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            temperature=0.4,
            max_tokens=1000,
        )

        drafted_email = (
            response.choices[0]
            .message
            .content
            .strip()
        )

        tokens_used = (
            response.usage.prompt_tokens +
            response.usage.completion_tokens
        )

        time_slots = [
            TimeSlot(**slot)
            for slot in slots
        ]

        return SchedulingResponse(
            candidate_name=candidate_name,
            candidate_email=candidate_email,
            job_title=job_title,
            duration_minutes=duration_minutes,
            slots=time_slots,
            drafted_email=drafted_email,
            recruiter_name=recruiter_name,
            calendar_provider=calendar_provider,
            tokens_used=tokens_used,
        )

    except Exception as e:
        logger.exception("Scheduling email generation failed")

        raise RuntimeError(
            f"Failed to generate scheduling email: {str(e)}"
        )