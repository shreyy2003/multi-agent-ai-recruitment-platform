import json
import uuid
import os
import logging

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional

from database.db import get_db
from models.pipeline_schemas import (
    JobCreate,
    JobRecord,
    JobSummary,
    CandidateCreate,
    CandidateUpdate,
    CandidateRecord,
    CandidateSummary,
)


# ──────────────────────────────────────────────────────────────────────────────
# SETUP
# ──────────────────────────────────────────────────────────────────────────────

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/pipeline", tags=["Pipeline"])


# ──────────────────────────────────────────────────────────────────────────────
# JOBS — CREATE
# ──────────────────────────────────────────────────────────────────────────────

@router.post("/jobs", response_model=JobRecord)
async def create_job(job: JobCreate):
    """
    Called by Stage 1 after generating a structured JD.
    Saves the job record for use across all downstream stages.
    """

    job_id = str(uuid.uuid4())[:12]

    try:
        with get_db() as conn:
            conn.execute(
                """
                INSERT INTO jobs (job_id, job_title, structured_jd, domain, status)
                VALUES (?, ?, ?, ?, 'open')
                """,
                (
                    job_id,
                    job.job_title,
                    json.dumps(job.structured_jd),
                    job.domain,
                ),
            )

            row = conn.execute(
                "SELECT * FROM jobs WHERE job_id = ?", (job_id,)
            ).fetchone()

        logger.info(f"Job created: {job_id} | {job.job_title}")

        return _row_to_job_record(row, conn=None)

    except Exception as e:
        logger.error(f"Failed to create job: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to save job to pipeline.")


# ──────────────────────────────────────────────────────────────────────────────
# JOBS — LIST (for dropdowns)
# ──────────────────────────────────────────────────────────────────────────────

@router.get("/jobs", response_model=list[JobSummary])
async def list_jobs(status: Optional[str] = None, limit: int = 50):
    """
    Returns lightweight job list for dropdowns across all agents.
    Ordered by most recently updated first.
    Optionally filter by status (open/closed).
    """

    try:
        with get_db() as conn:

            query = """
                SELECT j.job_id, j.job_title, j.domain, j.status, j.created_at,
                       COUNT(c.candidate_id) as candidate_count
                FROM jobs j
                LEFT JOIN candidates c ON j.job_id = c.job_id
            """

            params = []

            if status:
                query += " WHERE j.status = ?"
                params.append(status)

            query += """
                GROUP BY j.job_id
                ORDER BY j.updated_at DESC
                LIMIT ?
            """
            params.append(limit)

            rows = conn.execute(query, params).fetchall()

        return [
            JobSummary(
                job_id=row["job_id"],
                job_title=row["job_title"],
                domain=row["domain"],
                status=row["status"],
                candidate_count=row["candidate_count"],
                created_at=row["created_at"],
            )
            for row in rows
        ]

    except Exception as e:
        logger.error(f"Failed to list jobs: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch jobs.")


# ──────────────────────────────────────────────────────────────────────────────
# JOBS — GET ONE (full structured JD, used to pre-fill Stage 2/5 forms)
# ──────────────────────────────────────────────────────────────────────────────

@router.get("/jobs/{job_id}", response_model=JobRecord)
async def get_job(job_id: str):
    """
    Returns full job record including structured JD JSON.
    Used by Stage 2 (sourcing) and Stage 5 (debrief) to pre-fill JD input.
    """

    try:
        with get_db() as conn:

            row = conn.execute(
                "SELECT * FROM jobs WHERE job_id = ?", (job_id,)
            ).fetchone()

            if not row:
                raise HTTPException(status_code=404, detail="Job not found.")

            count_row = conn.execute(
                "SELECT COUNT(*) as cnt FROM candidates WHERE job_id = ?",
                (job_id,),
            ).fetchone()

        return JobRecord(
            job_id=row["job_id"],
            job_title=row["job_title"],
            structured_jd=json.loads(row["structured_jd"]),
            domain=row["domain"],
            status=row["status"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
            candidate_count=count_row["cnt"],
        )

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"Failed to fetch job {job_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch job.")


# ──────────────────────────────────────────────────────────────────────────────
# CANDIDATES — CREATE (bulk, called by Stage 2 sourcing)
# ──────────────────────────────────────────────────────────────────────────────

