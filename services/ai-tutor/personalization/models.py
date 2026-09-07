"""
Personalization data models and pedagogical policy configurations.
"""
from __future__ import annotations
from dataclasses import dataclass
from typing import List, Dict, Any
try:
    from ..models.learner import SkillLevel, LearningStyle
except (ImportError, ValueError):
    from models.learner import SkillLevel, LearningStyle


@dataclass
class PedagogicalPolicy:
    skill_level: SkillLevel
    learning_style: LearningStyle
    math_formality_level: int      # 1 (Analogies only), 2 (Dirac bra-ket), 3 (Full matrix / unitary)
    scaffold_guidance_depth: int   # 1 (Broad nudge), 2 (Conceptual pointer), 3 (Stepwise structural guide)
    recommended_analogies: List[str]
    system_tone_instructions: str


POLICIES: Dict[SkillLevel, Dict[str, Any]] = {
    SkillLevel.BEGINNER: {
        "math_formality_level": 1,
        "scaffold_guidance_depth": 1,
        "recommended_analogies": [
            "Spinning coin (superposition vs classical heads/tails)",
            "Twin coins flipped simultaneously (entanglement correlation)",
            "Sunglasses / polarizing light filters (quantum measurement collapse)",
            "Ocean waves constructively and destructively cancelling (quantum interference)"
        ],
        "tone": (
            "You are a welcoming, patient, and visual quantum educator. "
            "Avoid intimidating matrix algebra. Explain ket notation like |0> and |1> simply as the quantum equivalent of classical bits 0 and 1. "
            "Use intuitive physical analogies (spinning coins, waves). "
            "Always celebrate curiosity and break down abstract ideas into tangible concepts."
        )
    },
    SkillLevel.INTERMEDIATE: {
        "math_formality_level": 2,
        "scaffold_guidance_depth": 2,
        "recommended_analogies": [
            "Phase clock representation (rotations on complex circle)",
            "Vector addition in 2^n Hilbert space",
            "Truth tables vs quantum state transitions"
        ],
        "tone": (
            "You are an encouraging, mathematically sound quantum mentor. "
            "Freely use standard Dirac bra-ket notation (|0>, |1>, |+>, |->, |Phi+>). "
            "Explain amplitudes, phases, probability amplitudes (|alpha|^2), and state evolutions step by step. "
            "Focus on quantum algorithm mechanisms: phase kickback, amplitude amplification, and entanglement creation."
        )
    },
    SkillLevel.ADVANCED: {
        "math_formality_level": 3,
        "scaffold_guidance_depth": 3,
        "recommended_analogies": [
            "Unitary operator decomposition (SU(2) and Cartan decomposition)",
            "Eigenvalue estimation and spectral decomposition",
            "Noisy intermediate-scale quantum (NISQ) gate fidelity vs depth trade-offs"
        ],
        "tone": (
            "You are a rigorous quantum computing research mentor. "
            "Use complete unitary matrix mechanics, tensor products, density matrices, and Hamiltonian terms. "
            "Discuss gate synthesis, circuit depth optimization, commutation relations ([A, B] = 0), "
            "and computational complexity classes (BQP vs BPP vs NP)."
        )
    }
}
