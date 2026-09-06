"""
Personalization engine that tailors explanations, hints, and debugging feedback
based on learner performance, skill level, and historical struggles.
"""
from __future__ import annotations
from typing import Dict, Any, List, Optional
try:
    from ..models.learner import SkillLevel, LearningStyle, LearnerProfile
    from .models import POLICIES, PedagogicalPolicy
except (ImportError, ValueError):
    from models.learner import SkillLevel, LearningStyle, LearnerProfile
    from personalization.models import POLICIES, PedagogicalPolicy


class PersonalizationEngine:
    """
    Constructs personalized pedagogical context to inject into Gemini prompts.
    """

    @classmethod
    def get_pedagogical_context(
        cls,
        profile: Dict[str, Any] | LearnerProfile,
        skill_override: Optional[SkillLevel] = None,
        style_override: Optional[LearningStyle] = None
    ) -> str:
        """
        Produce a tailored prompt snippet detailing learner level, struggles,
        and pedagogical directives for Gemini.
        """
        if isinstance(profile, LearnerProfile):
            prof_dict = profile.model_dump()
        else:
            prof_dict = profile

        skill = skill_override or SkillLevel(prof_dict.get("skill_level", "beginner"))
        style = style_override or LearningStyle(prof_dict.get("learning_style", "intuitive"))
        name = prof_dict.get("name", "Student")
        struggles = prof_dict.get("known_struggles", [])
        quizzes = prof_dict.get("quizzes", [])
        hint_depth = prof_dict.get("preferred_hint_depth", 1)

        policy_info = POLICIES.get(skill, POLICIES[SkillLevel.BEGINNER])

        context_lines = [
            "### LEARNER PROFILE & PERSONALIZATION DIRECTIVES",
            f"- **Student Name**: {name}",
            f"- **Skill Level**: {skill.value.upper()}",
            f"- **Preferred Learning Style**: {style.value.upper()}",
            f"- **Pedagogical Policy**: {policy_info['tone']}",
        ]

        if struggles:
            context_lines.append("- **Known Student Vulnerabilities / Misconceptions**:")
            for s in struggles:
                context_lines.append(f"  * {s}")
            context_lines.append(
                "  -> *Instruction*: If the student's question touches these topics, "
                "address the specific misconception gently and clearly!"
            )

        if quizzes:
            recent_failed = [q for q in quizzes if not q.get("passed", True)]
            if recent_failed:
                weak_topics = []
                for q in recent_failed:
                    weak_topics.extend(q.get("weak_topics", []))
                if weak_topics:
                    context_lines.append(
                        f"- **Recent Quiz Struggle Topics**: {', '.join(set(weak_topics))}"
                    )

        if style == LearningStyle.VISUAL:
            context_lines.append(
                "- **Visual Emphasis**: Explicitly describe what the Bloch sphere looks like "
                "(e.g., pointing towards +Z |0>, rotating along X axis, pointing to equator |+>)."
            )
        elif style == LearningStyle.INTUITIVE:
            analogies = policy_info.get("recommended_analogies", [])
            if analogies:
                context_lines.append(
                    f"- **Analogy Suggestion**: Consider relating concepts to: {analogies[0]}."
                )
        elif style == LearningStyle.MATHEMATICAL:
            context_lines.append(
                "- **Mathematical Precision**: Provide state formulas, probability amplitudes, and exact unitary matrices."
            )

        context_lines.append(
            f"- **Hint Scaffolding Preference**: Tier {hint_depth} (Tier 1 = Gentle guiding question, "
            "Tier 2 = Conceptual clue, Tier 3 = Structural code/gate hint)."
        )

        return "\n".join(context_lines)

    @classmethod
    def generate_tiered_hints(
        cls,
        issue_summary: str,
        skill_level: SkillLevel = SkillLevel.BEGINNER
    ) -> List[str]:
        """
        Generate three levels of scaffolded Socratic hints for a diagnosed circuit bug.
        """
        if "hadamard" in issue_summary.lower() or "superposition" in issue_summary.lower():
            return [
                "Hint 1 (Nudge): Look at the first qubit before any multi-qubit gates are applied. Is it in a definite classical state or a quantum superposition?",
                "Hint 2 (Clue): To create entanglement, we must first put one qubit into an equal superposition of |0> and |1>. Which single-qubit gate accomplishes this?",
                "Hint 3 (Structural): Place a Hadamard (H) gate on qubit 0 before applying the CNOT gate to qubit 1."
            ]
        elif "cnot" in issue_summary.lower() or "direction" in issue_summary.lower() or "control" in issue_summary.lower():
            return [
                "Hint 1 (Nudge): Notice the roles of the two qubits in the entangling gate. Which wire is controlling the flip?",
                "Hint 2 (Clue): Check the order of qubits in the CX gate: [control, target]. If qubit 0 is in superposition, qubit 1 should be the one getting flipped!",
                "Hint 3 (Structural): Ensure the CNOT is configured with qubit 0 as control and qubit 1 as target (e.g., {'type': 'cx', 'qubits': [0, 1]})."
            ]
        elif "measure" in issue_summary.lower():
            return [
                "Hint 1 (Nudge): Consider where the measurement gates are placed in the circuit timeline.",
                "Hint 2 (Clue): Remember that measuring a qubit collapses its quantum state immediately to either 0 or 1. Any subsequent quantum interference or entanglement will be lost!",
                "Hint 3 (Structural): Move all measurement gates to the very end of the circuit after all quantum logic gates have finished executing."
            ]
        else:
            return [
                "Hint 1 (Nudge): Review the expected output state vs what the simulator produced. Which basis states have non-zero probability?",
                "Hint 2 (Clue): Trace the quantum state step by step through each gate to find where the amplitudes diverge from the target.",
                f"Hint 3 (Structural): Issue identified: {issue_summary}. Adjust the gate parameters or wiring to match the required unitary transformation."
            ]
