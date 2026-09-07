"""
Simulation tool for AI Tutor.
Dispatches to the external Qiskit simulation service (Role 3), with a high-fidelity
built-in NumPy quantum state simulator fallback so the AI tutor functions autonomously.
"""
from __future__ import annotations
import json
import logging
import math
from typing import Dict, Any, List, Optional, Tuple
import numpy as np

logger = logging.getLogger(__name__)

# Standard 2x2 single-qubit quantum gate matrices
GATE_MATRICES: Dict[str, np.ndarray] = {
    "h": (1.0 / math.sqrt(2.0)) * np.array([[1, 1], [1, -1]], dtype=complex),
    "x": np.array([[0, 1], [1, 0]], dtype=complex),
    "y": np.array([[0, -1j], [1j, 0]], dtype=complex),
    "z": np.array([[1, 0], [0, -1]], dtype=complex),
    "s": np.array([[1, 0], [0, 1j]], dtype=complex),
    "sdg": np.array([[1, 0], [0, -1j]], dtype=complex),
    "t": np.array([[1, 0], [0, np.exp(1j * np.pi / 4)]], dtype=complex),
    "tdg": np.array([[1, 0], [0, np.exp(-1j * np.pi / 4)]], dtype=complex),
}


def _get_rotation_matrix(gate_type: str, angle: float) -> np.ndarray:
    """Generate 2x2 unitary for parameterized rotation gates."""
    half = angle / 2.0
    if gate_type == "rx":
        return np.array([
            [math.cos(half), -1j * math.sin(half)],
            [-1j * math.sin(half), math.cos(half)]
        ], dtype=complex)
    elif gate_type == "ry":
        return np.array([
            [math.cos(half), -math.sin(half)],
            [math.sin(half), math.cos(half)]
        ], dtype=complex)
    elif gate_type == "rz":
        return np.array([
            [np.exp(-1j * half), 0],
            [0, np.exp(1j * half)]
        ], dtype=complex)
    elif gate_type == "p":
        return np.array([
            [1.0, 0],
            [0, np.exp(1j * angle)]
        ], dtype=complex)
    raise ValueError(f"Unknown rotation gate: {gate_type}")


