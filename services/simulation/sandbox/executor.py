"""
Sandbox for running user-submitted raw Qiskit code (the code-editor input
path, as opposed to the drag-and-drop JSON path).

HONEST SCOPE NOTE FOR THE TEAM / JUDGES:
True isolation for arbitrary user code is a container/VM-level problem
(gVisor, Firecracker, nsjail, Docker-in-Docker). That's not buildable
correctly in a 2-day hackathon window. This module gives you a
*best-effort* sandbox suitable for a demo:
  - runs the code in a separate process (not the API process)
  - hard wall-clock timeout
  - CPU time + memory limits via `resource` (Linux only)
  - restricted builtins (no open/import/exec/eval/os/sys/subprocess/etc.)
  - only exposes qiskit + the circuit result back to the caller

If you have time after the MVP works, the next real upgrade is: run this
in a locked-down Docker container with --network=none and a read-only
filesystem, not just an in-process restriction. Say that explicitly in
the pitch deck (section 7 of the design doc already flags this as the
main technical risk) — a judge will respect "we scoped this consciously"
far more than a silent gap.
"""
from __future__ import annotations

import ast
import multiprocessing as mp
import platform
from typing import Any

IS_WINDOWS = platform.system() == "Windows"

if not IS_WINDOWS:
    import resource

# Names allowed to be referenced inside submitted code.
ALLOWED_BUILTINS = {
    "range", "len", "list", "dict", "tuple", "set", "float", "int", "str",
    "bool", "sum", "min", "max", "abs", "round", "enumerate", "zip", "map",
    "filter", "print",
}

# AST node types we refuse outright, regardless of what they reference.
FORBIDDEN_NODE_TYPES = (ast.Import, ast.ImportFrom)
FORBIDDEN_NAMES = {
    "open", "exec", "eval", "compile", "__import__", "input",
    "os", "sys", "subprocess", "socket", "shutil", "pathlib",
}


class SandboxViolation(Exception):
    pass


def _static_check(code: str) -> None:
    """Reject obviously dangerous code before we even run it."""
    try:
        tree = ast.parse(code, mode="exec")
    except SyntaxError as e:
        raise SandboxViolation(f"Syntax error: {e}") from e

    for node in ast.walk(tree):
        if isinstance(node, FORBIDDEN_NODE_TYPES):
            raise SandboxViolation(
                "Imports are not allowed. Use the pre-supplied `QuantumCircuit`, "
                "`AerSimulator`, and `Statevector` names directly."
            )
        if isinstance(node, ast.Name) and node.id in FORBIDDEN_NAMES:
            raise SandboxViolation(f"Use of '{node.id}' is not allowed.")
        if isinstance(node, ast.Attribute) and node.attr.startswith("__"):
            raise SandboxViolation("Dunder attribute access is not allowed.")


def _set_limits(cpu_seconds: int, mem_mb: int) -> None:
    # resource module (CPU/memory limits) is Unix-only. On Windows, we
    # rely on the wall-clock timeout in run_user_code as the safety net
    # instead — not as strong, but good enough for a hackathon demo.
    if IS_WINDOWS:
        return
    resource.setrlimit(resource.RLIMIT_CPU, (cpu_seconds, cpu_seconds))
    mem_bytes = mem_mb * 1024 * 1024
    resource.setrlimit(resource.RLIMIT_AS, (mem_bytes, mem_bytes))


def _worker(code: str, cpu_seconds: int, mem_mb: int, result_queue: mp.Queue) -> None:
    try:
        _set_limits(cpu_seconds, mem_mb)

        from qiskit import QuantumCircuit
        from qiskit_aer import AerSimulator
        from qiskit.quantum_info import Statevector

        safe_globals = {
            "__builtins__": {k: __builtins__[k] for k in ALLOWED_BUILTINS
                              if isinstance(__builtins__, dict) and k in __builtins__},
            "QuantumCircuit": QuantumCircuit,
            "AerSimulator": AerSimulator,
            "Statevector": Statevector,
        }
        local_vars: dict[str, Any] = {}
        exec(compile(code, "<user_code>", "exec"), safe_globals, local_vars)

        qc = local_vars.get("qc") or local_vars.get("circuit")
        if qc is None or not isinstance(qc, QuantumCircuit):
            result_queue.put({"error": "Code must define a QuantumCircuit named `qc`."})
            return

        backend = AerSimulator()
        job = backend.run(qc, shots=1024)
        counts = job.result().get_counts()
        result_queue.put({"counts": dict(counts)})
    except MemoryError:
        result_queue.put({"error": "Memory limit exceeded."})
    except Exception as e:  # noqa: BLE001 — deliberately broad, this is a sandbox boundary
        result_queue.put({"error": f"{type(e).__name__}: {e}"})


def run_user_code(
    code: str,
    timeout_seconds: int = 8,
    cpu_seconds: int = 5,
    mem_mb: int = 1024,
) -> dict[str, Any]:
    # NOTE: mem_mb defaults to 1024 (not a tiny number) because RLIMIT_AS
    # caps *virtual* address space, and NumPy/OpenBLAS reserve a large
    # virtual mapping just to load their shared libraries — well before
    # any real computation happens. A lower cap kills even trivial circuits.
    """Execute user-submitted code in an isolated process with hard limits.
    Returns {"counts": {...}} on success or {"error": "..."} on failure/violation."""
    _static_check(code)

    ctx = mp.get_context("fork")
    result_queue: mp.Queue = ctx.Queue()
    proc = ctx.Process(target=_worker, args=(code, cpu_seconds, mem_mb, result_queue))
    proc.start()
    proc.join(timeout=timeout_seconds)

    if proc.is_alive():
        proc.terminate()
        proc.join()
        return {"error": f"Execution timed out after {timeout_seconds}s."}

    if not result_queue.empty():
        return result_queue.get()

    return {"error": "Process exited without returning a result (likely killed by resource limits)."}
