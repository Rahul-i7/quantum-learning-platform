// Theory content for the /learn section. Kept as data (not hardcoded JSX)
// so new topics/gates can be added without touching LearnContent.tsx.

export interface Topic {
    id: string;
    title: string;
    category: "fundamentals" | "gates" | "algorithms";
    summary: string;
    body: TopicBlock[];
}

export type TopicBlock =
    | { type: "p"; text: string }
    | { type: "matrix"; label: string; rows: string[] }
    | { type: "note"; text: string }
    | { type: "interactive"; component: "qubit-transformation"; defaultGate?: "I" | "X" | "Y" | "Z" | "H" | "S" | "S†" | "T" | "T†" }
    | { type: "interactive"; component: "bloch-explorer" }
    | { type: "interactive"; component: "measurement-demo" }
    | { type: "interactive"; component: "entanglement-demo" }
    | { type: "interactive"; component: "two-qubit-gate-demo"; gateType?: "cx" | "cz" | "swap" }
    | { type: "interactive"; component: "three-qubit-gate-demo"; gateType?: "ccx" | "cswap" }
    | { type: "interactive"; component: "rotation-gate-demo"; axis: "x" | "y" | "z" }
    | { type: "interactive"; component: "shors-periodicity" }
    // Renders one or more circuits from lib/content/circuit-templates.ts
    // as an SVG diagram (see components/learn/CircuitDiagramView.tsx).
    | { type: "interactive"; component: "circuit-diagram"; templateIds: string[] }
    // Rendered with KaTeX (see components/learn/Math.tsx). `tex` is raw
    // LaTeX source, e.g. "|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle".
    | { type: "math"; tex: string; caption?: string };

