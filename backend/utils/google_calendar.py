"""
Google Calendar Utility — Stage 4
Fetches free slots from Google Calendar using OAuth2 credentials.

Setup steps (one-time):
1. Go to https://console.cloud.google.com
2. Create a project → Enable "Google Calendar API"
3. Create OAuth 2.0 credentials (Desktop App)
4. Download credentials.json and place in /backend root
5. pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client

On first run, a browser window opens for the recruiter to log in.
After that, token.json is saved and reused automatically.
"""

import os
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

SCOPES = [
    "https://www.googleapis.com/auth/calendar.readonly"
]

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

CREDENTIALS_PATH = os.path.join(
    BASE_DIR,
    "..",
    "credentials.json"
)

TOKEN_PATH = os.path.join(
    BASE_DIR,
    "..",
    "token_google.json"
)

# Recruiter timezone
LOCAL_TZ = ZoneInfo("Asia/Kolkata")

# Business hours
WORK_START_HOUR = 10  # 10 AM
WORK_END_HOUR = 21    # 9 PM

# Minimum interview notice
MIN_NOTICE_HOURS = 24


def get_google_credentials() -> Credentials:
    creds = None

    if os.path.exists(TOKEN_PATH):
        creds = Credentials.from_authorized_user_file(
            TOKEN_PATH,
            SCOPES
        )

    if not creds or not creds.valid:

        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())

        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                CREDENTIALS_PATH,
                SCOPES
            )

            creds = flow.run_local_server(port=0)

        with open(TOKEN_PATH, "w") as token:
            token.write(creds.to_json())

    return creds


def is_google_connected() -> bool:
    if not os.path.exists(TOKEN_PATH):
        return False

    try:
        creds = Credentials.from_authorized_user_file(
            TOKEN_PATH,
            SCOPES
        )

        return (
            creds.valid
            or (
                creds.expired
                and creds.refresh_token is not None
            )
        )

    except Exception:
        return False


def get_google_free_slots(
    duration_minutes: int,
    days_ahead: int = 7
) -> list[dict]:

    creds = get_google_credentials()

    service = build(
        "calendar",
        "v3",
        credentials=creds
    )

    # Local recruiter time
    now_local = datetime.now(LOCAL_TZ)

    # Minimum notice period
    search_start_local = (
        now_local + timedelta(hours=MIN_NOTICE_HOURS)
    )

    search_end_local = (
        now_local + timedelta(days=days_ahead)
    )

    # Google FreeBusy expects UTC
    search_start_utc = search_start_local.astimezone(
        timezone.utc
    )

    search_end_utc = search_end_local.astimezone(
        timezone.utc
    )

    body = {
        "timeMin": search_start_utc.isoformat(),
        "timeMax": search_end_utc.isoformat(),
        "items": [{"id": "primary"}],
    }

    freebusy_result = (
        service.freebusy()
        .query(body=body)
        .execute()
    )

    busy_periods = (
        freebusy_result["calendars"]["primary"]["busy"]
    )

    busy_ranges = []

    for period in busy_periods:

        busy_start = datetime.fromisoformat(
            period["start"]
        ).astimezone(LOCAL_TZ)

        busy_end = datetime.fromisoformat(
            period["end"]
        ).astimezone(LOCAL_TZ)

        busy_ranges.append(
            (busy_start, busy_end)
        )

    slots = []
    used_days = set()

    current = search_start_local.replace(
        minute=0,
        second=0,
        microsecond=0
    )

    while (
        current < search_end_local
        and len(slots) < 3
    ):

        # Skip weekends
        if current.weekday() >= 5:
            current += timedelta(days=1)
            current = current.replace(
                hour=WORK_START_HOUR,
                minute=0
            )
            continue

        day_key = current.date()

        # One slot per day
        if day_key in used_days:
            current += timedelta(hours=1)
            continue

        # Before workday starts
        if current.hour < WORK_START_HOUR:
            current = current.replace(
                hour=WORK_START_HOUR,
                minute=0
            )
            continue

        # After workday ends
        if current.hour >= WORK_END_HOUR:
            current = (
                current + timedelta(days=1)
            ).replace(
                hour=WORK_START_HOUR,
                minute=0,
                second=0,
                microsecond=0
            )
            continue

        slot_end = current + timedelta(
            minutes=duration_minutes
        )

        # Slot must finish before end of workday
        if (
            slot_end.hour > WORK_END_HOUR
            or (
                slot_end.hour == WORK_END_HOUR
                and slot_end.minute > 0
            )
        ):
            current += timedelta(hours=1)
            continue

        conflict = any(
            not (
                slot_end <= busy_start
                or current >= busy_end
            )
            for busy_start, busy_end in busy_ranges
        )

        if not conflict:

            slots.append(
                {
                    "date": current.strftime(
                        "%A, %d %B %Y"
                    ),
                    "day": current.strftime(
                        "%A"
                    ),
                    "start_time": current.strftime(
                        "%I:%M %p"
                    ).lstrip("0"),
                    "end_time": slot_end.strftime(
                        "%I:%M %p"
                    ).lstrip("0"),
                    "iso_start": current.isoformat(),
                    "iso_end": slot_end.isoformat(),
                }
            )

            used_days.add(day_key)

        current += timedelta(hours=1)

    return slots


def disconnect_google():

    if os.path.exists(TOKEN_PATH):
        os.remove(TOKEN_PATH)