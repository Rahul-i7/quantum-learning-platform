# AI-Based Interactive Quantum Algorithm Learning Platform — Design Doc

> **Purpose of this document:** This is the shared design reference for the whole team. Anyone can upload this file to their own Claude conversation, say "I'm doing [role/task]", and start working on their part with full context on how it fits into the rest of the system.

---

## 1. Problem Statement

Quantum computing education today is largely theoretical, fragmented across disconnected tools, and inaccessible without expensive real quantum hardware. Students and early professionals lack a single environment where they can learn concepts, build circuits, simulate them, and get intelligent feedback — all in one place.

## 2. Objectives

- Interactive web platform for learning, designing, simulating, and visualizing quantum algorithms.
- Both graphical (drag-and-drop) and code-based circuit design.
- Real-time circuit execution and simulation.
- AI-assisted tutoring: concept explanation, error detection, optimization suggestions, personalized learning paths.
- Visualization of quantum states, Bloch spheres, measurement probabilities.
- Assessments, coding challenges, progress tracking, instructor dashboards.

---

## 3. System Architecture

The system is split into four tiers so different people can build and test each one independently, as long as they agree on the interfaces (API contracts) between them.

```
┌─────────────────────────────────────────────┐
│              Web Frontend (Next.js)          │
│  Circuit builder · Code editor · LMS UI       │
└───────────────────┬───────────────────────────┘
                     │ REST/GraphQL calls
┌───────────────────▼───────────────────────────┐
│         API Gateway / Orchestrator             │
│   Auth · Routing · Request orchestration        │
└──────┬───────────────┬───────────────┬─────────┘
       │               │               │
┌──────▼─────┐  ┌──────▼──────┐  ┌─────▼───────┐
│ AI Tutor    │  │ Simulation  │  │ Content /   │
│ Service     │  │ Service     │  │ Progress    │
│ (Google AI  │  │ (Qiskit)    │  │ Service     │
│  Studio)    │  │             │  │ (Supabase)  │
└─────────────┘  └─────────────┘  └─────────────┘
```

**Frontend (Next.js)**
- Drag-and-drop circuit builder (canvas-based, e.g. Konva or custom SVG/React)
- Code editor (Monaco) for users who want to write Qiskit code directly
- Visualization layer: Bloch sphere (Three.js), measurement histograms (D3/Plotly/Recharts)
- Learning module UI, quizzes, dashboards
- Auth via Supabase client SDK

**API Gateway**
- Central entry point for all frontend requests
- Handles authentication/session validation (Supabase Auth / JWT)
- Routes requests to the correct backend service
- Can be a lightweight Next.js API layer initially, or a separate service if the team prefers a dedicated backend

**Simulation Service**
- Accepts a circuit definition (from either the drag-and-drop builder or raw code) in a shared JSON format
- Executes it via Qiskit (Aer simulator to start)
- Returns statevector, measurement counts, and probabilities as JSON
- Runs user-submitted code in a sandboxed/isolated environment — this is a hard requirement, not optional, since we're executing arbitrary user code
- Designed with an adapter pattern so more simulators (Cirq, PennyLane) can be added later without changing the interface

**AI Tutor Service**
- Wraps Google AI Studio (Gemini) for explanations, debugging help, and optimization suggestions
- Should be able to call the Simulation Service as a tool — i.e., actually run the learner's circuit and reason about the real output, not just guess from the code
- Personalization: pulls the learner's past quiz/assessment performance from the Content Service to tailor explanations

**Content & Progress Service (Supabase)**
- Postgres database for: users, courses, lessons, quizzes, coding challenges, submissions, progress records
- Row-level security so users only see their own progress; instructors see aggregated cohort data
- Supabase Auth for login/signup

---

## 4. Circuit Data Format (shared contract)

All three backend services need to agree on one shared representation of a "circuit" so the frontend, simulator, and AI tutor can all speak the same language. Proposed shape (finalize as a team before backend work starts):

```json
{
  "num_qubits": 3,
  "gates": [
    { "type": "h", "qubits": [0] },
    { "type": "cx", "qubits": [0, 1] },
    { "type": "measure", "qubits": [0, 1, 2] }
  ]
}
```

The drag-and-drop builder generates this JSON. The code editor's Qiskit code gets parsed/translated into this same JSON (or the simulation service accepts raw code directly — decide together, but keep one canonical internal format).

---

## 5. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, React, Tailwind |
| Backend / Auth / DB | Supabase (Postgres, Auth, Row-Level Security) |
| AI Tutor | Google AI Studio (Gemini API) |
| Quantum Simulation | Qiskit (Aer simulator) |
| Circuit Visualization | Three.js (Bloch sphere), D3/Recharts/Plotly (histograms) |
| Code Editor | Monaco Editor |

---

## 6. Development Phases

1. **Foundation** — basic circuit builder + one working simulation backend (Qiskit Aer) returning results as JSON.
2. **Interactivity** — real-time state/measurement visualization; code editor path added alongside drag-and-drop.
3. **Intelligence layer** — AI tutor wired in with tool-calling into the simulation service.
4. **Learning & assessment tools** — lessons, quizzes, coding challenges, progress tracking.
5. **Expansion & polish** — instructor dashboards, personalization refinement, UI polish, additional simulators.

Aim to get a thin vertical slice working end-to-end first (build a simple circuit → simulate → see a result on screen) before every team member goes deep on their own module — this catches integration issues early.

---

## 7. Feasibility Notes

