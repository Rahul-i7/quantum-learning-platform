"""
Core Quantum AI Tutor implementation wrapping the official Google GenAI SDK (`google-genai`).
Handles multi-turn Socratic tutoring, tool calling into simulation, and adaptive personalization.
"""
from __future__ import annotations
import json
import logging
import os
import re
from typing import Dict, Any, List, Optional, Tuple

try:
    from ..config import settings
    from ..models.circuit import CircuitDefinition, SimulationResult, QuantumGate
    from ..models.learner import SkillLevel, LearningStyle, LearnerProfile
    from ..models.api import (
        ChatMessage,
        TutorChatResponse,
        ExplainResponse,
        DebugResponse,
        OptimizeResponse,
    )
    from ..tools.simulation_tool import simulate_circuit, compare_circuits
    from ..tools.learner_profile_tool import get_learner_profile
    from ..personalization.engine import PersonalizationEngine
    from ..prompts.system_tutor import MASTER_TUTOR_SYSTEM_INSTRUCTION
    from .circuit_builder import bloch_target_to_gates, extract_circuit_proposal, CIRCUIT_BUILDING_INSTRUCTION
    from ..prompts.debugger_prompt import DEBUGGER_PROMPT_TEMPLATE
    from ..prompts.explainer_prompt import EXPLAINER_PROMPT_TEMPLATE
    from ..prompts.optimizer_prompt import OPTIMIZER_PROMPT_TEMPLATE
except (ImportError, ValueError):
    from config import settings
    from models.circuit import CircuitDefinition, SimulationResult, QuantumGate
    from models.learner import SkillLevel, LearningStyle, LearnerProfile
    from models.api import (
        ChatMessage,
        TutorChatResponse,
        ExplainResponse,
        DebugResponse,
        OptimizeResponse,
    )
    from tools.simulation_tool import simulate_circuit, compare_circuits
    from tools.learner_profile_tool import get_learner_profile
    from personalization.engine import PersonalizationEngine
    from prompts.system_tutor import MASTER_TUTOR_SYSTEM_INSTRUCTION
    from core.circuit_builder import bloch_target_to_gates, extract_circuit_proposal, CIRCUIT_BUILDING_INSTRUCTION
    from prompts.debugger_prompt import DEBUGGER_PROMPT_TEMPLATE
    from prompts.explainer_prompt import EXPLAINER_PROMPT_TEMPLATE
    from prompts.optimizer_prompt import OPTIMIZER_PROMPT_TEMPLATE

logger = logging.getLogger(__name__)

# Try importing google-genai SDK
try:
    from google import genai
    from google.genai import types
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False
    logger.warning("google-genai SDK not installed. Operating in simulation-guided offline mode.")


