"""
Creates the three demo learners (beginner_alex, intermediate_sam, advanced_elena)
as real Supabase Auth users, plus matching profiles / quiz_attempts /
concept_mastery rows, so that:

  GET {SUPABASE_URL}/rest/v1/user_profiles?user_id=eq.<uuid>&select=*

returns data shaped exactly like services/ai-tutor/tools/learner_profile_tool.py's
DEMO_PROFILES dict. Run this once against a fresh project, after schema.sql
and seed.sql have been applied.

Usage:
    export SUPABASE_URL=https://xxxx.supabase.co
    export SUPABASE_SERVICE_ROLE_KEY=...
    python scripts/seed_demo_users.py
"""
from __future__ import annotations
import os
import sys
import httpx

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

if not SUPABASE_URL or not SERVICE_KEY:
    print("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.", file=sys.stderr)
    sys.exit(1)

HEADERS = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
}

DEMO_USERS = [
    {
        "email": "beginner_alex@demo.quantum.edu",
        "password": "demo-password-alex-1!",
        "profile": {
            "name": "Alex",
            "skill_level": "beginner",
            "learning_style": "intuitive",
            "current_module": "module_2_entanglement",
            "preferred_hint_depth": 1,
            "known_struggles": [
                "CNOT control vs target direction",
                "Difference between classical probability and quantum superposition",
            ],
        },
        "lessons": ["module_1_qubits_intro", "module_1_superposition_basics"],
        "quiz_attempts": [
            {"quiz_id": "q1_superposition", "score": 85.0, "passed": True, "weak_topics": ["Phase vs amplitude"]},
            {"quiz_id": "q2_bell_states", "score": 50.0, "passed": False,
             "weak_topics": ["CNOT control/target order", "Bell measurement"]},
        ],
        "concepts": [
            {"concept_id": "gate-cx", "concept_name": "CNOT direction", "status": "struggling",
             "accuracy_rate": 0.4, "attempts": 3},
        ],
    },
    {
        "email": "intermediate_sam@demo.quantum.edu",
        "password": "demo-password-sam-1!",
        "profile": {
            "name": "Sam",
            "skill_level": "intermediate",
            "learning_style": "visual",
            "current_module": "module_5_grovers_algorithm",
            "preferred_hint_depth": 2,
            "known_struggles": [
                "Phase kickback mechanism in oracle queries",
                "Diffuser reflection around the mean",
            ],
        },
        "lessons": ["module_1_qubits_intro", "module_1_superposition_basics", "module_2_entanglement_intro"],
        "quiz_attempts": [
            {"quiz_id": "q4_teleportation", "score": 90.0, "passed": True,
             "weak_topics": ["Classical feedforward corrections"]},
            {"quiz_id": "q5_grover_oracle", "score": 68.0, "passed": True,
             "weak_topics": ["Multi-controlled phase flip", "Ancilla cleanup"]},
        ],
        "concepts": [
            {"concept_id": "grover-oracle", "concept_name": "Oracle phase kickback", "status": "learning",
             "accuracy_rate": 0.68, "attempts": 5},
        ],
    },
    {
        "email": "advanced_elena@demo.quantum.edu",
        "password": "demo-password-elena-1!",
        "profile": {
            "name": "Elena",
            "skill_level": "advanced",
            "learning_style": "mathematical",
            "current_module": "module_qaoa_optimization",
            "preferred_hint_depth": 3,
            "known_struggles": [
                "Barren plateaus in variational circuits",
                "Unitary compilation gate synthesis",
            ],
        },
        "lessons": ["module_1_qubits_intro", "module_1_superposition_basics", "module_2_entanglement_intro"],
        "quiz_attempts": [
            {"quiz_id": "q_qft", "score": 98.0, "passed": True, "weak_topics": []},
        ],
        "concepts": [],
    },
]


def create_auth_user(email: str, password: str) -> str:
    res = httpx.post(
        f"{SUPABASE_URL}/auth/v1/admin/users",
        headers=HEADERS,
        json={"email": email, "password": password, "email_confirm": True},
        timeout=10.0,
    )
    if res.status_code == 422 or (res.status_code == 400 and "already" in res.text.lower()):
        # Already exists — look it up.
        lookup = httpx.get(
            f"{SUPABASE_URL}/auth/v1/admin/users",
            headers=HEADERS,
            params={"email": email},
            timeout=10.0,
        )
        lookup.raise_for_status()
        users = lookup.json().get("users", [])
        if not users:
            raise RuntimeError(f"Could not find or create user {email}")
        return users[0]["id"]
    res.raise_for_status()
    return res.json()["id"]


def upsert(table: str, rows: list[dict], on_conflict: str | None = None) -> None:
    if not rows:
        return
    params = {"on_conflict": on_conflict} if on_conflict else {}
    res = httpx.post(
        f"{SUPABASE_URL}/rest/v1/{table}",
        headers={**HEADERS, "Prefer": "resolution=merge-duplicates"},
        params=params,
        json=rows,
        timeout=10.0,
    )
    res.raise_for_status()


def main() -> None:
    for demo in DEMO_USERS:
        user_id = create_auth_user(demo["email"], demo["password"])
        print(f"{demo['email']} -> {user_id}")

        upsert("profiles", [{"user_id": user_id, **demo["profile"]}], on_conflict="user_id")

        upsert("lesson_progress", [
            {"user_id": user_id, "lesson_id": lesson_id} for lesson_id in demo["lessons"]
        ])

        upsert("quiz_attempts", [
            {"user_id": user_id, "answers": {}, **qa} for qa in demo["quiz_attempts"]
        ])

        upsert("concept_mastery", [
            {"user_id": user_id, **c} for c in demo["concepts"]
        ], on_conflict="user_id,concept_id")

        # Enroll in the demo cohort so the instructor dashboard has data.
        upsert("cohort_members", [
            {"cohort_id": "00000000-0000-0000-0000-0000000000c1", "user_id": user_id}
        ], on_conflict="cohort_id,user_id")

    print("Done. Demo learners now live at /rest/v1/user_profiles?user_id=eq.<uuid>")


if __name__ == "__main__":
    main()
