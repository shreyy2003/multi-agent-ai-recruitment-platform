from pydantic import BaseModel
from typing import List


class TimeSlot(BaseModel):
    date: str          # e.g. "Monday, 2 June 2025"
    day: str           # e.g. "Monday"
    start_time: str    # e.g. "10:00 AM"
    end_time: str      # e.g. "10:45 AM"
    iso_start: str     # e.g. "2025-06-02T10:00:00"
    iso_end: str       # e.g. "2025-06-02T10:45:00"


class SchedulingResponse(BaseModel):
    candidate_name: str
    candidate_email: str
    job_title: str
    duration_minutes: int
    slots: List[TimeSlot]
    drafted_email: str
    recruiter_name: str
    calendar_provider: str
    tokens_used: int