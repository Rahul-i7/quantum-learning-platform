"""
Interactive CLI for testing and demonstrating the Quantum AI Tutor.
Allows live conversational chatting, circuit loading, simulation execution, and debugging.
"""
from __future__ import annotations
import json
import os
import sys
from pathlib import Path

# Add project root to sys.path so imports work cleanly
current_dir = Path(__file__).parent.resolve()
sys.path.insert(0, str(current_dir))

from core.tutor import QuantumAITutor
from models.circuit import CircuitDefinition
from models.learner import SkillLevel
from tools.simulation_tool import simulate_circuit


def print_banner():
    print("=" * 70)
    print("       AI-BASED INTERACTIVE QUANTUM ALGORITHM LEARNING PLATFORM")
    print("                     Role 4: AI Tutor Service (CLI)")
    print("=" * 70)
    print("Commands:")
    print("  /load <path>     - Load a circuit JSON file")
    print("  /sim             - Simulate the currently loaded circuit")
    print("  /debug <goal>    - Debug current circuit against a target goal")
    print("  /explain         - Ask AI tutor to explain currently loaded circuit")
    print("  /optimize        - Ask AI tutor to optimize currently loaded circuit")
    print("  /level <lvl>     - Set learner level (beginner, intermediate, advanced)")
    print("  /quit            - Exit")
    print("=" * 70)


def main():
    print_banner()
    tutor = QuantumAITutor()

    if tutor.is_gemini_connected():
        print(f"[STATUS] Connected to Google AI Studio (Model: {tutor.model})")
    else:
        print("[STATUS] Running with local quantum engine (Set GEMINI_API_KEY for live Gemini API)")

    current_circuit: CircuitDefinition = None
    skill_level = SkillLevel.BEGINNER
    history = []

    # Try loading default bell state as starter circuit
    examples_dir = current_dir.parent.parent / "shared" / "circuit-schema" / "examples"
    default_circuit_path = examples_dir / "bell_state.json"
    if default_circuit_path.exists():
        try:
            with open(default_circuit_path, "r") as f:
                data = json.load(f)
                current_circuit = CircuitDefinition(**data)
                print(f"[LOADED] Default starter circuit: {default_circuit_path.name}")
        except Exception as e:
            pass

    while True:
        try:
            user_input = input(f"\n[Learner ({skill_level.value})]> ").strip()
            if not user_input:
                continue

            if user_input in ("/quit", "/exit", "quit", "exit"):
                print("Goodbye! Keep exploring quantum superposition!")
                break

            elif user_input.startswith("/load"):
                parts = user_input.split(maxsplit=1)
                if len(parts) < 2:
                    print("Usage: /load <path_to_circuit.json>")
                    continue
                path = Path(parts[1])
                if not path.is_absolute():
                    path = current_dir / path
                if not path.exists():
                    # Check examples directory
                    alt_path = examples_dir / parts[1]
                    if alt_path.exists():
                        path = alt_path
                    else:
                        print(f"Error: File not found at {path} or {alt_path}")
                        continue
                with open(path, "r") as f:
                    data = json.load(f)
                    current_circuit = CircuitDefinition(**data)
                    print(f"Successfully loaded circuit: {path.name} ({current_circuit.num_qubits} qubits, {len(current_circuit.gates)} gates)")

            elif user_input == "/sim":
                if not current_circuit:
                    print("No circuit currently loaded. Use /load <file.json> first.")
                    continue
                print("\n[SIMULATING CIRCUIT VIA LOCAL / ROLE-3 SIMULATOR]")
                result = simulate_circuit(current_circuit.model_dump())
                print(f"- Qubits: {result.get('num_qubits')}")
                print(f"- Probabilities: {result.get('probabilities')}")
                print(f"- Counts (1024 shots): {result.get('counts')}")
                print(f"- Statevector: {result.get('statevector_formatted')}")
                print(f"- Bloch vectors: {result.get('bloch_vectors')}")

            elif user_input.startswith("/debug"):
                if not current_circuit:
                    print("No circuit loaded to debug. Use /load <file.json> first.")
                    continue
                goal = user_input[6:].strip() or "Create Bell State |Phi+>"
                print(f"\n[AI TUTOR DEBUGGING FOR OBJECTIVE: '{goal}']...")
                dbg_res = tutor.debug_circuit(
                    circuit=current_circuit,
                    target_objective=goal,
                    user_id="beginner_alex"
                )
                print("\n--- DEBUGGER DIAGNOSIS ---")
                print(dbg_res.diagnosis)
                print("\n--- TIERED HINTS ---")
                for h in dbg_res.hints:
                    print(f"  * {h}")

            elif user_input == "/explain":
                if not current_circuit:
                    print("No circuit loaded. Use /load <file.json> first.")
                    continue
                print("\n[AI TUTOR EXPLAINING CIRCUIT]...")
                exp_res = tutor.explain_circuit(
                    circuit=current_circuit,
                    user_id="beginner_alex",
                    skill_override=skill_level
                )
                print("\n--- EXPLANATION ---")
                print(exp_res.explanation)

            elif user_input == "/optimize":
                if not current_circuit:
                    print("No circuit loaded. Use /load <file.json> first.")
                    continue
                print("\n[AI TUTOR OPTIMIZING CIRCUIT]...")
                opt_res = tutor.optimize_circuit(current_circuit)
                print(f"\nOriginal Gates: {opt_res.original_gate_count} -> Optimized Gates: {opt_res.optimized_gate_count}")
                print("Suggestions:")
                for s in opt_res.optimization_suggestions:
                    print(f"  * {s}")
                print(f"\nExplanation:\n{opt_res.explanation}")

            elif user_input.startswith("/level"):
                parts = user_input.split()
                if len(parts) > 1 and parts[1].lower() in ("beginner", "intermediate", "advanced"):
                    skill_level = SkillLevel(parts[1].lower())
                    print(f"Learner skill level set to: {skill_level.value.upper()}")
                else:
                    print("Valid levels: beginner, intermediate, advanced")

            else:
                # Conversational prompt
                print("\n[AI TUTOR THINKING]...")
                chat_res = tutor.chat(
                    message=user_input,
                    circuit=current_circuit,
                    history=history,
                    user_id="beginner_alex",
                    skill_override=skill_level
                )
                print(f"\nQuBit:\n{chat_res.response}\n")
                if chat_res.suggested_questions:
                    print("Suggested Follow-ups:")
                    for q in chat_res.suggested_questions:
                        print(f"  ? {q}")

        except KeyboardInterrupt:
            print("\nExiting...")
            break
        except Exception as e:
            print(f"Error: {e}")


if __name__ == "__main__":
    main()
