from pydantic import BaseModel, field_validator
from typing import List, Optional


class HiringContext(BaseModel):
    salary_range: Optional[str] = None
    location: Optional[str] = None
    work_mode: Optional[str] = None
    notice_period_preference: Optional[str] = None
    experience_range: Optional[str] = None
    experience_flexibility: Optional[str] = None
    urgency: Optional[str] = None
    client_flags: List[str] = []


class JDQualityAnalysis(BaseModel):
    overall_quality_score: int
    ambiguity_flags: List[str]
    contradiction_flags: List[str]
    unrealistic_expectations: List[str]
    missing_information: List[str]
    market_alignment: str
    hiring_risk_summary: str
    recommended_fixes: List[str]


class IntakeDocument(BaseModel):
    role_overview: str
    key_responsibilities: List[str]
    must_have_requirements: List[str]
    nice_to_have_requirements: List[str]
    ideal_candidate_profile: str
    key_challenges: List[str]
    team_structure: str
    growth_opportunities: List[str]


class PrescreenQuestion(BaseModel):
    question: str
    category: str
    listen_for: str


class ScoringGuide(BaseModel):
    score_5: str
    score_3: str
    score_1: str


class ScoreCriteria(BaseModel):
    name: str
    weight: int
    description: str
    scoring_guide: ScoringGuide


class Scorecard(BaseModel):
    criteria: List[ScoreCriteria]
    recommendation_threshold: str

    @field_validator("criteria")
    @classmethod
    def weights_must_sum_to_100(cls, criteria):
        total = sum(c.weight for c in criteria)
        if total != 100:
            raise ValueError(
                f"Scorecard weights sum to {total}, must equal exactly 100."
            )
        return criteria


class IntakeResponse(BaseModel):
    job_title: Optional[str] = "Untitled Role" 
    hiring_context: HiringContext
    jd_quality_analysis: JDQualityAnalysis
    intake_document: IntakeDocument
    auto_reject_criteria: List[str]
    prescreening_questions: List[PrescreenQuestion]
    scorecard: Scorecard
    tokens_used: int

    @field_validator("auto_reject_criteria")
    @classmethod
    def must_have_disqualifiers(cls, v):
        if len(v) < 3:
            raise ValueError(
                f"auto_reject_criteria has {len(v)} item(s), minimum is 3."
            )
        return v

    @field_validator("prescreening_questions")
    @classmethod
    def must_cover_logistics(cls, questions):
        categories = [q.category.strip().lower() for q in questions]
        if "logistics" not in categories:
            raise ValueError(
                "prescreening_questions must include at least one Logistics question."
            )
        return questions