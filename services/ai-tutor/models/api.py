"""
API request and response schemas for AI Tutor endpoints.
"""
from __future__ import annotations
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from .circuit import CircuitDefinition, SimulationResult
from .learner import SkillLevel, LearningStyle


class ChatMessage(BaseModel):
    role: str = Field(..., description="'user', 'model', or 'assistant'")
    content: str


class TutorChatRequest(BaseModel):
    user_id: Optional[str] = "default_learner"
    message: str = Field(..., description="Student's prompt or question")
    circuit: Optional[CircuitDefinition] = Field(
        default=None, description="Current circuit loaded on the learner canvas"
    )
    history: Optional[List[ChatMessage]] = Field(
        default_factory=list, description="Previous chat conversation history"
    )
    skill_level_override: Optional[SkillLevel] = None
    learning_style_override: Optional[LearningStyle] = None


class TutorChatResponse(BaseModel):
    response: str
    simulation_called: bool = False
    simulation_result: Optional[SimulationResult] = None
    suggested_questions: List[str] = Field(default_factory=list)


class ExplainRequest(BaseModel):
    user_id: Optional[str] = "default_learner"
    concept_or_circuit_query: Optional[str] = None
    circuit: Optional[CircuitDefinition] = None
    skill_level: Optional[SkillLevel] = None
    learning_style: Optional[LearningStyle] = None


class ExplainResponse(BaseModel):
    explanation: str
    state_breakdown: Optional[List[str]] = None
    visual_aid_cues: List[str] = Field(
        default_factory=list, description="Cues for frontend (e.g. highlight qubit 0, inspect Bloch sphere)"
    )


class DebugRequest(BaseModel):
    user_id: Optional[str] = "default_learner"
    circuit: CircuitDefinition = Field(..., description="Student's candidate circuit")
    target_objective: str = Field(
        ..., description="What the circuit is supposed to accomplish (e.g., 'Create Bell State |Phi+>')"
    )
    reference_circuit: Optional[CircuitDefinition] = None


class DebugResponse(BaseModel):
    is_correct: bool
    diagnosis: str
    simulation_output: Optional[SimulationResult] = None
    hints: List[str] = Field(
        default_factory=list, description="Tiered hints (Nudge, Clue, Structural suggestion)"
    )
    suggested_fix: Optional[str] = None


class OptimizeRequest(BaseModel):
    user_id: Optional[str] = "default_learner"
    circuit: CircuitDefinition
    target_criteria: Optional[str] = "Reduce gate count and depth while preserving unitary equivalence"


class OptimizeResponse(BaseModel):
    original_gate_count: int
    optimized_gate_count: int
    optimization_suggestions: List[str]
    optimized_circuit: Optional[CircuitDefinition] = None
    explanation: str
