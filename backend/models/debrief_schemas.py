from pydantic import BaseModel
from typing import List, Optional


class JDMatchAnalysis(BaseModel):
    match_percentage: int
    matched_requirements: List[str]
    partial_matches: List[str]
    missing_requirements: List[str]


class ResumeConsistencyCheck(BaseModel):
    confirmed_skills: List[str]
    interview_claims_missing_from_resume: List[str]
    resume_skills_not_discussed: List[str]


class DebriefResponse(BaseModel):
    candidate_name: str
    job_title: str
    interviewer_name: str

    executive_summary: str
    jd_match: JDMatchAnalysis
    strengths: List[str]
    concerns: List[str]
    resume_consistency: Optional[ResumeConsistencyCheck]
    final_recommendation: str        # Strong Hire / Hire / Borderline / No Hire
    recommendation_justification: str
    follow_up_questions: List[str]

    resume_uploaded: bool
    tokens_used: int