from pydantic import BaseModel

class OutreachResponse(BaseModel):
    first_touch: str
    follow_up: str
    key_points: str
    full_output: str
    platform: str
    candidate_name: str
    tokens_used: int