export const TOPICS: Topic[] = [
    {
        id: "qubits",
        title: "Qubits & Superposition",
        category: "fundamentals",
        summary:
            "The basic unit of quantum information, and why it isn't just a fancy bit.",
        body: [
            {
                type: "p",
                text: "A classical bit is always either 0 or 1. A qubit's state is a combination — a superposition — of both: |ψ⟩ = α|0⟩ + β|1⟩, where α and β are complex numbers called amplitudes.",
            },

            {
                type: "interactive",
                component: "qubit-transformation",
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
                type: "interactive",
                component: "bloch-explorer",
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
                type: "interactive",
                component: "entanglement-demo",
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
                type: "interactive",
                component: "measurement-demo",
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
                type: "interactive",
                component: "qubit-transformation",
                defaultGate: "H",
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
                type: "interactive",
                component: "qubit-transformation",
                defaultGate: "X",
            },
            {
                type: "note",
                text: "On the Bloch sphere, X is a 180° rotation around the sphere's X-axis — it swaps the north and south poles.",
            },
        ],
    }, {
        id: "gate-y",
        title: "Y — Pauli-Y (Bit & Phase Flip)",
        category: "gates",
        summary: "Flips both the bit value and the phase of a qubit simultaneously.",
        body: [
            {
                type: "p",
                text: "Y maps |0⟩ to i|1⟩ and |1⟩ to -i|0⟩, combining a bit-flip (NOT) and a phase-flip while introducing a complex phase factor.",
            },
            {
                type: "matrix",
                label: "Y =",
                rows: ["[ 0 -i ]", "[ i  0 ]"],
            },
            {
                type: "interactive",
                component: "qubit-transformation",
                defaultGate: "Y",
            },
            {
                type: "note",
                text: "On the Bloch sphere, Y is a 180° rotation around the sphere's Y-axis — it maps the +x state |+⟩ to the -x state |-⟩ and vice versa.",
            },
        ],
    }, {
        id: "gate-z",
        title: "Z — Pauli-Z (Phase Flip)",
        category: "gates",
        summary: "Flips the relative phase of the qubit without changing its state probabilities.",
        body: [
            {
                type: "p",
                text: "Z leaves |0⟩ unchanged and maps |1⟩ to -|1⟩, reversing the sign of the |1⟩ amplitude while keeping measurement odds in the computational basis identical.",
            },
            {
                type: "matrix",
                label: "Z =",
                rows: ["[ 1  0 ]", "[ 0 -1 ]"],
            },
            {
                type: "interactive",
                component: "qubit-transformation",
                defaultGate: "Z",
            },
            {
                type: "note",
                text: "On the Bloch sphere, Z is a 180° rotation around the sphere's Z-axis — it rotates the equator, swapping the positive and negative superposition states |+⟩ and |-⟩.",
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
                type: "interactive",
                component: "two-qubit-gate-demo",
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
                type: "interactive",
                component: "measurement-demo",
            },
            {
                type: "note",
                text: "A circuit with no Measure gates still gives you exact probabilities in this platform — Measure only changes how the result is reported, not whether the underlying math is computed.",
            },
        ],
    },

    {
        id: "gate-s",
        title: "S — Phase",
        category: "gates",
        summary: "A quarter-turn of relative phase — leaves |0⟩ and |1⟩ probabilities untouched.",
        body: [
            {
                type: "p",
                text: "S multiplies the |1⟩ amplitude by i, leaving |0⟩'s amplitude alone. Since |i| = 1, this never changes how likely you are to measure 0 or 1 — it only changes the relative phase between the two amplitudes, which is invisible in the computational basis but shows up as a rotation around the Bloch sphere's equator.",
            },
            {
                type: "matrix",
                label: "S =",
                rows: ["[ 1  0 ]", "[ 0  i ]"],
            },
            {
                type: "interactive",
                component: "qubit-transformation",
                defaultGate: "S",
            },
            {
                type: "note",
                text: "S does nothing visible to |0⟩ or |1⟩ themselves — try it from |+⟩ above and watch the point sweep a quarter-turn around the equator instead of the poles.",
            },
        ],
    },
    {
        id: "gate-sdg",
        title: "S† — S Dagger",
        category: "gates",
        summary: "The inverse of S — undoes exactly the phase rotation S applies.",
        body: [
            {
                type: "p",
                text: "S† multiplies the |1⟩ amplitude by -i instead of i — the opposite quarter-turn from S. Applying S then S† (or S† then S) returns a state to exactly where it started, which is what makes it the 'dagger' (inverse) of S.",
            },
            {
                type: "matrix",
                label: "S† =",
                rows: ["[ 1  0 ]", "[ 0 -i ]"],
            },
            {
                type: "interactive",
                component: "qubit-transformation",
                defaultGate: "S†",
            },
            {
                type: "note",
                text: "Gates whose matrix is its own inverse (like H, X, Y, Z) don't need a separate dagger version in the palette — S and T do, because applying them twice doesn't get you back to where you started.",
            },
        ],
    },
    {
        id: "gate-t",
        title: "T — Gate",
        category: "gates",
        summary: "An eighth-turn of relative phase — half the rotation of S.",
        body: [
            {
                type: "p",
                text: "T multiplies the |1⟩ amplitude by e^(iπ/4) — an eighth of a full turn, exactly half of what S does. Four T gates in a row equal one S gate; eight equal a full rotation back to the start. T shows up constantly in real quantum algorithms because it's the smallest common phase rotation most hardware can apply directly.",
            },
            {
                type: "math",
                tex: "T = \\begin{pmatrix} 1 & 0 \\\\ 0 & e^{i\\pi/4} \\end{pmatrix}",
            },
            {
                type: "interactive",
                component: "qubit-transformation",
                defaultGate: "T",
            },
            {
                type: "note",
                text: "Try S and T back to back from |+⟩ (S lesson, then T lesson) and compare how far each one sweeps the point — T's step is visibly half of S's.",
            },
        ],
    },
    {
        id: "gate-tdg",
        title: "T† — T Dagger",
        category: "gates",
        summary: "The inverse of T — rotates relative phase by -π/4 instead of +π/4.",
        body: [
            {
                type: "p",
                text: "T† multiplies the |1⟩ amplitude by e^(-iπ/4), the exact opposite of T's rotation. Like S†, it exists so you can undo a T gate without having to apply T seven more times to loop all the way around.",
            },
            {
                type: "math",
                tex: "T^\\dagger = \\begin{pmatrix} 1 & 0 \\\\ 0 & e^{-i\\pi/4} \\end{pmatrix}",
            },
            {
                type: "interactive",
                component: "qubit-transformation",
                defaultGate: "T†",
            },
            {
                type: "note",
                text: "T followed by T† (in either order) is the identity — build that two-gate circuit in the builder and confirm the output matches the input exactly.",
            },
        ],
    },
    {
        id: "gate-rx",
        title: "RX(θ)",
        category: "gates",
        summary: "A continuously adjustable rotation around the Bloch sphere's X axis.",
        body: [
            {
                type: "p",
                text: "Where X is a fixed 180° flip, RX(θ) lets you dial in any rotation angle around the same X axis. At θ = 180°, RX becomes X (up to an overall phase that doesn't affect measurement) — X is really just one specific case of this more general gate.",
            },
            {
                type: "math",
                tex: "R_x(\\theta) = \\begin{pmatrix} \\cos\\frac{\\theta}{2} & -i\\sin\\frac{\\theta}{2} \\\\ -i\\sin\\frac{\\theta}{2} & \\cos\\frac{\\theta}{2} \\end{pmatrix}",
            },
            {
                type: "interactive",
                component: "rotation-gate-demo",
                axis: "x",
            },
            {
                type: "note",
                text: "Drag θ all the way to 180° above and compare the output to what the fixed X gate lesson showed — they should land on the same point.",
            },
        ],
    },
    {
        id: "gate-ry",
        title: "RY(θ)",
        category: "gates",
        summary: "A continuously adjustable rotation around the Bloch sphere's Y axis.",
        body: [
            {
                type: "p",
                text: "RY(θ) rotates around the Y axis by any angle you choose. Unlike RX and RZ, RY's matrix is entirely real-valued — no i's anywhere — which makes it a common choice for preparing specific superposition amplitudes without introducing any relative phase.",
            },
            {
                type: "math",
                tex: "R_y(\\theta) = \\begin{pmatrix} \\cos\\frac{\\theta}{2} & -\\sin\\frac{\\theta}{2} \\\\ \\sin\\frac{\\theta}{2} & \\cos\\frac{\\theta}{2} \\end{pmatrix}",
            },
            {
                type: "interactive",
                component: "rotation-gate-demo",
                axis: "y",
            },
            {
                type: "note",
                text: "At θ = 90°, RY turns |0⟩ into |+⟩ with purely real amplitudes — try it above and check the statevector readout has no i terms at all.",
            },
        ],
    },
    {
        id: "gate-rz",
        title: "RZ(θ)",
        category: "gates",
        summary: "A continuously adjustable rotation around the Bloch sphere's Z axis — generalizes S, S†, T and T†.",
        body: [
            {
                type: "p",
                text: "RZ(θ) is the general phase rotation that S, S†, T and T† are all specific angles of: S is RZ(90°), T is RZ(45°), and so on. Because it rotates around the same axis |0⟩ and |1⟩ sit on, applying it to a pure |0⟩ or |1⟩ shows no visible movement on the Bloch sphere — the demo below starts from |+⟩ instead so the rotation is actually visible.",
            },
            {
                type: "math",
                tex: "R_z(\\theta) = \\begin{pmatrix} e^{-i\\theta/2} & 0 \\\\ 0 & e^{i\\theta/2} \\end{pmatrix}",
            },
            {
                type: "interactive",
                component: "rotation-gate-demo",
                axis: "z",
            },
            {
                type: "note",
                text: "Set θ to 90° and 45° above and compare the result to the S and T lessons — RZ at those angles reproduces them (up to an overall phase that measurement can't detect).",
            },
        ],
    },
    {
        id: "gate-cz",
        title: "CZ — Controlled-Z",
        category: "gates",
        summary: "Flips the relative phase of |11⟩ only — symmetric between its two qubits.",
        body: [
            {
                type: "p",
                text: "CZ applies a Z gate to the target qubit only when the control is |1⟩ — but since Z only flips sign, and that sign flip only matters when BOTH qubits are |1⟩, CZ ends up completely symmetric: it doesn't matter which qubit you call the control. CZ never changes which basis state you'd measure — only the relative phase of |11⟩ flips, which is why it's the workhorse behind Grover's diffusion operator.",
            },
            {
                type: "matrix",
                label: "CZ =",
                rows: [
                    "[ 1 0 0  0 ]",
                    "[ 0 1 0  0 ]",
                    "[ 0 0 1  0 ]",
                    "[ 0 0 0 -1 ]",
                ],
            },
            {
                type: "interactive",
                component: "two-qubit-gate-demo",
                gateType: "cz",
            },
            {
                type: "note",
                text: "This is exactly the oracle gate used in the Grover's Search lesson to mark |11⟩ — go compare the circuit diagram there once you've played with CZ here.",
            },
        ],
    },
    {
        id: "gate-swap",
        title: "SWAP Gate",
        category: "gates",
        summary: "Exchanges the states of two qubits entirely.",
        body: [
            {
                type: "p",
                text: "SWAP exchanges whatever state q0 and q1 are holding — classical bits, superpositions, even their half of an entangled pair. It's built from three CX gates in a row in hardware that can't apply it directly, which is a classic trick worth knowing: CX(0,1), CX(1,0), CX(0,1) swaps q0 and q1 exactly.",
            },
            {
                type: "matrix",
                label: "SWAP =",
                rows: [
                    "[ 1 0 0 0 ]",
                    "[ 0 0 1 0 ]",
                    "[ 0 1 0 0 ]",
                    "[ 0 0 0 1 ]",
                ],
            },
            {
                type: "interactive",
                component: "two-qubit-gate-demo",
                gateType: "swap",
            },
            {
                type: "note",
                text: "Try the three-CX trick in the builder: CX(q0→q1), CX(q1→q0), CX(q0→q1) on a circuit where q0 = |1⟩ and q1 = |0⟩ — the result should match SWAP's output here.",
            },
        ],
    },
    {
        id: "gate-ccx",
        title: "Toffoli — Controlled-CX",
        category: "gates",
        summary: "Flips the target only when BOTH of two controls are |1⟩ — the quantum AND gate.",
        body: [
            {
                type: "p",
                text: "CCX (Controlled-Controlled-X, or the Toffoli gate) flips its target qubit only when both control qubits are |1⟩ — it's the closest thing in this gate set to a classical AND gate, and because it's reversible (applying it twice undoes it), it's exactly the kind of gate quantum computers need to implement classical logic without losing information.",
            },
            {
                type: "p",
                text: "With 3 qubits there are 8 basis states and an 8×8 matrix — too big to usefully print here, but the rule is simple: copy q0 and q1 unchanged, flip q2 exactly when q0 = q1 = 1.",
            },
            {
                type: "interactive",
                component: "three-qubit-gate-demo",
                gateType: "ccx",
            },
            {
                type: "note",
                text: "CCX plus a handful of single-qubit gates is enough to build any classical circuit on a quantum computer — it's universal for classical (reversible) computation.",
            },
        ],
    },
    {
        id: "gate-cswap",
        title: "Fredkin — Controlled-SWAP",
        category: "gates",
        summary: "Swaps two qubits, but only when a third control qubit is |1⟩.",
        body: [
            {
                type: "p",
                text: "The Fredkin gate (Controlled-SWAP) swaps q1 and q2 only when the control q0 is |1⟩ — otherwise all three qubits pass through unchanged. Like Toffoli, it's reversible and universal for classical computation, and it has a notable extra property: it never changes how many qubits are in state |1⟩ overall, which makes it a natural fit for reversible circuits that need to conserve a quantity.",
            },
            {
                type: "interactive",
                component: "three-qubit-gate-demo",
                gateType: "cswap",
            },
            {
                type: "note",
                text: "Compare this to plain SWAP: SWAP always exchanges q0 and q1, no questions asked. Fredkin only swaps its two target qubits when a separate control says to — same swap, with a permission check attached.",
            },
        ],
    },

    // --- Algorithms ---------------------------------------------------

    {
        id: "bell-states",
        title: "Bell States",
        category: "algorithms",
        summary: "The four maximally entangled two-qubit states, and how to build each one.",
        body: [
            {
                type: "p",
                text: "The Bell states are the four simplest examples of maximal entanglement between two qubits. Every one of them is built the same way: an H gate on qubit 0, then a CX from qubit 0 to qubit 1 — the only thing that changes is what you do to the inputs before that.",
            },
            {
                type: "math",
                tex: "|\\Phi^+\\rangle = \\frac{1}{\\sqrt{2}}\\big(|00\\rangle + |11\\rangle\\big)",
                caption: "Φ+ — start both qubits at |0⟩, then H(q0), CX(q0→q1).",
            },
            {
                type: "math",
                tex: "|\\Phi^-\\rangle = \\frac{1}{\\sqrt{2}}\\big(|00\\rangle - |11\\rangle\\big)",
                caption: "Φ− — same as Φ+, but apply Z to q0 before the CX.",
            },
            {
                type: "math",
                tex: "|\\Psi^+\\rangle = \\frac{1}{\\sqrt{2}}\\big(|01\\rangle + |10\\rangle\\big)",
                caption: "Ψ+ — same as Φ+, but apply X to q1 before the CX.",
            },
            {
                type: "math",
                tex: "|\\Psi^-\\rangle = \\frac{1}{\\sqrt{2}}\\big(|01\\rangle - |10\\rangle\\big)",
                caption: "Ψ− — apply both X to q1 and Z to q0 before the CX.",
            },
            {
                type: "interactive",
                component: "entanglement-demo",
            },
            {
                type: "note",
                text: "Load the \"Bell States\" templates in the Circuit Builder to build all four and confirm each one's Measurement Outcomes panel — Φ± only ever show 00/11, Ψ± only ever show 01/10.",
            },
        ],
    },
    {
        id: "teleportation",
        title: "Quantum Teleportation",
        category: "algorithms",
        summary: "Moving an unknown qubit state across a shared entangled pair, without cloning it.",
        body: [
            {
                type: "p",
                text: "Teleportation transmits the state of one qubit (q0) onto another (q2) using a Bell pair shared in advance (q1 and q2) plus two classical bits of information — it never copies q0's state, which would violate the no-cloning theorem.",
            },
            {
                type: "p",
                text: "The circuit has three parts: first entangle q1 and q2 into a Bell pair (H then CX). Then entangle the unknown state on q0 with q1 (CX from q0 to q1, then H on q0). Finally, measure q0 and q1 — those two classical bits tell you which of four corrections (I, X, Z, or XZ) to apply to q2 to finish the job.",
            },
            {
                type: "math",
                tex: "|\\psi\\rangle_0 \\otimes |\\Phi^+\\rangle_{12} \\;\\xrightarrow{\\text{CX, H, measure}}\\; \\text{2 classical bits} \\;\\xrightarrow{\\text{correction}}\\; |\\psi\\rangle_2",
            },
            {
                type: "interactive",
                component: "circuit-diagram",
                templateIds: ["teleportation"],
            },
            {
                type: "note",
                text: "This platform's schema doesn't support classically-conditioned gates, so the \"Teleportation\" template stops after the two measurements — that's the interesting entangling part of the protocol. Which correction q2 would need is determined entirely by those two measured bits.",
            },
        ],
    },
    {
        id: "deutsch-jozsa",
        title: "Deutsch-Jozsa Algorithm",
        category: "algorithms",
        summary: "One query to tell whether a hidden function is constant or balanced — exponentially fewer than any classical method.",
        body: [
            {
                type: "p",
                text: "You're given a black-box function f(x) that maps n bits to one bit, with a promise: f is either constant (same output for every input) or balanced (outputs 0 for exactly half of all inputs and 1 for the other half). Classically, you might need to check just over half of all 2ⁿ inputs in the worst case to be sure. Deutsch-Jozsa decides it with a single query to the quantum oracle.",
            },
            {
                type: "p",
                text: "The recipe: start the input register in |0⟩ and an ancilla qubit in |1⟩, apply H to every qubit, apply the oracle Uf (which flips the ancilla's phase depending on f), apply H to the input register again, then measure it.",
            },
            {
                type: "math",
                tex: "\\text{measure } 00\\ldots0 \\;\\Rightarrow\\; f \\text{ is constant} \\qquad \\text{any other result} \\;\\Rightarrow\\; f \\text{ is balanced}",
            },
            {
                type: "interactive",
                component: "circuit-diagram",
                templateIds: ["deutsch-jozsa-constant", "deutsch-jozsa-balanced"],
            },
            {
                type: "note",
                text: "Load the \"Deutsch-Jozsa\" templates in the builder — the constant-oracle one measures all zeros every time, and the balanced-oracle one (a CX from input to ancilla) never does. Same shape of circuit, opposite guaranteed outcome.",
            },
        ],
    },
    {
        id: "grovers",
        title: "Grover's Search Algorithm",
        category: "algorithms",
        summary: "Finding a marked item among N unsorted possibilities in roughly √N steps instead of N.",
        body: [
            {
                type: "p",
                text: "Searching an unsorted list of N items classically takes, on average, N/2 checks. Grover's algorithm finds a marked item using roughly √N applications of two steps: an oracle that flips the sign of the marked item's amplitude, and a \"diffusion\" operator that reflects every amplitude about their average — together they amplify the marked item's probability with each round.",
            },
            {
                type: "math",
                tex: "|\\psi\\rangle = \\frac{1}{\\sqrt{N}} \\sum_{x=0}^{N-1} |x\\rangle \\;\\xrightarrow{\\;(\\text{oracle} \\to \\text{diffusion})^{\\,r}\\;}\\; |x_{\\text{marked}}\\rangle,\\quad r \\approx \\frac{\\pi}{4}\\sqrt{N}",
            },
            {
                type: "p",
                text: "For the simplest useful case — 2 qubits, N = 4 possible states — a single round already gets you there: apply H to both qubits, apply the oracle for the marked state (for |11⟩, that's a CZ), then the diffusion operator (H, X, CZ, X, H on both qubits).",
            },
            {
                type: "interactive",
                component: "circuit-diagram",
                templateIds: ["grover-2qubit"],
            },
            {
                type: "note",
                text: "Load the \"Grover's Search\" template (marked state |11⟩, 2 qubits) and run it — the Measurement Outcomes panel should show close to 100% on 11, with the other three outcomes near zero, after just one oracle+diffusion round.",
            },
        ],
    },
    {
        id: "shors",
        title: "Shor's Algorithm",
        category: "algorithms",
        summary: "Factoring large numbers exponentially faster than the best known classical algorithms — the result that threatens RSA.",
        body: [
            {
                type: "p",
                text: "Shor's algorithm factors an integer N by reducing factoring to a different problem — period finding — and solving that with a quantum computer. Pick a random a < N, and look at the sequence a mod N, a² mod N, a³ mod N, ... . It's periodic with some period r. Once you know r, gcd(a^(r/2) ± 1, N) usually reveals a nontrivial factor of N.",
            },
            {
                type: "math",
                tex: "a^r \\equiv 1 \\pmod{N}",
                caption: "The period r of aˣ mod N is exactly what the quantum part finds.",
            },
            {
                type: "p",
                text: "Finding r classically is about as hard as factoring itself. Quantumly, you put a register in superposition of every x, compute aˣ mod N into a second register (entangling the two), and apply the Quantum Fourier Transform to the first register — the QFT turns the hidden period into a measurable pattern of peaks, in time that scales polynomially in the number of digits of N instead of exponentially.",
            },
            {
                type: "interactive",
                component: "shors-periodicity",
            },
            {
                type: "note",
                text: "Shor's algorithm needs modular exponentiation and a Quantum Fourier Transform, both well beyond this builder's 6-qubit, 8-step canvas for any N worth factoring — there's no runnable template for it here. The pieces above (superposition, CX-built entanglement, and phase-sensitive gates like Z) are exactly what those two ingredients are made of, though, so everything you've built so far in this builder is the toolkit Shor's is assembled from.",
            },
        ],
    },
];

export const CATEGORY_LABELS: Record<Topic["category"], string> = {
    fundamentals: "Fundamentals",
    gates: "Gates in this Builder",
    algorithms: "Algorithms",
};