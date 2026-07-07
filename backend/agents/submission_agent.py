import os
import json
import logging

from groq import Groq

from prompts.submission_prompt import SUBMISSION_EMAIL_PROMPT

logger = logging.getLogger(__name__)

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

TEMPLATES_PATH = os.path.join(os.path.dirname(__file__), "..", "utils", "email_templates.json")


def load_templates() -> dict:
    with open(TEMPLATES_PATH, "r") as f:
        return json.load(f)


def generate_submission_email(
    candidate_name: str,
    role: str,
    client_name: str,
    client_contact: str,
    domain: str,
    cv_content: str,
    debrief_content: str = "",
    additional_notes: str = "",
) -> dict:
    """
    Loads the domain template, fills merge tags via Groq/Llama,
    enriches with CV + debrief highlights.
    Returns {"subject": str, "body": str}
    """
    templates = load_templates()

    if domain not in templates:
        raise ValueError(f"Unknown domain: {domain}")

    template = templates[domain]

    prompt = SUBMISSION_EMAIL_PROMPT.format(
        candidate_name=candidate_name,
        role=role,
        client_name=client_name,
        client_contact=client_contact,
        domain=template["domain"],
        template_subject=template["subject"],
        template_body=template["body"],
        cv_content=cv_content,
        debrief_content=debrief_content if debrief_content else "No debrief provided.",
        additional_notes=additional_notes if additional_notes else "None.",
    )

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        temperature=0.2,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a senior recruitment consultant at The Jobs Jungle. "
                    "Always return valid JSON only."
                ),
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
    )

    raw = response.choices[0].message.content.strip()

    tokens_used = (
        response.usage.prompt_tokens
        + response.usage.completion_tokens
    )

    try:
        result = json.loads(raw)
    except json.JSONDecodeError as e:
        logger.error(f"Submission JSON parse failed: {e}\nRaw output:\n{raw}")
        raise ValueError("AI returned malformed JSON. Please try regenerating.")

    if "subject" not in result or "body" not in result:
        raise ValueError("AI response missing required fields. Please try regenerating.")

    logger.info(f"Submission draft generated — tokens used: {tokens_used}")

    return result