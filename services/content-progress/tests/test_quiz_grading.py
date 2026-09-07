import pytest
from grading.quiz_grading import grade_quiz

QUESTIONS = [
    {"id": "q1", "correct_choice": "b", "concept_id": "gate-h", "topic": "Phase vs amplitude"},
    {"id": "q2", "correct_choice": "c", "concept_id": "gate-cx", "topic": "CNOT direction"},
]


def test_all_correct_passes():
    result = grade_quiz(QUESTIONS, {"q1": "b", "q2": "c"}, passing_score=70)
    assert result["score"] == 100.0
    assert result["passed"] is True
    assert result["weak_topics"] == []


def test_partial_score_and_weak_topics():
    result = grade_quiz(QUESTIONS, {"q1": "b", "q2": "x"}, passing_score=70)
    assert result["score"] == 50.0
    assert result["passed"] is False
    assert "CNOT direction" in result["weak_topics"]


def test_missing_answer_counts_as_wrong():
    result = grade_quiz(QUESTIONS, {"q1": "b"}, passing_score=70)
    assert result["score"] == 50.0


def test_concept_mastery_status_thresholds():
    result = grade_quiz(QUESTIONS, {"q1": "b", "q2": "c"}, passing_score=70)
    statuses = {c["concept_id"]: c["status"] for c in result["concept_results"]}
    assert statuses["gate-h"] == "mastered"
    assert statuses["gate-cx"] == "mastered"


def test_empty_questions_raises():
    with pytest.raises(ValueError):
        grade_quiz([], {}, passing_score=70)
