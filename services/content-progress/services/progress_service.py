"""
Progress aggregation (Role 5).

`build_cohort_summary` returns data in exactly the shape
apps/web/components/visualizations/InstructorDashboard.jsx already renders
(cohortName / modules / students[].{completionPct, moduleProgress, quizzes,
challenges, lastActive}) — see PRESETS/buildCohort in that file for the
target shape this mirrors. Point the dashboard at
GET /api/instructor/cohort/{cohort_id} to replace the hardcoded presets
with real data; no component changes needed beyond the fetch.
"""
from __future__ import annotations
from typing import Any

from db import repository as repo


def _module_titles() -> list[str]:
    modules = []
    if repo.using_supabase():
        from db import supabase_client as sb
        rows = sb.select("modules", {"select": "id,title", "order": "order_index"})
        modules = rows
    else:
        from db.memory_store import MODULES
        modules = MODULES
    return modules


def _lessons_by_module() -> dict[str, list[str]]:
    if repo.using_supabase():
        from db import supabase_client as sb
        rows = sb.select("lessons", {"select": "id,module_id"})
    else:
        from db.memory_store import LESSONS
        rows = LESSONS
    by_module: dict[str, list[str]] = {}
    for lesson in rows:
        by_module.setdefault(lesson["module_id"], []).append(lesson["id"])
    return by_module


def build_learner_progress(user_id: str) -> dict[str, Any]:
    profile = repo.get_user_profile(user_id)
    lessons_by_module = _lessons_by_module()
    total_lessons = sum(len(v) for v in lessons_by_module.values()) or 1
    completed = set(profile.get("completed_lessons") or [])
    completion_pct = round(100 * len(completed & set().union(*lessons_by_module.values())) / total_lessons) \
        if lessons_by_module else 0

    return {
        "user_id": profile["user_id"],
        "name": profile.get("name", "Student"),
        "skill_level": profile.get("skill_level", "beginner"),
        "completion_pct": completion_pct,
        "completed_lessons": sorted(completed),
        "quizzes": profile.get("quizzes") or [],
        "concepts": profile.get("concepts") or {},
        "known_struggles": profile.get("known_struggles") or [],
    }


def _module_progress_for(profile: dict[str, Any], modules: list[dict], lessons_by_module: dict[str, list[str]]) -> list[int]:
    completed = set(profile.get("completed_lessons") or [])
    progress = []
    for m in modules:
        lesson_ids = lessons_by_module.get(m["id"], [])
        if not lesson_ids:
            progress.append(0)
            continue
        pct = round(100 * len(completed & set(lesson_ids)) / len(lesson_ids))
        progress.append(pct)
    return progress


def _challenge_status_for(profile: dict[str, Any]) -> list[dict[str, Any]]:
    # Demo/lightweight signal: a quiz passing in an entanglement-flavoured
    # module is used as a stand-in for "did the related challenge" until
    # challenge_submissions are joined in per-user (left as a follow-up once
    # a real Supabase project + auth sessions are wired end-to-end).
    quizzes = {q["quiz_id"]: q for q in (profile.get("quizzes") or [])}
    bell = quizzes.get("q2_bell_states")
    grover = quizzes.get("q5_grover_oracle")
    return [
        {"name": "Build a Bell state circuit",
         "status": "completed" if bell and bell.get("passed") else ("in_progress" if bell else "not_started")},
        {"name": "Grover search (2-qubit)",
         "status": "completed" if grover and grover.get("score", 0) >= 85 else ("in_progress" if grover else "not_started")},
    ]


def build_cohort_summary(cohort_id: str, cohort_name: str | None = None) -> dict[str, Any]:
    modules = _module_titles()
    lessons_by_module = _lessons_by_module()
    profiles = repo.get_cohort_profiles(cohort_id)

    students = []
    for profile in profiles:
        module_progress = _module_progress_for(profile, modules, lessons_by_module)
        completion_pct = round(sum(module_progress) / len(module_progress)) if module_progress else 0
        quizzes_out = [
            {"name": q["title"], "score": round(q["score"] / 10), "max": 10}
            for q in (profile.get("quizzes") or [])
        ]
        students.append({
            "id": profile["user_id"],
            "name": profile.get("name", "Student"),
            "completionPct": completion_pct,
            "moduleProgress": module_progress,
            "quizzes": quizzes_out,
            "challenges": _challenge_status_for(profile),
            "lastActive": "recently",
        })

    return {
        "cohortName": cohort_name or repo.get_demo_cohort_name(),
        "modules": [m["title"] for m in modules],
        "students": students,
    }
