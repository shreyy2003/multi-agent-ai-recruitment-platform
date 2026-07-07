import os
import json
import logging

from groq import Groq

from prompts.debrief_prompt import get_debrief_prompt
from models.debrief_schemas import (
    DebriefResponse,
    JDMatchAnalysis,
    ResumeConsistencyCheck,
)

logger = logging.getLogger(__name__)

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


def generate_debrief(
    candidate_name: str,
    job_title: str,
    interviewer_name: str,
    jd_text: str,
    transcript_text: str,
    resume_text: str | None,
) -> DebriefResponse:

    prompt = get_debrief_prompt(
        candidate_name=candidate_name,
        job_title=job_title,
        interviewer_name=interviewer_name,
        jd_text=jd_text,
        transcript_text=transcript_text,
        resume_text=resume_text,
    )

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        temperature=0.2,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an expert recruitment analyst. "
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
        data = json.loads(raw)

    except json.JSONDecodeError as e:
        logger.error(
            f"Debrief JSON parse failed: {e}\nRaw output:\n{raw}"
        )
        raise ValueError(
            "AI returned malformed JSON. Please try again."
        )

    # ── JD Match — now has 3 fields ──────────────────────────────────────────
    jd_match = JDMatchAnalysis(
        match_percentage=data["jd_match"]["match_percentage"],
        matched_requirements=data["jd_match"]["matched_requirements"],
        partial_matches=data["jd_match"].get("partial_matches", []),
        missing_requirements=data["jd_match"].get("missing_requirements", []),
    )

    # ── Resume Consistency — now has 3 sub-fields ────────────────────────────
    resume_consistency = None
    if resume_text and data.get("resume_consistency"):
        rc = data["resume_consistency"]
        resume_consistency = ResumeConsistencyCheck(
            confirmed_skills=rc.get("confirmed_skills", []),
            interview_claims_missing_from_resume=rc.get(
                "interview_claims_missing_from_resume", []
            ),
            resume_skills_not_discussed=rc.get(
                "resume_skills_not_discussed", []
            ),
        )

    return DebriefResponse(
        candidate_name=candidate_name,
        job_title=job_title,
        interviewer_name=interviewer_name,
        executive_summary=data["executive_summary"],
        jd_match=jd_match,
        strengths=data["strengths"],
        concerns=data["concerns"],
        resume_consistency=resume_consistency,
        final_recommendation=data["final_recommendation"],
        recommendation_justification=data["recommendation_justification"],
        follow_up_questions=data["follow_up_questions"],
        resume_uploaded=resume_text is not None,
        tokens_used=tokens_used,
    )