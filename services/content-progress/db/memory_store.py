"""
In-memory fallback data store.

Used automatically when SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not
set (fresh clone, local dev, or a demo before the real Supabase project is
provisioned) so Roles 1, 2, and 4 can build and test against this service's
API immediately, with the exact same demo learners as
services/ai-tutor/tools/learner_profile_tool.py.

Not for production use — data resets on every process restart, and there is
no auth/RLS enforcement here (the FastAPI auth layer still applies).
"""
from __future__ import annotations
import copy
from datetime import datetime, timezone
from typing import Any

COURSES = [
    {"id": "quantum-foundations", "title": "Quantum Algorithm Foundations",
     "description": "Qubits through Grover's algorithm.", "order_index": 0}
]

MODULES = [
    {"id": "module_1_qubits", "course_id": "quantum-foundations", "title": "Qubits & Superposition", "order_index": 1},
    {"id": "module_2_entanglement", "course_id": "quantum-foundations", "title": "Entanglement", "order_index": 2},
    {"id": "module_3_deutsch_jozsa", "course_id": "quantum-foundations", "title": "Deutsch–Jozsa", "order_index": 3},
    {"id": "module_4_quantum_teleportation", "course_id": "quantum-foundations", "title": "Quantum Teleportation", "order_index": 4},
    {"id": "module_5_grovers_algorithm", "course_id": "quantum-foundations", "title": "Grover's Algorithm", "order_index": 5},
]

LESSONS = [
    {"id": "module_1_qubits_intro", "module_id": "module_1_qubits", "title": "Qubits & Superposition", "order_index": 1},
    {"id": "module_1_superposition_basics", "module_id": "module_1_qubits", "title": "Superposition Basics", "order_index": 2},
    {"id": "module_2_entanglement_intro", "module_id": "module_2_entanglement", "title": "What Is Entanglement", "order_index": 1},
]

QUIZZES = [
    {"id": "q1_superposition", "module_id": "module_1_qubits", "title": "Superposition & Hadamard", "passing_score": 70},
    {"id": "q2_bell_states", "module_id": "module_2_entanglement", "title": "Introduction to Entanglement", "passing_score": 70},
    {"id": "q4_teleportation", "module_id": "module_4_quantum_teleportation", "title": "Quantum Teleportation Protocol", "passing_score": 70},
    {"id": "q5_grover_oracle", "module_id": "module_5_grovers_algorithm", "title": "Oracle Formulation", "passing_score": 70},
]

QUIZ_QUESTIONS = [
    {"id": "qq1", "quiz_id": "q1_superposition", "order_index": 1,
     "prompt": "What does the Hadamard gate do to |0⟩?",
     "choices": [{"id": "a", "text": "Leaves it unchanged"}, {"id": "b", "text": "Flips it to |1⟩"},
                 {"id": "c", "text": "Produces an equal superposition of |0⟩ and |1⟩"}, {"id": "d", "text": "Measures it"}],
     "correct_choice": "c", "concept_id": "gate-h", "topic": "Phase vs amplitude",
     "explanation": "H maps |0⟩ to (|0⟩ + |1⟩)/√2 — a 50/50 superposition."},
    {"id": "qq2", "quiz_id": "q2_bell_states", "order_index": 1,
     "prompt": "In a CX (CNOT) gate, when does the target qubit flip?",
     "choices": [{"id": "a", "text": "Always"}, {"id": "b", "text": "Only when the control qubit is |1⟩"},
                 {"id": "c", "text": "Only when the target qubit is |1⟩"}, {"id": "d", "text": "Never"}],
     "correct_choice": "b", "concept_id": "gate-cx", "topic": "CNOT control/target order",
     "explanation": "CX flips the target only if the control qubit is |1⟩."},
    {"id": "qq3", "quiz_id": "q2_bell_states", "order_index": 2,
     "prompt": "After H(0) then CX(0,1) on |00⟩, which outcomes are possible on measurement?",
     "choices": [{"id": "a", "text": "Only 00"}, {"id": "b", "text": "00 and 11, each 50%"},
                 {"id": "c", "text": "00, 01, 10, 11 equally"}, {"id": "d", "text": "Only 11"}],
     "correct_choice": "b", "concept_id": "bell-state", "topic": "Bell measurement",
     "explanation": "This circuit produces the Bell state (|00⟩ + |11⟩)/√2."},
]

CODING_CHALLENGES = [
    {"id": "build-a-bell-state", "module_id": "module_2_entanglement", "title": "Build a Bell state circuit",
     "description": "Construct a 2-qubit circuit that produces the entangled Bell state (|00⟩ + |11⟩)/√2.",
     "starter_circuit": {"num_qubits": 2, "gates": []},
     "grading_mode": "probabilities", "expected_result": {"00": 0.5, "11": 0.5},
     "tolerance": 0.05, "required_gate_types": ["h", "cx"]},
    {"id": "grover-2-qubit-search", "module_id": "module_5_grovers_algorithm", "title": "Grover search (2-qubit)",
     "description": "Build a 2-qubit Grover circuit that amplifies the |11⟩ marked state.",
     "starter_circuit": {"num_qubits": 2, "gates": []},
     "grading_mode": "probabilities", "expected_result": {"11": 1.0},
     "tolerance": 0.1, "required_gate_types": ["h"]},
]

