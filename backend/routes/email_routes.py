from fastapi import (
    APIRouter,
    UploadFile,
    File,
    Form,
    HTTPException
)

from models.email_schemas import OutreachResponse

from agents.email_drafter import (
    draft_outreach_messages
)

from utils.file_parser import (
    extract_text_from_pdf_bytes,
    extract_text_from_docx_bytes
)

router = APIRouter(
    prefix="/agent",
    tags=["Outreach Agent"]
)


@router.post(
    "/outreach",
    response_model=OutreachResponse
)
async def outreach_agent(

    job_brief: str = Form(""),

    jd_file: UploadFile | None = File(None),

    candidate_name: str = Form(...),
    candidate_current_title: str = Form(""),
    candidate_company: str = Form(""),

    platform: str = Form("LinkedIn InMail"),
    tone: str = Form("Professional"),

    recruiter_name: str = Form(...),
    recruiter_company: str = Form(
        "TJJ - The Jobs Jungle"
    ),

    regenerate: bool = Form(False),

    previous_output: str = Form(""),
):

    extracted_jd = job_brief.strip()

    if jd_file:

        file_bytes = await jd_file.read()

        filename = (
            jd_file.filename.lower()
            if jd_file.filename
            else ""
        )

        try:

            if filename.endswith(".pdf"):
                extracted_jd = (
                    extract_text_from_pdf_bytes(
                        file_bytes
                    )
                )

            elif filename.endswith(".docx"):
                extracted_jd = (
                    extract_text_from_docx_bytes(
                        file_bytes
                    )
                )

            else:
                raise HTTPException(
                    status_code=400,
                    detail="Only PDF and DOCX supported."
                )

        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=str(e)
            )

    if not extracted_jd:
        raise HTTPException(
            status_code=400,
            detail=(
                "Provide either a Job Brief "
                "or upload a JD file."
            )
        )

    result = draft_outreach_messages(
        job_brief=extracted_jd,
        candidate_name=candidate_name,
        candidate_current_title=candidate_current_title,
        candidate_company=candidate_company,
        platform=platform,
        tone=tone,
        recruiter_name=recruiter_name,
        recruiter_company=recruiter_company,
        regenerate=regenerate,
        previous_output=previous_output,
    )

    return result