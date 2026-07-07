from pydantic import BaseModel, EmailStr
from typing import Optional
from enum import Enum


class DomainEnum(str, Enum):
    engineering = "engineering"
    product_management = "product_management"
    data_ai = "data_ai"
    quality_assurance = "quality_assurance"
    devops_cloud = "devops_cloud"
    business_gtm = "business_gtm"


class SubmissionDraftRequest(BaseModel):
    candidate_name: str
    role: str
    client_name: str
    client_contact_email: EmailStr
    domain: DomainEnum
    additional_notes: Optional[str] = None


class SubmissionDraftResponse(BaseModel):
    subject: str
    body: str
    candidate_name: str
    role: str
    client_name: str
    client_contact_email: str
    domain: str
    cv_filename: str
    debrief_filename: Optional[str] = None


class ApproveAndSendRequest(BaseModel):
    subject: str
    body: str
    client_contact_email: EmailStr
    candidate_name: str
    role: str
    client_name: str