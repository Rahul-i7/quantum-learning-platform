'use client'

import { useState } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Minus, Plus } from 'lucide-react'
import GatePalette from '@/components/circuit-builder/GatePalette'
import CircuitCanvas from '@/components/circuit-builder/CircuitCanvas'
import QiskitPreview from '@/components/circuit-builder/QiskitPreview'
import MeasurementHistogram from '@/components/visualizations/MeasurementHistogram'
import BlochSphereVisualizer from '@/components/visualizations/BlochSphereVisualizer'
import { useCircuitStore } from '@/lib/store/circuit-store'
import NavBar from '@/components/nav/NavBar'
import { Sparkle } from 'lucide-react'

export default function BuilderPage() {
    const store = useCircuitStore()

    const [simulationResult, setSimulationResult] = useState<{
        counts?: Record<string, number> | null
        statevector?: number[][] | null
        probabilities?: Record<string, number> | null
        num_qubits?: number
    } | null>(null)

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [aiExplanation, setAiExplanation] = useState<string | null>(null)
    const [aiLoading, setAiLoading] = useState(false)

    const MIN_QUBITS = 1
    const MAX_QUBITS = 6

    const handleQubitChange = (next: number) => {
        const clamped = Math.max(MIN_QUBITS, Math.min(MAX_QUBITS, next))
        if (clamped === store.numQubits) return
        // Changing qubit count can orphan gates on qubits that no longer exist,
        // so reset the circuit rather than leaving dangling references.
        store.reset()
        store.setNumQubits(clamped)
        setSimulationResult(null)
        setError(null)
    }

    const handleRunSimulation = async () => {
        if (store.gates.length === 0) {
            setError('Please place at least one gate on the circuit canvas before running.')
            return
        }

        setLoading(true)
        setError(null)
        try {
            const formattedGates = [...store.gates]
                .sort((a, b) => a.step - b.step)
                .map((g) => ({
                    type: g.type.toLowerCase(),
                    qubits: g.qubits,
                }))

            const res = await fetch('/api/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    num_qubits: store.numQubits,
                    gates: formattedGates,
                }),
            })

            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.detail || data.error || `Simulation failed with status ${res.status}`)
            }

            setSimulationResult(data)
        } catch (err: any) {
            setError(err?.message || 'Unable to reach the simulation backend service.')
        } finally {
            setLoading(false)
        }
    }

    const handleAskAi = async () => {
        if (store.gates.length === 0) {
            setError('Place at least one gate before asking for an explanation.')
            return
        }
        setAiLoading(true)
        setAiExplanation(null)
        setError(null)
        try {
            const formattedGates = [...store.gates]
                .sort((a, b) => a.step - b.step)
                .map((g) => ({ type: g.type.toLowerCase(), qubits: g.qubits }))

            const res = await fetch('/api/tutor/explain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    circuit: { num_qubits: store.numQubits, gates: formattedGates },
                    concept_or_circuit_query: 'Explain this circuit step-by-step and what it computes',
                    user_id: 'beginner_alex',
                }),
            })

            const data = await res.json()

            if (!res.ok) throw new Error(data.detail || data.error || `AI explain failed: ${res.status}`)
            setAiExplanation(data.explanation ?? JSON.stringify(data))
        } catch (err: any) {
            setError(err?.message || 'AI tutor is unavailable')
        } finally {
            setAiLoading(false)
        }
    }

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="bg-gray-50 h-screen w-screen">
                <NavBar />
                <main className="min-h-screen bg-gray-100 p-8">

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Circuit Builder</h1>
                            <p className="text-sm text-gray-500">Interactive quantum algorithm design and simulation</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm">
                                <span className="text-sm font-medium text-gray-600">Qubits</span>
                                <button
                                    onClick={() => handleQubitChange(store.numQubits - 1)}
                                    disabled={store.numQubits <= MIN_QUBITS}
                                    className="flex h-6 w-6 items-center justify-center rounded bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:hover:bg-gray-100 cursor-pointer"
                                    aria-label="Decrease qubit count"
                                >
                                    <Minus className="h-3.5 w-3.5" />
                                </button>
                                <span className="w-4 text-center font-mono text-sm font-semibold text-gray-800">
                                    {store.numQubits}
                                </span>
                                <button
                                    onClick={() => handleQubitChange(store.numQubits + 1)}
                                    disabled={store.numQubits >= MAX_QUBITS}
                                    className="flex h-6 w-6 items-center justify-center rounded bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:hover:bg-gray-100 cursor-pointer"
                                    aria-label="Increase qubit count"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                </button>
                            </div>

                            <button
                                onClick={handleRunSimulation}
                                disabled={loading}
                                className="rounded-lg bg-emerald-600 px-5 py-2 font-semibold text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 transition-colors cursor-pointer"
                            >
                                {loading ? 'Simulating...' : '▶ Run Simulation'}
                            </button>

                            <button
                                onClick={handleAskAi}
                                disabled={aiLoading}
                                className="cursor-pointer flex justify-center items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-colors"
                            >
                                <Sparkle className="h-3.5 w-3.5" />
                                {aiLoading ? 'Explaining…' : 'Ask AI to Explain'}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 rounded-md bg-red-50 p-3 text-sm font-medium text-red-700 border border-red-200">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-6 lg:flex-row items-start">
                        <div className="w-full lg:w-48 shrink-0 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <GatePalette />
                        </div>

                        <div className="flex-1 flex flex-col gap-6 w-full">
                            <div className="flex gap-5 w-full">
                                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                    <CircuitCanvas />
                                </div>

                                <div className="bg-white grow p-5 rounded-lg shadow-sm border border-gray-200">
                                    <h2 className="text-lg text-gray-800 mb-2">AI Explanation</h2>
                                    {aiExplanation && (
                                        <pre className="h-68 whitespace-pre-wrap text-sm text-gray-700 overflow-scroll">{aiExplanation}</pre>
                                    )}
                                </div>

                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <MeasurementHistogram
                                    data={simulationResult}
                                    loading={loading}
                                />

                                <BlochSphereVisualizer
                                    data={simulationResult}
                                    numQubits={store.numQubits}
                                    loading={loading}
                                />
                            </div>

                            <QiskitPreview />


                        </div>
                    </div>
                </main>
            </div>
        </DndProvider>
    )
}