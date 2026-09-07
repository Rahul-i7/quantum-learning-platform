# AI Tutor Service (Role 4 — AI Integration Lead)

The **AI Tutor Service** is the intelligence core of the **AI-Based Interactive Quantum Algorithm Learning Platform**. It wraps Google AI Studio (Gemini) using the official `google-genai` SDK and provides:
1. **Interactive Socratic Tutoring**: Guides students without spoon-feeding answers.
2. **Tool-Calling Quantum Simulation**: Automatically invokes quantum circuit simulation (Role 3 Qiskit service, with internal fallback) to reason over ground truth statevectors and measurement distributions.
3. **Automated Circuit Debugger**: Analyzes student circuits against target challenge objectives, diagnoses physical flaws, and delivers 3-tiered scaffolded hints.
4. **Adaptive Personalization Engine**: Tailors math complexity, tone, and analogies based on learner mastery (Beginner, Intermediate, Advanced) and quiz history.
5. **Circuit Optimization**: Recommends gate cancellations (e.g., $H \cdot H = I$), rotation mergers, and depth reductions.

---

## Folder Structure

```
services/ai-tutor/
├── api/                    # API models and router helpers
├── core/
│   └── tutor.py            # Core QuantumAITutor engine (Gemini SDK + tools)
├── models/
│   ├── circuit.py          # Circuit, gate, and simulation result schemas
│   ├── learner.py          # Learner profile & mastery schemas
│   └── api.py              # Request/Response DTOs
├── personalization/
│   ├── engine.py           # Pedagogical adaptation & tiered hints
│   └── models.py           # Cognitive policies and styles
├── prompts/
│   ├── system_tutor.py     # Master Socratic system instructions
│   ├── debugger_prompt.py  # Bug diagnosis prompt templates
│   ├── explainer_prompt.py # Step-by-step state evolution templates
│   └── optimizer_prompt.py # Circuit optimization templates
├── tools/
│   ├── simulation_tool.py  # Simulation tool calling + local quantum simulator
│   └── learner_profile_tool.py # Profile retrieval tool
├── tests/                  # Pytest test suite
├── cli.py                  # Interactive terminal interface for testing
├── main.py                 # FastAPI web application
├── config.py               # Settings & environment variable loader
├── requirements.txt        # Python package dependencies
└── README.md
```

---

## Quick Start

### 1. Install Dependencies
```bash
cd services/ai-tutor
pip install -r requirements.txt
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Edit `.env` and add your Google AI Studio API key:
```env
GEMINI_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-2.5-flash
SIMULATION_SERVICE_URL=http://localhost:8000
```
*(Note: If `GEMINI_API_KEY` is not provided, the service still runs autonomously using its internal local quantum simulator and rule-guided Socratic reasoning engine!)*

### 3. Run the Interactive CLI
Test conversational chat, circuit debugging, and simulation directly in your terminal:
```bash
python cli.py
```
Inside the CLI:
- `/load examples/bell_state.json` (or any circuit file)
- `/sim` to simulate the loaded circuit
- `/debug Create Bell State |Phi+>` to test the debugger
- `/explain` to get a step-by-step quantum state evolution breakdown
- `/optimize` to see gate cancellations
- `/level intermediate` to switch pedagogical levels

### 4. Run the FastAPI Web Service
Start the REST API server:
```bash
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```
View interactive Swagger API documentation at:
`http://localhost:8001/docs`

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/tutor/health` | Health status and connected Gemini model |
| `POST` | `/api/tutor/chat` | Conversational chat with circuit context |
| `POST` | `/api/tutor/explain` | Step-by-step circuit/concept explainer |
| `POST` | `/api/tutor/debug` | Circuit diagnosis & scaffolded hints |
| `POST` | `/api/tutor/optimize` | Unitary-preserving circuit optimization |
| `GET` | `/api/tutor/profiles/{user_id}` | Retrieve learner profile and weakness map |

---

## Running the Automated Test Suite

```bash
pytest tests/ -v
```
The test suite validates:
- Circuit schema validation and bounds checks
- Exact quantum simulation (Hadamard superposition, Bell state entanglement, Pauli flips)
- Multi-tier Socratic hint generation
- Personalization policies across Beginner, Intermediate, and Advanced profiles
- Circuit debugging and optimization logic
- FastAPI HTTP endpoints
