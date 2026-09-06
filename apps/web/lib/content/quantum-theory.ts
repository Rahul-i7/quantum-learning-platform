// Theory content for the /learn section. Kept as data (not hardcoded JSX)
// so new topics/gates can be added without touching LearnContent.tsx.

export interface Topic {
  id: string;
  title: string;
  category: "fundamentals" | "gates";
  summary: string;
  body: TopicBlock[];
}

export type TopicBlock =
  | { type: "p"; text: string }
  | { type: "matrix"; label: string; rows: string[] }
  | { type: "note"; text: string };

export const TOPICS: Topic[] = [
  {
    id: "qubits",
    title: "Qubits & Superposition",
    category: "fundamentals",
    summary: "The basic unit of quantum information, and why it isn't just a fancy bit.",
    body: [
      {
        type: "p",
        text: "A classical bit is always either 0 or 1. A qubit's state is a combination — a superposition — of both: |ψ⟩ = α|0⟩ + β|1⟩, where α and β are complex numbers called amplitudes.",
      },
      {
        type: "p",
        text: "You never observe α and β directly. Measuring the qubit collapses it to a definite 0 or 1, with probability |α|² of getting 0 and |β|² of getting 1. Those two probabilities must add up to 1 — that's why you'll often see amplitudes like 1/√2 (≈0.707) in this platform's results: (1/√2)² + (1/√2)² = 0.5 + 0.5 = 1.",
      },
      {
        type: "note",
        text: "In the builder, the \"probabilities\" panel after running a circuit is exactly this: |amplitude|² for each possible measurement outcome.",
      },
    ],
  },
  {
    id: "bloch-sphere",
    title: "The Bloch Sphere",
    category: "fundamentals",
    summary: "A way to picture a single qubit's state as a point on a sphere.",
    body: [
      {
        type: "p",
        text: "Since a qubit's state is really just two numbers (α and β) constrained so their squared magnitudes sum to 1, it can be drawn as a single point on the surface of a sphere. The north pole is |0⟩, the south pole is |1⟩, and everywhere else on the surface is some superposition of the two.",
      },
      {
        type: "p",
        text: "Gates that act on one qubit are rotations of this point around the sphere. This is exactly what the Bloch sphere visualizer in the builder is showing you — it's not a separate simulation, it's a picture of the same statevector math the simulator computed.",
      },
      {
        type: "note",
        text: "If a qubit is entangled with another (see below), its individual point moves inside the sphere rather than on the surface — that shrinking is a visual signal of entanglement, not measurement noise.",
      },
    ],
  },
  {
    id: "entanglement",
    title: "Entanglement",
    category: "fundamentals",
    summary: "What happens when two qubits stop having independent states.",
    body: [
      {
        type: "p",
        text: "Two qubits are entangled when their combined state can't be split apart into 'qubit A's state' and 'qubit B's state' separately. Measuring one instantly tells you something certain about the other, no matter how the circuit is drawn out.",
      },
      {
        type: "p",
        text: "The classic example — and the one this platform's CX gate is built to create — is the Bell state: apply H to one qubit, then CX with that qubit as control. The result is 50% chance of measuring both qubits as 0, 50% chance of both as 1, and 0% chance of ever seeing them different.",
      },
      {
        type: "note",
        text: "Try it: place an H gate, then a CX from that qubit to another, and run the circuit. Check the Measurement Outcomes panel — you should see only '00' and '11' bars, never '01' or '10'.",
      },
    ],
  },
  {
    id: "measurement",
    title: "Measurement & Probabilities",
    category: "fundamentals",
    summary: "How a quantum state becomes a classical answer.",
    body: [
      {
        type: "p",
        text: "Measurement is the only way to get classical information out of a quantum circuit, and it's irreversible — once you measure, superposition is gone and you're left with a definite bitstring.",
      },
      {
        type: "p",
        text: "Because outcomes are probabilistic, a single run doesn't tell you the full picture. Real quantum hardware (and simulators, when you use a measure gate) run the same circuit many times — 'shots' — and report counts: how many times each bitstring showed up.",
      },
      {
        type: "note",
        text: "In this platform, if your circuit has no measure gate, the simulator instead reports exact probabilities directly from the math (no sampling noise). Add a Measure gate to see shot-based counts instead.",
      },
    ],
  },
  {
    id: "gate-h",
    title: "H — Hadamard",
    category: "gates",
    summary: "Turns a definite 0 or 1 into an equal superposition of both.",
    body: [
      {
        type: "p",
        text: "The Hadamard gate is how superposition usually enters a circuit. Applied to |0⟩, it produces an equal mix of |0⟩ and |1⟩ — measuring afterward gives 0 or 1 with 50/50 probability.",
      },
      {
        type: "matrix",
        label: "H = (1/√2) ×",
        rows: ["[ 1   1 ]", "[ 1  -1 ]"],
      },
      {
        type: "note",
        text: "On the Bloch sphere, H rotates |0⟩ (north pole) to the equator — the point exactly between the poles, representing equal probability of either outcome.",
      },
    ],
  },
  {
    id: "gate-x",
    title: "X — Pauli-X (NOT)",
    category: "gates",
    summary: "The quantum equivalent of a classical NOT gate.",
    body: [
      {
        type: "p",
        text: "X flips |0⟩ to |1⟩ and vice versa, exactly like a classical NOT — but it also works on superpositions, flipping the roles of the two amplitudes.",
      },
      {
        type: "matrix",
        label: "X =",
        rows: ["[ 0  1 ]", "[ 1  0 ]"],
      },
      {
        type: "note",
        text: "On the Bloch sphere, X is a 180° rotation around the sphere's X-axis — it swaps the north and south poles.",
      },
    ],
  },
  {
    id: "gate-cx",
    title: "CX — Controlled-NOT (CNOT)",
    category: "gates",
    summary: "A two-qubit gate that flips a target qubit only if the control qubit is 1.",
    body: [
      {
        type: "p",
        text: "CX is the workhorse for creating entanglement. It takes a control qubit and a target qubit: if the control is |1⟩, it applies X to the target; if the control is |0⟩, it does nothing to the target.",
      },
      {
        type: "p",
        text: "When the control qubit is in superposition (say, after an H gate) rather than a definite 0 or 1, CX entangles the two qubits — the 'flip the target' and 'don't flip it' possibilities both exist at once, linked to the control's state.",
      },
      {
        type: "note",
        text: "This is exactly the two-step gate in the builder: click a qubit wire to set it as control, then click the target wire to complete the connection.",
      },
    ],
  },
  {
    id: "gate-measure",
    title: "Measure",
    category: "gates",
    summary: "Collapses a qubit's superposition into a definite classical bit.",
    body: [
      {
        type: "p",
        text: "Placing a Measure gate on a qubit tells the simulator to actually sample an outcome for that qubit rather than just reporting the underlying probabilities — this is what makes the 'counts' (shot-based results) appear instead of 'probabilities'.",
      },
      {
        type: "note",
        text: "A circuit with no Measure gates still gives you exact probabilities in this platform — Measure only changes how the result is reported, not whether the underlying math is computed.",
      },
    ],
  },
];

export const CATEGORY_LABELS: Record<Topic["category"], string> = {
  fundamentals: "Fundamentals",
  gates: "Gates in this Builder",
};
