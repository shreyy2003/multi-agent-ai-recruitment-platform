from pydantic import BaseModel
from typing import Optional
from enum import Enum

class InputModeEnum(str, Enum):
    structured = "structured"   # Stage 1 PDF output
    raw        = "raw"          # Raw JD text / PDF / DOCX


class JDParams(BaseModel):
    job_title:           str
    seniority:           str
    must_have:           list[str]
    nice_to_have:        list[str]
    experience_years:    str
    location:            str
    domain:              str
    salary_range:        Optional[str] = None
    notice_period_days:  Optional[int] = None
    auto_reject_signals: list[str]     = []
    title_variants:      list[str]     = []


class SoftFlag(BaseModel):
    field:   str
    message: str


class CandidateProfile(BaseModel):
    id:                  str
    name:                str
    title:               str
    company:             Optional[str] = "Not specified"
    location:            Optional[str] = "Not specified"
    linkedin_url:        str
    skills:              list[str]
    experience:          Optional[str]  = None
    match_score:         int
    match_reason:        str
    soft_flags:          list[SoftFlag] = []
    availability_signal: Optional[str]  = "none"
    availability_note:   Optional[str]  = None
    career_trajectory:   Optional[str]  = "unclear"
    startup_fit:         Optional[bool] = False
    email:               Optional[str]  = None
    phone:               Optional[str]  = None
    contact_unlocked:    bool           = False
    blend_source:        str            = "quality"

class SourcingResponse(BaseModel):
    jd_params:       JDParams
    candidates:      list[CandidateProfile]
    total_found:     int
    tokens_used:     int
    input_mode:      str

class UnlockRequest(BaseModel):
    candidate_ids: list[str]
    candidates:    list[CandidateProfile]