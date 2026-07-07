"""
Outlook Calendar Utility — Stage 4
Fetches free slots from Outlook/Microsoft 365 Calendar using Microsoft Graph API.

Setup steps (one-time):
1. Go to https://portal.azure.com
2. Register a new app under "App registrations"
3. Add permission: Calendars.Read (delegated)
4. Note your CLIENT_ID and TENANT_ID
5. Add to .env:
   OUTLOOK_CLIENT_ID=your_client_id
   OUTLOOK_TENANT_ID=your_tenant_id
6. pip install msal requests

On first run, a device code flow is triggered — recruiter logs in via browser.
Token is cached locally and reused automatically.
"""

import os
from datetime import datetime, timedelta

import msal
import requests
from zoneinfo import ZoneInfo

# -----------------------------------------------------------------------------
# CONFIG
# -----------------------------------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TOKEN_CACHE_PATH = os.path.join(BASE_DIR, "..", "token_outlook.json")

CLIENT_ID = os.getenv("OUTLOOK_CLIENT_ID", "")
TENANT_ID = os.getenv("OUTLOOK_TENANT_ID", "common")

AUTHORITY = f"https://login.microsoftonline.com/{TENANT_ID}"

SCOPES = ["Calendars.Read"]

GRAPH_URL = "https://graph.microsoft.com/v1.0"

LOCAL_TZ = ZoneInfo("Asia/Kolkata")

WORK_START_HOUR = 10  # 10 AM IST
WORK_END_HOUR = 21    # 9 PM IST


# -----------------------------------------------------------------------------
# MSAL APP
# -----------------------------------------------------------------------------

def _build_msal_app():
    cache = msal.SerializableTokenCache()

    if os.path.exists(TOKEN_CACHE_PATH):
        with open(TOKEN_CACHE_PATH, "r") as f:
            cache.deserialize(f.read())

    app = msal.PublicClientApplication(
        CLIENT_ID,
        authority=AUTHORITY,
        token_cache=cache
    )

    return app, cache


def _save_cache(cache):
    if cache.has_state_changed:
        with open(TOKEN_CACHE_PATH, "w") as f:
            f.write(cache.serialize())


# -----------------------------------------------------------------------------
# AUTH
# -----------------------------------------------------------------------------

def get_outlook_access_token() -> str:
    """
    Returns valid Outlook access token.
    Uses cached token whenever possible.
    Falls back to device code flow on first login.
    """

    app, cache = _build_msal_app()

    accounts = app.get_accounts()

    if accounts:
        result = app.acquire_token_silent(
            SCOPES,
            account=accounts[0]
        )

        if result and "access_token" in result:
            _save_cache(cache)
            return result["access_token"]

    # First-time login
    flow = app.initiate_device_flow(scopes=SCOPES)

    if "user_code" not in flow:
        raise Exception("Failed to initialize Outlook device flow.")

    print("\n" + "=" * 80)
    print(flow["message"])
    print("=" * 80 + "\n")

    result = app.acquire_token_by_device_flow(flow)

    _save_cache(cache)

    if "access_token" not in result:
        raise Exception(
            f"Outlook authentication failed: "
            f"{result.get('error_description')}"
        )

    return result["access_token"]


def is_outlook_connected() -> bool:
    """
    Returns True if Outlook account is already connected.
    """

    if not os.path.exists(TOKEN_CACHE_PATH):
        return False

    try:
        app, _ = _build_msal_app()
        return len(app.get_accounts()) > 0
    except Exception:
        return False


def disconnect_outlook():
    """
    Removes cached Outlook authentication.
    """

    if os.path.exists(TOKEN_CACHE_PATH):
        os.remove(TOKEN_CACHE_PATH)


# -----------------------------------------------------------------------------
# CALENDAR
# -----------------------------------------------------------------------------

def get_outlook_free_slots(
    duration_minutes: int,
    days_ahead: int = 7
) -> list[dict]:
    """
    Returns up to 3 available interview slots.

    Rules:
    - 10 AM – 9 PM IST
    - Skip weekends
    - One slot per day
    - Future slots only
    """

    token = get_outlook_access_token()

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Prefer": 'outlook.timezone="India Standard Time"',
    }

    now = datetime.now(LOCAL_TZ)

    end_range = now + timedelta(days=days_ahead)

    params = {
        "startDateTime": now.isoformat(),
        "endDateTime": end_range.isoformat(),
        "$select": "start,end",
        "$top": 200,
        "$orderby": "start/dateTime",
    }

    response = requests.get(
        f"{GRAPH_URL}/me/calendarView",
        headers=headers,
        params=params,
        timeout=30,
    )

    response.raise_for_status()

    events = response.json().get("value", [])

    busy_ranges = []

    for event in events:
        start = datetime.fromisoformat(
            event["start"]["dateTime"]
        )

        end = datetime.fromisoformat(
            event["end"]["dateTime"]
        )

        if start.tzinfo is None:
            start = start.replace(tzinfo=LOCAL_TZ)

        if end.tzinfo is None:
            end = end.replace(tzinfo=LOCAL_TZ)

        start = start.astimezone(LOCAL_TZ)
        end = end.astimezone(LOCAL_TZ)

        busy_ranges.append((start, end))

    slots = []
    used_days = set()

    current = (
        now.replace(
            minute=0,
            second=0,
            microsecond=0
        )
        + timedelta(hours=1)
    )

    while current < end_range and len(slots) < 3:

        # Skip weekends
        if current.weekday() >= 5:
            current += timedelta(days=1)
            current = current.replace(
                hour=WORK_START_HOUR,
                minute=0
            )
            continue

        # Working hours
        if current.hour < WORK_START_HOUR:
            current = current.replace(
                hour=WORK_START_HOUR,
                minute=0
            )

        if current.hour >= WORK_END_HOUR:
            current += timedelta(days=1)
            current = current.replace(
                hour=WORK_START_HOUR,
                minute=0
            )
            continue

        day_key = current.date()

        # Only one slot per day
        if day_key in used_days:
            current += timedelta(hours=1)
            continue

        slot_end = current + timedelta(minutes=duration_minutes)

        # Must fit inside workday
        if slot_end.hour > WORK_END_HOUR:
            current += timedelta(hours=1)
            continue

        if (
            slot_end.hour == WORK_END_HOUR
            and slot_end.minute > 0
        ):
            current += timedelta(hours=1)
            continue

        # Must be future
        if current <= now:
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
                    "date": current.strftime("%A, %d %B %Y"),
                    "day": current.strftime("%A"),
                    "start_time": current.strftime("%I:%M %p").lstrip("0"),
                    "end_time": slot_end.strftime("%I:%M %p").lstrip("0"),
                    "iso_start": current.isoformat(),
                    "iso_end": slot_end.isoformat(),
                }
            )

            used_days.add(day_key)

        current += timedelta(hours=1)

    return slots