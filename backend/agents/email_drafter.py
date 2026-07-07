import os
from groq import Groq

from prompts.outreach_prompt import (
    SYSTEM_PROMPT,
    build_outreach_prompt
)

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


def draft_outreach_messages(
    job_brief: str,
    candidate_name: str,
    candidate_current_title: str,
    candidate_company: str,
    platform: str,
    tone: str,
    recruiter_name: str,
    recruiter_company: str,
    regenerate: bool = False,
    previous_output: str = "",
):

    prompt = build_outreach_prompt(
        job_brief=job_brief,
        candidate_name=candidate_name,
        candidate_current_title=candidate_current_title,
        candidate_company=candidate_company,
        platform=platform,
        tone=tone,
        recruiter_name=recruiter_name,
        recruiter_company=recruiter_company,
        regenerate=regenerate,
        previous_output=previous_output,
    )

    temperature = 1.0 if regenerate else 0.5

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": SYSTEM_PROMPT
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=temperature,
        max_tokens=2000,
    )

    full_output = response.choices[0].message.content

    first_touch = extract_section(
        full_output,
        "FIRST TOUCH MESSAGE",
        "FOLLOW-UP MESSAGE"
    )

    follow_up = extract_section(
        full_output,
        "FOLLOW-UP MESSAGE",
        "KEY POINTS USED"
    )

    key_points = extract_section(
        full_output,
        "KEY POINTS USED FROM BRIEF",
        None
    )

    return {
        "first_touch": first_touch.strip(),
        "follow_up": follow_up.strip(),
        "key_points": key_points.strip(),
        "full_output": full_output,
        "platform": platform,
        "candidate_name": candidate_name,
        "tokens_used": (
            response.usage.total_tokens
            if response.usage
            else 0
        ),
    }


def extract_section(
    text: str,
    start_marker: str,
    end_marker: str | None
):
    try:

        start_idx = text.find(start_marker)

        if start_idx == -1:
            return text

        start_idx = (
            text.find("\n", start_idx) + 1
        )

        if end_marker:

            end_idx = text.find(
                end_marker,
                start_idx
            )

            if end_idx == -1:
                return text[start_idx:]

            return text[start_idx:end_idx]

        return text[start_idx:]

    except Exception:
        return text