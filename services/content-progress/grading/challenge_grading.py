"""
Coding-challenge grading (Role 5) — hands the learner's submitted circuit to
the Simulation Service (Role 3) via the shared circuit JSON contract
(shared/circuit-schema/schema.json), then compares the *actual* simulated
result against the challenge's `expected_result` within `tolerance`.

This is why the AI Tutor's tool-calling into the Simulation Service and this
grading logic both matter: neither guesses from the code, both run it for
real and reason over the real physics.
"""
from __future__ import annotations
import logging
from typing import Any

import httpx

from config import settings

logger = logging.getLogger("content-progress.challenge_grading")


class SimulationUnavailable(RuntimeError):
    pass


def run_simulation(circuit: dict[str, Any]) -> dict[str, Any]:
    try:
        res = httpx.post(
            f"{settings.simulation_service_url.rstrip('/')}/simulate",
            json=circuit,
            timeout=15.0,
        )
        res.raise_for_status()
        return res.json()
    except httpx.HTTPStatusError as e:
        # Circuit was rejected by the simulator's own validation (bad gate,
        # out-of-range qubit, etc) — surface that as ungraded feedback
        # rather than a 500.
        detail = e.response.json().get("detail", str(e)) if e.response is not None else str(e)
        raise SimulationUnavailable(f"Simulation rejected the circuit: {detail}") from e
    except httpx.HTTPError as e:
        raise SimulationUnavailable(f"Could not reach the Simulation Service: {e}") from e


def _required_gates_present(circuit: dict[str, Any], required: list[str] | None) -> list[str]:
    if not required:
        return []
    present = {g["type"] for g in circuit.get("gates", [])}
    return [g for g in required if g not in present]


def grade_challenge(challenge: dict[str, Any], circuit: dict[str, Any]) -> dict[str, Any]:
    """
    challenge: a coding_challenges row (grading_mode, expected_result, tolerance,
               required_gate_types)
    circuit:   the learner's submitted circuit JSON (shared contract)
    """
    missing_gates = _required_gates_present(circuit, challenge.get("required_gate_types"))

    sim_result = run_simulation(circuit)

    mode = challenge["grading_mode"]
    expected = challenge["expected_result"]
    tolerance = float(challenge.get("tolerance", 0.05))

    actual: dict[str, float] | None
    if mode == "probabilities":
        actual = sim_result.get("probabilities")
    elif mode == "counts":
        counts = sim_result.get("counts") or {}
        total = sum(counts.values()) or 1
        actual = {k: v / total for k, v in counts.items()}
    elif mode == "statevector":
        actual = None  # handled separately below
    else:
        raise ValueError(f"Unknown grading_mode '{mode}'")

    if mode == "statevector":
        sv = sim_result.get("statevector")
        matched, deviations = _compare_statevector(sv, expected, tolerance)
    else:
        matched, deviations = _compare_distribution(actual or {}, expected, tolerance)

    passed = matched and not missing_gates
    score = _score_from_deviation(deviations) if matched else 0.0
    if missing_gates:
        score = min(score, 40.0)  # got the right output by luck without the required technique

    feedback_parts = []
    if missing_gates:
        feedback_parts.append(f"Missing required gate(s): {', '.join(missing_gates)}.")
    if passed:
        feedback_parts.append("Circuit output matches the target within tolerance. Nice work.")
    elif not missing_gates:
        feedback_parts.append(_deviation_feedback(deviations, mode))

    return {
        "status": "completed" if passed else "in_progress",
        "score": round(score, 1),
        "passed": passed,
        "feedback": " ".join(feedback_parts),
        "sim_result": sim_result,
    }


def _compare_distribution(actual: dict[str, float], expected: dict[str, float],
                           tolerance: float) -> tuple[bool, dict[str, float]]:
    keys = set(actual) | set(expected)
    deviations = {}
    ok = True
    for k in keys:
        a = actual.get(k, 0.0)
        e = expected.get(k, 0.0)
        dev = abs(a - e)
        deviations[k] = dev
        if dev > tolerance:
            ok = False
    return ok, deviations


def _compare_statevector(actual_sv, expected: dict[str, Any], tolerance: float) -> tuple[bool, dict[str, float]]:
    if not actual_sv:
        return False, {}
    expected_amps = expected.get("amplitudes", [])
    if len(expected_amps) != len(actual_sv):
        return False, {}
    deviations = {}
    ok = True
    for i, (a, e) in enumerate(zip(actual_sv, expected_amps)):
        dev = ((a[0] - e[0]) ** 2 + (a[1] - e[1]) ** 2) ** 0.5
        deviations[str(i)] = dev
        if dev > tolerance:
            ok = False
    return ok, deviations


def _score_from_deviation(deviations: dict[str, float]) -> float:
    if not deviations:
        return 100.0
    worst = max(deviations.values())
    return max(0.0, 100.0 * (1 - worst))


def _deviation_feedback(deviations: dict[str, float], mode: str) -> str:
    if not deviations:
        return "Could not compute a comparison — check the circuit output."
    worst_key = max(deviations, key=deviations.get)
    return (f"Output doesn't match the target yet — largest gap is on outcome "
            f"'{worst_key}' (off by {deviations[worst_key]:.2f}). Keep iterating.")
