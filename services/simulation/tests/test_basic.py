"""
Run with: pytest tests/test_basic.py -v
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from adapters.qiskit_adapter import simulate_circuit, CircuitValidationError


def test_bell_state_produces_00_and_11_only():
    circuit = {
        "num_qubits": 2,
        "shots": 2000,
        "gates": [
            {"type": "h", "qubits": [0]},
            {"type": "cx", "qubits": [0, 1]},
            {"type": "measure", "qubits": [0, 1]},
        ],
    }
    result = simulate_circuit(circuit)
    assert result["counts"] is not None
    for outcome in result["counts"]:
        assert outcome in ("00", "11")


def test_statevector_returned_when_no_measurement():
    circuit = {
        "num_qubits": 1,
        "gates": [{"type": "h", "qubits": [0]}],
    }
    result = simulate_circuit(circuit)
    assert result["statevector"] is not None
    assert result["counts"] is None


def test_rejects_out_of_range_qubit():
    circuit = {
        "num_qubits": 1,
        "gates": [{"type": "h", "qubits": [5]}],
    }
    with pytest.raises(CircuitValidationError):
        simulate_circuit(circuit)


def test_rejects_unsupported_gate():
    circuit = {
        "num_qubits": 1,
        "gates": [{"type": "not_a_real_gate", "qubits": [0]}],
    }
    with pytest.raises(CircuitValidationError):
        simulate_circuit(circuit)


def test_rejects_too_many_qubits():
    circuit = {
        "num_qubits": 50,
        "gates": [{"type": "h", "qubits": [0]}],
    }
    with pytest.raises(CircuitValidationError):
        simulate_circuit(circuit)
