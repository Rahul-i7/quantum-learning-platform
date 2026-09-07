"""
End-to-end API tests against the in-memory fallback store (no live Supabase
or Simulation Service needed for the non-grading endpoints; the challenge
submit endpoint mocks the simulation call).
"""
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_list_courses():
    res = client.get("/api/courses")
    assert res.status_code == 200
    assert any(c["id"] == "quantum-foundations" for c in res.json())


def test_quiz_questions_strip_answer_key():
    res = client.get("/api/quizzes/q2_bell_states/questions")
    assert res.status_code == 200
    body = res.json()
    for q in body["questions"]:
        assert "correct_choice" not in q


def test_quiz_not_found():
    res = client.get("/api/quizzes/does-not-exist/questions")
    assert res.status_code == 404


def test_submit_quiz_updates_profile():
    res = client.post("/api/quizzes/q2_bell_states/submit", json={
        "user_id": "test_learner_1",
        "answers": {"qq2": "b", "qq3": "b"},
    })
    assert res.status_code == 200
    body = res.json()
    assert body["score"] == 100.0
    assert body["passed"] is True

    progress = client.get("/api/progress/test_learner_1").json()
    assert any(q["quiz_id"] == "q2_bell_states" for q in progress["quizzes"])


@patch("grading.challenge_grading.run_simulation")
def test_submit_challenge_pass(mock_sim):
    mock_sim.return_value = {"probabilities": {"00": 0.5, "11": 0.5}, "counts": {}, "statevector": None}
    res = client.post("/api/challenges/build-a-bell-state/submit", json={
        "user_id": "test_learner_2",
        "circuit": {
            "num_qubits": 2,
            "gates": [
                {"type": "h", "qubits": [0]},
                {"type": "cx", "qubits": [0, 1]},
                {"type": "measure", "qubits": [0, 1]},
            ],
        },
    })
    assert res.status_code == 200
    assert res.json()["passed"] is True


def test_lesson_complete_reflected_in_progress():
    client.post("/api/lessons/complete", json={"user_id": "test_learner_3", "lesson_id": "module_1_qubits_intro"})
    progress = client.get("/api/progress/test_learner_3").json()
    assert "module_1_qubits_intro" in progress["completed_lessons"]


def test_user_profile_matches_ai_tutor_contract():
    res = client.get("/api/user_profiles/beginner_alex")
    assert res.status_code == 200
    body = res.json()
    for field in ["user_id", "name", "skill_level", "learning_style", "completed_lessons",
                  "quizzes", "concepts", "known_struggles", "preferred_hint_depth"]:
        assert field in body


def test_instructor_cohort_summary_shape():
    from db.memory_store import DEMO_COHORT_ID
    res = client.get(f"/api/instructor/cohort/{DEMO_COHORT_ID}")
    assert res.status_code == 200
    body = res.json()
    assert "cohortName" in body and "modules" in body and "students" in body
    if body["students"]:
        s = body["students"][0]
        for field in ["id", "name", "completionPct", "moduleProgress", "quizzes", "challenges", "lastActive"]:
            assert field in s