- No physical quantum hardware needed — classical simulation via Qiskit Aer handles all educational-scale circuits (well under the ~20-qubit range).
- All chosen tools are free/low-cost for a project of this scale.
- Main technical risk is sandboxing user-submitted code safely — treat this as a priority, not an afterthought.

---

## 8. Team Roles & Tasks

Six roles. Each teammate should read the full doc above for context, then focus on their section. Cross-team syncing is needed wherever an interface (like the circuit JSON format in section 4) is shared.

### 1. Frontend Lead — Circuit Builder & UI
- Build the drag-and-drop circuit builder (gate palette, wire grid, canvas interactions)
- Integrate the Monaco code editor as an alternate input mode
- Build core app shell/navigation, learning module pages, quiz UI
- Own the frontend's connection to the API gateway

### 2. Frontend/Visualization Engineer — State & Results Visualization
- Build the Bloch sphere visualization (Three.js)
- Build measurement probability histograms / result displays
- Work closely with Role 1 on shared UI components and design consistency
- Handle instructor dashboard visualizations (progress charts, cohort stats)

### 3. Backend Lead — API Gateway & Simulation Service
- Set up the API gateway (routing, auth validation, request orchestration)
- Build the Qiskit-based simulation service: accept circuit JSON, execute, return results
- Set up sandboxing/isolation for running user-submitted circuits/code safely
- Define and document the circuit JSON contract (section 4) with the whole team

### 4. AI Integration Lead — Tutor Service
- Integrate Google AI Studio (Gemini) for explanations, debugging, and optimization suggestions
- Implement tool-calling so the AI tutor can invoke the simulation service and reason over real circuit output
- Design the personalization logic (pulling past performance data to tailor explanations)
- Prompt design/testing for tutor quality

### 5. Backend/Data Lead — Content, Auth & Progress (Supabase)
- Design and implement the Supabase schema: users, courses, lessons, quizzes, challenges, submissions, progress
- Set up Supabase Auth and row-level security policies
- Build the assessment/coding-challenge grading logic
- Build APIs for progress tracking and instructor-facing data aggregation

### 6. Presentation & Documentation Lead
- Own the pitch deck (PPT) — problem, solution, architecture, demo narrative, impact
- Coordinate the demo flow/script across all modules for the final presentation
- Maintain project documentation (this doc and any updates as the build evolves)
- Support with UI copy, README, and any submission-required write-ups

---

## 9. Folder Structure & Ownership

Single monorepo so everyone works against the same shared contracts (circuit JSON schema, env config) without needing separate repos to sync.

```
quantum-learning-platform/
├── apps/
│   └── web/                        # Next.js frontend
│       ├── app/
│       │   ├── (auth)/             # login/signup pages
│       │   ├── builder/            # drag-and-drop circuit builder      → Role 1
│       │   ├── editor/             # Monaco code editor                 → Role 1
│       │   ├── learn/              # courses, lessons, quizzes UI       → Role 1
│       │   ├── dashboard/          # instructor dashboard UI            → Role 2
│       │   └── api/                # API gateway routes                → Role 3
│       ├── components/
│       │   ├── circuit-builder/    # gate palette, wire grid            → Role 1
│       │   ├── visualizations/     # Bloch sphere, histograms           → Role 2
│       │   └── ui/                 # shared/reusable components         → shared
│       ├── lib/
│       │   ├── supabase/           # Supabase client setup              → Role 5
│       │   └── api-client/         # frontend → gateway calls           → Role 1/2
│       └── public/
│
├── services/
│   ├── simulation/                 # Qiskit simulation service          → Role 3
│   │   ├── adapters/               # qiskit adapter (+ future cirq/pennylane)
│   │   ├── sandbox/                # isolated code execution
│   │   └── tests/
│   │
│   └── ai-tutor/                   # Google AI Studio integration       → Role 4
│       ├── tools/                  # tool-calling defs (calls simulation service)
│       ├── prompts/
│       └── tests/
│
├── supabase/                       # schema, auth, RLS policies         → Role 5
│   ├── migrations/
│   ├── seed/
│   └── policies/
│
├── shared/
│   └── circuit-schema/             # shared circuit JSON contract       → Role 3 (maintains, whole team consumes)
│
├── docs/                           # design doc, PPT, demo script       → Role 6
│   ├── design-doc.md
│   ├── ppt/
│   └── assets/
│
├── .env.example
├── README.md
└── package.json
```

**Ownership at a glance:**

| Folder | Owner |
|---|---|
| `apps/web/app/builder`, `editor`, `learn`, `components/circuit-builder` | Role 1 — Frontend Lead |
| `apps/web/app/dashboard`, `components/visualizations` | Role 2 — Visualization Engineer |
| `apps/web/app/api`, `services/simulation`, `shared/circuit-schema` | Role 3 — Backend Lead |
| `services/ai-tutor` | Role 4 — AI Integration Lead |
| `supabase/`, `apps/web/lib/supabase` | Role 5 — Backend/Data Lead |
| `docs/` | Role 6 — Presentation & Documentation Lead |

**Working conventions:**
- Branch per feature, named `role-<n>/<short-description>` (e.g. `role-3/circuit-json-schema`), PR into `main`.
- Anyone changing `shared/circuit-schema/` should flag it to the team first — it's the one folder every service depends on.
- Keep `.env.example` updated whenever a new service/key is added, so nobody's blocked pulling the repo.

---

## 10. How to Use This Doc

If you're picking up a task: upload this file to Claude and say something like *"I'm doing Role 3 (Backend Lead — API Gateway & Simulation Service), help me build the Qiskit simulation service that accepts the circuit JSON format described in section 4."* Claude will have the full context of the architecture and how your piece connects to everyone else's.
