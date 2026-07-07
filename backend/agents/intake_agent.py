import os
import re
import json
import asyncio
import logging

from groq import AsyncGroq
from pydantic import ValidationError
from dotenv import load_dotenv

from models.intake_schemas import IntakeResponse
from prompts.intake_prompt import INTAKE_SYSTEM_PROMPT


# ──────────────────────────────────────────────────────────────────────────────
# ENV
# ──────────────────────────────────────────────────────────────────────────────

load_dotenv()


# ──────────────────────────────────────────────────────────────────────────────
# LOGGING
# ──────────────────────────────────────────────────────────────────────────────

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────────────────────────────────────
# GROQ CLIENT — LAZY SINGLETON
# ──────────────────────────────────────────────────────────────────────────────

_client: AsyncGroq | None = None


def _get_client() -> AsyncGroq:
    """
    Lazily initialize Groq client only when first used.
    Prevents startup crashes if env vars are missing during import time.
    """

    global _client

    if _client is None:

        api_key = os.getenv("GROQ_API_KEY")

        if not api_key:
            raise RuntimeError(
                "GROQ_API_KEY is missing. "
                "Add it to your .env file and restart the server."
            )

        _client = AsyncGroq(api_key=api_key)

    return _client


# ──────────────────────────────────────────────────────────────────────────────
# CONFIG
# ──────────────────────────────────────────────────────────────────────────────

MODEL = "llama-3.3-70b-versatile"

TEMPERATURE = 0.3

MAX_TOKENS = 6000

MAX_RETRIES = 2

RETRY_DELAY_S = 2

MAX_JD_CHARS = 15_000


# ──────────────────────────────────────────────────────────────────────────────
# HELPERS
# ──────────────────────────────────────────────────────────────────────────────

def _split_string_to_list(value: str) -> list[str]:
    """
    Convert badly formatted prose strings into clean lists.
    """

    items = re.split(
        r"[\n;]|(?<!\w)\d+\.\s*",
        value
    )

    cleaned = [
        item.strip(" -•*\t")
        for item in items
        if item.strip(" -•*\t")
    ]

    return cleaned


# ──────────────────────────────────────────────────────────────────────────────
# OUTPUT NORMALIZATION
# ──────────────────────────────────────────────────────────────────────────────

