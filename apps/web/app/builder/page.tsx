/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Minus, Plus, Sparkle } from 'lucide-react'
import GatePalette from '@/components/circuit-builder/GatePalette'
import CircuitCanvas from '@/components/circuit-builder/CircuitCanvas'
import QiskitPreview from '@/components/circuit-builder/QiskitPreview'
import MeasurementHistogram from '@/components/visualizations/MeasurementHistogram'
import BlochSphereVisualizer from '@/components/visualizations/BlochSphereVisualizer'
import { useCircuitStore } from '@/lib/store/circuit-store'
import NavBar from '@/components/nav/NavBar'
import AIExplanation from '@/components/circuit-builder/AIExplanation'
import TemplateLoader from '@/components/circuit-builder/TemplateLoader'

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
            <div className="min-h-screen bg-[#fafafa] text-zinc-950">
                <NavBar />

                <main className="mx-auto w-full max-w-[1600px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
                    {/* Builder Header */}
                    <header className="mb-8 border-b border-zinc-200 pb-6">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <div className="mb-3 flex items-center gap-3">
                                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-600">
                                        QMentor / Builder
                                    </span>

                                    <span className="h-px w-8 bg-zinc-300" />

                                    <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-400">
                                        Quantum Workspace
                                    </span>
                                </div>

                                <h1 className="text-4xl font-semibold tracking-[-0.04em] text-zinc-950 sm:text-5xl">
                                    Circuit Builder
                                </h1>

                                <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-500">
                                    Construct, simulate, and inspect quantum circuits one gate at a
                                    time.
                                </p>
                            </div>

                            {/* Controls */}
                            <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                                        Qubits
                                    </span>

                                    <div className="flex items-center border border-zinc-200 bg-white">
                                        <button
                                            onClick={() =>
                                                handleQubitChange(Math.max(MIN_QUBITS, store.numQubits - 1))
                                            }
                                            disabled={store.numQubits <= MIN_QUBITS}
                                            className="flex h-8 w-8 items-center justify-center border-r border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-30"
                                        >
                                            <Minus className="h-3.5 w-3.5" />
                                        </button>

                                        <span className="flex h-8 min-w-10 items-center justify-center font-mono text-xs font-semibold text-zinc-900">
                                            {String(store.numQubits).padStart(2, '0')}
                                        </span>

                                        <button
                                            onClick={() =>
                                                handleQubitChange(Math.min(MAX_QUBITS, store.numQubits + 1))
                                            }
                                            disabled={store.numQubits >= MAX_QUBITS}
                                            className="flex h-8 w-8 items-center justify-center border-l border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-30"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="hidden h-8 w-px bg-zinc-200 sm:block" />

                                <TemplateLoader
                                    onLoad={() => {
                                        setSimulationResult(null)
                                        setAiExplanation(null)
                                        setError(null)
                                    }}
                                />

                                <button
                                    onClick={handleRunSimulation}
                                    disabled={loading}
                                    className="cursor-pointer flex h-9 items-center gap-2 bg-zinc-950 px-4 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {loading ? 'Running...' : 'Run Simulation'}
                                </button>

                                <button
                                    onClick={handleAskAi}
                                    disabled={aiLoading}
                                    className="cursor-pointer flex h-9 items-center gap-2 border border-zinc-200 bg-white px-4 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-700 transition-colors hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Sparkle className="h-3.5 w-3.5" />
                                    {aiLoading ? 'Thinking...' : 'Ask AI'}
                                </button>
                            </div>
                        </div>
                    </header>

                    {/* Error */}
                    {error && (
                        <div className="mb-6 border-l-2 border-red-500 bg-red-50 px-4 py-3">
                            <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-red-500">
                                Simulation Error
                            </div>
                            <p className="mt-1 text-sm leading-6 text-red-700">
                                {error}
                            </p>
                        </div>
                    )}

                    {/* Circuit Workspace */}
                    <section className="border border-zinc-200 bg-white">
                        <div className="grid lg:grid-cols-[280px_minmax(0,1fr)_280px]">
                            {/* Gate Library */}
                            <aside className="border-b border-zinc-200 lg:border-b-0 lg:border-r">
                                <div className="border-b border-zinc-200 px-5 py-4">
                                    <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                                        01 / Gate Library
                                    </div>
                                    <div className="mt-1 text-sm font-semibold text-zinc-900">
                                        Operations
                                    </div>
                                </div>

                                <GatePalette />
                            </aside>

                            {/* Circuit */}
                            <section className="min-w-0">
                                <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
                                    <div>
                                        <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                                            02 / Circuit
                                        </div>
                                        <div className="mt-1 text-sm font-semibold text-zinc-900">
                                            Quantum Register
                                        </div>
                                    </div>

                                    <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-400">
                                        8 steps
                                    </span>
                                </div>

                                <div className="min-h-105 p-5">
                                    <CircuitCanvas />
                                </div>
                            </section>

                            {/* AI */}
                            <aside className="border-t border-zinc-200 lg:border-l lg:border-t-0">
                                <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
                                    <div>
                                        <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                                            03 / Analysis
                                        </div>

                                        <div className="mt-1 text-sm font-semibold text-zinc-900">
                                            AI Explanation
                                        </div>
                                    </div>

                                    <div
                                        className={`h-1.5 w-1.5 rounded-full ${aiLoading
                                            ? 'animate-pulse bg-blue-500'
                                            : aiExplanation
                                                ? 'bg-emerald-500'
                                                : 'bg-zinc-300'
                                            }`}
                                    />
                                </div>

                                <div className="flex min-h-105 max-h-105 overflow-y-auto flex-col">
                                    {aiLoading ? (
                                        /* Loading */
                                        <div className="flex flex-1 flex-col p-5">
                                            <div className="mb-6 flex items-center gap-2">
                                                <div className="h-px w-5 bg-blue-500" />

                                                <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-blue-600">
                                                    Analyzing circuit
                                                </span>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="h-2 w-3/4 animate-pulse bg-zinc-100" />
                                                <div className="h-2 w-full animate-pulse bg-zinc-100" />
                                                <div className="h-2 w-5/6 animate-pulse bg-zinc-100" />
                                                <div className="h-2 w-2/3 animate-pulse bg-zinc-100" />
                                            </div>

                                            <div className="mt-auto border-t border-zinc-100 pt-4">
                                                <span className="font-mono text-[8px] uppercase tracking-wider text-zinc-400">
                                                    Reading gate sequence...
                                                </span>
                                            </div>
                                        </div>
                                    ) : aiExplanation ? (
                                        /* Explanation */
                                        <div className="flex flex-1 flex-col">
                                            <div className="border-b border-zinc-100 px-5 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-emerald-600">
                                                        Analysis complete
                                                    </span>

                                                    <span className="h-px flex-1 bg-zinc-100" />
                                                </div>
                                            </div>

                                            <div className="flex-1 overflow-y-auto px-5 py-5">
                                                <AIExplanation content={aiExplanation} />
                                            </div>

                                            <div className="border-t border-zinc-100 px-5 py-3">
                                                <span className="font-mono text-[8px] uppercase tracking-wider text-zinc-400">
                                                    Generated from current circuit
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        /* Empty */
                                        <div className="flex flex-1 flex-col p-5">
                                            <div className="flex flex-1 flex-col items-center justify-center text-center">
                                                <div className="mb-5 flex h-10 w-10 items-center justify-center border border-zinc-200 bg-zinc-50">
                                                    <Sparkle className="h-4 w-4 text-blue-600" />
                                                </div>

                                                <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
                                                    No analysis yet
                                                </div>

                                                <p className="mt-3 max-w-[210px] text-sm font-medium leading-5 text-zinc-800">
                                                    Let QMentor explain what your circuit is doing.
                                                </p>

                                                <p className="mt-2 max-w-[210px] text-xs leading-5 text-zinc-400">
                                                    Add gates to the register, then ask the AI to analyze the
                                                    resulting quantum operation.
                                                </p>
                                            </div>

                                            <div className="border-t border-zinc-100 pt-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-mono text-[8px] uppercase tracking-wider text-zinc-400">
                                                        AI Tutor
                                                    </span>

                                                    <span className="font-mono text-[8px] text-zinc-300">
                                                        READY
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </aside>
                        </div>
                    </section>

                    {/* Results */}
                    {simulationResult && (
                        <section className="mt-8 border-t border-zinc-200 pt-8">
                            <div className="mb-5 flex items-end justify-between">
                                <div>
                                    <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                                        04 / Simulation
                                    </div>

                                    <h2 className="mt-1 text-lg font-semibold tracking-tight text-zinc-950">
                                        Measurement & quantum state
                                    </h2>

                                    <p className="mt-1 text-xs text-zinc-400">
                                        Inspect the measured distribution and resulting qubit state.
                                    </p>
                                </div>

                                <span className="hidden font-mono text-[9px] uppercase tracking-[0.15em] text-zinc-400 sm:block">
                                    Statevector / Measurement
                                </span>
                            </div>

                            <div className="grid border border-zinc-200 lg:grid-cols-2">
                                <div className="min-w-0 bg-white p-5 lg:border-r lg:border-zinc-200">
                                    <MeasurementHistogram
                                        data={simulationResult}
                                        loading={loading}
                                    />
                                </div>

                                <div className="min-w-0 bg-white p-5">
                                    <BlochSphereVisualizer
                                        data={simulationResult}
                                        variant="default"
                                        loading={loading}
                                        animated
                                    />
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Qiskit Code */}
                    <section className="mt-10">
                        <div className="mb-5 flex items-end justify-between border-b border-zinc-200 pb-3">
                            <div>
                                <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-blue-600">
                                    Export
                                </div>

                                <h2 className="mt-1 text-xl font-semibold tracking-tight text-zinc-950">
                                    Qiskit Code
                                </h2>
                            </div>

                            <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-400">
                                Python
                            </span>
                        </div>

                        <div className="border border-zinc-200 bg-white">
                            <QiskitPreview />
                        </div>
                    </section>
                </main>
            </div>
        </DndProvider>
    )
}