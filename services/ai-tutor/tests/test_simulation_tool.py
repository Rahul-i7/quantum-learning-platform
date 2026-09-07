"""
Tests for Quantum Simulation Tool and Circuit Comparison.
"""
import math
import numpy as np
import pytest
from tools.simulation_tool import simulate_circuit, compare_circuits, LocalQuantumSimulator


def test_hadamard_superposition():
    """Verify H gate creates equal superposition |+> = (|0> + |1>) / sqrt(2)."""
    circuit = {
        "num_qubits": 1,
        "gates": [
            {"type": "h", "qubits": [0]}
        ]
    }
    result = simulate_circuit(circuit, shots=10000)
    assert result["success"] is True
    assert result["num_qubits"] == 1

    probs = result["probabilities"]
    assert abs(probs.get("0", 0.0) - 0.5) < 0.01
    assert abs(probs.get("1", 0.0) - 0.5) < 0.01

    # Check Bloch vector: pointing along +X (x=1.0, z=0.0)
    bloch = result["bloch_vectors"][0]
    assert abs(bloch["x"] - 1.0) < 0.01
    assert abs(bloch["z"] - 0.0) < 0.01


def test_bell_state_simulation():
    """Verify Bell state |Phi+> = (|00> + |11>) / sqrt(2)."""
    circuit = {
        "num_qubits": 2,
        "gates": [
            {"type": "h", "qubits": [0]},
            {"type": "cx", "qubits": [0, 1]}
        ]
    }
    result = simulate_circuit(circuit, shots=5000)
    assert result["success"] is True
    assert result["num_qubits"] == 2

    probs = result["probabilities"]
    assert abs(probs.get("00", 0.0) - 0.5) < 0.02
    assert abs(probs.get("11", 0.0) - 0.5) < 0.02
    # No |01> or |10> states should exist
    assert "01" not in probs or probs["01"] < 0.001
    assert "10" not in probs or probs["10"] < 0.001


def test_pauli_x_flip():
    """Verify Pauli X flips |0> to |1>."""
    circuit = {
        "num_qubits": 1,
        "gates": [
            {"type": "x", "qubits": [0]}
        ]
    }
    result = simulate_circuit(circuit, shots=1000)
    assert result["probabilities"].get("1", 0.0) == 1.0
    # Bloch vector points to South Pole (z = -1)
    bloch = result["bloch_vectors"][0]
    assert abs(bloch["z"] - (-1.0)) < 0.01


def test_interference_h_h_cancellation():
    """Verify H * H = I (constructive interference back to |0>)."""
    circuit = {
        "num_qubits": 1,
        "gates": [
            {"type": "h", "qubits": [0]},
            {"type": "h", "qubits": [0]}
        ]
    }
    result = simulate_circuit(circuit, shots=1000)
    assert result["probabilities"].get("0", 0.0) == 1.0


def test_compare_circuits_identical():
    """Comparing a circuit to itself should give 100% fidelity."""
    circuit = {
        "num_qubits": 2,
        "gates": [
            {"type": "h", "qubits": [0]},
            {"type": "cx", "qubits": [0, 1]}
        ]
    }
    comp = compare_circuits(circuit, circuit)
    assert comp["equivalent"] is True
    assert comp["state_fidelity"] == 1.0
    assert comp["probability_tv_distance"] == 0.0


def test_compare_circuits_buggy_candidate():
    """Candidate missing Hadamard compared to Bell state should fail."""
    target_bell = {
        "num_qubits": 2,
        "gates": [
            {"type": "h", "qubits": [0]},
            {"type": "cx", "qubits": [0, 1]}
        ]
    }
    buggy_candidate = {
        "num_qubits": 2,
        "gates": [
            {"type": "cx", "qubits": [0, 1]}  # Missing H
        ]
    }
    comp = compare_circuits(buggy_candidate, target_bell)
    assert comp["equivalent"] is False
    assert comp["state_fidelity"] < 0.8
    assert "Circuits differ" in comp["differences_summary"]