@router.post("/candidates", response_model=CandidateRecord)
async def create_candidate(candidate: CandidateCreate):
    """
    Called by Stage 2 (sourcing) after a candidate is found/unlocked.
    One call per candidate — Stage 2 frontend can call this in a loop,
    or we add a /candidates/bulk endpoint later if needed.
    """

    candidate_id = str(uuid.uuid4())[:12]

    try:
        with get_db() as conn:

            # ── Validate job exists ───────────────────────────────────────
            job_row = conn.execute(
                "SELECT job_id FROM jobs WHERE job_id = ?", (candidate.job_id,)
            ).fetchone()

            if not job_row:
                raise HTTPException(status_code=404, detail="Job not found.")

            # Skip duplicate — same linkedin_url already exists under this job
            if candidate.linkedin_url:
                dup = conn.execute(
                    "SELECT candidate_id FROM candidates WHERE job_id = ? AND linkedin_url = ?",
                    (candidate.job_id, candidate.linkedin_url),
                ).fetchone()
                if dup:
                    logger.info(f"Duplicate skipped: {candidate.name} already exists under job {candidate.job_id}")
                    existing_row = conn.execute(
                        "SELECT * FROM candidates WHERE candidate_id = ?",
                        (dup["candidate_id"],),
                    ).fetchone()
                    return _row_to_candidate_record(existing_row)

            conn.execute(
                """
                INSERT INTO candidates
                    (candidate_id, job_id, name, title, company,
                     email, phone, linkedin_url, cv_file_ref, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'sourced')
                """,
                (
                    candidate_id,
                    candidate.job_id,
                    candidate.name,
                    candidate.title,
                    candidate.company,
                    candidate.email,
                    candidate.phone,
                    candidate.linkedin_url,
                    candidate.cv_file_ref,
                ),
            )

            row = conn.execute(
                "SELECT * FROM candidates WHERE candidate_id = ?",
                (candidate_id,),
            ).fetchone()

        logger.info(f"Candidate created: {candidate_id} | {candidate.name}")

        return _row_to_candidate_record(row)

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"Failed to create candidate: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to save candidate.")


# ──────────────────────────────────────────────────────────────────────────────
# CANDIDATES — LIST BY JOB (for dropdowns in Stage 3/4/5/6)
# ──────────────────────────────────────────────────────────────────────────────

@router.get("/jobs/{job_id}/candidates", response_model=list[CandidateSummary])
async def list_candidates_for_job(job_id: str, status: Optional[str] = None):
    """
    Returns candidates for a specific job — used to populate the
    candidate dropdown in Stage 3, 4, 5, 6 once a job is selected.
    Optionally filter by status (e.g. Stage 6 only wants 'interviewed').
    """

    try:
        with get_db() as conn:

            query = "SELECT candidate_id, job_id, name, title, company, linkedin_url, status FROM candidates WHERE job_id = ?"
            params = [job_id]

            if status:
                query += " AND status = ?"
                params.append(status)

            query += " ORDER BY updated_at DESC"

            rows = conn.execute(query, params).fetchall()

        return [
            CandidateSummary(
                candidate_id=row["candidate_id"],
                job_id=row["job_id"],
                name=row["name"],
                title=row["title"],
                company=row["company"],
                linkedin_url=row["linkedin_url"],
                status=row["status"],
            )
            for row in rows
        ]

    except Exception as e:
        logger.error(f"Failed to list candidates for job {job_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch candidates.")


# ──────────────────────────────────────────────────────────────────────────────
# CANDIDATES — GET ONE (full record, used to pre-fill Stage 3/4/5/6 forms)
# ──────────────────────────────────────────────────────────────────────────────

@router.get("/candidates/{candidate_id}", response_model=CandidateRecord)
async def get_candidate(candidate_id: str):
    """
    Returns full candidate record including debrief JSON if present.
    Used to pre-fill forms across Stage 3, 4, 5, 6.
    """

    try:
        with get_db() as conn:

            row = conn.execute(
                "SELECT * FROM candidates WHERE candidate_id = ?",
                (candidate_id,),
            ).fetchone()

            if not row:
                raise HTTPException(status_code=404, detail="Candidate not found.")

        return _row_to_candidate_record(row)

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"Failed to fetch candidate {candidate_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch candidate.")


# ──────────────────────────────────────────────────────────────────────────────
# CANDIDATES — UPDATE (called by Stage 4 status change, Stage 5 debrief write)
# ──────────────────────────────────────────────────────────────────────────────

