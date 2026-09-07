"""
Content, Auth & Progress Service (Role 5).
Run with: uvicorn main:app --reload --port 8002

Endpoints:
  GET  /health
  GET  /api/courses
  GET  /api/quizzes/{quiz_id}/questions        -> questions WITHOUT answer key
  POST /api/quizzes/{quiz_id}/submit           -> grade + record attempt
  GET  /api/challenges/{challenge_id}
  POST /api/challenges/{challenge_id}/submit   -> run + grade via Simulation Service
  POST /api/lessons/complete                   -> mark a lesson done
  GET  /api/progress/{user_id}                 -> learner progress summary
  GET  /api/user_profiles/{user_id}            -> AI Tutor personalization contract
  GET  /api/instructor/cohort/{cohort_id}      -> InstructorDashboard-shaped rollup

Auth: send `Authorization: Bearer <supabase-jwt>` on user-scoped requests.
If SUPABASE_JWT_SECRET is unset, the service runs in dev mode and trusts the
`user_id` in the request body instead (see auth.py).
"""
from __future__ import annotations
import logging
from typing import Optional

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from auth import get_authenticated_user_id, resolve_user_id
from db import repository as repo
from grading.quiz_grading import grade_quiz
from grading.challenge_grading import grade_challenge, SimulationUnavailable
from services.progress_service import build_learner_progress, build_cohort_summary
from models.schemas import (
    QuizSubmitRequest, QuizSubmitResponse,
    ChallengeSubmitRequest, ChallengeSubmitResponse,
    LessonCompleteRequest,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("content-progress-service")

app = FastAPI(
    title="Quantum Learning Platform — Content, Auth & Progress Service",
    description="Supabase-backed course content, quiz/challenge grading, and progress tracking (Role 5).",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["System"])
def health():
    return {
        "status": "ok",
        "service": "content-progress",
        "supabase_configured": repo.using_supabase(),
        "simulation_service_url": settings.simulation_service_url,
    }


# ---------------------------------------------------------------------------
# Content
# ---------------------------------------------------------------------------
@app.get("/api/courses", tags=["Content"])
def list_courses():
    return repo.get_courses()


@app.get("/api/quizzes/{quiz_id}/questions", tags=["Content"])
def get_quiz_questions(quiz_id: str):
    quiz = repo.get_quiz(quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail=f"Quiz '{quiz_id}' not found.")
    questions = repo.get_quiz_questions(quiz_id, with_answers=False)
    return {"quiz": quiz, "questions": questions}


@app.get("/api/challenges/{challenge_id}", tags=["Content"])
def get_challenge(challenge_id: str):
    challenge = repo.get_challenge(challenge_id)
    if not challenge:
        raise HTTPException(status_code=404, detail=f"Challenge '{challenge_id}' not found.")
    # Don't leak the answer key / tolerance to the client beyond what's useful for a hint.
    safe = {k: v for k, v in challenge.items() if k not in ("expected_result",)}
    return safe


# ---------------------------------------------------------------------------
# Grading
# ---------------------------------------------------------------------------
@app.post("/api/quizzes/{quiz_id}/submit", response_model=QuizSubmitResponse, tags=["Grading"])
def submit_quiz(
    quiz_id: str,
    req: QuizSubmitRequest,
    token_user_id: Optional[str] = Depends(get_authenticated_user_id),
):
    quiz = repo.get_quiz(quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail=f"Quiz '{quiz_id}' not found.")

    questions = repo.get_quiz_questions(quiz_id, with_answers=True)
    try:
        result = grade_quiz(questions, req.answers, float(quiz["passing_score"]))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    user_id = resolve_user_id(token_user_id, req.user_id)

    repo.record_quiz_attempt(
        user_id=user_id, quiz_id=quiz_id, quiz_title=quiz["title"],
        score=result["score"], passed=result["passed"],
        weak_topics=result["weak_topics"], answers=req.answers,
    )
    for c in result["concept_results"]:
        repo.upsert_concept_mastery(
            user_id=user_id, concept_id=c["concept_id"],
            concept_name=c["concept_id"].replace("-", " ").title(),
            status=c["status"], accuracy_rate=c["accuracy_rate"],
        )

    return QuizSubmitResponse(
        quiz_id=quiz_id, score=result["score"], passed=result["passed"],
        weak_topics=result["weak_topics"], per_question=result["per_question"],
    )


@app.post("/api/challenges/{challenge_id}/submit", response_model=ChallengeSubmitResponse, tags=["Grading"])
def submit_challenge(
    challenge_id: str,
    req: ChallengeSubmitRequest,
    token_user_id: Optional[str] = Depends(get_authenticated_user_id),
):
    challenge = repo.get_challenge(challenge_id)
    if not challenge:
        raise HTTPException(status_code=404, detail=f"Challenge '{challenge_id}' not found.")

    circuit_dict = req.circuit.model_dump(exclude_none=True)
    try:
        result = grade_challenge(challenge, circuit_dict)
    except SimulationUnavailable as e:
        raise HTTPException(status_code=502, detail=str(e)) from e

    user_id = resolve_user_id(token_user_id, req.user_id)

    saved = repo.record_challenge_submission(
        user_id=user_id, challenge_id=challenge_id, circuit=circuit_dict,
        status=result["status"], score=result["score"], passed=result["passed"],
        feedback=result["feedback"], sim_result=result["sim_result"],
    )

    return ChallengeSubmitResponse(
        challenge_id=challenge_id, status=result["status"], score=result["score"],
        passed=result["passed"], feedback=result["feedback"], sim_result=result["sim_result"],
    )


@app.post("/api/lessons/complete", tags=["Progress"])
def complete_lesson(
    req: LessonCompleteRequest,
    token_user_id: Optional[str] = Depends(get_authenticated_user_id),
):
    user_id = resolve_user_id(token_user_id, req.user_id)
    repo.mark_lesson_complete(user_id, req.lesson_id)
    return {"user_id": user_id, "lesson_id": req.lesson_id, "completed": True}


# ---------------------------------------------------------------------------
# Progress reads
# ---------------------------------------------------------------------------
@app.get("/api/progress/{user_id}", tags=["Progress"])
def get_progress(user_id: str):
    return build_learner_progress(user_id)


@app.get("/api/user_profiles/{user_id}", tags=["Progress"])
def get_user_profile_for_tutor(user_id: str):
    """Same contract as the Supabase `user_profiles` view — lets the AI
    Tutor service call this service directly as a fallback path if it
    prefers an HTTP API over hitting PostgREST."""
    return repo.get_user_profile(user_id)


@app.get("/api/instructor/cohort/{cohort_id}", tags=["Progress"])
def get_cohort_summary(cohort_id: str, cohort_name: Optional[str] = None):
    return build_cohort_summary(cohort_id, cohort_name)
