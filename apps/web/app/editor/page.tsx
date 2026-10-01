/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useRef, useState } from 'react'
import NavBar from '@/components/nav/NavBar'
import MeasurementHistogram from '@/components/visualizations/MeasurementHistogram'
import BlochSphereVisualizer from '@/components/visualizations/BlochSphereVisualizer'
import QuantumCodeEditor, {
    type QuantumCodeEditorRef,
} from '@/components/editor/QuantumCodeEditor'
import { useCircuitStore } from '@/lib/store/circuit-store'
import CircuitPreview from '@/components/editor/CircuitPreview'

export default function EditorPage() {
    const editorRef = useRef<QuantumCodeEditorRef>(null)

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [simulationResult, setSimulationResult] = useState<any>(null)

    const handleRunSimulation = async () => {
        setError('')

        // Auto-apply current editor code to parser & store before running simulation
        if (editorRef.current) {
            const applyResult = editorRef.current.apply()

            if (!applyResult.success) {
                setError(applyResult.error ?? 'Unable to parse circuit code.')
                setSimulationResult(null)
                return
            }
        }

        const { numQubits, gates } = useCircuitStore.getState()

        setLoading(true)

        try {
            const formattedGates = [...gates]
                .sort((a, b) => a.step - b.step)
                .map((gate) => ({
                    type: gate.type,
                    qubits: gate.qubits,
                    step: gate.step,
                }))

            const response = await fetch('/api/simulate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    num_qubits: numQubits,
                    gates: formattedGates,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error ?? 'Simulation failed.')
            }

            setSimulationResult(data)
        } catch (err) {
            setSimulationResult(null)
            setError(
                err instanceof Error
                    ? err.message
                    : 'Simulation service unavailable.'
            )
        } finally {
            setLoading(false)
        }
    }
    return (
        <main className="min-h-screen bg-[#fafafa] text-zinc-950">
            <NavBar />

            <div className="mx-auto w-full max-w-[1600px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
                <header className="mb-8 border-b border-zinc-200 pb-6">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="mb-3 flex items-center gap-3">
                                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-600">
                                    QMentor / Editor
                                </span>

                                <span className="h-px w-8 bg-zinc-300" />

                                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-400">
                                    Code Workspace
                                </span>
                            </div>

                            <h1 className="text-4xl font-semibold tracking-[-0.04em] text-zinc-950 sm:text-5xl">
                                Quantum Editor
                            </h1>

                            <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-500">
                                Write Qiskit circuits directly, then simulate and inspect
                                their quantum state.
                            </p>
                        </div>

                        <button
                            onClick={handleRunSimulation}
                            disabled={loading}
                            className="inline-flex h-11 items-center justify-center bg-zinc-950 px-5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <span className="mr-2 h-3 w-3 animate-spin rounded-full border border-white/30 border-t-white" />
                                    Simulating
                                </>
                            ) : (
                                'Run Simulation'
                            )}
                        </button>
                    </div>
                </header>

                <section className="grid min-h-155 border border-zinc-200 bg-white lg:grid-cols-[minmax(0,1fr)_420px]">
                    <div className="min-w-0 border-b border-zinc-200 lg:border-b-0 lg:border-r">
                        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
                            <div>
                                <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                                    01 / Source
                                </div>

                                <div className="mt-1 text-sm font-semibold text-zinc-900">
                                    Qiskit / Python
                                </div>
                            </div>

                            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-zinc-400">
                                Monaco
                            </span>
                        </div>

                        <QuantumCodeEditor ref={editorRef} />
                    </div>

                    <aside className="min-w-0">
                        <div className="border-b border-zinc-200 px-5 py-4">
                            <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                                02 / Output
                            </div>

                            <div className="mt-1 text-sm font-semibold text-zinc-900">
                                Circuit & Results
                            </div>
                        </div>

                        <div className="border-b border-zinc-200 p-5">
                            <div className="mb-4">
                                <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                                    Circuit
                                </div>

                                <div className="mt-1 text-sm font-semibold text-zinc-900">
                                    Generated circuit
                                </div>
                            </div>

                            <CircuitPreview />
                        </div>

                        <div className="min-h-[560px]">
                            {error && (
                                <div className="border-b border-zinc-200 bg-red-50 px-5 py-4">
                                    <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-red-500">
                                        Simulation Error
                                    </div>

                                    <p className="mt-1 text-xs leading-5 text-red-700">
                                        {error}
                                    </p>
                                </div>
                            )}

                            {!simulationResult && !loading && !error && (
                                <div className="flex min-h-[560px] items-center justify-center px-6">
                                    <div className="max-w-[220px] text-center">
                                        <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center border border-zinc-200 bg-zinc-50">
                                            <span className="font-mono text-xs text-zinc-400">∿</span>
                                        </div>

                                        <p className="text-xs font-medium text-zinc-700">
                                            No simulation yet
                                        </p>

                                        <p className="mt-1 text-[11px] leading-5 text-zinc-400">
                                            Write a circuit and run the simulation to inspect its output.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {loading && (
                                <div className="flex min-h-[560px] items-center justify-center px-6">
                                    <div className="text-center">
                                        <div className="mx-auto mb-4 h-5 w-5 animate-spin rounded-full border border-zinc-200 border-t-blue-600" />

                                        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-500">
                                            Simulating circuit
                                        </p>
                                    </div>
                                </div>
                            )}

                            {simulationResult && !loading && (
                                <div className="divide-y divide-zinc-200">
                                    <div className="p-5">
                                        <div className="mb-4">
                                            <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                                                Measurement
                                            </div>

                                            <div className="mt-1 text-sm font-semibold text-zinc-900">
                                                Probability distribution
                                            </div>
                                        </div>

                                        <MeasurementHistogram
                                            data={simulationResult}
                                            loading={loading}
                                        />
                                    </div>

                                    <div className="p-5">
                                        <div className="mb-4">
                                            <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                                                Quantum State
                                            </div>

                                            <div className="mt-1 text-sm font-semibold text-zinc-900">
                                                Bloch sphere
                                            </div>
                                        </div>

                                        <BlochSphereVisualizer
                                            data={simulationResult}
                                            variant="default"
                                            loading={loading}
                                            animated
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </aside>
                </section>
            </div>
        </main>
    )
}