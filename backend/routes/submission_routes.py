import logging
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from typing import Optional

from agents.submission_agent import generate_submission_email
from models.submission_schemas import DomainEnum
from utils.file_parser import extract_text_from_pdf_bytes, extract_text_from_docx_bytes

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/submission", tags=["Submission Agent"])


def parse_uploaded_file(file_bytes: bytes, filename: str) -> str:
    """Route file to correct parser based on extension."""
    fname = filename.lower()
    if fname.endswith(".pdf"):
        return extract_text_from_pdf_bytes(file_bytes)
    elif fname.endswith(".docx"):
        return extract_text_from_docx_bytes(file_bytes)
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {filename}. Please upload PDF or DOCX."
        )


@router.get("/templates")
async def get_templates():
    """Return list of available domain templates for frontend dropdown."""
    domains = [
        {"value": "engineering", "label": "Engineering"},
        {"value": "product_management", "label": "Product Management"},
        {"value": "data_ai", "label": "Data & AI"},
        {"value": "quality_assurance", "label": "Quality Assurance"},
        {"value": "devops_cloud", "label": "DevOps & Cloud"},
        {"value": "business_gtm", "label": "Business & GTM"},
    ]
    return {"domains": domains}


@router.post("/generate-draft")
async def generate_draft(
    candidate_name: str = Form(...),
    role: str = Form(...),
    client_name: str = Form(...),
    client_contact_email: str = Form(...),
    domain: DomainEnum = Form(...),
    additional_notes: Optional[str] = Form(None),
    cv_file: UploadFile = File(...),
    debrief_file: Optional[UploadFile] = File(None),
):
    """
    Core endpoint — reads CV + optional debrief,
    loads domain template, calls Claude to generate filled email draft.
    Also used for regeneration (same endpoint, called again).
    """
    try:
        # Parse CV
        cv_bytes = await cv_file.read()
        cv_content = parse_uploaded_file(cv_bytes, cv_file.filename)

        # Parse debrief if provided
        debrief_content = ""
        debrief_filename = None
        if debrief_file and debrief_file.filename:
            debrief_bytes = await debrief_file.read()
            debrief_content = parse_uploaded_file(debrief_bytes, debrief_file.filename)
            debrief_filename = debrief_file.filename

        # Generate email via agent
        result = generate_submission_email(
            candidate_name=candidate_name,
            role=role,
            client_name=client_name,
            client_contact=client_contact_email,
            domain=domain.value,
            cv_content=cv_content,
            debrief_content=debrief_content,
            additional_notes=additional_notes or "",
        )

        return {
            "subject": result["subject"],
            "body": result["body"],
            "candidate_name": candidate_name,
            "role": role,
            "client_name": client_name,
            "client_contact_email": client_contact_email,
            "domain": domain.value,
            "cv_filename": cv_file.filename,
            "debrief_filename": debrief_filename,
        }

    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Draft generation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate draft. Please try again.")


@router.post("/approve-send")
async def approve_and_send(
    subject: str = Form(...),
    body: str = Form(...),
    client_contact_email: str = Form(...),
    candidate_name: str = Form(...),
    role: str = Form(...),
    client_name: str = Form(...),
    cv_file: UploadFile = File(...),
    debrief_file: Optional[UploadFile] = File(None),
):
    """
    Recruiter approves the draft — sends email with CV (and optional debrief) attached.
    Uses SMTP config from environment variables.
    """
    import smtplib
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText
    from email.mime.base import MIMEBase
    from email import encoders
    import os

    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", 587))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    sender_name = os.getenv("SENDER_NAME", "The Jobs Jungle")

    if not smtp_user or not smtp_pass:
        raise HTTPException(
            status_code=500,
            detail="SMTP credentials not configured. Set SMTP_USER and SMTP_PASS in environment."
        )

    try:
        msg = MIMEMultipart()
        msg["From"] = f"{sender_name} <{smtp_user}>"
        msg["To"] = client_contact_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))

        # Attach CV
        cv_bytes = await cv_file.read()
        part = MIMEBase("application", "octet-stream")
        part.set_payload(cv_bytes)
        encoders.encode_base64(part)
        part.add_header("Content-Disposition", f'attachment; filename="{cv_file.filename}"')
        msg.attach(part)

        # Attach debrief if provided
        if debrief_file and debrief_file.filename:
            debrief_bytes = await debrief_file.read()
            debrief_part = MIMEBase("application", "octet-stream")
            debrief_part.set_payload(debrief_bytes)
            encoders.encode_base64(debrief_part)
            debrief_part.add_header(
                "Content-Disposition",
                f'attachment; filename="{debrief_file.filename}"'
            )
            msg.attach(debrief_part)

        # Send
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_user, client_contact_email, msg.as_string())

        logger.info(f"Submission email sent to {client_contact_email} for {candidate_name} — {role}")

        return {
            "success": True,
            "message": f"Submission email sent to {client_contact_email}",
            "candidate_name": candidate_name,
            "role": role,
            "client_name": client_name,
        }

    except smtplib.SMTPException as e:
        logger.error(f"SMTP error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")
    except Exception as e:
        logger.error(f"Approve and send failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to send email. Please try again.")