'use client'

import { useState, useEffect, useRef } from 'react'
import { useCircuitStore } from '@/lib/store/circuit-store'
import DropCell from './DropCell'

const NUM_STEPS = 8

export default function CircuitCanvas() {
    const numQubits = useCircuitStore((state) => state.numQubits)
    const gates = useCircuitStore((state) => state.gates)

    const qubits = Array.from({ length: numQubits }, (_, i) => i)

    const steps = Array.from({ length: NUM_STEPS }, (_, i) => i)

    const [pendingGate, setPendingGate] =
        useState<{
            type: 'cx' | 'cz' | 'swap' | 'ccx' | 'cswap'
            qubitIndex: number
            stepIndex: number
            selectedQubits: number[]
        } | null>(null)

    const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

    const canvasRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (pendingGate && canvasRef.current) {
                const rect = canvasRef.current.getBoundingClientRect()

                setMousePos({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                })
            }
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setPendingGate(null)
            }
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('keydown', handleKeyDown)

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [pendingGate])

    const getControlCenter = () => {
        if (!pendingGate || !canvasRef.current) {
            return { x: 0, y: 0 }
        }

        const cellEl = canvasRef.current.querySelector(
            `[data-qubit="${pendingGate.qubitIndex}"][data-step="${pendingGate.stepIndex}"]`
        ) as HTMLElement

        if (!cellEl) {
            return { x: 0, y: 0 }
        }

        const cellRect = cellEl.getBoundingClientRect()
        const canvasRect = canvasRef.current.getBoundingClientRect()

        return {
            x:
                cellRect.left -
                canvasRect.left +
                cellRect.width / 2,

            y:
                cellRect.top -
                canvasRect.top +
                cellRect.height / 2,
        }
    }

    const controlCenter = getControlCenter()

    const multiQubitGates = gates.filter(
        (gate) =>
            ['cx', 'cz', 'swap', 'ccx', 'cswap'].includes(gate.type) &&
            gate.qubits.length >= 2
    )

    return (
        <div
            ref={canvasRef}
            className="relative  bg-white">
            {pendingGate && (
                <div className="mb-3 flex items-center justify-between border border-blue-200 bg-blue-50 px-3 py-2">
                    <div>
                        <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-blue-500">
                            Placing {pendingGate.type.toUpperCase()}
                        </span>

                        <p className="mt-0.5 text-xs text-blue-700">
                            {pendingGate.type === 'ccx' || pendingGate.type === 'cswap'
                                ? `Select ${3 - pendingGate.selectedQubits.length} more ${3 - pendingGate.selectedQubits.length === 1
                                    ? 'qubit'
                                    : 'qubits'
                                }`
                                : `Select ${2 - pendingGate.selectedQubits.length} more qubit${2 - pendingGate.selectedQubits.length === 1 ? '' : 's'
                                }`}
                        </p>
                    </div>

                    <button
                        onClick={() => setPendingGate(null)}
                        className="cursor-pointer font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-blue-500 hover:text-blue-700"
                    >
                        Cancel
                    </button>
                </div>
            )}
            {/* Pending multi-qubit gate guide */}
            {pendingGate && (
                <svg className="pointer-events-none absolute inset-0 z-40 h-full w-full">
                    <line
                        x1={controlCenter.x}
                        y1={controlCenter.y}
                        x2={mousePos.x}
                        y2={mousePos.y}
                        stroke="#2563eb"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                        strokeLinecap="round"
                    />
                </svg>
            )}


            {/* Circuit header */}
            <div className="flex items-center border-b border-zinc-200 bg-zinc-50/70">
                <div className="flex h-8 w-16 shrink-0 items-center justify-center border-r border-zinc-200">
                    <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.15em] text-zinc-400">
                        Qubit
                    </span>
                </div>

                {steps.map((stepIndex) => (
                    <div
                        key={stepIndex}
                        className="flex h-8 w-14 shrink-0 items-center justify-center border-l border-zinc-100"
                    >
                        <span className="font-mono text-[8px] text-zinc-400">
                            {String(stepIndex + 1).padStart(2, '0')}
                        </span>
                    </div>
                ))}
            </div>

            {/* Register */}
            <div className="relative">
                {qubits.map((qubitIndex) => (
                    <div key={qubitIndex} className="flex">
                        {/* Qubit label */}
                        <div className="flex h-14 w-16 shrink-0 items-center justify-center border-r border-zinc-200 bg-zinc-50/50">
                            <span className="font-mono text-xs font-medium text-zinc-500">
                                q[{qubitIndex}]
                            </span>
                        </div>

                        {/* Cells */}
                        <div className="flex">
                            {steps.map((stepIndex) => (
                                <DropCell
                                    key={stepIndex}
                                    qubitIndex={qubitIndex}
                                    stepIndex={stepIndex}
                                    pendingGate={pendingGate}
                                    setPendingGate={setPendingGate}
                                />
                            ))}
                        </div>
                    </div>
                ))}

                {/* Active multi-qubit gates connections */}
                {multiQubitGates.map((gate) => {
                    const min = Math.min(...gate.qubits)
                    const max = Math.max(...gate.qubits)

                    return (
                        <div
                            key={`${gate.id}-connection`}
                            className="pointer-events-none absolute z-10 w-px bg-blue-500"
                            style={{
                                left:
                                    64 +
                                    gate.step * 56 +
                                    28,

                                top:
                                    32 +
                                    min * 56 +
                                    28,

                                height:
                                    (max - min) * 56,
                            }}
                        />
                    )
                })}
            </div>

            {/* Empty state */}
            {gates.length === 0 && (
                <div className="border-t border-zinc-100 px-5 py-6 text-center">
                    <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-zinc-400">
                        Drag a gate onto the register
                    </p>
                </div>
            )}
        </div>
    )
}