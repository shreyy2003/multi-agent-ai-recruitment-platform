import os
import json
import uuid
import asyncio
import logging

from groq import AsyncGroq
from tavily import TavilyClient
from dotenv import load_dotenv

from models.sourcing_schemas import (
    JDParams,
    CandidateProfile,
    SoftFlag,
    SourcingResponse,
)
from prompts.sourcing_prompt import (
    JD_EXTRACTION_PROMPT,
    STRUCTURED_JD_EXTRACTION_PROMPT,
    CANDIDATE_EXTRACTION_PROMPT,
    RERANKING_PROMPT,
)

# ENV
load_dotenv()


# LOGGING

logger = logging.getLogger(__name__)


# GROQ CLIENT — LAZY SINGLETON

_groq_client: AsyncGroq | None = None


def _get_groq_client() -> AsyncGroq:
    global _groq_client
    if _groq_client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise RuntimeError(
                "GROQ_API_KEY is missing. "
                "Add it to your .env file and restart the server."
            )
        _groq_client = AsyncGroq(api_key=api_key)
    return _groq_client


# TAVILY CLIENT — LAZY SINGLETON

_tavily_client: TavilyClient | None = None


def _get_tavily_client() -> TavilyClient:
    global _tavily_client
    if _tavily_client is None:
        api_key = os.getenv("TAVILY_API_KEY")
        if not api_key:
            raise RuntimeError(
                "TAVILY_API_KEY is missing. "
                "Add it to your .env file and restart the server."
            )
        _tavily_client = TavilyClient(api_key=api_key)
    return _tavily_client


# CONFIG

MODEL           = "llama-3.3-70b-versatile"
TEMPERATURE     = 0.2
MAX_TOKENS      = 4000
MAX_RETRIES     = 2
RETRY_DELAY_S   = 2
MAX_JD_CHARS    = 15_000
TAVILY_RESULTS  = 10   # per query
TOP_N           = 10   # final candidates to return

# Pool blending config
TOP_QUALITY_COUNT  = 6   # top matches regardless of availability
AVAILABLE_COUNT    = 4   # available candidates to fill remaining slots


# HELPERS

def _is_structured_jd(jd_text: str) -> bool:
    """
    Detect if the input is a Stage 1 structured intake report.
    Checks for known section headers from Stage 1 output.
    """
    markers = [
        "Must Have Requirements",
        "Nice To Have Requirements",
        "Auto Reject Criteria",
        "Prescreening Questions",
        "Candidate Scorecard",
        "TJJ Recruitment Intake Report",
    ]
    return sum(1 for m in markers if m in jd_text) >= 2

#Streaming 
async def _groq_json_call(prompt: str, max_tokens: int = MAX_TOKENS) -> dict | list:
    """
    Single Groq call expecting JSON response.
    Includes a small delay before each call to avoid rate limiting.
    """
    # ── Rate limit buffer — Groq free tier is strict ──────────────────────
    await asyncio.sleep(2)

    response = await _get_groq_client().chat.completions.create(
        model=MODEL,
        temperature=TEMPERATURE,
        max_tokens=max_tokens,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an expert recruitment analyst at The Jobs Jungle. "
                    "Always return valid JSON only."
                ),
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
    )
    raw = response.choices[0].message.content.strip()
    tokens = response.usage.total_tokens
    return json.loads(raw), tokens