def _normalize_output(data: dict) -> dict:
    """
    Repairs common LLM formatting mistakes before schema validation.
    """
    # If model nested job_title inside hiring_context, hoist it up
    if "job_title" not in data:
        nested = data.get("hiring_context", {}).pop("job_title", None)
        if nested:
            data["job_title"] = nested

    # ─────────────────────────────────────────────
    # FIX SCORING GUIDE KEYS
    # ─────────────────────────────────────────────

    try:

        criteria = (
            data
            .get("scorecard", {})
            .get("criteria", [])
        )

        for criterion in criteria:

            scoring = criterion.get(
                "scoring_guide",
                {}
            )

            if scoring and "score_5" not in scoring:

                criterion["scoring_guide"] = {
                    "score_5": scoring.get("5", ""),
                    "score_3": scoring.get("3", ""),
                    "score_1": scoring.get("1", ""),
                }

    except Exception as e:

        logger.warning(
            f"Scoring guide normalization failed: {e}"
        )

    # ─────────────────────────────────────────────
    # FIX LIST FIELDS RETURNED AS STRINGS
    # ─────────────────────────────────────────────

    intake = data.get(
        "intake_document",
        {}
    )

    list_fields = [
        "key_responsibilities",
        "must_have_requirements",
        "nice_to_have_requirements",
        "key_challenges",
        "growth_opportunities",
    ]

    for field in list_fields:

        try:

            value = intake.get(field)

            if isinstance(value, str):

                logger.warning(
                    f"{field} returned as string — repairing"
                )

                intake[field] = _split_string_to_list(value)

        except Exception as e:

            logger.warning(
                f"Normalization failed for {field}: {e}"
            )

    # ─────────────────────────────────────────────
    # FIX AUTO REJECT RETURNED AS STRING
    # ─────────────────────────────────────────────

    try:

        auto_reject = data.get(
            "auto_reject_criteria"
        )

        if isinstance(auto_reject, str):

            logger.warning(
                "auto_reject_criteria returned as string"
            )

            data["auto_reject_criteria"] = (
                _split_string_to_list(auto_reject)
            )

    except Exception as e:

        logger.warning(
            f"auto_reject normalization failed: {e}"
        )

    # ─────────────────────────────────────────────
    # FIX JD QUALITY ANALYSIS LISTS
    # ─────────────────────────────────────────────

    try:

        quality = data.get(
            "jd_quality_analysis",
            {}
        )

        quality_list_fields = [
            "ambiguity_flags",
            "contradiction_flags",
            "unrealistic_expectations",
            "missing_information",
            "recommended_fixes",
        ]

        for field in quality_list_fields:

            value = quality.get(field)

            if isinstance(value, str):

                logger.warning(
                    f"jd_quality_analysis.{field} "
                    f"returned as string — repairing"
                )

                quality[field] = (
                    _split_string_to_list(value)
                )

    except Exception as e:

        logger.warning(
            f"JD quality list normalization failed: {e}"
        )

    # ─────────────────────────────────────────────
    # FIX QUALITY SCORE RETURNED AS "72/100"
    # ─────────────────────────────────────────────

    try:

        quality = data.get(
            "jd_quality_analysis",
            {}
        )

        score = quality.get(
            "overall_quality_score"
        )

        if isinstance(score, str):

            nums = re.findall(r"\d+", score)

            if nums:

                quality["overall_quality_score"] = (
                    int(nums[0])
                )

    except Exception as e:

        logger.warning(
            f"Quality score normalization failed: {e}"
        )

    return data


# ──────────────────────────────────────────────────────────────────────────────
# MESSAGE BUILDER
# ──────────────────────────────────────────────────────────────────────────────

def _build_messages(
    jd_text: str,
    validation_error: str | None = None
) -> list:
    """
    Build conversation payload for Groq.
    """

    messages = [

        {
            "role": "system",
            "content": INTAKE_SYSTEM_PROMPT
        },

        {
            "role": "user",
            "content": (
                "Analyze this job description and generate "
                "structured recruitment documents.\n\n"
                f"JOB DESCRIPTION:\n{jd_text}"
            )
        }
    ]

    # ─────────────────────────────────────────────
    # RETRY SELF-CORRECTION
    # ─────────────────────────────────────────────

    if validation_error:

        messages.append({

            "role": "assistant",

            "content": (
                "[Previous response failed validation]"
            )
        })

        messages.append({

            "role": "user",

            "content": (
                f"Your previous response failed schema "
                f"validation with this error:\n\n"
                f"{validation_error}\n\n"

                f"Return the FULL corrected JSON.\n\n"

                f"Ensure ALL required top-level fields exist:\n"
                f"- job_title (clean role title, max 60 chars, top-level field)\n"
                f"- hiring_context\n"
                f"- intake_document\n"
                f"- auto_reject_criteria\n"
                f"- prescreening_questions\n"
                f"- scorecard\n"
                f"- jd_quality_analysis\n\n"

                f"Critical validation rules:\n"

                f"1. All List[str] fields must be JSON arrays.\n"

                f"2. auto_reject_criteria must contain "
                f"minimum 3 items.\n"

                f"3. prescreening_questions must contain "
                f"at least one Logistics question.\n"

                f"4. scorecard.scoring_guide MUST use:\n"
                f"score_5\n"
                f"score_3\n"
                f"score_1\n"
                f"NOT numeric keys.\n"

                f"5. scorecard weights must sum to EXACTLY 100.\n"

                f"6. jd_quality_analysis must contain:\n"
                f"- overall_quality_score (integer)\n"
                f"- ambiguity_flags\n"
                f"- contradiction_flags\n"
                f"- unrealistic_expectations\n"
                f"- missing_information\n"
                f"- market_alignment\n"
                f"- hiring_risk_summary\n"
                f"- recommended_fixes\n"
            )
        })

    return messages


