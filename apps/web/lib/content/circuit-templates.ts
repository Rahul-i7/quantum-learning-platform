// Algorithm templates for the Circuit Builder's "Load Template" panel.
//
// These mirror the canonical circuits kept as JSON examples in
// shared/circuit-schema/examples (the shared contract other services read),
// but shaped for this app's zustand circuit store: gates here have no
// `clbits` field, and multi-qubit gates are expressed as a single gate
// entry whose `qubits` array lists every qubit it touches (same
// convention CircuitCanvas already uses for "cx").
//
// `step` groups gates into the same canvas column. Gates sharing a step
// must not share a qubit. Kept within the builder's limits: <= 6 qubits,
// <= 8 steps (see MAX_QUBITS / NUM_STEPS in app/builder/page.tsx and
// components/circuit-builder/CircuitCanvas.tsx).

export interface TemplateGate {
    type: string;
    qubits: number[];
    step: number;
}

export interface CircuitTemplate {
    id: string;
    title: string;
    category: "bell-states" | "teleportation" | "deutsch-jozsa" | "grover" | "bb84";
    description: string;
    numQubits: number;
    gates: TemplateGate[];
}

export const CIRCUIT_TEMPLATES: CircuitTemplate[] = [
    {
        id: "bell-phi-plus",
        title: "Bell State — Φ+",
        category: "bell-states",
        description: "(|00⟩ + |11⟩) / √2 — the canonical Bell pair.",
        numQubits: 2,
        gates: [
            { type: "h", qubits: [0], step: 0 },
            { type: "cx", qubits: [0, 1], step: 1 },
            { type: "measure", qubits: [0], step: 2 },
            { type: "measure", qubits: [1], step: 2 },
        ],
    },
    {
        id: "bell-phi-minus",
        title: "Bell State — Φ−",
        category: "bell-states",
        description: "(|00⟩ − |11⟩) / √2 — Φ+ with a relative phase flip.",
        numQubits: 2,
        gates: [
            { type: "h", qubits: [0], step: 0 },
            { type: "z", qubits: [0], step: 1 },
            { type: "cx", qubits: [0, 1], step: 2 },
            { type: "measure", qubits: [0], step: 3 },
            { type: "measure", qubits: [1], step: 3 },
        ],
    },
    {
        id: "bell-psi-plus",
        title: "Bell State — Ψ+",
        category: "bell-states",
        description: "(|01⟩ + |10⟩) / √2 — Φ+ with qubit 1 pre-flipped.",
        numQubits: 2,
        gates: [
            { type: "h", qubits: [0], step: 0 },
            { type: "x", qubits: [1], step: 0 },
            { type: "cx", qubits: [0, 1], step: 1 },
            { type: "measure", qubits: [0], step: 2 },
            { type: "measure", qubits: [1], step: 2 },
        ],
    },
    {
        id: "bell-psi-minus",
        title: "Bell State — Ψ−",
        category: "bell-states",
        description: "(|01⟩ − |10⟩) / √2 — the fourth and last Bell state.",
        numQubits: 2,
        gates: [
            { type: "h", qubits: [0], step: 0 },
            { type: "x", qubits: [1], step: 0 },
            { type: "z", qubits: [0], step: 1 },
            { type: "cx", qubits: [0, 1], step: 2 },
            { type: "measure", qubits: [0], step: 3 },
            { type: "measure", qubits: [1], step: 3 },
        ],
    },
    {
        id: "teleportation",
        title: "Quantum Teleportation",
        category: "teleportation",
        description: "Teleports q0's state onto q2 via a Bell pair on q1/q2.",
        numQubits: 3,
        gates: [
            { type: "h", qubits: [1], step: 0 },
            { type: "cx", qubits: [1, 2], step: 1 },
            { type: "cx", qubits: [0, 1], step: 2 },
            { type: "h", qubits: [0], step: 3 },
            { type: "measure", qubits: [0], step: 4 },
            { type: "measure", qubits: [1], step: 4 },
        ],
    },
    {
        id: "deutsch-jozsa-constant",
        title: "Deutsch-Jozsa — Constant Oracle",
        category: "deutsch-jozsa",
        description: "1-bit oracle with f(x) = 0. Input register always measures 0.",
        numQubits: 2,
        gates: [
            { type: "x", qubits: [1], step: 0 },
            { type: "h", qubits: [0], step: 1 },
            { type: "h", qubits: [1], step: 1 },
            { type: "h", qubits: [0], step: 2 },
            { type: "measure", qubits: [0], step: 3 },
        ],
    },
    {
        id: "deutsch-jozsa-balanced",
        title: "Deutsch-Jozsa — Balanced Oracle",
        category: "deutsch-jozsa",
        description: "1-bit oracle with f(x) = x. Input register never measures 0.",
        numQubits: 2,
        gates: [
            { type: "x", qubits: [1], step: 0 },
            { type: "h", qubits: [0], step: 1 },
            { type: "h", qubits: [1], step: 1 },
            { type: "cx", qubits: [0, 1], step: 2 },
            { type: "h", qubits: [0], step: 3 },
            { type: "measure", qubits: [0], step: 4 },
        ],
    },
    {
        id: "grover-2qubit",
        title: "Grover's Search (marks |11⟩)",
        category: "grover",
        description: "One oracle+diffusion round over 2 qubits. Measures 11 with near-certainty.",
        numQubits: 2,
        gates: [
            { type: "h", qubits: [0], step: 0 },
            { type: "h", qubits: [1], step: 0 },
            { type: "cz", qubits: [0, 1], step: 1 },
            { type: "h", qubits: [0], step: 2 },
            { type: "h", qubits: [1], step: 2 },
            { type: "x", qubits: [0], step: 3 },
            { type: "x", qubits: [1], step: 3 },
            { type: "cz", qubits: [0, 1], step: 4 },
            { type: "x", qubits: [0], step: 5 },
            { type: "x", qubits: [1], step: 5 },
            { type: "h", qubits: [0], step: 6 },
            { type: "h", qubits: [1], step: 6 },
            { type: "measure", qubits: [0], step: 7 },
            { type: "measure", qubits: [1], step: 7 },
        ],
    },
    {
        id: "bb84-matching",
        title: "BB84 — Matching Bases",
        category: "bb84",
        description: "Alice encodes bit 1 in the X basis; Bob measures in X. Deterministic (kept for the key).",
        numQubits: 1,
        gates: [
            { type: "x", qubits: [0], step: 0 },
            { type: "h", qubits: [0], step: 1 },
            { type: "h", qubits: [0], step: 2 },
            { type: "measure", qubits: [0], step: 3 },
        ],
    },
    {
        id: "bb84-mismatched",
        title: "BB84 — Mismatched Bases",
        category: "bb84",
        description: "Alice encodes in X; Bob measures in Z. Random outcome (discarded by BB84).",
        numQubits: 1,
        gates: [
            { type: "x", qubits: [0], step: 0 },
            { type: "h", qubits: [0], step: 1 },
            { type: "measure", qubits: [0], step: 2 },
        ],
    },
];

export const TEMPLATE_CATEGORY_LABELS: Record<CircuitTemplate["category"], string> = {
    "bell-states": "Bell States",
    teleportation: "Teleportation",
    "deutsch-jozsa": "Deutsch-Jozsa",
    grover: "Grover's Search",
    bb84: "BB84",
};