import httpx
import pytest
from unittest.mock import patch

from grading.challenge_grading import grade_challenge, SimulationUnavailable

BELL_CHALLENGE = {
    "id": "build-a-bell-state",
    "grading_mode": "probabilities",
    "expected_result": {"00": 0.5, "11": 0.5},
    "tolerance": 0.05,
    "required_gate_types": ["h", "cx"],
}

BELL_CIRCUIT = {
    "num_qubits": 2,
    "gates": [
        {"type": "h", "qubits": [0]},
        {"type": "cx", "qubits": [0, 1]},
        {"type": "measure", "qubits": [0, 1]},
    ],
}


def _mock_sim_response(json_body, status_code=200):
    class FakeResponse:
        def __init__(self):
            self.status_code = status_code

        def raise_for_status(self):
            if status_code >= 400:
                raise httpx.HTTPStatusError("error", request=None, response=self)

        def json(self):
            return json_body

    return FakeResponse()


@patch("grading.challenge_grading.httpx.post")
def test_correct_bell_state_passes(mock_post):
    mock_post.return_value = _mock_sim_response({
        "num_qubits": 2, "statevector": None,
        "counts": {"00": 512, "11": 512},
        "probabilities": {"00": 0.5, "11": 0.5},
    })
    result = grade_challenge(BELL_CHALLENGE, BELL_CIRCUIT)
    assert result["passed"] is True
    assert result["status"] == "completed"
    assert result["score"] > 90


@patch("grading.challenge_grading.httpx.post")
def test_missing_required_gate_capped_score(mock_post):
    mock_post.return_value = _mock_sim_response({
        "probabilities": {"00": 0.5, "11": 0.5}, "counts": {}, "statevector": None,
    })
    circuit_without_cx = {"num_qubits": 2, "gates": [{"type": "h", "qubits": [0]}]}
    result = grade_challenge(BELL_CHALLENGE, circuit_without_cx)
    assert result["passed"] is False
    assert "cx" in result["feedback"]
    assert result["score"] <= 40.0


@patch("grading.challenge_grading.httpx.post")
def test_wrong_distribution_fails_with_feedback(mock_post):
    mock_post.return_value = _mock_sim_response({
        "probabilities": {"00": 1.0}, "counts": {}, "statevector": None,
    })
    result = grade_challenge(BELL_CHALLENGE, BELL_CIRCUIT)
    assert result["passed"] is False
    assert result["status"] == "in_progress"
    assert "gap" in result["feedback"] or "match" not in result["feedback"]


@patch("grading.challenge_grading.httpx.post", side_effect=httpx.ConnectError("refused"))
def test_simulation_unavailable_raises(mock_post):
    with pytest.raises(SimulationUnavailable):
        grade_challenge(BELL_CHALLENGE, BELL_CIRCUIT)