async def source_candidates_stream(jd_text: str):
    """
    Streaming version of source_candidates.
    Yields SSE-compatible dicts with type + message + optional data.
    """

    if len(jd_text) > MAX_JD_CHARS:
        jd_text = jd_text[:MAX_JD_CHARS]

    total_tokens = 0
    is_structured = _is_structured_jd(jd_text)
    input_mode    = "structured" if is_structured else "raw"

    # ── Step 1 ────────────────────────────────────────────────────────────
    yield {"type": "progress", "step": 1, "message": "Reading job description..."}
    params, tokens = await _extract_jd_params(jd_text, is_structured)
    total_tokens += tokens
    yield {"type": "progress", "step": 1, "message": f"Role identified: {params.job_title}"}

    # ── Step 2 ────────────────────────────────────────────────────────────
    yield {"type": "progress", "step": 2, "message": "Building search queries..."}
    queries = _build_search_queries(params)
    yield {"type": "progress", "step": 2, "message": f"{len(queries)} queries ready"}

    # ── Step 3 ────────────────────────────────────────────────────────────
    yield {"type": "progress", "step": 3, "message": "Searching LinkedIn profiles..."}
    search_results = _run_tavily_searches(queries)

    if not search_results:
        raise Exception("No search results returned. Please refine the JD.")

    yield {"type": "progress", "step": 3, "message": f"{len(search_results)} profiles found"}

    # ── Step 4 ────────────────────────────────────────────────────────────
    yield {"type": "progress", "step": 4, "message": "Extracting candidate profiles..."}
    raw_candidates, tokens = await _extract_candidates(search_results)
    total_tokens += tokens

    if not raw_candidates:
        raise Exception("Could not extract candidate profiles. Please try again.")

    yield {"type": "progress", "step": 4, "message": f"{len(raw_candidates)} candidates extracted"}

    # ── Step 5 ────────────────────────────────────────────────────────────
    yield {"type": "progress", "step": 5, "message": "Scoring and ranking candidates..."}
    ranked_candidates, tokens = await _rerank_candidates(raw_candidates, params)
    total_tokens += tokens
    yield {"type": "progress", "step": 5, "message": "Ranking complete"}

    # ── Step 6 ────────────────────────────────────────────────────────────
    yield {"type": "progress", "step": 6, "message": "Building final candidate list..."}
    profiles = _build_profiles(ranked_candidates)

    result = SourcingResponse(
        jd_params=params,
        candidates=profiles,
        total_found=len(profiles),
        tokens_used=total_tokens,
        input_mode=input_mode,
    )

    # ── Final result ──────────────────────────────────────────────────────
    yield {
        "type": "complete",
        "message": f"Found {len(profiles)} candidates",
        "data": result.model_dump(),
    }


# STEP 1 — EXTRACT JD PARAMS

async def _extract_jd_params(
    jd_text: str,
    is_structured: bool,
) -> tuple[JDParams, int]:
    """
    Extract structured search parameters from JD text.
    Uses different prompt depending on input mode.
    """

    prompt_template = (
        STRUCTURED_JD_EXTRACTION_PROMPT
        if is_structured
        else JD_EXTRACTION_PROMPT
    )

    prompt = prompt_template.format(jd_text=jd_text)

    last_error = None

    for attempt in range(MAX_RETRIES + 1):

        try:

            if attempt > 0:
                await asyncio.sleep(RETRY_DELAY_S * attempt)
                logger.warning(
                    f"JD extraction retry {attempt}/{MAX_RETRIES}"
                )

            data, tokens = await _groq_json_call(prompt)

            # ── Wrap array responses ──────────────────────────────────────
            if isinstance(data, list):
                raise ValueError("Expected dict, got list")

            params = JDParams(**data)

            logger.info(
                f"JD params extracted | "
                f"Title: {params.job_title} | "
                f"Tokens: {tokens}"
            )

            return params, tokens

        except Exception as e:
            last_error = str(e)
            logger.error(f"JD extraction attempt {attempt + 1} failed: {e}")

    raise Exception(
        f"JD extraction failed after {MAX_RETRIES + 1} attempts. "
        f"Last error: {last_error}"
    )


# DOMAIN QUERY TEMPLATES

DOMAIN_QUERY_TEMPLATES = {
    "engineering": [
        "{seniority} Backend Engineer {skills} India site:linkedin.com/in",
        "{seniority} Software Engineer {skills} India site:linkedin.com/in",
        "{seniority} {title} {skills} developer India site:linkedin.com/in",
    ],
    "devops_cloud": [
        "{seniority} DevOps Engineer {skills} India site:linkedin.com/in",
        "{seniority} Cloud Engineer {skills} India site:linkedin.com/in",
        "{seniority} SRE {skills} India site:linkedin.com/in",
    ],
    "data_ai": [
        "{seniority} Data Engineer {skills} India site:linkedin.com/in",
        "{seniority} ML Engineer {skills} India site:linkedin.com/in",
        "{seniority} AI Engineer {skills} India site:linkedin.com/in",
    ],
    "product_management": [
        "{seniority} Product Manager {skills} India site:linkedin.com/in",
        "{seniority} Product Lead {skills} India site:linkedin.com/in",
        "{seniority} Program Manager {skills} India site:linkedin.com/in",
    ],
    "quality_assurance": [
        "{seniority} QA Engineer {skills} India site:linkedin.com/in",
        "{seniority} SDET {skills} India site:linkedin.com/in",
        "{seniority} Test Engineer automation {skills} India site:linkedin.com/in",
    ],
    "business_gtm": [
        "{seniority} Sales Manager {skills} India site:linkedin.com/in",
        "{seniority} Business Development {skills} India site:linkedin.com/in",
        "{seniority} GTM Manager {skills} India site:linkedin.com/in",
    ],
}

