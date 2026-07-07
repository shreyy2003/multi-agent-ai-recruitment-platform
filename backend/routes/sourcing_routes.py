import logging
import json

from typing import Optional

from fastapi import (
    APIRouter,
    UploadFile,
    File,
    Form,
    HTTPException,
)
from fastapi.responses import StreamingResponse

from agents.sourcing_agent import (
    source_candidates,
    source_candidates_stream,
    unlock_candidate_contacts,
)

from models.sourcing_schemas import (
    SourcingResponse,
    CandidateProfile,
    UnlockRequest,
)

from utils.file_parser import (
    extract_text_from_pdf_bytes,
    extract_text_from_docx_bytes,
)


# ──────────────────────────────────────────────────────────────────────────────
# SETUP
# ──────────────────────────────────────────────────────────────────────────────

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/sourcing",
    tags=["Sourcing Agent"],
)


# ──────────────────────────────────────────────────────────────────────────────
# HELPERS
# ──────────────────────────────────────────────────────────────────────────────

def _parse_file(file_bytes: bytes, filename: str) -> str:
    """
    Route uploaded file to correct parser.
    """

    fname = filename.lower()

    if fname.endswith(".pdf"):
        return extract_text_from_pdf_bytes(file_bytes)

    if fname.endswith(".docx"):
        return extract_text_from_docx_bytes(file_bytes)

    raise HTTPException(
        status_code=400,
        detail=f"Unsupported file type: {filename}. Please upload PDF or DOCX."
    )


# ──────────────────────────────────────────────────────────────────────────────
# ROUTE 1 — STANDARD SOURCE
# ──────────────────────────────────────────────────────────────────────────────

@router.post("/source", response_model=SourcingResponse)
async def source(
    jd_text: Optional[str] = Form(None),
    jd_file: Optional[UploadFile] = File(None),
):
    """
    Standard (non-streaming) sourcing endpoint.
    Returns final sourcing result only.
    """

    if not jd_text and not jd_file:
        raise HTTPException(
            status_code=400,
            detail="Provide either JD text or upload a JD file."
        )

    if jd_file and jd_file.filename:
        try:
            file_bytes = await jd_file.read()
            jd_text = _parse_file(file_bytes, jd_file.filename)

            logger.info(
                f"Parsed file {jd_file.filename} "
                f"({len(jd_text)} chars)"
            )

        except HTTPException:
            raise

        except Exception as e:
            raise HTTPException(
                status_code=422,
                detail=f"Failed to read file: {str(e)}"
            )

    if not jd_text or not jd_text.strip():
        raise HTTPException(
            status_code=400,
            detail="JD text is empty. Please provide a valid job description."
        )

    try:

        result = await source_candidates(jd_text.strip())

        logger.info(
            f"Sourcing complete | "
            f"Candidates={result.total_found} | "
            f"Tokens={result.tokens_used}"
        )

        return result

    except ValueError as e:
        raise HTTPException(
            status_code=422,
            detail=str(e)
        )

    except Exception as e:
        logger.error(
            f"Sourcing failed: {e}",
            exc_info=True,
        )

        raise HTTPException(
            status_code=500,
            detail="Sourcing failed. Please try again."
        )


# ──────────────────────────────────────────────────────────────────────────────
# ROUTE 2 — STREAMING SOURCE
# ──────────────────────────────────────────────────────────────────────────────

@router.post("/source/stream")
async def source_stream(
    jd_text: Optional[str] = Form(None),
    jd_file: Optional[UploadFile] = File(None),
):
    """
    Streaming sourcing endpoint.

    Emits SSE events:

    progress:
    {
      "type": "progress",
      "step": 1,
      "message": "Reading job description"
    }

    complete:
    {
      "type": "complete",
      "message": "Sourcing complete",
      "data": {...}
    }

    error:
    {
      "type": "error",
      "message": "..."
    }
    """

    if not jd_text and not jd_file:
        raise HTTPException(
            status_code=400,
            detail="Provide either JD text or upload a JD file."
        )

    if jd_file and jd_file.filename:
        try:
            file_bytes = await jd_file.read()
            jd_text = _parse_file(file_bytes, jd_file.filename)

            logger.info(
                f"Parsed file {jd_file.filename} "
                f"({len(jd_text)} chars)"
            )

        except HTTPException:
            raise

        except Exception as e:
            raise HTTPException(
                status_code=422,
                detail=f"Failed to read file: {str(e)}"
            )

    if not jd_text or not jd_text.strip():
        raise HTTPException(
            status_code=400,
            detail="JD text is empty. Please provide a valid job description."
        )

    async def event_stream():

        try:

            async for event in source_candidates_stream(
                jd_text.strip()
            ):
                yield f"data: {json.dumps(event)}\n\n"

        except Exception as e:

            logger.error(
                f"Streaming sourcing failed: {e}",
                exc_info=True,
            )

            yield (
                f"data: "
                f"{json.dumps({'type': 'error', 'message': str(e)})}"
                f"\n\n"
            )

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ──────────────────────────────────────────────────────────────────────────────
# ROUTE 3 — UNLOCK CONTACTS
# ──────────────────────────────────────────────────────────────────────────────

@router.post("/unlock", response_model=list[CandidateProfile])
async def unlock_contacts(request: UnlockRequest):
    """
    Unlock selected candidate contact details.

    Frontend sends:
    - candidate_ids
    - candidates

    Returns updated CandidateProfile list.
    """

    if not request.candidate_ids:
        raise HTTPException(
            status_code=400,
            detail="No candidate IDs provided."
        )

    try:

        logger.info(
            f"Unlock requested for "
            f"{len(request.candidate_ids)} candidates"
        )

        unlocked_candidates = await unlock_candidate_contacts(
            request.candidate_ids,
            request.candidates,
        )

        return unlocked_candidates

    except Exception as e:

        logger.error(
            f"Unlock failed: {e}",
            exc_info=True,
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to unlock contacts. Please try again."
        )