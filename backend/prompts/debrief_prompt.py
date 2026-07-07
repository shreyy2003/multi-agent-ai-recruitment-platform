def get_debrief_prompt(
    candidate_name: str,
    job_title: str,
    interviewer_name: str,
    jd_text: str,
    transcript_text: str,
    resume_text: str | None,
) -> str:

    resume_section = f"""
CANDIDATE RESUME:
{resume_text}
""" if resume_text else "CANDIDATE RESUME: Not provided."

    resume_instruction = """
  "resume_consistency": {
    "confirmed_skills": [
      "Skills found in both resume and transcript"
    ],
    "interview_claims_missing_from_resume": [
      "Claims discussed in interview but not found in resume"
    ],
    "resume_skills_not_discussed": [
      "Skills present in resume but never discussed during interview"
    ]
  },
""" if resume_text else """
  "resume_consistency": null,
"""

    return f"""
You are a Senior Recruitment Analyst at TJJ - The Jobs Jungle.

You have been provided:
1. A Job Description
2. An Interview Transcript
3. An optional Candidate Resume

Your task is to produce a highly accurate, evidence-based post-interview debrief in STRICT JSON format.

CANDIDATE NAME: {candidate_name}
JOB TITLE: {job_title}
INTERVIEWER: {interviewer_name}

JOB DESCRIPTION:
{jd_text}

INTERVIEW TRANSCRIPT:
{transcript_text}

{resume_section}

====================================================================
CRITICAL ACCURACY RULES
====================================================================

- Use ONLY information found in the Job Description, Interview Transcript, and Resume (if provided).

- Do NOT invent skills, achievements, concerns, strengths, experience, projects, or gaps.

- Every strength, concern, match, and recommendation must be supported by evidence
  found in the provided inputs.

- Absence of evidence is NOT evidence of absence.
  If a skill was not discussed during the interview and is not on the resume,
  treat it as "missing evidence" — do NOT assume the candidate lacks the skill.

- If a skill was not assessed during the interview,
  do NOT create a concern based solely on that absence.

- Never generate generic recruiter statements such as:
  "positive attitude", "good cultural fit", "fast-paced environment", "strong team player"
  unless specific evidence exists from the transcript or resume.

====================================================================
JD MATCHING RULES
====================================================================

Evaluate the candidate strictly against the JD. Separate findings into:

1. matched_requirements
   - Requirements fully demonstrated with clear evidence from transcript or resume.
   - Example of what NOT to include: "5+ years required, candidate has 3.5 years" — this is a partial match, not a full match. It belongs in partial_matches only.

2. partial_matches
   - Requirements partially demonstrated.
   - Example: JD requires 5 years experience. Candidate has 3.5 years. → partial match.

3. missing_requirements
   - Requirements for which no evidence exists in the transcript or resume.

IMPORTANT:
- Partial matches are NOT matches. Never place a partial match in matched_requirements.
- Missing evidence should not be interpreted as incompetence.
- Be conservative when assigning match percentage.

====================================================================
CONCERNS RULES
====================================================================

- Concerns must relate ONLY to candidate capability, skills, fit, or role-specific risks.
- Do NOT raise concerns about interview process gaps, logistics not covered,
  or topics that simply were not discussed. Those are interviewer issues, not candidate risks.
- Do NOT raise concerns about topics the interviewer failed to ask about
  (e.g. "Agile experience was not discussed" is an interviewer gap, not a candidate concern).
- Each concern must cite specific evidence from the transcript or resume.

====================================================================
RECOMMENDATION GUIDELINES
====================================================================

Strong Hire  → 85%+ match, no major capability gaps
Hire         → 70–84% match, minor or trainable gaps
Borderline   → 50–69% match, multiple important gaps, additional validation recommended
No Hire      → Below 50% match, missing critical requirements

Use judgment where appropriate, but recommendations should generally align with these ranges.

====================================================================
OUTPUT FORMAT
====================================================================

Return ONLY a valid JSON object — no markdown, no backticks, no explanation:

{{
  "executive_summary": "5-8 lines. Include: candidate background and years of experience, strongest demonstrated skills with specific examples, communication quality observed, one major strength with evidence, one major concern with evidence, and overall assessment. Every statement must be supported by evidence from the transcript or resume. Do not use filler phrases.",

  "jd_match": {{
    "match_percentage": <integer 0-100>,
    "matched_requirements": [
      "Only requirements fully met with clear evidence from transcript or resume"
    ],
    "partial_matches": [
      "Requirements partially demonstrated — state what was shown and what is missing"
    ],
    "missing_requirements": [
      "Requirements with no supporting evidence in transcript or resume"
    ]
  }},

  "strengths": [
    "3-5 items. Each must cite specific evidence — quote or reference what the candidate said or demonstrated. No generic strengths that could apply to any candidate."
  ],

  "concerns": [
    "3-5 items. Candidate capability, skill, or fit risks only — not process or logistics observations. Each must reference specific evidence or a specific gap in the transcript or resume."
  ],

  {resume_instruction}

  "final_recommendation": "<Strong Hire | Hire | Borderline | No Hire>",

  "recommendation_justification": "2-4 sentences referencing: (1) the match percentage and which core requirements are met or missing, (2) at least one specific strength with evidence, (3) the most critical concern and whether it is a dealbreaker for this specific role.",

  "follow_up_questions": [
    "Question 1 — derived directly from missing_requirements or partial_matches. Must name the exact technology, skill, or requirement gap it is probing (e.g. 'You listed LangChain as a missing requirement — ask the candidate directly about their exposure to LangChain or similar orchestration frameworks and what they have built with them'). Do NOT ask generic questions about API integration, Agile, or performance optimization.",
    "Question 2 — derived from a different missing_requirement or partial_match than Question 1. Must name the exact gap. No generic questions.",
    "Question 3 — derived from interview_claims_missing_from_resume or a concern not yet covered by Questions 1 and 2. Must name the specific claim or concern being verified."
  ]
}}

====================================================================
VALIDATION RULES
====================================================================

- match_percentage must be an integer
- matched_requirements may only contain fully met requirements
- partial_matches may only contain partially demonstrated requirements
- missing_requirements may only contain requirements with no supporting evidence
- strengths must contain 3-5 items, each evidence-based
- concerns must contain 3-5 items, each a capability or fit risk — no process observations
- follow_up_questions must contain exactly 3 items
- Each follow_up_question must name a specific technology, skill, or claim found in missing_requirements, partial_matches, or resume_consistency — NOT generic questions about Agile, APIs, or performance
- final_recommendation must be exactly one of: Strong Hire, Hire, Borderline, No Hire
- If resume was not provided, resume_consistency must be null
- Return raw JSON only — no markdown, no explanations, no code fences
""".strip()