# ──────────────────────────────────────────────────────────────────────────────
# MODEL CALL
# ──────────────────────────────────────────────────────────────────────────────

async def _call_model(
    jd_text: str,
    validation_error: str | None = None
) -> dict:
    """
    Single Groq model call.
    """

    messages = _build_messages(
        jd_text=jd_text,
        validation_error=validation_error
    )

    response = await (
        _get_client()
        .chat
        .completions
        .create(
            model=MODEL,
            messages=messages,
            temperature=TEMPERATURE,
            max_tokens=MAX_TOKENS,
            response_format={
                "type": "json_object"
            }
        )
    )

    content = response.choices[0].message.content

    parsed = json.loads(content)

    parsed = _normalize_output(parsed)

    parsed["tokens_used"] = (
        response.usage.total_tokens
    )

    return parsed


# ──────────────────────────────────────────────────────────────────────────────
# PUBLIC ENTRYPOINT
# ──────────────────────────────────────────────────────────────────────────────

async def generate_intake_documents(
    jd_text: str
) -> IntakeResponse:
    """
    Main public entrypoint.
    Generates validated recruiter-grade intake documents.
    """

    # ─────────────────────────────────────────────
    # TRUNCATE OVERSIZED JD
    # ─────────────────────────────────────────────

    if len(jd_text) > MAX_JD_CHARS:

        logger.warning(
            f"JD truncated from "
            f"{len(jd_text)} chars "
            f"to {MAX_JD_CHARS}"
        )

        jd_text = jd_text[:MAX_JD_CHARS]

    last_error = None

    # ─────────────────────────────────────────────
    # RETRY LOOP
    # ─────────────────────────────────────────────

    for attempt in range(MAX_RETRIES + 1):

        try:

            # ─────────────────────────────
            # DELAY ON RETRY
            # ─────────────────────────────

            if attempt > 0:

                wait = RETRY_DELAY_S * attempt

                logger.warning(
                    f"Retry attempt "
                    f"{attempt}/{MAX_RETRIES} "
                    f"after validation failure"
                )

                await asyncio.sleep(wait)

            # ─────────────────────────────
            # MODEL CALL
            # ─────────────────────────────

            parsed = await _call_model(
                jd_text=jd_text,
                validation_error=last_error
            )

            # ─────────────────────────────
            # PYDANTIC VALIDATION
            # ─────────────────────────────

            result = IntakeResponse(
                **parsed
            )

            logger.info(
                f"Intake generation successful "
                f"on attempt {attempt + 1} "
                f"| Tokens: {result.tokens_used}"
            )

            return result

        # ─────────────────────────────────────────
        # JSON FAILURES
        # ─────────────────────────────────────────

        except json.JSONDecodeError as e:

            last_error = (
                f"Invalid JSON response: {e}"
            )

            logger.error(
                f"Attempt {attempt + 1} "
                f"JSON error: {e}"
            )

        # ─────────────────────────────────────────
        # VALIDATION FAILURES
        # ─────────────────────────────────────────

        except ValidationError as e:

            last_error = str(e)

            logger.error(
                f"Attempt {attempt + 1} "
                f"validation error: {e}"
            )

        # ─────────────────────────────────────────
        # NON-RETRYABLE FAILURES
        # ─────────────────────────────────────────

        except Exception as e:

            logger.error(
                f"Non-retryable error: {e}",
                exc_info=True
            )

            raise

    # ─────────────────────────────────────────────
    # FINAL FAILURE
    # ─────────────────────────────────────────────

    raise Exception(
        f"Model failed after "
        f"{MAX_RETRIES + 1} attempts. "
        f"Last error: {last_error}"
    )