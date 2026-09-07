"""
Simulation Service (Role 3)
Run with: uvicorn main:app --reload --port 8001

Endpoints:
  POST /simulate       -> circuit JSON in (shared contract), results out
  POST /simulate/code  -> raw user Qiskit code in, sandboxed execution
  GET  /health         -> liveness check for the API gateway
"""
from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from adapters.qiskit_adapter import simulate_circuit, CircuitValidationError
from sandbox.executor import run_user_code, SandboxViolation

app = FastAPI(title="QMentor — Simulation Service")

# Tighten allow_origins to the real frontend URL before demo/deploy.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class GateDef(BaseModel):
    type: str
    qubits: list[int]
    clbits: list[int] | None = None
    params: list[float] | None = None


class CircuitRequest(BaseModel):
    num_qubits: int
    num_clbits: int | None = None
    gates: list[GateDef]
    shots: int = Field(default=1024, ge=1, le=20000)


class CodeRequest(BaseModel):
    code: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/simulate")
def simulate(req: CircuitRequest):
    circuit_json = req.model_dump()
    try:
        return simulate_circuit(circuit_json)
    except CircuitValidationError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:  # noqa: BLE001 — surface as 500, don't leak internals in prod
        raise HTTPException(status_code=500, detail="Simulation failed.") from e


@app.post("/simulate/code")
def simulate_code(req: CodeRequest):
    try:
        result = run_user_code(req.code)
    except SandboxViolation as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result