class LocalQuantumSimulator:
    """
    Exact statevector and shot simulator for educational circuits (up to 16 qubits).
    Follows standard textbook Qiskit convention (little-endian: qubit 0 is least significant bit).
    """

    @classmethod
    def simulate(cls, circuit_data: Dict[str, Any], shots: int = 1024) -> Dict[str, Any]:
        num_qubits = circuit_data.get("num_qubits", 1)
        if num_qubits < 1 or num_qubits > 16:
            return {
                "success": False,
                "error": f"Circuit qubit count {num_qubits} is outside supported range (1-16)",
                "num_qubits": num_qubits
            }

        dim = 1 << num_qubits
        # Initial state |0...0>
        state = np.zeros(dim, dtype=complex)
        state[0] = 1.0

        gates = circuit_data.get("gates", [])
        gate_count = 0
        circuit_depth = 0
        qubit_depths = [0] * num_qubits
        for g in gates:
            raw_type = g.get("type", "")
            if hasattr(raw_type, "value"):
                g_type = str(raw_type.value).lower()
            else:
                g_type = str(raw_type).split(".")[-1].lower()
            qubits = g.get("qubits", [])
            params = g.get("params", []) or []

            if g_type == "barrier":
                continue

            if g_type == "measure":
                # We calculate pure statevector right before measurement,
                # then sample counts at the end.
                continue

            gate_count += 1
            max_d = max([qubit_depths[q] for q in qubits], default=0) + 1
            for q in qubits:
                qubit_depths[q] = max_d

            # 1-Qubit Gates
            if g_type in GATE_MATRICES:
                u = GATE_MATRICES[g_type]
                state = cls._apply_single_qubit_gate(state, num_qubits, qubits[0], u)
            elif g_type in ("rx", "ry", "rz", "p"):
                angle = float(params[0]) if params else 0.0
                u = _get_rotation_matrix(g_type, angle)
                state = cls._apply_single_qubit_gate(state, num_qubits, qubits[0], u)
            # 2-Qubit Gates
            elif g_type in ("cx", "cnot"):
                if len(qubits) >= 2:
                    state = cls._apply_cnot(state, num_qubits, control=qubits[0], target=qubits[1])
            elif g_type == "cz":
                if len(qubits) >= 2:
                    state = cls._apply_cz(state, num_qubits, q1=qubits[0], q2=qubits[1])
            elif g_type == "swap":
                if len(qubits) >= 2:
                    state = cls._apply_swap(state, num_qubits, q1=qubits[0], q2=qubits[1])
            # 3-Qubit Gates
            elif g_type in ("ccx", "toffoli"):
                if len(qubits) >= 3:
                    state = cls._apply_toffoli(
                        state, num_qubits, c1=qubits[0], c2=qubits[1], target=qubits[2]
                    )

        circuit_depth = max(qubit_depths, default=0)

        # Calculate exact theoretical probabilities
        probabilities_raw = np.abs(state) ** 2
        probabilities: Dict[str, float] = {}
        for idx, prob in enumerate(probabilities_raw):
            if prob > 1e-6:
                # Little-endian binary representation matching qubit 0 as rightmost bit
                bitstring = bin(idx)[2:].zfill(num_qubits)
                probabilities[bitstring] = round(float(prob), 4)

        # Sample measurement counts using multinomial sampling
        counts: Dict[str, int] = {}
        if shots > 0:
            samples = np.random.multinomial(shots, probabilities_raw)
            for idx, count in enumerate(samples):
                if count > 0:
                    bitstring = bin(idx)[2:].zfill(num_qubits)
                    counts[bitstring] = int(count)

        # Compute Bloch coordinates for each qubit
        bloch_vectors = cls._compute_bloch_vectors(state, num_qubits)

        # Format statevector for display
        statevector_formatted = [
            f"{c.real:+.3f}{c.imag:+.3f}j" if abs(c.imag) > 1e-5 else f"{c.real:+.3f}"
            for c in state
        ]

        return {
            "success": True,
            "num_qubits": num_qubits,
            "statevector": [complex(c) for c in state],
            "statevector_formatted": statevector_formatted,
            "probabilities": probabilities,
            "counts": counts,
            "bloch_vectors": bloch_vectors,
            "circuit_depth": circuit_depth,
            "gate_count": gate_count,
            "error": None
        }

    @staticmethod
    def _apply_single_qubit_gate(state: np.ndarray, n: int, target: int, u: np.ndarray) -> np.ndarray:
        """Applies a 2x2 matrix U to target qubit in an n-qubit statevector."""
        # Reshape into tensor of shape (2, 2, ..., 2)
        tensor = state.reshape([2] * n)
        # Note: in little-endian, qubit 0 is index n-1 in tensor shape
        axis = n - 1 - target
        # Contract along target axis with U
        tensor = np.tensordot(u, tensor, axes=(1, axis))
        # tensordot puts the new dimension at axis 0; roll it back to original position
        tensor = np.moveaxis(tensor, 0, axis)
        return tensor.reshape(-1)

    @staticmethod
    def _apply_cnot(state: np.ndarray, n: int, control: int, target: int) -> np.ndarray:
        """Applies CX gate."""
        dim = 1 << n
        new_state = np.copy(state)
        ctrl_mask = 1 << control
        tgt_mask = 1 << target
        for i in range(dim):
            if (i & ctrl_mask) and not (i & tgt_mask):
                partner = i ^ tgt_mask
                new_state[i], new_state[partner] = state[partner], state[i]
        return new_state

    @staticmethod
    def _apply_cz(state: np.ndarray, n: int, q1: int, q2: int) -> np.ndarray:
        """Applies Controlled-Z gate."""
        dim = 1 << n
        new_state = np.copy(state)
        mask = (1 << q1) | (1 << q2)
        for i in range(dim):
            if (i & mask) == mask:
                new_state[i] = -state[i]
        return new_state

    @staticmethod
    def _apply_swap(state: np.ndarray, n: int, q1: int, q2: int) -> np.ndarray:
        """Applies SWAP gate."""
        dim = 1 << n
        new_state = np.copy(state)
        m1 = 1 << q1
        m2 = 1 << q2
        for i in range(dim):
            b1 = 1 if (i & m1) else 0
            b2 = 1 if (i & m2) else 0
            if b1 != b2 and b1 == 1:
                partner = (i ^ m1) | m2
                new_state[i], new_state[partner] = state[partner], state[i]
        return new_state

    @staticmethod
    def _apply_toffoli(state: np.ndarray, n: int, c1: int, c2: int, target: int) -> np.ndarray:
        """Applies 3-qubit CCX (Toffoli) gate."""
        dim = 1 << n
        new_state = np.copy(state)
        ctrl_mask = (1 << c1) | (1 << c2)
        tgt_mask = 1 << target
        for i in range(dim):
            if (i & ctrl_mask) == ctrl_mask and not (i & tgt_mask):
                partner = i ^ tgt_mask
                new_state[i], new_state[partner] = state[partner], state[i]
        return new_state

    @classmethod
    def _compute_bloch_vectors(cls, state: np.ndarray, n: int) -> List[Dict[str, float]]:
        """
        Computes single-qubit expectation values <X>, <Y>, <Z> for each qubit
        by taking partial traces (forming 1-qubit reduced density matrix).
        """
        bloch_list = []
        pauli_x = np.array([[0, 1], [1, 0]], dtype=complex)
        pauli_y = np.array([[0, -1j], [1j, 0]], dtype=complex)
        pauli_z = np.array([[1, 0], [0, -1]], dtype=complex)

        tensor = state.reshape([2] * n)
        for q in range(n):
            axis = n - 1 - q
            # Trace out all other qubits to form 2x2 reduced density matrix rho_q
            other_axes = [i for i in range(n) if i != axis]
            # Form density matrix |psi><psi|
            # Efficient contraction:
            # rho[a, b] = sum_k tensor[...a...] * conj(tensor[...b...])
            t_conj = np.conjugate(tensor)
            if other_axes:
                rho = np.tensordot(tensor, t_conj, axes=(other_axes, other_axes))
            else:
                rho = np.outer(state, np.conjugate(state))

            # Expectation values
            bx = float(np.real(np.trace(rho @ pauli_x)))
            by = float(np.real(np.trace(rho @ pauli_y)))
            bz = float(np.real(np.trace(rho @ pauli_z)))

            bloch_list.append({
                "qubit": q,
                "x": round(bx, 4),
                "y": round(by, 4),
                "z": round(bz, 4)
            })
        return bloch_list


