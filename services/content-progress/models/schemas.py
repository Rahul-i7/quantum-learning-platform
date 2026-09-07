from __future__ import annotations
from typing import Any, Optional
from pydantic import BaseModel, Field


# --- Quiz grading ---------------------------------------------------------

class QuizSubmitRequest(BaseModel):
    user_id: str
    answers: dict[str, str] = Field(..., description="question_id -> chosen choice_id")


class QuizSubmitResponse(BaseModel):
    quiz_id: str
    score: float
    passed: bool
    weak_topics: list[str]
    per_question: list[dict[str, Any]]


# --- Coding challenge grading ---------------------------------------------

class GateDef(BaseModel):
    type: str
    qubits: list[int]
    clbits: Optional[list[int]] = None
    params: Optional[list[float]] = None


class CircuitPayload(BaseModel):
    num_qubits: int
    num_clbits: Optional[int] = None
    gates: list[GateDef]
    shots: int = 1024


class ChallengeSubmitRequest(BaseModel):
    user_id: str
    circuit: CircuitPayload


class ChallengeSubmitResponse(BaseModel):
    challenge_id: str
    status: str
    score: Optional[float]
    passed: bool
    feedback: str
    sim_result: Optional[dict[str, Any]] = None


# --- Lesson progress -------------------------------------------------------

class LessonCompleteRequest(BaseModel):
    user_id: str
    lesson_id: str


# --- Progress / instructor dashboard ---------------------------------------

class LearnerProgressSummary(BaseModel):
    user_id: str
    name: str
    skill_level: str
    completion_pct: int
    completed_lessons: list[str]
    quizzes: list[dict[str, Any]]
    concepts: dict[str, Any]
    known_struggles: list[str]


class ModuleProgress(BaseModel):
    module: str
    avg_completion: int


class CohortStudent(BaseModel):
    id: str
    name: str
    completionPct: int
    moduleProgress: list[int]
    quizzes: list[dict[str, Any]]
    challenges: list[dict[str, Any]]
    lastActive: str


class CohortSummary(BaseModel):
    cohortName: str
    modules: list[str]
    students: list[CohortStudent]