# Fallback if domain not matched
DEFAULT_QUERY_TEMPLATES = [
    "{seniority} {title} {skills} India site:linkedin.com/in",
    "{seniority} {title} developer {skills} India site:linkedin.com/in",
    "{title} {skills} engineer India site:linkedin.com/in",
]


# STEP 2 — BUILD TAVILY SEARCH QUERIES

def _build_search_queries(params: JDParams) -> list[str]:
    """
    Build domain-specific Tavily search queries from JD params.
    Uses hardcoded domain templates — no Groq call needed.
    Guarantees queries stay true to the role domain.
    """

    # ── Pick top 2-3 must-have skills for query ───────────────────────────
    skills_str = " ".join(params.must_have[:3])

    # ── Simplify seniority for query ──────────────────────────────────────
    seniority_map = {
        "Junior":    "Junior",
        "Mid":       "",
        "Senior":    "Senior",
        "Lead":      "Lead",
        "Principal": "Principal",
    }
    seniority = seniority_map.get(params.seniority, "")

    # ── Get title — first word only to keep query short ───────────────────
    title = params.job_title.split("/")[0].strip()

    # ── Pick templates for domain ─────────────────────────────────────────
    templates = DOMAIN_QUERY_TEMPLATES.get(
        params.domain,
        DEFAULT_QUERY_TEMPLATES,
    )

    # ── Fill templates ─────────────────────────────────────────────────────
    queries = []
    for template in templates:
        query = template.format(
            seniority=seniority,
            title=title,
            skills=skills_str,
        ).strip()
        # Clean up double spaces from empty seniority
        query = " ".join(query.split())
        queries.append(query)

    logger.info(
        f"Built {len(queries)} domain-specific queries "
        f"for domain: {params.domain}"
    )

    return queries


# STEP 3 — TAVILY SEARCH

def _run_tavily_searches(queries: list[str]) -> list[dict]:
    """
    Run Tavily searches for all queries.
    Deduplicates results by URL.
    """

    seen_urls = set()
    all_results = []

    for i, query in enumerate(queries):

        try:

            logger.info(f"Tavily search {i + 1}/{len(queries)}: {query}")

            response = _get_tavily_client().search(
                query=query,
                search_depth="basic",
                max_results=TAVILY_RESULTS,
            )

            for result in response.get("results", []):

                url = result.get("url", "")

                if url not in seen_urls:
                    seen_urls.add(url)
                    all_results.append({
                        "title":   result.get("title", ""),
                        "url":     url,
                        "snippet": result.get("content", "")[:200],
                    })

        except Exception as e:
            logger.error(f"Tavily search {i + 1} failed: {e}")
            continue

    logger.info(f"Tavily returned {len(all_results)} unique results")

    return all_results


# STEP 4 — EXTRACT CANDIDATE PROFILES FROM SEARCH RESULTS

async def _extract_candidates(
    search_results: list[dict],
) -> tuple[list[dict], int]:
    """
    Use Groq to extract structured candidate profiles from Tavily snippets.
    """

    # ── Limit to top 15 results to reduce token usage ────────────────────
    search_results = search_results[:15]

    results_text = json.dumps(search_results, indent=2)

    prompt = CANDIDATE_EXTRACTION_PROMPT.format(
        search_results=results_text
    )

    data, tokens = await _groq_json_call(prompt)

    # ── Handle wrapped responses ──────────────────────────────────────────
    if isinstance(data, dict):
        candidates = (
            data.get("candidates")
            or data.get("profiles")
            or list(data.values())[0]
        )
    else:
        candidates = data

    candidates = [c for c in candidates if c.get("name")]

    # ── Assign unique IDs ─────────────────────────────────────────────────
    for c in candidates:
        c["id"] = str(uuid.uuid4())[:8]

    logger.info(f"Extracted {len(candidates)} candidate profiles")

    return candidates, tokens


