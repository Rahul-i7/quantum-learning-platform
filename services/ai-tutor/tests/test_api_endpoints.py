"""
Tests for FastAPI REST API endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/tutor/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "ai-tutor"
    assert "supported_features" in data


def test_chat_endpoint():
    payload = {
        "user_id": "beginner_alex",
        "message": "What is a Hadamard gate?",
        "circuit": {
            "num_qubits": 1,
            "gates": [
                {"type": "h", "qubits": [0]}
            ]
        }
    }
    response = client.post("/api/tutor/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "response" in data
    assert data["simulation_called"] is True
    assert data["simulation_result"] is not None


def test_explain_endpoint():
    payload = {
        "user_id": "beginner_alex",
        "circuit": {
            "num_qubits": 2,
            "gates": [
                {"type": "h", "qubits": [0]},
                {"type": "cx", "qubits": [0, 1]}
            ]
        }
    }
    response = client.post("/api/tutor/explain", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "explanation" in data


def test_debug_endpoint():
    payload = {
        "user_id": "beginner_alex",
        "target_objective": "Create Bell State |Phi+>",
        "circuit": {
            "num_qubits": 2,
            "gates": [
                {"type": "h", "qubits": [0]},
                {"type": "cx", "qubits": [0, 1]}
            ]
        }
    }
    response = client.post("/api/tutor/debug", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_correct"] is True
    assert "diagnosis" in data


def test_optimize_endpoint():
    payload = {
        "circuit": {
            "num_qubits": 1,
            "gates": [
                {"type": "h", "qubits": [0]},
                {"type": "h", "qubits": [0]}
            ]
        }
    }
    response = client.post("/api/tutor/optimize", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["original_gate_count"] == 2
    assert data["optimized_gate_count"] == 0
