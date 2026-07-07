from pydantic import BaseModel
from typing import Optional, Any


# ──────────────────────────────────────────────────────────────────────────────
# ENUMS (as plain strings — kept simple for SQLite TEXT columns)
# ──────────────────────────────────────────────────────────────────────────────

JOB_STATUSES = ["open", "closed"]

CANDIDATE_STATUSES = [
    "sourced",
    "contacted",
    "scheduled",
    "interviewed",
    "submitted",
]


# ──────────────────────────────────────────────────────────────────────────────
# JOB SCHEMAS
# ──────────────────────────────────────────────────────────────────────────────

class JobCreate(BaseModel):
    job_title:     str
    structured_jd: dict      # Stage 1 full output, stored as JSON
    domain:        Optional[str] = None


class JobRecord(BaseModel):
    job_id:        str
    job_title:     str
    structured_jd: dict
    domain:        Optional[str] = None
    status:        str
    created_at:    str
    updated_at:    str
    candidate_count: Optional[int] = 0


class JobSummary(BaseModel):
    """Lightweight version for dropdowns — avoids sending full JD JSON."""
    job_id:        str
    job_title:     str
    domain:        Optional[str] = None
    status:        str
    candidate_count: int = 0
    created_at:    str


# ──────────────────────────────────────────────────────────────────────────────
# CANDIDATE SCHEMAS
# ──────────────────────────────────────────────────────────────────────────────

class CandidateCreate(BaseModel):
    job_id:        str
    name:          str
    title:         Optional[str] = None
    company:       Optional[str] = None
    email:         Optional[str] = None
    phone:         Optional[str] = None
    linkedin_url:  Optional[str] = None
    cv_file_ref:   Optional[str] = None


class CandidateUpdate(BaseModel):
    """For partial updates — e.g. Stage 5 writing debrief, status changes."""
    name:           Optional[str] = None
    title:          Optional[str] = None
    company:        Optional[str] = None
    email:          Optional[str] = None
    phone:          Optional[str] = None
    linkedin_url:   Optional[str] = None
    cv_file_ref:    Optional[str] = None
    stage5_debrief: Optional[dict] = None
    status:         Optional[str] = None


class CandidateRecord(BaseModel):
    candidate_id:   str
    job_id:         str
    name:           str
    title:          Optional[str] = None
    company:        Optional[str] = None
    email:          Optional[str] = None
    phone:          Optional[str] = None
    linkedin_url:   Optional[str] = None
    cv_file_ref:    Optional[str] = None
    stage5_debrief: Optional[dict] = None
    status:         str
    created_at:     str
    updated_at:     str


class CandidateSummary(BaseModel):
    """Lightweight version for dropdowns."""
    candidate_id: str
    job_id:       str
    name:         str
    title:        Optional[str] = None
    company:      Optional[str] = None
    linkedin_url: Optional[str] = None
    status:       str