# STEP 5 — AI RE-RANKING

async def _rerank_candidates(
    candidates: list[dict],
    params: JDParams,
) -> tuple[list[dict], int]:
    """
    Use Groq to score and rank candidates against JD requirements.
    Returns candidates enriched with match_score, match_reason, soft_flags.
    """

    candidates_text = json.dumps(candidates, indent=2)

    prompt = RERANKING_PROMPT.format(
        job_title=params.job_title,
        seniority=params.seniority,
        must_have=", ".join(params.must_have),
        nice_to_have=", ".join(params.nice_to_have),
        experience_years=params.experience_years,
        location=params.location,
        auto_reject_signals=", ".join(params.auto_reject_signals),
        candidates=candidates_text,
    )

    data, tokens = await _groq_json_call(prompt)

    # ── Handle wrapped responses ──────────────────────────────────────────
    if isinstance(data, dict):
        scores = (
            data.get("candidates")
            or data.get("scores")
            or data.get("rankings")
            or list(data.values())[0]
        )
    else:
        scores = data

    # ── Merge scores back into candidate profiles ─────────────────────────
    scores_by_id = {s["id"]: s for s in scores}

    enriched = []

    for candidate in candidates:

        cid = candidate["id"]
        score_data = scores_by_id.get(cid, {})

        candidate["match_score"]         = score_data.get("match_score", 0)
        candidate["match_reason"]        = score_data.get("match_reason", "")
        candidate["soft_flags"]          = score_data.get("soft_flags", [])
        candidate["availability_signal"] = score_data.get("availability_signal", "none")
        candidate["availability_note"]   = score_data.get("availability_note", None)
        candidate["career_trajectory"]   = score_data.get("career_trajectory", "unclear")
        candidate["startup_fit"]         = score_data.get("startup_fit", False)

        enriched.append(candidate)

    # ── Sort by match score descending ───────────────────────────────────
    enriched.sort(key=lambda x: x["match_score"], reverse=True)

    logger.info(
        f"Re-ranking complete | "
        f"Top score: {enriched[0]['match_score'] if enriched else 0}"
    )

    # Phase 2: blend quality + available pools
    blended = _blend_candidate_pools(enriched)

    return blended, tokens

# STEP 5b — POOL BLENDING

AVAILABLE_SIGNALS = {"open_to_work", "recently_left", "freelancing"}

def _blend_candidate_pools(enriched: list[dict]) -> list[dict]:
    """
    Phase 2 pool blending with graceful degradation.

    If available candidates exist — blend top 6 quality + top 4 available.
    If no available candidates — return top 10 quality as-is.
    """

    # Pool 1: top quality by score
    pool_quality = enriched[:TOP_QUALITY_COUNT]
    pool_quality_ids = {c["id"] for c in pool_quality}

    for c in pool_quality:
        c["blend_source"] = "quality"

    # Pool 2: available candidates not already in pool 1
    pool_available = [
        c for c in enriched
        if c["id"] not in pool_quality_ids
        and c.get("availability_signal") in AVAILABLE_SIGNALS
    ][:AVAILABLE_COUNT]

    # ── Graceful degradation ──────────────────────────────────────────────
    if not pool_available:
        # No available candidates found — return top 10 quality as-is
        logger.info(
            "No available candidates detected — "
            "returning top 10 quality candidates"
        )
        return enriched[:TOP_N]

    for c in pool_available:
        c["blend_source"] = "available"

    # Merge, de-duplicate, re-sort
    seen = set()
    merged = []
    for c in pool_quality + pool_available:
        if c["id"] not in seen:
            seen.add(c["id"])
            merged.append(c)

    merged.sort(key=lambda x: x["match_score"], reverse=True)

    logger.info(
        f"Pool blend complete | "
        f"Quality: {len(pool_quality)} | "
        f"Available: {len(pool_available)} | "
        f"Final: {len(merged[:TOP_N])}"
    )

    return merged[:TOP_N]


# STEP 6 — BUILD FINAL CANDIDATE PROFILES

