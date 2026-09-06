import { create } from 'zustand';

// --- TypeScript Types ---


export interface Gate {
    id: string;
    type: string;
    qubits: number[];
    step: number;
}

export interface CircuitState {
    numQubits: number;
    gates: Gate[];

    // Actions
    setNumQubits: (n: number) => void;
    addGate: (gate: Gate) => void;
    removeGate: (id: string) => void;
    reset: () => void;
}

// --- Zustand Store ---

export const useCircuitStore = create<CircuitState>((set) => ({
    numQubits: 3,
    gates: [],
    // Actions
    setNumQubits: (n) => set({ numQubits: n }),
    addGate: (gate) => set((state) => ({
        gates: [...state.gates, gate]
    })),
    removeGate: (id) => set((state) => ({
        gates: state.gates.filter(g => g.id !== id)
    })),
    reset: () => set({ gates: [] }),
}));