def simulate_circuit(circuit: Dict[str, Any] | str, shots: int = 1024) -> Dict[str, Any]:
    """
    Simulate a quantum circuit to obtain its statevector, measurement counts,
    probabilities, and Bloch sphere coordinates.

    Args:
        circuit: Quantum circuit definition as a dictionary or JSON string, containing:
                 - num_qubits: int
                 - gates: list of {type: str, qubits: list[int], params: list[float]}
        shots: Number of measurement shots (default: 1024)

    Returns:
        A dictionary containing simulation results:
        - success: bool
        - num_qubits: int
        - probabilities: dict mapping computational basis bitstrings (e.g. "00", "11") to probabilities
        - counts: dict mapping bitstrings to shot frequencies
        - statevector_formatted: list of formatted complex amplitudes
        - bloch_vectors: list of {qubit, x, y, z} coordinates
        - circuit_depth: int
        - gate_count: int
    """
    import os
    import httpx

    # Parse JSON string if passed as string
    if isinstance(circuit, str):
        try:
            circuit = json.loads(circuit)
        except Exception as e:
            return {"success": False, "error": f"Invalid JSON format for circuit: {str(e)}"}

    sim_service_url = os.getenv("SIMULATION_SERVICE_URL")
    if sim_service_url:
        try:
            with httpx.Client(timeout=10.0) as client:
                res = client.post(
                    f"{sim_service_url.rstrip('/')}/simulate",
                    json={"circuit": circuit, "shots": shots}
                )
                if res.status_code == 200:
                    data = res.json()
                    return data
        except Exception:
            logger.debug(f"External simulation service ({sim_service_url}) not running. Using local quantum simulator.")

    # Built-in local quantum simulator fallback
    result = LocalQuantumSimulator.simulate(circuit, shots=shots)
    # Serialize complex numbers to string for JSON safety
    if "statevector" in result and result["statevector"] is not None:
        result["statevector"] = [f"{c.real:+.4f}{c.imag:+.4f}j" for c in result["statevector"]]
    return result


