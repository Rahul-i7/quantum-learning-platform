"""
Repository layer — every other module (main.py, grading/*) calls through
here instead of talking to Supabase or the memory store directly. Picks
the backend automatically based on `settings.supabase_configured`, so the
rest of the service doesn't need to know or care which one is active.
"""
from __future__ import annotations
import logging
from typing import Any, Optional

from config import settings
from db import supabase_client as sb
from db.memory_store import store as mem, DEMO_COHORT_ID, DEMO_COHORT_NAME

logger = logging.getLogger("content-progress.repository")


def using_supabase() -> bool:
    return settings.supabase_configured


# ---------------------------------------------------------------------------
# Content
# ---------------------------------------------------------------------------
def get_courses() -> list[dict]:
    if using_supabase():
        return sb.select("courses", {"select": "*", "order": "order_index"})
    from db.memory_store import COURSES
    return COURSES


def get_quiz(quiz_id: str) -> Optional[dict]:
    if using_supabase():
        rows = sb.select("quizzes", {"select": "*", "id": f"eq.{quiz_id}"})
        return rows[0] if rows else None
    from db.memory_store import QUIZZES
    return next((q for q in QUIZZES if q["id"] == quiz_id), None)


def get_quiz_questions(quiz_id: str, with_answers: bool) -> list[dict]:
    if using_supabase():
        table = "quiz_questions" if with_answers else "quiz_questions_public"
        return sb.select(table, {"select": "*", "quiz_id": f"eq.{quiz_id}", "order": "order_index"})
    from db.memory_store import QUIZ_QUESTIONS
    questions = [q for q in QUIZ_QUESTIONS if q["quiz_id"] == quiz_id]
    if not with_answers:
        questions = [{k: v for k, v in q.items() if k != "correct_choice"} for q in questions]
    return questions


def get_challenge(challenge_id: str) -> Optional[dict]:
    if using_supabase():
        rows = sb.select("coding_challenges", {"select": "*", "id": f"eq.{challenge_id}"})
        return rows[0] if rows else None
    from db.memory_store import CODING_CHALLENGES
    return next((c for c in CODING_CHALLENGES if c["id"] == challenge_id), None)


# ---------------------------------------------------------------------------
# Progress writes
# ---------------------------------------------------------------------------
def record_quiz_attempt(user_id: str, quiz_id: str, quiz_title: str, score: float,
                         passed: bool, weak_topics: list[str], answers: dict) -> None:
    if using_supabase():
        sb.insert("quiz_attempts", {
            "user_id": user_id, "quiz_id": quiz_id, "score": score, "passed": passed,
            "weak_topics": weak_topics, "answers": answers,
        }, returning=False)
    else:
        mem.record_quiz_attempt(user_id, quiz_id, quiz_title, score, passed, weak_topics)


def upsert_concept_mastery(user_id: str, concept_id: str, concept_name: str,
                            status: str, accuracy_rate: float) -> None:
    if using_supabase():
        existing = sb.select("concept_mastery", {
            "select": "attempts", "user_id": f"eq.{user_id}", "concept_id": f"eq.{concept_id}"
        })
        attempts = (existing[0]["attempts"] + 1) if existing else 1
        sb.upsert("concept_mastery", {
            "user_id": user_id, "concept_id": concept_id, "concept_name": concept_name,
            "status": status, "accuracy_rate": accuracy_rate, "attempts": attempts,
            "last_practiced": "now()",
        }, on_conflict="user_id,concept_id")
    else:
        mem.upsert_concept_mastery(user_id, concept_id, concept_name, status, accuracy_rate)


def mark_lesson_complete(user_id: str, lesson_id: str) -> None:
    if using_supabase():
        sb.upsert("lesson_progress", {"user_id": user_id, "lesson_id": lesson_id},
                  on_conflict="user_id,lesson_id")
    else:
        mem.mark_lesson_complete(user_id, lesson_id)


def record_challenge_submission(user_id: str, challenge_id: str, circuit: dict, status: str,
                                 score: Optional[float], passed: bool, feedback: str,
                                 sim_result: Optional[dict]) -> dict:
    if using_supabase():
        rows = sb.insert("challenge_submissions", {
            "user_id": user_id, "challenge_id": challenge_id, "circuit": circuit,
            "status": status, "score": score, "passed": passed, "feedback": feedback,
            "sim_result": sim_result,
        })
        return rows[0] if rows else {}
    return mem.record_challenge_submission(user_id, challenge_id, circuit, status, score, passed, feedback, sim_result)


# ---------------------------------------------------------------------------
# Progress reads
# ---------------------------------------------------------------------------
def get_user_profile(user_id: str) -> dict[str, Any]:
    """Matches the exact shape services/ai-tutor expects from user_profiles."""
    if using_supabase():
        rows = sb.select("user_profiles", {"select": "*", "user_id": f"eq.{user_id}"})
        if rows:
            return rows[0]
        return _default_profile(user_id)
    return mem.profiles.get(user_id) or _default_profile(user_id)


def _default_profile(user_id: str) -> dict[str, Any]:
    return {
        "user_id": user_id, "name": "Student", "skill_level": "beginner", "learning_style": "intuitive",
        "completed_lessons": [], "current_module": None, "quizzes": [], "concepts": {},
        "known_struggles": [], "preferred_hint_depth": 1,
    }


def get_cohort_profiles(cohort_id: str) -> list[dict[str, Any]]:
    if using_supabase():
        members = sb.select("cohort_members", {"select": "user_id", "cohort_id": f"eq.{cohort_id}"})
        profiles = []
        for m in members:
            profiles.append(get_user_profile(m["user_id"]))
        return profiles
    return mem.cohort_profiles(cohort_id)


def get_demo_cohort_id() -> str:
    return DEMO_COHORT_ID


def get_demo_cohort_name() -> str:
    return DEMO_COHORT_NAME
