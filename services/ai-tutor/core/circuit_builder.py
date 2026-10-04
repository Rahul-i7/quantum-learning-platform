
from __future__ import annotations
import json
import logging
import math
import re
from typing import Any, Dict, Optional, Tuple

try:
    from ..models.circuit import CircuitDefinition, GateType
except (ImportError, ValueError):
    from models.circuit import CircuitDefinition, GateType

logger = logging.getLogger(__name__)

# Gates the frontend builder palette can actually render and simulate.
BUILDER_GATES = {
    "h", "x", "y", "z", "s", "sdg", "t", "tdg",
    "rx", "ry", "rz", "cx", "cz", "swap", "ccx", "cswap", "measure",
}
MAX_BUILDER_QUBITS = 6

_BLOCK_RE = re.compile(r"```circuit\s*(\{.*?\})\s*```", re.DOTALL | re.IGNORECASE)


def bloch_target_to_gates(x: float, y: float, z: float, qubit: int = 0) -> Dict[str, Any]:
    """
    Compute the gates that move a single qubit from |0> (Bloch arrow pointing up, +Z)
    to a target direction on the Bloch sphere.

    Use this whenever the learner asks to "move the arrow" / "point the qubit" to a
    position. The target is a direction (x, y, z); it does not need to be normalised.
    Examples: +X = (1,0,0), -X = (-1,0,0), +Y = (0,1,0), -Z = (0,0,-1).

    Args:
        x: Target Bloch x component.
        y: Target Bloch y component.
        z: Target Bloch z component.
        qubit: Which qubit to rotate (default 0).

    Returns:
        {"gates": [...]} - ready-to-use gate list (ry then rz, angles in radians),
        plus the polar/azimuth angles in degrees for explanation.
    """
    r = math.sqrt(x * x + y * y + z * z)
    if r < 1e-9:
        return {"error": "Target vector is zero - pick a direction on the sphere."}
    x, y, z = x / r, y / r, z / r
    theta = math.acos(max(-1.0, min(1.0, z)))       # polar angle from +Z
    phi = math.atan2(y, x) if math.hypot(x, y) > 1e-9 else 0.0  # azimuth in the XY plane

    gates = []
    if theta > 1e-9:
        gates.append({"type": "ry", "qubits": [qubit], "params": [round(theta, 6)]})
    if abs(phi) > 1e-9 and theta > 1e-9 and theta < math.pi - 1e-9:
        gates.append({"type": "rz", "qubits": [qubit], "params": [round(phi, 6)]})
    return {
        "gates": gates,
        "polar_angle_deg": round(math.degrees(theta), 3),
        "azimuth_deg": round(math.degrees(phi), 3),
        "note": "RY(polar) tilts the arrow down from +Z; RZ(azimuth) then spins it around the Z axis.",
    }


def extract_circuit_proposal(text: str) -> Tuple[str, Optional[CircuitDefinition]]:
    """
    Find a ```circuit {...}``` block in `text`.
    Returns (text_without_block, circuit_or_None). Invalid blocks are dropped silently
    (and logged) so a malformed model reply never breaks the chat.
    """
    if not text:
        return text, None
    match = _BLOCK_RE.search(text)
    if not match:
        return text, None

    clean = (text[: match.start()] + text[match.end():]).strip()
    try:
        raw = json.loads(match.group(1))
        gates = []
        for g in raw.get("gates", []):
            gtype = str(g.get("type", "")).lower()
            if gtype == "cnot":
                gtype = "cx"
            if gtype not in BUILDER_GATES:
                raise ValueError(f"Gate '{gtype}' is not available in the circuit builder.")
            gates.append({**g, "type": gtype})
        n = int(raw.get("num_qubits", 1))
        if not 1 <= n <= MAX_BUILDER_QUBITS:
            raise ValueError(f"num_qubits must be 1-{MAX_BUILDER_QUBITS} for the builder.")
        circuit = CircuitDefinition(num_qubits=n, gates=gates)
        circuit.validate_qubit_indices()
        if not circuit.gates:
            return clean, None
        return clean, circuit
    except Exception as e:  # noqa: BLE001 - never let a bad block break the reply
        logger.warning(f"Discarding invalid circuit proposal: {e}")
        return clean, None


# Appended to the system prompt on /chat.
CIRCUIT_BUILDING_INSTRUCTION = f"""
### BUILDING CIRCUITS FOR THE LEARNER
When the learner explicitly asks you to make / build / create / write a circuit (for example
"make a circuit that moves the arrow to this position", "build a Bell state"), you SHOULD build it
for them. The Socratic "don't give the answer" rule applies to graded challenges and debugging hints,
not to direct build requests.

1. Reply with a short, friendly explanation of what the circuit does and why it works.
2. Include the circuit in ONE fenced block with the language tag `circuit`, exactly like:
```circuit
{{"num_qubits": 1, "gates": [{{"type": "ry", "qubits": [0], "params": [1.5708]}}, {{"type": "rz", "qubits": [0], "params": [0.7854]}}]}}
```
3. Only use these gate types: h, x, y, z, s, sdg, t, tdg, rx, ry, rz, cx, cz, swap, ccx, cswap, measure.
   Rotation angles go in `params` as radians. For two-qubit gates list the control first.
   Use at most {MAX_BUILDER_QUBITS} qubits and 8 sequential steps.
4. For "move the arrow / point the qubit to <position>" requests, ALWAYS call `bloch_target_to_gates`
   first and copy its gates into the block. The qubit starts in |0>, the arrow pointing at +Z.
5. Only emit a `circuit` block when the learner asked you to build something. For plain questions, just answer.
6. The learner can click "Apply to canvas" to load your circuit, so don't ask them to place gates manually.
""".strip()