def compare_circuits(
    candidate_circuit: Dict[str, Any] | str,
    reference_circuit: Dict[str, Any] | str
) -> Dict[str, Any]:
    """
    Compare a student's candidate circuit with a reference target circuit.
    Evaluates quantum state fidelity |<candidate|reference>|^2 and measurement distribution similarity.

    Args:
        candidate_circuit: Student's circuit
        reference_circuit: Target goal circuit

    Returns:
        Dictionary with comparison metrics:
        - equivalent: bool (fidelity >= 0.99)
        - state_fidelity: float (0.0 to 1.0)
        - probability_tv_distance: float (total variation distance)
        - candidate_probabilities: dict
        - reference_probabilities: dict
        - differences_summary: str
    """
    if isinstance(candidate_circuit, str):
        candidate_circuit = json.loads(candidate_circuit)
    if isinstance(reference_circuit, str):
        reference_circuit = json.loads(reference_circuit)

    res_cand = LocalQuantumSimulator.simulate(candidate_circuit, shots=0)
    res_ref = LocalQuantumSimulator.simulate(reference_circuit, shots=0)

    if not res_cand["success"] or not res_ref["success"]:
        return {
            "equivalent": False,
            "error": "Failed to simulate one or both circuits",
            "state_fidelity": 0.0,
            "probability_tv_distance": 1.0,
            "differences_summary": f"Cand error: {res_cand.get('error')}, Ref error: {res_ref.get('error')}"
        }

    sv_cand = np.array(res_cand["statevector"], dtype=complex)
    sv_ref = np.array(res_ref["statevector"], dtype=complex)

    # Handle differing qubit counts
    if len(sv_cand) != len(sv_ref):
        return {
            "equivalent": False,
            "state_fidelity": 0.0,
            "probability_tv_distance": 1.0,
            "candidate_probabilities": res_cand["probabilities"],
            "reference_probabilities": res_ref["probabilities"],
            "differences_summary": (
                f"Qubit count mismatch: Candidate has {res_cand['num_qubits']} qubits, "
                f"reference requires {res_ref['num_qubits']} qubits."
            )
        }

    # Fidelity: |<psi_cand|psi_ref>|^2
    inner_product = np.vdot(sv_cand, sv_ref)
    fidelity = float(np.abs(inner_product) ** 2)

    # Total variation distance between measurement probability distributions:
    # 0.5 * sum |P_cand(x) - P_ref(x)|
    all_keys = set(res_cand["probabilities"].keys()) | set(res_ref["probabilities"].keys())
    tv_dist = 0.5 * sum(
        abs(res_cand["probabilities"].get(k, 0.0) - res_ref["probabilities"].get(k, 0.0))
        for k in all_keys
    )

    is_equiv = fidelity >= 0.99

    if is_equiv:
        summary = "Circuits are quantum-mechanically equivalent (State fidelity = 1.0)."
    else:
        summary = (
            f"Circuits differ: State fidelity is {fidelity:.3f}. "
            f"Expected state differs in measurement probabilities: {res_ref['probabilities']} "
            f"vs student output: {res_cand['probabilities']}."
        )

    return {
        "equivalent": is_equiv,
        "state_fidelity": round(fidelity, 4),
        "probability_tv_distance": round(float(tv_dist), 4),
        "candidate_probabilities": res_cand["probabilities"],
        "reference_probabilities": res_ref["probabilities"],
        "differences_summary": summary
    }
