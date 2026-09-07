"""
Learner profile tool for AI Tutor.
Pulls learner history, quiz scores, and concept struggles from the Supabase/Content Service (Role 5),
with robust mock profiles for development, demos, and testing.
"""
from __future__ import annotations
import os
import logging
from typing import Dict, Any, Optional
import httpx

logger = logging.getLogger(__name__)

# Built-in demo and test profiles
DEMO_PROFILES: Dict[str, Dict[str, Any]] = {
    "beginner_alex": {
        "user_id": "beginner_alex",
        "name": "Alex",
        "skill_level": "beginner",
        "learning_style": "intuitive",
        "completed_lessons": [
            "module_1_qubits_intro",
            "module_1_superposition_basics"
        ],
        "current_module": "module_2_entanglement",
        "known_struggles": [
            "CNOT control vs target direction",
            "Difference between classical probability and quantum superposition"
        ],
        "quizzes": [
            {
                "quiz_id": "q1_superposition",
                "title": "Superposition & Hadamard",
                "score": 85.0,
                "passed": True,
                "weak_topics": ["Phase vs amplitude"]
            },
            {
                "quiz_id": "q2_bell_states",
                "title": "Introduction to Entanglement",
                "score": 50.0,
                "passed": False,
                "weak_topics": ["CNOT control/target order", "Bell measurement"]
            }
        ],
        "preferred_hint_depth": 1
    },
    "intermediate_sam": {
        "user_id": "intermediate_sam",
        "name": "Sam",
        "skill_level": "intermediate",
        "learning_style": "visual",
        "completed_lessons": [
            "module_1_qubits",
            "module_2_entanglement",
            "module_3_deutsch_jozsa",
            "module_4_quantum_teleportation"
        ],
        "current_module": "module_5_grovers_algorithm",
        "known_struggles": [
            "Phase kickback mechanism in oracle queries",
            "Diffuser reflection around the mean"
        ],
        "quizzes": [
            {
                "quiz_id": "q4_teleportation",
                "title": "Quantum Teleportation Protocol",
                "score": 90.0,
                "passed": True,
                "weak_topics": ["Classical feedforward corrections"]
            },
            {
                "quiz_id": "q5_grover_oracle",
                "title": "Oracle Formulation",
                "score": 68.0,
                "passed": True,
                "weak_topics": ["Multi-controlled phase flip", "Ancilla cleanup"]
            }
        ],
        "preferred_hint_depth": 2
    },
    "advanced_elena": {
        "user_id": "advanced_elena",
        "name": "Elena",
        "skill_level": "advanced",
        "learning_style": "mathematical",
        "completed_lessons": [
            "module_all_foundations",
            "module_grover",
            "module_qft",
            "module_shor",
            "module_vqe"
        ],
        "current_module": "module_qaoa_optimization",
        "known_struggles": [
            "Barren plateaus in variational circuits",
            "Unitary compilation gate synthesis"
        ],
        "quizzes": [
            {
                "quiz_id": "q_qft",
                "title": "Quantum Fourier Transform",
                "score": 98.0,
                "passed": True,
                "weak_topics": []
            }
        ],
        "preferred_hint_depth": 3
    }
}


def get_learner_profile(user_id: str = "beginner_alex") -> Dict[str, Any]:
    """
    Retrieve a learner's educational profile, skill level, past quiz scores,
    and identified concept weaknesses to personalize explanations and hints.

    Args:
        user_id: Unique user identifier (e.g., "beginner_alex", "intermediate_sam", "advanced_elena")

    Returns:
        Dictionary with:
        - user_id: str
        - name: str
        - skill_level: "beginner" | "intermediate" | "advanced"
        - learning_style: "intuitive" | "visual" | "mathematical"
        - completed_lessons: list of lesson IDs
        - known_struggles: list of topics learner has had difficulty with
        - quizzes: list of past quiz results
    """
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = (
        os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        or os.getenv("SUPABASE_PUBLISHABLE_KEY")
        or os.getenv("SUPABASE_ANON_KEY")
    )

    if supabase_url and supabase_key:
        try:
            with httpx.Client(timeout=5.0) as client:
                res = client.get(
                    f"{supabase_url.rstrip('/')}/rest/v1/user_profiles?user_id=eq.{user_id}&select=*",
                    headers={
                        "apikey": supabase_key,
                        "Authorization": f"Bearer {supabase_key}"
                    }
                )
                if res.status_code == 200:
                    data = res.json()
                    if data and len(data) > 0:
                        return data[0]
        except Exception as e:
            logger.warning(f"Could not connect to Supabase profile service: {e}. Using cached profile.")

    # Return registered demo profile if found, else default beginner profile
    if user_id in DEMO_PROFILES:
        return DEMO_PROFILES[user_id]

    return {
        "user_id": user_id,
        "name": "Student",
        "skill_level": "beginner",
        "learning_style": "intuitive",
        "completed_lessons": [],
        "known_struggles": ["Quantum superposition vs classical states"],
        "quizzes": [],
        "preferred_hint_depth": 1
    }
