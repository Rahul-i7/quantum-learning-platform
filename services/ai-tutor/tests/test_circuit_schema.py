"""
Tests for Circuit Definition Models and Schema Validation.
"""
import pytest
from pydantic import ValidationError
from models.circuit import CircuitDefinition, QuantumGate, GateType


def test_valid_bell_state_circuit():
    circuit_data = {
        "num_qubits": 2,
        "gates": [
            {"type": "h", "qubits": [0]},
            {"type": "cx", "qubits": [0, 1]},
            {"type": "measure", "qubits": [0, 1]}
        ]
    }
    circuit = CircuitDefinition(**circuit_data)
    assert circuit.num_qubits == 2
    assert len(circuit.gates) == 3
    assert circuit.gates[0].type == GateType.H
    assert circuit.gates[1].type == GateType.CX
    assert circuit.gates[1].qubits == [0, 1]


def test_qubit_index_validation():
    circuit_data = {
        "num_qubits": 2,
        "gates": [
            {"type": "h", "qubits": [3]}  # Exceeds num_qubits=2
        ]
    }
    circuit = CircuitDefinition(**circuit_data)
    with pytest.raises(ValueError, match="exceeds circuit capacity"):
        circuit.validate_qubit_indices()


def test_negative_qubit_rejection():
    with pytest.raises(ValidationError):
        QuantumGate(type=GateType.H, qubits=[-1])


def test_parameterized_rotation_gate():
    gate = QuantumGate(type=GateType.RX, qubits=[0], params=[3.14159])
    assert gate.params == [3.14159]
