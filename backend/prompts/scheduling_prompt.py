def get_scheduling_prompt(
candidate_name: str,
candidate_email: str,
job_title: str,
duration_minutes: int,
recruiter_name: str,
recruiter_company: str,
slots: list[dict],
) -> str:
    slot_lines = "\n".join([
        f"- {s['day']}, {s['date']} — {s['start_time']} to {s['end_time']}"
        for s in slots
    ])

    return f"""
You are an experienced Talent Acquisition Coordinator writing on behalf of {recruiter_company}.

Your task is to draft a professional interview scheduling email for a candidate.

CANDIDATE DETAILS

* Candidate Name: {candidate_name}
* Candidate Email: {candidate_email}

INTERVIEW DETAILS

* Position: {job_title}
* Duration: {duration_minutes} minutes

RECRUITER DETAILS

* Recruiter Name: {recruiter_name}
* Company: {recruiter_company}

AVAILABLE INTERVIEW SLOTS
{slot_lines}

EMAIL REQUIREMENTS

The email must:

1. Be concise, professional, and friendly.
2. Address the candidate by name.
3. Mention the role being discussed.
4. State that the following are AVAILABLE interview slots.
5. Never imply that an interview has already been scheduled.
6. Present the slots as a clean bullet list.
7. Ask the candidate to reply with their preferred option.
8. Mention the interview duration naturally.
9. End with a professional sign-off using the recruiter name and company.
10. Sound like a real recruiter, not an AI assistant.

IMPORTANT RULES

* Do NOT say:

  * "We have scheduled..."
  * "Your interview is scheduled..."
  * "You have been booked..."
  * "Please attend..."
* Instead use wording such as:

  * "Please find below the available interview slots."
  * "Kindly let us know which option works best for you."
* Do not invent dates, times, links, meeting IDs, locations, or interview stages.
* Do not add a subject line.
* Do not add placeholders.
* Do not add explanations outside the email.
* Return ONLY the email body.

The ideal email length is 120-180 words.
""".strip()
