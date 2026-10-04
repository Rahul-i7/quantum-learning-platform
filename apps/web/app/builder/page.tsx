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
import AIChat, { type ChatMsg, type ProposedCircuit } from '@/components/circuit-builder/AIChat'
import { useAuth } from '@/lib/supabase/AuthProvider'
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
    const [messages, setMessages] = useState<ChatMsg[]>([])
    const [aiExplanation, setAiExplanation] = useState<string | null>(null)
    const [aiLoading, setAiLoading] = useState(false)
    const { user, profile } = useAuth()
    const userName = profile?.name && profile.name !== 'Learner' ? profile.name : undefined
    const userId = user?.id ?? 'default_learner'

    const MIN_QUBITS = 1
    const MAX_QUBITS = 6

    const handleQubitChange = (next: number) => {
        const clamped = Math.max(MIN_QUBITS, Math.min(MAX_QUBITS, next))
        if (clamped === store.numQubits) return
        store.reset()
        store.setNumQubits(clamped)
        setSimulationResult(null)
        setError(null)
    }

    const toApiGates = (gates: typeof store.gates) => 
        [...gates].sort((a, b) => a.step - b.step).map((g) => ({
            type: g.type.toLowerCase(),
            qubits: g.qubits,
            ...(g.params?.theta !== undefined ? {params: [g.params.theta]} : {}),
        }))

    const runSimulation = async (numQubits: number, gates: typeof store.gates) => {
        if (gates.length === 0) {
            setError('Please place at least one gate on the circuit canvas before running.')
            return
        }

        setLoading(true)
        setError(null)
        try {
            const res = await fetch('/api/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    num_qubits: numQubits,
                    gates: toApiGates(gates),
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

    const handleRunSimulation = () => runSimulation(store.numQubits, store.gates)

    const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2,7)}`

    const sendToTutor = async (text: string) => {
        const userMsg: ChatMsg = { id: newId(), role: 'user', content: text }
        const history = [...messages, userMsg]
        setMessages(history)
        setAiLoading(true)
        setError(null)
        try {
            const res = await fetch('/api/tutor/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json'},
                body: JSON.stringify({
                    message: text,
                    history: messages.slice(-10).map((m) => ({role: m.role, content: m.content})),
                    circuit: 
                        store.gates.length > 0
                        ? { num_qubits: store.numQubits, gates: toApiGates(store.gates)}
                        : null,
                    user_id: userId,
                    user_name: userName,
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.detail || data.error || `AI tutor chat failed: ${res.status}`)
            setMessages([
                ...history,
                {
                    id: newId(),
                    role: 'model',
                    content: data.response ?? JSON.stringify(data),
                    proposedCircuit: data.proposed_circuit ?? null,
                    suggestions: data.suggested_questions ?? []
                },
            ])
        } catch (err: any) {
            setError(err?.message || 'AI tutor is unavailable')
        } finally {
            setAiLoading(false)
        }
    }

    const handleAskAi = async () => {
        if (store.gates.length === 0) {
            setError('Place at least one gate before asking for an explanation.')
            return
        }
        sendToTutor('Explain this circuit step-by-step and what it computes')
    }

    const handleApplyCircuit = (messageId: string, circuit: ProposedCircuit) => {
        const numQubits = Math.max(MIN_QUBITS, Math.min(MAX_QUBITS, circuit.num_qubits))

        const MAX_STEPS = 8
        const nextFree: number[] = Array(numQubits).fill(0)
        const placed: typeof store.gates = []
        let overflow = false
        circuit.gates.forEach((g, i) => {
            const lo = Math.min(...g.qubits)
            const hi = Math.max(...g.qubits)
            
            const span = Array.from({ length: hi - lo + 1 }, (_, k) => lo + k)
            const step = Math.max(...span.map((q) => nextFree[q] ?? 0))
            if (step >= MAX_STEPS) {
                overflow = true
                return
            }
            span.forEach((q) => (nextFree[q] = step + 1))
            const type = g.type.toLowerCase()
            placed.push({
                id: `${type}-${g.qubits.join('-')}-s${step}-${i}-${Date.now()}`,
                type,
                qubits: g.qubits,
                step,
                ...(g.params && g.params.length > 0 ? { params: { theta: g.params[0] } } : {}),
            })
        })

        store.loadCircuit(numQubits, placed)
        setSimulationResult(null)
        setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, applied: true } : m)))
        if (overflow) {
            setError('Part of that circuit did not fit in the 8 available steps and was left out.')
        } else {
            setError(null)
        }
        runSimulation(numQubits, placed)
    }

    const handleClearCircuit = () => {
        store.reset()
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

                                    <div className="flex items-center gap-5">
                                        <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-400">
                                            8 steps
                                        </span>
                                        <TemplateLoader
                                            onLoad={() => {
                                                setSimulationResult(null)
                                                setAiExplanation(null)
                                                setError(null)
                                            }}
                                        />
                                        <button
                                            onClick={handleClearCircuit}
                                            className="cursor-pointer font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-400 transition-colors hover:text-red-500"
                                        >
                                            Clear
                                        </button>
                                    </div>
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
                                            AI Tutor
                                        </div>
                                    </div>

                                    <div
                                        className={`h-1.5 w-1.5 rounded-full ${aiLoading
                                            ? 'animate-pulse bg-blue-500'
                                            : messages.length > 0
                                                ? 'bg-emerald-500'
                                                : 'bg-zinc-300'
                                            }`}
                                    />
                                </div>

                                <div className="flex h-105 flex-col">
                                    <AIChat 
                                        messages={messages}
                                        loading={aiLoading}
                                        onSend={sendToTutor}
                                        onApply={handleApplyCircuit}
                                    />
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