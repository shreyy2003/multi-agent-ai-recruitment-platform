import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from dotenv import load_dotenv
load_dotenv()

from routes.intake_routes import router as intake_router
from routes.email_routes import router as email_router
from routes.scheduling_routes import router as scheduling_router
from routes.debrief_routes import router as debrief_router
from routes.submission_routes import router as submission_router
from routes.sourcing_routes import router as sourcing_router
from routes.pipeline_routes import router as pipeline_router
from database.db import init_db


# ── Logging ─────────────────────────────────────────

os.makedirs("logs", exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("logs/app.log"),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)


# ── Config ──────────────────────────────────────────

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173"
).split(",")


# ── Startup Validation ──────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):

    missing = [
        key for key in ["GROQ_API_KEY"]
        if not os.getenv(key)
    ]

    if missing:
        raise RuntimeError(
            f"Missing environment variables: {', '.join(missing)}"
        )

    # ── Initialize pipeline DB tables on startup ─────
    init_db()

    logger.info("Server started successfully")

    yield


# ── FastAPI App ─────────────────────────────────────

app = FastAPI(
    title="TJJ Recruitment Agents API",
    version="1.0.0",
    lifespan=lifespan
)


# ── Middleware ──────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Routes ──────────────────────────────────────────

app.include_router(intake_router)
app.include_router(email_router)
app.include_router(scheduling_router)
app.include_router(debrief_router)
app.include_router(submission_router)
app.include_router(sourcing_router)
app.include_router(pipeline_router)