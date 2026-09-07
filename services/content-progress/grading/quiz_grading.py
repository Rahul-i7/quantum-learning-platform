"""
Quiz grading (Role 5). Pure function over quiz questions + submitted
answers — no I/O here, so it's trivially unit-testable. main.py wires the
result into repository writes (quiz_attempts + concept_mastery).
"""
from __future__ import annotations
from typing import Any


def grade_quiz(questions: list[dict[str, Any]], answers: dict[str, str],
                passing_score: float) -> dict[str, Any]:
    """
    questions: rows from quiz_questions, MUST include 'correct_choice'
               (never send these to the browser client un-stripped).
    answers:   {question_id: chosen_choice_id}
    """
    if not questions:
        raise ValueError("Quiz has no questions to grade.")

    per_question = []
    correct_count = 0
    weak_topics: list[str] = []
    concept_updates: dict[str, dict[str, Any]] = {}

    for q in questions:
        qid = str(q["id"])
        chosen = answers.get(qid)
        is_correct = chosen is not None and chosen == q["correct_choice"]
        if is_correct:
            correct_count += 1
        else:
            if q.get("topic"):
                weak_topics.append(q["topic"])

        concept_id = q.get("concept_id")
        if concept_id:
            bucket = concept_updates.setdefault(concept_id, {"correct": 0, "total": 0})
            bucket["total"] += 1
            if is_correct:
                bucket["correct"] += 1

        per_question.append({
            "question_id": qid,
            "correct": is_correct,
            "chosen": chosen,
            "correct_choice": q["correct_choice"],
            "explanation": q.get("explanation"),
        })

    score = round((correct_count / len(questions)) * 100, 2)
    passed = score >= passing_score

    concept_results = []
    for concept_id, bucket in concept_updates.items():
        accuracy = bucket["correct"] / bucket["total"]
        status = _status_for_accuracy(accuracy)
        concept_results.append({"concept_id": concept_id, "accuracy_rate": accuracy, "status": status})

    return {
        "score": score,
        "passed": passed,
        "weak_topics": weak_topics,
        "per_question": per_question,
        "concept_results": concept_results,
    }


def _status_for_accuracy(accuracy: float) -> str:
    if accuracy >= 0.85:
        return "mastered"
    if accuracy >= 0.6:
        return "learning"
    return "struggling"
