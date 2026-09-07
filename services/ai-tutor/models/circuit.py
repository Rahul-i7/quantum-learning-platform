"""
Circuit data models conforming to shared circuit-schema contract.
"""
from __future__ import annotations
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator


class GateType(str, Enum):
    # Single qubit Pauli & Clifford
    H = "h"
    X = "x"
    Y = "y"
    Z = "z"
    S = "s"
    SDG = "sdg"
    T = "t"
    TDG = "tdg"
    # Single qubit rotation
    RX = "rx"
    RY = "ry"
    RZ = "rz"
    P = "p"
    # Two qubit
    CX = "cx"
    CNOT = "cnot"
    CZ = "cz"
    SWAP = "swap"
    # Three qubit
    CCX = "ccx"
    TOFFOLI = "toffoli"
    # Non-unitary
    MEASURE = "measure"
    BARRIER = "barrier"


class QuantumGate(BaseModel):
    type: GateType = Field(..., description="Type of gate/operation")
    qubits: List[int] = Field(..., min_length=1, description="Target qubit indices (controls first, then targets)")
    params: Optional[List[float]] = Field(default=None, description="Optional parameters for rotation gates (radians)")
    classical_bits: Optional[List[int]] = Field(default=None, description="Classical bit indices for measurement targets")

    @field_validator("qubits")
    def validate_qubits_non_negative(cls, v: List[int]) -> List[int]:
        for q in v:
            if q < 0:
                raise ValueError(f"Qubit index must be non-negative, got {q}")
        return v


class CircuitMetadata(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None


class CircuitDefinition(BaseModel):
    num_qubits: int = Field(..., ge=1, le=24, description="Total number of qubits in the circuit")
    num_classical_bits: Optional[int] = Field(default=0, ge=0, description="Total number of classical bits")
    metadata: Optional[CircuitMetadata] = None
    gates: List[QuantumGate] = Field(default_factory=list, description="Ordered sequence of gates")

    def validate_qubit_indices(self) -> None:
        """Validate that all gate qubit indices are within range [0, num_qubits - 1]."""
        for i, gate in enumerate(self.gates):
            for q in gate.qubits:
                if q >= self.num_qubits:
                    raise ValueError(
                        f"Gate #{i} ({gate.type}) targets qubit {q}, which exceeds circuit capacity ({self.num_qubits} qubits)."
                    )


class BlochCoordinates(BaseModel):
    qubit: int
    x: float
    y: float
    z: float


class SimulationResult(BaseModel):
    success: bool = True
    num_qubits: int
    statevector: Optional[List[complex]] = Field(
        default=None, description="Complex statevector amplitudes"
    )
    statevector_formatted: Optional[List[str]] = Field(
        default=None, description="Human-readable statevector amplitudes like '0.707 + 0.000j'"
    )
    probabilities: Dict[str, float] = Field(
        default_factory=dict, description="Theoretical measurement probabilities per computational basis state"
    )
    counts: Dict[str, int] = Field(
        default_factory=dict, description="Measurement counts from shots execution"
    )
    bloch_vectors: Optional[List[BlochCoordinates]] = Field(
        default=None, description="Bloch sphere coordinates (x, y, z) per qubit"
    )
    circuit_depth: Optional[int] = None
    gate_count: Optional[int] = None
    error: Optional[str] = None


class CircuitComparisonResult(BaseModel):
    equivalent: bool
    state_fidelity: float = Field(..., ge=0.0, le=1.0, description="Quantum state fidelity |<psi_cand|psi_ref>|^2")
    probability_tv_distance: float = Field(..., description="Total variation distance between measurement distributions")
    differences_summary: str
