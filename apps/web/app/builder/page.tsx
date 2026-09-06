'use client'


import { useState } from "react";
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import GatePalette from '@/components/circuit-builder/GatePalette'
import CircuitCanvas from '@/components/circuit-builder/CircuitCanvas'
import QiskitPreview from '@/components/circuit-builder/QiskitPreview'
import { useCircuitStore } from '@/lib/store/circuit-store';
import { runCircuit } from '@/lib/api-client/simulate';

export default function BuilderPage() {
    const { gates, numQubits } = useCircuitStore();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleRun() {
        setLoading(true);
        setError(null);
        try {
            const payload = {
                num_qubits: numQubits,
                gates: gates.map(g => ({ ...g, type: g.type.toLowerCase() })),
            };
            const data = await runCircuit(payload);
            setResult(data);
            console.log("Simulation result:", data); // keep this until you've confirmed the shape
        } catch (e) {
            setError(e instanceof Error ? e.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    }
    return (
        <DndProvider backend={HTML5Backend}>
            <main className="min-h-screen p-8 bg-gray-100">
                <h1 className="text-2xl font-bold mb-6 text-gray-800">
                    Quantum Circuit Builder
                </h1>

                <div className="flex gap-6 items-start">
                    {/* Gate Selection Palette */}
                    <div className="w-48 shrink-0 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <GatePalette />
                    </div>

                    {/* Interactive Circuit Canvas */}
                    <div className="flex-1 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <CircuitCanvas />
                    </div>
                    <QiskitPreview />
                </div>
                <button
                    onClick={handleRun}
                    disabled={loading}
                    className="mt-8 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50">
                    {loading ? "Running..." : "Run Circuit"}
                </button>
                {error && <p className="mt-4 text-red-500">{error}</p>}
            </main>
        </DndProvider>
    )
}