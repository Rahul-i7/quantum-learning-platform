"""
Learner profile models for personalized tutoring.
"""
from __future__ import annotations
from enum import Enum
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field


class SkillLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class LearningStyle(str, Enum):
    VISUAL = "visual"          # Focus on Bloch spheres, diagrams, circuit tracks
    INTUITIVE = "intuitive"    # Focus on analogies (coin flips, waves, gears)
    MATHEMATICAL = "mathematical"  # Focus on Dirac notation, matrices, unitary algebra


class ConceptStatus(str, Enum):
    NOT_STARTED = "not_started"
    STRUGGLING = "struggling"
    LEARNING = "learning"
    MASTERED = "mastered"


class ConceptMastery(BaseModel):
    concept_id: str
    concept_name: str
    status: ConceptStatus = ConceptStatus.NOT_STARTED
    accuracy_rate: float = Field(default=0.0, ge=0.0, le=1.0)
    attempts: int = 0
    last_practiced: Optional[str] = None


class QuizSummary(BaseModel):
    quiz_id: str
    title: str
    score: float = Field(..., ge=0.0, le=100.0)
    passed: bool
    weak_topics: List[str] = Field(default_factory=list)


class LearnerProfile(BaseModel):
    user_id: str
    name: str = "Learner"
    skill_level: SkillLevel = SkillLevel.BEGINNER
    learning_style: LearningStyle = LearningStyle.INTUITIVE
    completed_lessons: List[str] = Field(default_factory=list)
    current_module: Optional[str] = None
    quizzes: List[QuizSummary] = Field(default_factory=list)
    concepts: Dict[str, ConceptMastery] = Field(default_factory=dict)
    known_struggles: List[str] = Field(
        default_factory=list,
        description="Concepts where the learner has repeatedly made errors (e.g. phase kickback, CNOT direction)"
    )
    preferred_hint_depth: int = Field(
        default=1, ge=1, le=3,
        description="1 = High-level nudge, 2 = Conceptual hint, 3 = Detailed breakdown"
    )