@router.patch("/candidates/{candidate_id}", response_model=CandidateRecord)
async def update_candidate(candidate_id: str, updates: CandidateUpdate):
    """
    Partial update — used by:
    - Stage 3/4 to advance status (contacted, scheduled)
    - Stage 5 to write debrief JSON + status='interviewed'
    - Stage 6 to mark status='submitted'
    """

    fields_to_update = updates.model_dump(exclude_unset=True)

    if not fields_to_update:
        raise HTTPException(status_code=400, detail="No fields provided to update.")

    # ── Serialize debrief JSON if present ──────────────────────────────────
    if "stage5_debrief" in fields_to_update and fields_to_update["stage5_debrief"] is not None:
        fields_to_update["stage5_debrief"] = json.dumps(fields_to_update["stage5_debrief"])

    try:
        with get_db() as conn:

            existing = conn.execute(
                "SELECT candidate_id FROM candidates WHERE candidate_id = ?",
                (candidate_id,),
            ).fetchone()

            if not existing:
                raise HTTPException(status_code=404, detail="Candidate not found.")

            set_clause = ", ".join(f"{field} = ?" for field in fields_to_update)
            values = list(fields_to_update.values()) + [candidate_id]

            conn.execute(
                f"""
                UPDATE candidates
                SET {set_clause}, updated_at = datetime('now')
                WHERE candidate_id = ?
                """,
                values,
            )

            row = conn.execute(
                "SELECT * FROM candidates WHERE candidate_id = ?",
                (candidate_id,),
            ).fetchone()

        logger.info(f"Candidate updated: {candidate_id} | fields: {list(fields_to_update.keys())}")

        return _row_to_candidate_record(row)

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"Failed to update candidate {candidate_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update candidate.")


# ──────────────────────────────────────────────────────────────────────────────
# HELPERS
# ──────────────────────────────────────────────────────────────────────────────

