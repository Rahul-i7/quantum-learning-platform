"""
Tests for Core QuantumAITutor workflows: chat, debugging, explain, and optimize.
"""
from core.tutor import QuantumAITutor
from models.circuit import CircuitDefinition, QuantumGate, GateType
from models.learner import SkillLevel


def test_tutor_debug_bell_state_correct():
    tutor = QuantumAITutor()
    bell_circuit = CircuitDefinition(
        num_qubits=2,
        gates=[
            QuantumGate(type=GateType.H, qubits=[0]),
            QuantumGate(type=GateType.CX, qubits=[0, 1])
        ]
    )
    res = tutor.debug_circuit(
        circuit=bell_circuit,
        target_objective="Create Bell State |Phi+>",
        user_id="beginner_alex"
    )
    assert res.is_correct is True
    assert res.simulation_output is not None
    assert abs(res.simulation_output.probabilities.get("00", 0.0) - 0.5) < 0.05
    assert abs(res.simulation_output.probabilities.get("11", 0.0) - 0.5) < 0.05


def test_tutor_debug_bell_state_missing_hadamard():
    tutor = QuantumAITutor()
    buggy_circuit = CircuitDefinition(
        num_qubits=2,
        gates=[
            QuantumGate(type=GateType.CX, qubits=[0, 1])  # Missing H gate
        ]
    )
    res = tutor.debug_circuit(
        circuit=buggy_circuit,
        target_objective="Create Bell State |Phi+>",
        user_id="beginner_alex"
    )
    assert res.is_correct is False
    assert len(res.hints) >= 1


def test_tutor_optimize_circuit_cancellation():
    tutor = QuantumAITutor()
    redundant_circuit = CircuitDefinition(
        num_qubits=1,
        gates=[
            QuantumGate(type=GateType.H, qubits=[0]),
            QuantumGate(type=GateType.H, qubits=[0]),  # H * H = I
            QuantumGate(type=GateType.X, qubits=[0])
        ]
    )
    res = tutor.optimize_circuit(redundant_circuit)
    assert res.original_gate_count == 3
    assert res.optimized_gate_count == 1
    assert len(res.optimization_suggestions) >= 1
    assert res.optimized_circuit.gates[0].type == GateType.X


def test_tutor_chat_fallback_and_questions():
    tutor = QuantumAITutor()
    bell_circuit = CircuitDefinition(
        num_qubits=2,
        gates=[
            QuantumGate(type=GateType.H, qubits=[0]),
            QuantumGate(type=GateType.CX, qubits=[0, 1])
        ]
    )
    res = tutor.chat(
        message="Why do I observe equal 50% probabilities for |00> and |11>?",
        circuit=bell_circuit,
        user_id="beginner_alex"
    )
    assert res.simulation_called is True
    assert len(res.response) > 0
    assert len(res.suggested_questions) > 0
