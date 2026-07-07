from fastapi import APIRouter, Form, HTTPException

from models.scheduling_schemas import SchedulingResponse
from agents.scheduling_agent import draft_scheduling_email
from utils.google_calendar import (
    get_google_free_slots,
    is_google_connected,
    disconnect_google,
)
from utils.outlook_calendar import (
    get_outlook_free_slots,
    is_outlook_connected,
    disconnect_outlook,
)

router = APIRouter(
    prefix="/agent",
    tags=["Scheduling Agent"]
)


# ── Status endpoint ────────────────────────────────────────────────────────────

@router.get("/scheduling/status")
async def calendar_status():
    """Returns which calendar providers are currently connected."""
    return {
        "google": is_google_connected(),
        "outlook": is_outlook_connected(),
    }


# ── Connect endpoints ──────────────────────────────────────────────────────────

@router.post("/scheduling/connect/google")
async def connect_google():
    try:
        from utils.google_calendar import get_google_credentials
        get_google_credentials()
        return {"connected": True, "provider": "google"}

    except Exception as e:
        import traceback
        traceback.print_exc()   # prints full error in terminal

        raise HTTPException(
            status_code=400,
            detail=f"{type(e).__name__}: {str(e)}"
        )


@router.post("/scheduling/connect/outlook")
async def connect_outlook():
    """
    Triggers Outlook device code flow.
    Recruiter sees a code in the backend console to complete login.
    """
    try:
        from utils.outlook_calendar import get_outlook_access_token
        get_outlook_access_token()
        return {"connected": True, "provider": "outlook"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── Disconnect endpoints ───────────────────────────────────────────────────────

@router.post("/scheduling/disconnect/google")
async def disconnect_google_route():
    disconnect_google()
    return {"disconnected": True, "provider": "google"}


@router.post("/scheduling/disconnect/outlook")
async def disconnect_outlook_route():
    disconnect_outlook()
    return {"disconnected": True, "provider": "outlook"}


# ── Main scheduling endpoint ───────────────────────────────────────────────────

@router.post("/scheduling", response_model=SchedulingResponse)
async def scheduling_agent(
    candidate_name: str = Form(...),
    candidate_email: str = Form(...),
    job_title: str = Form(...),
    duration_minutes: int = Form(30),
    recruiter_name: str = Form(...),
    recruiter_company: str = Form("TJJ - The Jobs Jungle"),
    calendar_provider: str = Form(...),   # "google" or "outlook"
):
    # Validate calendar provider
    if calendar_provider not in ("google", "outlook"):
        raise HTTPException(
            status_code=400,
            detail="calendar_provider must be 'google' or 'outlook'."
        )

    # Validate duration
    if duration_minutes not in (30, 45):
        raise HTTPException(
            status_code=400,
            detail="duration_minutes must be 30 or 45."
        )

    # Fetch free slots from the chosen calendar
    try:
        if calendar_provider == "google":
            if not is_google_connected():
                raise HTTPException(
                    status_code=401,
                    detail="Google Calendar not connected. Please connect first."
                )
            slots = get_google_free_slots(duration_minutes)

        else:
            if not is_outlook_connected():
                raise HTTPException(
                    status_code=401,
                    detail="Outlook Calendar not connected. Please connect first."
                )
            slots = get_outlook_free_slots(duration_minutes)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch calendar slots: {str(e)}"
        )

    if not slots:
        raise HTTPException(
            status_code=404,
            detail="No free slots found in the next 7 business days."
        )

    # Draft the scheduling email via Claude
    result = draft_scheduling_email(
        candidate_name=candidate_name,
        candidate_email=candidate_email,
        job_title=job_title,
        duration_minutes=duration_minutes,
        recruiter_name=recruiter_name,
        recruiter_company=recruiter_company,
        slots=slots,
        calendar_provider=calendar_provider,
    )

    return result