def _build_profiles(candidates: list[dict]) -> list[CandidateProfile]:
    """
    Convert raw dicts into validated CandidateProfile Pydantic models.
    """

    profiles = []

    for c in candidates:

        try:

            soft_flags = [
                SoftFlag(
                    field=f.get("field", ""),
                    message=f.get("message", ""),
                )
                for f in c.get("soft_flags", [])
            ]

            profile = CandidateProfile(
                id=c.get("id", str(uuid.uuid4())[:8]),
                name=c.get("name") or "Unknown",
                title=c.get("title") or "Not specified",
                company=c.get("company") or "Not specified",
                location=c.get("location") or "Not specified",
                linkedin_url=c.get("linkedin_url") or "",
                skills=c.get("skills") or [],
                experience=c.get("experience"),
                match_score=c.get("match_score") or 0,
                match_reason=c.get("match_reason") or "",
                soft_flags=soft_flags,
                availability_signal=c.get("availability_signal") or "none",
                availability_note=c.get("availability_note"),
                career_trajectory=c.get("career_trajectory") or "unclear",
                startup_fit=c.get("startup_fit") or False,
                contact_unlocked=False,
                blend_source=c.get("blend_source") or "quality",
            )

            profiles.append(profile)

        except Exception as e:
            logger.warning(f"Skipping malformed candidate: {e}")
            continue

    return profiles


# PUBLIC ENTRYPOINT — SOURCING

async def source_candidates(jd_text: str) -> SourcingResponse:
    """
    Main public entrypoint.
    Accepts raw or structured JD text, returns ranked candidate profiles.
    """

    # ── Truncate oversized input ──────────────────────────────────────────
    if len(jd_text) > MAX_JD_CHARS:
        logger.warning(
            f"JD truncated from {len(jd_text)} to {MAX_JD_CHARS} chars"
        )
        jd_text = jd_text[:MAX_JD_CHARS]

    total_tokens = 0

    # ── Detect input mode ─────────────────────────────────────────────────
    is_structured = _is_structured_jd(jd_text)
    input_mode    = "structured" if is_structured else "raw"

    logger.info(f"Input mode detected: {input_mode}")

    # ── Step 1: Extract JD params ─────────────────────────────────────────
    params, tokens = await _extract_jd_params(jd_text, is_structured)
    total_tokens += tokens

    # ── Step 2: Build search queries (domain templates — no Groq call) ───
    queries = _build_search_queries(params)

    # ── Step 3: Tavily search ─────────────────────────────────────────────
    search_results = _run_tavily_searches(queries)

    if not search_results:
        raise Exception(
            "No search results returned from Tavily. "
            "Please try again or refine the JD."
        )

    # ── Step 4: Extract candidates from results ───────────────────────────
    raw_candidates, tokens = await _extract_candidates(search_results)
    total_tokens += tokens

    if not raw_candidates:
        raise Exception(
            "Could not extract candidate profiles from search results. "
            "Please try again."
        )

    # ── Step 5: AI re-ranking ─────────────────────────────────────────────
    ranked_candidates, tokens = await _rerank_candidates(
        raw_candidates, params
    )
    total_tokens += tokens

    # ── Step 6: Build validated profiles ─────────────────────────────────
    profiles = _build_profiles(ranked_candidates)

    logger.info(
        f"Sourcing complete | "
        f"Candidates: {len(profiles)} | "
        f"Total tokens: {total_tokens}"
    )

    return SourcingResponse(
        jd_params=params,
        candidates=profiles,
        total_found=len(profiles),
        tokens_used=total_tokens,
        input_mode=input_mode,
    )


# PUBLIC ENTRYPOINT — UNLOCK CONTACTS

async def unlock_candidate_contacts(
    candidate_ids: list[str],
    candidates: list[CandidateProfile],
) -> list[CandidateProfile]:
    """
    Marks selected candidates as unlocked.
    Contact details (LinkedIn URL) become fully accessible.
    Email/phone noted as requiring Apollo paid integration.
    """

    unlocked = []

    for candidate in candidates:

        if candidate.id in candidate_ids:

            candidate.contact_unlocked = True

            logger.info(
                f"Contact unlocked for: {candidate.name}"
            )

        unlocked.append(candidate)

    return unlocked