class QuantumAITutor:
    """
    Intelligent Quantum Computing AI Tutor powered by Google AI Studio (Gemini).
    Equipped with tool-calling capabilities to simulate circuits and inspect learner history.
    """

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        raw_key = api_key or settings.gemini_api_key or ""
        # Remove accidental quotes / spaces around the key in .env
        self.api_key = raw_key.strip().strip('"').strip("'")
        self.model = model or settings.default_model
        self.client = None
        # Human-readable reason shown to the user whenever we fall back to offline mode
        self.last_error: Optional[str] = None

        if not GENAI_AVAILABLE:
            self.last_error = "google-genai SDK is not installed (pip install -r requirements.txt)."
        elif not self.api_key:
            self.last_error = "GEMINI_API_KEY is not set in services/ai-tutor/.env."
            logger.info(
                "GEMINI_API_KEY not provided. AI Tutor running with local quantum simulation engine and heuristic pedagogical reasoning."
            )
        else:
            k = self.api_key
            logger.info(f"Gemini key loaded: {k[:12]}...{k[-3:]} ({len(k)} chars)")
            try:
                # AI Studio now issues "AQ." auth keys; they work with the normal Gemini API client.
                # Vertex AI mode is only used if you explicitly set GEMINI_USE_VERTEX=true.
                use_vertex = os.getenv("GEMINI_USE_VERTEX", "").strip().lower() in ("1", "true", "yes")
                if use_vertex:
                    self.client = genai.Client(vertexai=True, api_key=self.api_key)
                    logger.info(f"Initialized Gemini client (Vertex AI express mode) with model {self.model}")
                else:
                    self.client = genai.Client(api_key=self.api_key)
                    logger.info(f"Initialized Gemini client (AI Studio) with model {self.model}")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini Client: {e}")
                self.last_error = f"Could not initialize Gemini client: {self._short_error(e)}"
                self.client = None

    @staticmethod
    def _short_error(e: Exception) -> str:
        """Compact, user-friendly error message (no giant JSON dumps)."""
        text = str(e)
        m = re.search(r"'message': '([^']+)'", text)
        msg = m.group(1) if m else text
        return msg.strip()[:220]

    @staticmethod
    def _is_model_error(e: Exception) -> bool:
        """True when the failure is model unavailability, rate limits, high demand, or transient server errors."""
        text = str(e).upper()
        # Invalid key, bad auth, or permission issues cannot be fixed by switching models
        if any(term in text for term in ["API_KEY_INVALID", "PERMISSION_DENIED", "UNAUTHENTICATED", "INVALID_ARGUMENT"]):
            return False

        code = getattr(e, "code", None)
        if code in (404, 429, 500, 502, 503, 504):
            return True

        error_keywords = [
            "NOT_FOUND", "NOT FOUND", "IS NOT FOUND", "NOT SUPPORTED", "MODEL_NOT_FOUND",
            "RESOURCE_EXHAUSTED", "QUOTA", "RATE_LIMIT", "RATE LIMIT", "TOO MANY REQUESTS",
            "OVERLOADED", "HIGH DEMAND", "BUSY", "UNAVAILABLE", "TEMPORARILY_UNAVAILABLE",
            "SERVER ERROR", "INTERNAL", "DEADLINE_EXCEEDED", "503", "429"
        ]
        return any(kw in text for kw in error_keywords)

    def _generate(self, contents, config):
        """
        Call Gemini with the configured primary model. If that model is unavailable,
        rate-limited (429), or overloaded (503), try fallback models in sequence.
        """
        candidates = [self.model]
        for m in settings.fallback_models:
            if m not in candidates:
                candidates.append(m)

        last_exc: Optional[Exception] = None
        for name in candidates:
            # Try primary/fallback model with retry on transient high-demand glitches
            max_retries = 2
            for attempt in range(max_retries):
                try:
                    response = self.client.models.generate_content(
                        model=name, contents=contents, config=config
                    )
                    if name != self.model:
                        logger.warning(
                            f"Model '{self.model}' unavailable/overloaded. Answered using fallback model '{name}' instead."
                        )
                    self.last_error = None
                    return response
                except Exception as e:
                    last_exc = e
                    self.last_error = self._short_error(e)
                    if not self._is_model_error(e):
                        # Auth or fatal non-model error; fail fast
                        raise e

                    if attempt < max_retries - 1:
                        import time
                        time.sleep(0.5 * (attempt + 1))
                        logger.warning(
                            f"High demand for model '{name}' (attempt {attempt + 1}): {self.last_error}. Retrying..."
                        )
                    else:
                        logger.warning(
                            f"Model '{name}' unavailable or overloaded ({self.last_error}) after retries. Trying next fallback model..."
                        )

        raise last_exc  # every model candidate failed

    def _offline_notice(self) -> str:
        """Markdown note appended to offline answers so the reason is visible in the UI."""
        reason = self.last_error or "AI model did not respond."
        return f"\n\n> **AI Tutor is offline** - showing the built-in explanation instead.  \n> Reason: {reason}"

    @staticmethod
    def _with_display_name(profile: Dict[str, Any], user_name: Optional[str]) -> Dict[str, Any]:
        """Use the signed-in user's own name (first word) instead of whatever the stored profile says."""
        if user_name and user_name.strip():
            profile = {**profile, "name": user_name.strip().split()[0]}
        return profile

    def is_gemini_connected(self) -> bool:
        return self.client is not None

    def chat(
        self,
        message: str,
        circuit: Optional[CircuitDefinition] = None,
        history: Optional[List[ChatMessage]] = None,
        user_id: str = "default_learner",
        skill_override: Optional[SkillLevel] = None,
        style_override: Optional[LearningStyle] = None,
        user_name: Optional[str] = None
    ) -> TutorChatResponse:
        """
        Multi-turn conversational tutoring session.
        Uses Gemini with automatic tool-calling or heuristic pedagogical fallback.
        """
        # Fetch learner context
        profile_data = self._with_display_name(get_learner_profile(user_id), user_name)
        pedagogical_context = PersonalizationEngine.get_pedagogical_context(
            profile_data, skill_override=skill_override, style_override=style_override
        )

        circuit_sim_result: Optional[SimulationResult] = None
        sim_called = False

        circuit_dict = circuit.model_dump() if circuit else None
        if circuit_dict:
            # Pre-simulate so simulation data is ready for both Gemini and local response
            sim_dict = simulate_circuit(circuit_dict)
            sim_called = True
            # The Qiskit simulation service returns `counts: null` (and may omit other
            # fields) when the circuit has no measure gate, so use `or` fallbacks rather
            # than .get(key, default), which only applies when the key is missing.
            circuit_sim_result = SimulationResult(
                success=bool(sim_dict.get("success", False)),
                num_qubits=sim_dict.get("num_qubits") or circuit.num_qubits,
                statevector_formatted=sim_dict.get("statevector_formatted"),
                probabilities=sim_dict.get("probabilities") or {},
                counts=sim_dict.get("counts") or {},
                bloch_vectors=sim_dict.get("bloch_vectors"),
                circuit_depth=sim_dict.get("circuit_depth"),
                gate_count=sim_dict.get("gate_count"),
                error=sim_dict.get("error")
            )

        if self.client:
            try:
                system_instruction = (
                    f"{MASTER_TUTOR_SYSTEM_INSTRUCTION}\n\n"
                    f"{CIRCUIT_BUILDING_INSTRUCTION}\n\n"
                    f"{pedagogical_context}\n\n"
                )
                if profile_data.get("name") and profile_data["name"] != "Student":
                    system_instruction += f"The learner's name is {profile_data['name']}. Address them by this name when natural.\n\n"
                if circuit_dict:
                    system_instruction += (
                        f"### CURRENT CIRCUIT ON CANVAS:\n"
                        f"```json\n{json.dumps(circuit_dict, indent=2)}\n```\n"
                        f"### SIMULATOR MEASUREMENT TRUTH:\n"
                        f"- Probabilities: {circuit_sim_result.probabilities}\n"
                        f"- Statevector: {circuit_sim_result.statevector_formatted}\n"
                    )

                # Format chat history for SDK
                contents = []
                if history:
                    for h in history:
                        role = "user" if h.role == "user" else "model"
                        contents.append(types.Content(role=role, parts=[types.Part.from_text(text=h.content)]))

                # Append current user prompt
                contents.append(types.Content(role="user", parts=[types.Part.from_text(text=message)]))

                response = self._generate(
                    contents=contents,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        temperature=0.7,
                        tools=[simulate_circuit, get_learner_profile, compare_circuits, bloch_target_to_gates],
                    )
                )

                reply_text = response.text or "I inspected your circuit and quantum state."
                reply_text, proposed_circuit = extract_circuit_proposal(reply_text)

                # Generate follow-up suggestions
                suggested_questions = self._extract_or_generate_questions(reply_text, circuit)

                return TutorChatResponse(
                    response=reply_text,
                    proposed_circuit=proposed_circuit,
                    simulation_called=sim_called,
                    simulation_result=circuit_sim_result,
                    suggested_questions=suggested_questions
                )
            except Exception as e:
                logger.error(f"Error invoking Gemini API: {e}. Falling back to rule-guided response.")

        # Offline / Fallback Socratic responder
        fallback = self._generate_fallback_chat_response(
            message, circuit, circuit_sim_result, profile_data, pedagogical_context
        )
        fallback.response += self._offline_notice()
        return fallback

    def explain_circuit(
        self,
        circuit: Optional[CircuitDefinition] = None,
        user_id: str = "default_learner",
        query: Optional[str] = None,
        skill_override: Optional[SkillLevel] = None,
        style_override: Optional[LearningStyle] = None,
        user_name: Optional[str] = None
    ) -> ExplainResponse:
        """
        Explain a circuit's state evolution or a specific quantum concept.
        """
        profile = self._with_display_name(get_learner_profile(user_id), user_name)
        pedagogical_context = PersonalizationEngine.get_pedagogical_context(
            profile, skill_override=skill_override, style_override=style_override
        )

        sim_summary = "No circuit provided."
        circuit_dict = circuit.model_dump() if circuit else {}
        if circuit:
            sim_data = simulate_circuit(circuit_dict)
            sim_summary = (
                f"- Number of qubits: {sim_data.get('num_qubits')}\n"
                f"- Probabilities: {sim_data.get('probabilities')}\n"
                f"- Statevector amplitudes: {sim_data.get('statevector_formatted')}\n"
                f"- Circuit depth: {sim_data.get('circuit_depth')}, Gate count: {sim_data.get('gate_count')}"
            )

        prompt = EXPLAINER_PROMPT_TEMPLATE.format(
            learner_context=pedagogical_context,
            circuit_json=json.dumps(circuit_dict, indent=2) if circuit else "None",
            simulation_summary=sim_summary,
            user_query=query or "Explain how this circuit transforms the quantum state from start to finish."
        )

        if self.client:
            try:
                response = self._generate(
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=MASTER_TUTOR_SYSTEM_INSTRUCTION,
                        temperature=0.5
                    )
                )
                return ExplainResponse(
                    explanation=response.text,
                    visual_aid_cues=[
                        "Inspect the Bloch sphere at wire 0",
                        "Observe constructive/destructive interference in the histogram"
                    ]
                )
            except Exception as e:
                logger.error(f"Gemini explain error: {e}")

        # Fallback explainer
        fallback = self._generate_fallback_explanation(circuit, sim_summary, profile)
        fallback.explanation += self._offline_notice()
        return fallback

    def debug_circuit(
        self,
        circuit: CircuitDefinition,
        target_objective: str,
        user_id: str = "default_learner",
        reference_circuit: Optional[CircuitDefinition] = None
    ) -> DebugResponse:
        """
        Analyze student circuit against target objective using simulation and comparison.
        """
        profile = get_learner_profile(user_id)
        pedagogical_context = PersonalizationEngine.get_pedagogical_context(profile)

        circuit_dict = circuit.model_dump()
        sim_data = simulate_circuit(circuit_dict)
        sim_result = SimulationResult(
            success=sim_data.get("success", False),
            num_qubits=sim_data.get("num_qubits", 1),
            statevector_formatted=sim_data.get("statevector_formatted"),
            probabilities=sim_data.get("probabilities", {}),
            counts=sim_data.get("counts", {}),
            bloch_vectors=sim_data.get("bloch_vectors"),
            circuit_depth=sim_data.get("circuit_depth"),
            gate_count=sim_data.get("gate_count")
        )

        comparison_summary = "No reference circuit provided. Evaluated directly against objective."
        is_correct = False
        if reference_circuit:
            comp = compare_circuits(circuit_dict, reference_circuit.model_dump())
            comparison_summary = json.dumps(comp, indent=2)
            is_correct = comp.get("equivalent", False)
        else:
            # Rule check for common benchmark objectives:
            # Bell State |Phi+>: probabilities 50% '00', 50% '11'
            probs = sim_data.get("probabilities", {})
            if "bell state" in target_objective.lower() or "phi+" in target_objective.lower():
                is_correct = (
                    abs(probs.get("00", 0.0) - 0.5) < 0.05 and
                    abs(probs.get("11", 0.0) - 0.5) < 0.05 and
                    len(probs) == 2
                )
            elif "ghz" in target_objective.lower():
                is_correct = (
                    abs(probs.get("000", 0.0) - 0.5) < 0.05 and
                    abs(probs.get("111", 0.0) - 0.5) < 0.05 and
                    len(probs) == 2
                )

        # Generate tiered hints
        hints = PersonalizationEngine.generate_tiered_hints(
            f"Target: {target_objective}. Observed probabilities: {sim_data.get('probabilities')}",
            skill_level=SkillLevel(profile.get("skill_level", "beginner"))
        )

        if self.client:
            try:
                prompt = DEBUGGER_PROMPT_TEMPLATE.format(
                    target_objective=target_objective,
                    circuit_json=json.dumps(circuit_dict, indent=2),
                    simulation_summary=json.dumps(sim_data, indent=2),
                    comparison_summary=comparison_summary,
                    learner_context=pedagogical_context
                )
                response = self._generate(
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=MASTER_TUTOR_SYSTEM_INSTRUCTION,
                        temperature=0.3
                    )
                )
                return DebugResponse(
                    is_correct=is_correct,
                    diagnosis=response.text,
                    simulation_output=sim_result,
                    hints=hints
                )
            except Exception as e:
                logger.error(f"Gemini debug error: {e}")

        # Fallback debugger output
        diagnosis = (
            f"### Debugging Report for Target: '{target_objective}'\n\n"
            f"- **Status**: {'Verified Correct!' if is_correct else 'Discrepancy Detected'}\n"
            f"- **Simulated Probabilities**: `{sim_data.get('probabilities')}`\n"
            f"- **Statevector**: `{sim_data.get('statevector_formatted')}`\n\n"
        )
        if is_correct:
            diagnosis += "Great job! Your circuit produces the exact quantum state required by the challenge."
        else:
            diagnosis += (
                "Your circuit did not produce the expected quantum state distribution. "
                "Notice that the simulated output does not match the target superposition or entanglement profile."
            )

        return DebugResponse(
            is_correct=is_correct,
            diagnosis=diagnosis,
            simulation_output=sim_result,
            hints=hints
        )

    def optimize_circuit(
        self,
        circuit: CircuitDefinition,
        target_criteria: str = "Reduce gate count and depth while preserving unitary equivalence"
    ) -> OptimizeResponse:
        """
        Analyze circuit for cancellations (e.g. H-H, X-X, CNOT-CNOT), rotation merging, and SWAP reduction.
        """
        circuit_dict = circuit.model_dump()
        sim_data = simulate_circuit(circuit_dict)
        orig_count = len(circuit.gates)

        # Rule-based static optimizer check for gate cancellations
        optimized_gates, suggestions = self._perform_static_optimization(circuit.gates)
        opt_count = len(optimized_gates)

        optimized_circuit = CircuitDefinition(
            num_qubits=circuit.num_qubits,
            num_classical_bits=circuit.num_classical_bits,
            gates=optimized_gates
        )

        explanation = (
            f"Analyzed {orig_count} gates. Identified {len(suggestions)} optimization opportunities, "
            f"reducing gate count to {opt_count}."
        )

        if self.client:
            try:
                prompt = OPTIMIZER_PROMPT_TEMPLATE.format(
                    circuit_json=json.dumps(circuit_dict, indent=2),
                    simulation_summary=json.dumps(sim_data, indent=2),
                    target_criteria=target_criteria
                )
                response = self._generate(
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=MASTER_TUTOR_SYSTEM_INSTRUCTION,
                        temperature=0.2
                    )
                )
                explanation = response.text
            except Exception as e:
                logger.error(f"Gemini optimize error: {e}")

        return OptimizeResponse(
            original_gate_count=orig_count,
            optimized_gate_count=opt_count,
            optimization_suggestions=suggestions if suggestions else ["Circuit is already canonical/minimal."],
            optimized_circuit=optimized_circuit,
            explanation=explanation
        )

    def _perform_static_optimization(
        self,
        gates: List[QuantumGate]
    ) -> Tuple[List[QuantumGate], List[str]]:
        """
        Static optimizer pass:
        - Self-inverse pairs (H-H, X-X, Y-Y, Z-Z) on same qubit cancel to identity.
        - Consecutive identical CNOTs on identical control & target cancel to identity.
        """
        new_gates: List[QuantumGate] = []
        suggestions: List[str] = []
        skip_indices = set()

        for i in range(len(gates)):
            if i in skip_indices:
                continue

            g1 = gates[i]
            # Check adjacent gate on same qubit
            if i + 1 < len(gates):
                g2 = gates[i + 1]
                # Self inverse 1-qubit gates
                if (
                    g1.type in ("h", "x", "y", "z") and
                    g1.type == g2.type and
                    g1.qubits == g2.qubits
                ):
                    suggestions.append(
                        f"Cancelled consecutive self-inverse gates: {g1.type.upper()} and {g2.type.upper()} on qubit {g1.qubits[0]} (equivalent to Identity)."
                    )
                    skip_indices.add(i)
                    skip_indices.add(i + 1)
                    continue
                # Self inverse CNOT
                if (
                    g1.type in ("cx", "cnot") and
                    g2.type in ("cx", "cnot") and
                    g1.qubits == g2.qubits
                ):
                    suggestions.append(
                        f"Cancelled consecutive duplicate CNOT gates with control q{g1.qubits[0]} and target q{g1.qubits[1]}."
                    )
                    skip_indices.add(i)
                    skip_indices.add(i + 1)
                    continue

            new_gates.append(g1)

        return new_gates, suggestions

    def _extract_or_generate_questions(
        self,
        text: str,
        circuit: Optional[CircuitDefinition]
    ) -> List[str]:
        """Generate relevant follow-up questions for the student."""
        if circuit and len(circuit.gates) > 0:
            return [
                "What happens if we swap the control and target qubits?",
                "How does measuring earlier change the quantum state?",
                "Can you show me the Bloch sphere representation of qubit 0?"
            ]
        return [
            "What is the physical meaning of quantum superposition?",
            "How does a Hadamard gate differ from a classical NOT gate?",
            "Can you give me a circuit challenge to test my understanding?"
        ]

    def _generate_fallback_chat_response(
        self,
        message: str,
        circuit: Optional[CircuitDefinition],
        sim: Optional[SimulationResult],
        profile: Dict[str, Any],
        pedagogical_context: str
    ) -> TutorChatResponse:
        """Heuristic Socratic tutor response when API key is not yet set."""
        name = profile.get("name", "Student")
        skill = profile.get("skill_level", "beginner")

        response_lines = [
            f"Hello {name}! I am **QuBit**, your Quantum Computing AI Tutor."
        ]

        if sim and sim.success:
            response_lines.append("\nI simulated your current circuit with the local quantum engine:")
            response_lines.append(f"- **Qubits**: {sim.num_qubits}")
            response_lines.append(f"- **Measurement Probabilities**: `{sim.probabilities}`")
            response_lines.append(f"- **Statevector**: `{sim.statevector_formatted}`")

            # Check if Bell state
            if sim.probabilities.get("00", 0) > 0.4 and sim.probabilities.get("11", 0) > 0.4:
                response_lines.append(
                    "\nNotice how measuring qubit 0 immediately tells you the state of qubit 1! "
                    "This correlation is the hallmark of the **Bell state** $|\\Phi^+\\rangle = \\frac{|00\\rangle + |11\\rangle}{\\sqrt{2}}$."
                )
            else:
                response_lines.append(
                    "\nObserve how the probability amplitudes distribute across the computational basis states. "
                    "Which state do you expect to observe most frequently, and why?"
                )
        else:
            response_lines.append(
                f"\nYou asked: *\"{message}\"*\n\n"
                "In quantum computing, every quantum bit starts in the base state $|0\\rangle$. "
                "When you apply a **Hadamard (H)** gate, it puts the qubit into an equal superposition: "
                "$$|+\\rangle = \\frac{1}{\\sqrt{2}}(|0\\rangle + |1\\rangle)$$"
                "Try placing an H gate on qubit 0 in the circuit builder to see how the Bloch sphere tips towards the equator!"
            )

        return TutorChatResponse(
            response="\n".join(response_lines),
            simulation_called=sim is not None,
            simulation_result=sim,
            suggested_questions=[
                "Why does Hadamard create an equal 50/50 superposition?",
                "How do we entangle two qubits using a CNOT gate?",
                "What is the difference between phase and probability?"
            ]
        )

    def _generate_fallback_explanation(
        self,
        circuit: Optional[CircuitDefinition],
        sim_summary: str,
        profile: Dict[str, Any]
    ) -> ExplainResponse:
        """Deterministic explanation fallback for circuits."""
        if not circuit or not circuit.gates:
            return ExplainResponse(
                explanation=(
                    "### Empty Circuit\n"
                    "The circuit has no gates. In quantum computing, all qubits initialize in the ground state $|0\\dots0\\rangle$. "
                    "If measured now, you will observe `0` with 100% probability."
                ),
                state_breakdown=["Initial: |0...0>"],
                visual_aid_cues=["Qubit points directly to North Pole (|0>) on Bloch sphere."]
            )

        gate_names = [g.type.value.upper() for g in circuit.gates]
        init_state = "|0>" * circuit.num_qubits
        explanation = (
            f"### Step-by-Step Circuit Evolution\n\n"
            f"This {circuit.num_qubits}-qubit circuit executes {len(circuit.gates)} operations: `{' -> '.join(gate_names)}`.\n\n"
            f"1. **Initialization**: All qubits start in ground state |0...0> ({init_state}).\n"
            f"2. **Gate Sequence**: Gates transform the state vector through unitary operations.\n"
            f"3. **Simulation Output**:\n{sim_summary}\n\n"
            "Notice how each unitary gate preserves total probability (sum |c_i|^2 = 1)."
        )

        return ExplainResponse(
            explanation=explanation,
            state_breakdown=[f"Gate {i+1}: {g.type.value.upper()} on qubits {g.qubits}" for i, g in enumerate(circuit.gates)],
            visual_aid_cues=["Watch the Bloch sphere rotate along the X or Z axis as gates execute."]
        )