def _row_to_job_record(row, conn=None) -> JobRecord:
    return JobRecord(
        job_id=row["job_id"],
        job_title=row["job_title"],
        structured_jd=json.loads(row["structured_jd"]),
        domain=row["domain"],
        status=row["status"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
        candidate_count=0,
    )


def _row_to_candidate_record(row) -> CandidateRecord:
    return CandidateRecord(
        candidate_id=row["candidate_id"],
        job_id=row["job_id"],
        name=row["name"],
        title=row["title"],
        company=row["company"],
        email=row["email"],
        phone=row["phone"],
        linkedin_url=row["linkedin_url"],
        cv_file_ref=row["cv_file_ref"],
        stage5_debrief=json.loads(row["stage5_debrief"]) if row["stage5_debrief"] else None,
        status=row["status"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


# ──────────────────────────────────────────────────────────────────────────────
# RESUME UPLOAD — Stage 5 saves candidate CV for Stage 6 auto-attach
# ──────────────────────────────────────────────────────────────────────────────

import os
import shutil

RESUME_UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads", "resumes")

@router.post("/upload-resume")
async def upload_resume(
    candidate_id: str = Form(...),
    resume_file: UploadFile = File(...),
):
    """
    Saves candidate resume to disk and returns a file reference.
    Called by Stage 5 after debrief generation when a resume was uploaded.
    Stage 6 uses the file_ref to auto-attach the CV.
    """
    try:
        os.makedirs(RESUME_UPLOAD_DIR, exist_ok=True)

        ext      = resume_file.filename.rsplit(".", 1)[-1].lower()
        filename = f"{candidate_id}.{ext}"
        filepath = os.path.join(RESUME_UPLOAD_DIR, filename)

        contents = await resume_file.read()
        with open(filepath, "wb") as f:
            f.write(contents)

        logger.info(f"Resume saved for candidate {candidate_id}: {filename}")

        return {"file_ref": filepath, "filename": filename}

    except Exception as e:
        logger.error(f"Resume upload failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to upload resume.")


# ──────────────────────────────────────────────────────────────────────────────
# CANDIDATES — SERVE CV FILE (Stage 6 fetches stored CV for auto-attach)
# ──────────────────────────────────────────────────────────────────────────────

from fastapi.responses import FileResponse as FastAPIFileResponse


@router.get("/candidates/{candidate_id}/cv")
async def get_candidate_cv(candidate_id: str):
    """
    Returns the stored CV file for a candidate.
    Stage 6 fetches this to auto-attach without manual re-upload.
    """
    try:
        with get_db() as conn:
            row = conn.execute(
                "SELECT cv_file_ref, name FROM candidates WHERE candidate_id = ?",
                (candidate_id,),
            ).fetchone()

            if not row:
                raise HTTPException(status_code=404, detail="Candidate not found.")

            if not row["cv_file_ref"]:
                raise HTTPException(status_code=404, detail="No CV stored for this candidate.")

        filepath = row["cv_file_ref"]

        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="CV file not found on disk.")

        filename = os.path.basename(filepath)

        return FastAPIFileResponse(
            path=filepath,
            filename=filename,
            media_type="application/octet-stream",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to serve CV for {candidate_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve CV.")


# ──────────────────────────────────────────────────────────────────────────────
# CANDIDATES — GENERATE DEBRIEF PDF FROM STORED JSON (Option B for Stage 6)
# ──────────────────────────────────────────────────────────────────────────────

import tempfile
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.pagesizes import letter


@router.get("/candidates/{candidate_id}/debrief-pdf")
async def get_candidate_debrief_pdf(candidate_id: str):
    """
    Generates a PDF from the stored stage5_debrief JSON.
    Stage 6 fetches this to auto-attach the debrief without manual re-upload.
    """
    try:
        with get_db() as conn:
            row = conn.execute(
                "SELECT stage5_debrief, name FROM candidates WHERE candidate_id = ?",
                (candidate_id,),
            ).fetchone()

            if not row:
                raise HTTPException(status_code=404, detail="Candidate not found.")

            if not row["stage5_debrief"]:
                raise HTTPException(status_code=404, detail="No debrief stored for this candidate.")

        debrief = json.loads(row["stage5_debrief"])
        name    = row["name"].replace(" ", "_")

        # Generate PDF from debrief JSON
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
        doc = SimpleDocTemplate(
            tmp.name,
            pagesize=letter,
            rightMargin=50, leftMargin=50,
            topMargin=50,   bottomMargin=50,
        )

        styles   = getSampleStyleSheet()
        elements = []

        def add_heading(text, style="Heading1"):
            elements.append(Paragraph(text, styles[style]))
            elements.append(Spacer(1, 8))

        def add_body(text):
            elements.append(Paragraph(str(text), styles["Normal"]))
            elements.append(Spacer(1, 6))

        def add_bullet_list(items):
            for item in items:
                elements.append(Paragraph(f"• {item}", styles["Normal"]))
            elements.append(Spacer(1, 6))

        add_heading(f"Interview Debrief — {debrief.get('candidate_name', '')}")
        add_body(f"Role: {debrief.get('job_title', '')}  |  Interviewer: {debrief.get('interviewer_name', '')}")
        elements.append(Spacer(1, 12))

        add_heading("Executive Summary", "Heading2")
        add_body(debrief.get("executive_summary", ""))

        jd_match = debrief.get("jd_match", {})
        add_heading(f"JD Match — {jd_match.get('match_percentage', 0)}%", "Heading2")
        if jd_match.get("matched_requirements"):
            add_heading("Matched Requirements", "Heading3")
            add_bullet_list(jd_match["matched_requirements"])
        if jd_match.get("missing_requirements"):
            add_heading("Missing Requirements", "Heading3")
            add_bullet_list(jd_match["missing_requirements"])

        if debrief.get("strengths"):
            add_heading("Strengths", "Heading2")
            add_bullet_list(debrief["strengths"])

        if debrief.get("concerns"):
            add_heading("Concerns", "Heading2")
            add_bullet_list(debrief["concerns"])

        add_heading("Final Recommendation", "Heading2")
        add_body(debrief.get("final_recommendation", ""))
        add_body(debrief.get("recommendation_justification", ""))

        if debrief.get("follow_up_questions"):
            add_heading("Follow-Up Questions", "Heading2")
            add_bullet_list(debrief["follow_up_questions"])

        doc.build(elements)

        logger.info(f"Debrief PDF generated for candidate {candidate_id}")

        return FastAPIFileResponse(
            path=tmp.name,
            filename=f"debrief_{name}.pdf",
            media_type="application/pdf",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to generate debrief PDF for {candidate_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate debrief PDF.")