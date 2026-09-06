"""
Tests for Personalization Engine and Adaptive Hint Scaffolding.
"""
from models.learner import SkillLevel, LearningStyle, LearnerProfile
from personalization.engine import PersonalizationEngine
from tools.learner_profile_tool import get_learner_profile


def test_beginner_pedagogical_context():
    profile = get_learner_profile("beginner_alex")
    context = PersonalizationEngine.get_pedagogical_context(profile)

    assert "BEGINNER" in context
    assert "Alex" in context
    assert "Avoid intimidating matrix algebra" in context
    assert "CNOT control vs target direction" in context


def test_intermediate_pedagogical_context():
    profile = get_learner_profile("intermediate_sam")
    context = PersonalizationEngine.get_pedagogical_context(profile)

    assert "INTERMEDIATE" in context
    assert "Dirac bra-ket notation" in context
    assert "Phase kickback" in context


def test_advanced_pedagogical_context():
    profile = get_learner_profile("advanced_elena")
    context = PersonalizationEngine.get_pedagogical_context(profile)

    assert "ADVANCED" in context
    assert "unitary matrix mechanics" in context


def test_tiered_hints_generation():
    hints = PersonalizationEngine.generate_tiered_hints("Missing Hadamard gate", SkillLevel.BEGINNER)
    assert len(hints) == 3
    assert "Hint 1 (Nudge)" in hints[0]
    assert "Hint 2 (Clue)" in hints[1]
    assert "Hint 3 (Structural)" in hints[2]
    assert "Hadamard" in hints[2] or "superposition" in hints[1].lower()
