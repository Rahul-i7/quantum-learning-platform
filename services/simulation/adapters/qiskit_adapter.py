"""
Qiskit adapter — translates the shared circuit JSON contract (see
shared/circuit-schema/schema.json) into a Qiskit circuit, runs it on Aer,
and returns results in a plain-JSON-serializable shape.

Kept as a standalone module (not a generic base class) on purpose for the
hackathon timeline. If a Cirq/PennyLane adapter is added later, extract a
tiny `SimulatorAdapter` protocol (build_circuit, run) and have both
implement it — main.py already only calls `simulate_circuit`, so that
swap won't touch the API layer.
"""
from __future__ import annotations

from typing import Any

from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator
from qiskit.quantum_info import Statevector

MAX_QUBITS = 20
SUPPORTED_GATES = {
    "h", "x", "y", "z", "s", "t", "sdg", "tdg",
    "rx", "ry", "rz",
    "cx", "cy", "cz", "swap", "ccx", "cswap",
    "measure",
}


class CircuitValidationError(ValueError):
    """Raised when the incoming circuit JSON is malformed or unsafe."""


def _validate(circuit_json: dict[str, Any]) -> None:
    num_qubits = circuit_json.get("num_qubits")
    if not isinstance(num_qubits, int) or not (1 <= num_qubits <= MAX_QUBITS):
        raise CircuitValidationError(
            f"num_qubits must be an integer between 1 and {MAX_QUBITS}"
        )

    gates = circuit_json.get("gates")
    if not isinstance(gates, list) or len(gates) == 0:
        raise CircuitValidationError("gates must be a non-empty list")

    for i, gate in enumerate(gates):
        gtype = gate.get("type")
        if gtype not in SUPPORTED_GATES:
            raise CircuitValidationError(f"gate[{i}]: unsupported type '{gtype}'")

        qubits = gate.get("qubits")
        if not isinstance(qubits, list) or not qubits:
            raise CircuitValidationError(f"gate[{i}]: 'qubits' must be a non-empty list")
        for q in qubits:
            if not isinstance(q, int) or not (0 <= q < num_qubits):
                raise CircuitValidationError(
                    f"gate[{i}]: qubit index {q} out of range for num_qubits={num_qubits}"
                )

        if gtype in ("rx", "ry", "rz"):
            params = gate.get("params")
            if not isinstance(params, list) or len(params) != 1:
                raise CircuitValidationError(f"gate[{i}]: '{gtype}' requires params=[angle]")


def build_circuit(
    circuit_json: dict[str, Any], include_measurements: bool = True
) -> QuantumCircuit:
    """Build a Qiskit QuantumCircuit from the shared JSON contract. Raises
    CircuitValidationError on any malformed input — call this before ever
    touching Qiskit's own APIs so validation errors are ours, not a stack
    trace from inside the library."""
    _validate(circuit_json)

    num_qubits = circuit_json["num_qubits"]
    num_clbits = circuit_json.get("num_clbits") or num_qubits
    qc = QuantumCircuit(num_qubits, num_clbits)

    for gate in circuit_json["gates"]:
        gtype = gate["type"]
        qubits = gate["qubits"]
        # Use `or` rather than dict.get(key, default): callers (e.g. the
        # Pydantic API layer) may send the key explicitly set to None
        # rather than omitting it, which defeats a plain .get() default.
        params = gate.get("params") or []

        if gtype == "measure":
            if not include_measurements:
                continue
            clbits = gate.get("clbits") or qubits
            qc.measure(qubits, clbits)
        elif gtype in ("rx", "ry", "rz"):
            getattr(qc, gtype)(params[0], qubits[0])
        elif gtype in ("h", "x", "y", "z", "s", "t", "sdg", "tdg"):
            getattr(qc, gtype)(qubits[0])
        elif gtype in ("cx", "cy", "cz", "swap"):
            getattr(qc, gtype)(qubits[0], qubits[1])
        elif gtype == "ccx":
            qc.ccx(qubits[0], qubits[1], qubits[2])
        elif gtype == "cswap":
            qc.cswap(qubits[0], qubits[1], qubits[2])

    return qc


def simulate_circuit(circuit_json: dict[str, Any]) -> dict[str, Any]:
    """Run the circuit and return the statevector (pre-measurement), measurement
    counts (when the circuit measures), and probabilities — all JSON-safe."""
    qc = build_circuit(circuit_json)
    has_measurement = any(g["type"] == "measure" for g in circuit_json["gates"])
    shots = circuit_json.get("shots", 1024)

    result: dict[str, Any] = {
        "num_qubits": circuit_json["num_qubits"],
        "statevector": None,
        "counts": None,
        "probabilities": None,
    }

    # Statevector of the circuit *as if no measurement had happened*. Learners want to see
    # the state before it collapses (Bloch sphere), and the measured counts below show the
    # outcome. Without this, any circuit containing a Measure gate lost its statevector,
    # and unmeasured qubits were misreported from counts (their classical bit stays 0).
    # Note: for mid-circuit measurements this ignores the collapse.
    qc_unitary = build_circuit(circuit_json, include_measurements=False)
    sv = Statevector.from_instruction(qc_unitary)
    result["statevector"] = [[c.real, c.imag] for c in sv.data]
    result["statevector_premeasurement"] = has_measurement

    if not has_measurement:
        result["probabilities"] = sv.probabilities_dict()
    else:
        backend = AerSimulator()
        job = backend.run(qc, shots=shots)
        counts = job.result().get_counts()
        result["counts"] = dict(counts)
        total = sum(counts.values())
        result["probabilities"] = {k: v / total for k, v in counts.items()}

    return result