_DEMO_PROFILES: dict[str, dict[str, Any]] = {
    "beginner_alex": {
        "user_id": "beginner_alex", "name": "Alex", "skill_level": "beginner", "learning_style": "intuitive",
        "current_module": "module_2_entanglement", "preferred_hint_depth": 1,
        "known_struggles": ["CNOT control vs target direction",
                             "Difference between classical probability and quantum superposition"],
        "completed_lessons": ["module_1_qubits_intro", "module_1_superposition_basics"],
        "quizzes": [
            {"quiz_id": "q1_superposition", "title": "Superposition & Hadamard", "score": 85.0, "passed": True,
             "weak_topics": ["Phase vs amplitude"]},
            {"quiz_id": "q2_bell_states", "title": "Introduction to Entanglement", "score": 50.0, "passed": False,
             "weak_topics": ["CNOT control/target order", "Bell measurement"]},
        ],
        "concepts": {
            "gate-cx": {"concept_id": "gate-cx", "concept_name": "CNOT direction", "status": "struggling",
                        "accuracy_rate": 0.4, "attempts": 3, "last_practiced": None},
        },
    },
    "intermediate_sam": {
        "user_id": "intermediate_sam", "name": "Sam", "skill_level": "intermediate", "learning_style": "visual",
        "current_module": "module_5_grovers_algorithm", "preferred_hint_depth": 2,
        "known_struggles": ["Phase kickback mechanism in oracle queries", "Diffuser reflection around the mean"],
        "completed_lessons": ["module_1_qubits_intro", "module_1_superposition_basics", "module_2_entanglement_intro"],
        "quizzes": [
            {"quiz_id": "q4_teleportation", "title": "Quantum Teleportation Protocol", "score": 90.0, "passed": True,
             "weak_topics": ["Classical feedforward corrections"]},
            {"quiz_id": "q5_grover_oracle", "title": "Oracle Formulation", "score": 68.0, "passed": True,
             "weak_topics": ["Multi-controlled phase flip", "Ancilla cleanup"]},
        ],
        "concepts": {
            "grover-oracle": {"concept_id": "grover-oracle", "concept_name": "Oracle phase kickback",
                               "status": "learning", "accuracy_rate": 0.68, "attempts": 5, "last_practiced": None},
        },
    },
    "advanced_elena": {
        "user_id": "advanced_elena", "name": "Elena", "skill_level": "advanced", "learning_style": "mathematical",
        "current_module": "module_qaoa_optimization", "preferred_hint_depth": 3,
        "known_struggles": ["Barren plateaus in variational circuits", "Unitary compilation gate synthesis"],
        "completed_lessons": ["module_1_qubits_intro", "module_1_superposition_basics", "module_2_entanglement_intro"],
        "quizzes": [
            {"quiz_id": "q_qft", "title": "Quantum Fourier Transform", "score": 98.0, "passed": True, "weak_topics": []},
        ],
        "concepts": {},
    },
}

DEMO_COHORT_ID = "00000000-0000-0000-0000-0000000000c1"
DEMO_COHORT_NAME = "Section A — Week 6"


class MemoryStore:
    """Mutable in-process copy of the seed data, so submissions during a
    session actually update progress instead of being silently dropped."""

    def __init__(self) -> None:
        self.profiles: dict[str, dict[str, Any]] = copy.deepcopy(_DEMO_PROFILES)
        self.challenge_submissions: list[dict[str, Any]] = []

    def ensure_user(self, user_id: str) -> dict[str, Any]:
        if user_id not in self.profiles:
            self.profiles[user_id] = {
                "user_id": user_id, "name": "Student", "skill_level": "beginner",
                "learning_style": "intuitive", "current_module": None, "preferred_hint_depth": 1,
                "known_struggles": [], "completed_lessons": [], "quizzes": [], "concepts": {},
            }
        return self.profiles[user_id]

    def record_quiz_attempt(self, user_id: str, quiz_id: str, quiz_title: str, score: float,
                             passed: bool, weak_topics: list[str]) -> None:
        profile = self.ensure_user(user_id)
        profile["quizzes"].append({
            "quiz_id": quiz_id, "title": quiz_title, "score": score, "passed": passed, "weak_topics": weak_topics
        })

    def upsert_concept_mastery(self, user_id: str, concept_id: str, concept_name: str,
                                status: str, accuracy_rate: float, attempts_delta: int = 1) -> None:
        profile = self.ensure_user(user_id)
        existing = profile["concepts"].get(concept_id)
        attempts = (existing["attempts"] + attempts_delta) if existing else attempts_delta
        profile["concepts"][concept_id] = {
            "concept_id": concept_id, "concept_name": concept_name, "status": status,
            "accuracy_rate": accuracy_rate, "attempts": attempts,
            "last_practiced": datetime.now(timezone.utc).isoformat(),
        }

    def mark_lesson_complete(self, user_id: str, lesson_id: str) -> None:
        profile = self.ensure_user(user_id)
        if lesson_id not in profile["completed_lessons"]:
            profile["completed_lessons"].append(lesson_id)

    def record_challenge_submission(self, user_id: str, challenge_id: str, circuit: dict,
                                     status: str, score: float | None, passed: bool,
                                     feedback: str, sim_result: dict | None) -> dict:
        submission = {
            "id": f"sub_{len(self.challenge_submissions) + 1}",
            "user_id": user_id, "challenge_id": challenge_id, "circuit": circuit,
            "status": status, "score": score, "passed": passed, "feedback": feedback,
            "sim_result": sim_result, "created_at": datetime.now(timezone.utc).isoformat(),
        }
        self.challenge_submissions.append(submission)
        return submission

    def cohort_profiles(self, cohort_id: str) -> list[dict[str, Any]]:
        # Demo cohort = all seeded demo users.
        if cohort_id == DEMO_COHORT_ID:
            return list(self.profiles.values())
        return []


store = MemoryStore()
