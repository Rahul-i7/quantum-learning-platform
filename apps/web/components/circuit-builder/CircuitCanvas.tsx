'use client'

import { useState, useEffect, useRef } from 'react'
import { useDrop } from 'react-dnd'
import { useCircuitStore } from '@/lib/store/circuit-store'
import { X } from 'lucide-react'

const NUM_STEPS = 8

interface CellProps {
    qubitIndex: number
    stepIndex: number
    pendingCX: { qubitIndex: number, stepIndex: number } | null
    setPendingCX: React.Dispatch<React.SetStateAction<{ qubitIndex: number, stepIndex: number } | null>>
}

function DropCell({ qubitIndex, stepIndex, pendingCX, setPendingCX }: CellProps) {
    const addGate = useCircuitStore((state) => state.addGate)
    const removeGate = useCircuitStore((state) => state.removeGate)

    const gate = useCircuitStore((state) =>
        state.gates.find(
            (g: any) => g.qubits.includes(qubitIndex) && g.step === stepIndex
        )
    )
    const [{ isOver, canDrop }, drop] = useDrop(() => ({
        accept: 'GATE',
        drop: (item: { type: string; gateType: string }) => {
            if (item.gateType === "CX") {
                setPendingCX({ qubitIndex, stepIndex })
            } else {
                addGate({
                    id: `${item.gateType}-q${qubitIndex}-s${stepIndex}-${Date.now()}`,
                    type: item.gateType,
                    qubits: [qubitIndex],
                    step: stepIndex,
                });
            }
        },
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
            canDrop: !!monitor.canDrop(),
        }),
    }))

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (gate) removeGate(gate.id)
    }

    const isPendingControl =
        pendingCX?.qubitIndex === qubitIndex &&
        pendingCX?.stepIndex !== stepIndex

    const handleCellClick = () => {
        if (pendingCX && pendingCX.stepIndex === stepIndex && pendingCX.qubitIndex !== qubitIndex) {
            addGate({
                id: `cx-q${pendingCX.qubitIndex}-q${qubitIndex}-s${stepIndex}-${Date.now()}`,
                type: "cx",
                qubits: [pendingCX.qubitIndex, qubitIndex],
                step: stepIndex,
            });
            setPendingCX(null)
        }
    }

    return (
        <div
            ref={(node) => {
                drop(node)
            }}
            onClick={handleCellClick}
            data-qubit={qubitIndex}
            data-step={stepIndex}
            className={`relative flex h-12 w-12 items-center justify-center border border-dashed border-gray-300 bg-white transition-colors ${isOver && canDrop ? 'bg-blue-100 border-blue-500' : ''
                } ${pendingCX?.qubitIndex === qubitIndex && pendingCX?.stepIndex !== stepIndex ? 'border-2 border-blue-500 cursor-pinter' : ''}`}
        >
            {/* Horizontal wire line passing through the center */}
            <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-gray-400 z-0" />
            {gate && (
                <div className="group relative z-10 flex h-8 w-8 items-center justify-center rounded bg-blue-600 font-mono text-xs font-bold text-white shadow-sm">
                    {gate.type === 'measure' ? 'M' : gate.type.toUpperCase()}

                    <button
                        onClick={handleRemove}
                        className="absolute cursor-pointer -top-1.5 hidden -right-1.5 h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white group-hover:flex"
                    >
                        <X size={12} />
                    </button>
                </div>
            )}

            {isPendingControl && (
                <div className="relative z-20 h-4 w-4 rounded-full bg-blue-600 ring-4 ring-blue-300" />
            )}
            {/* Drop feedback indicator */}
            {isOver && !gate && (
                <div className="absolute inset-1 rounded bg-blue-400/30 z-10" />
            )}
        </div>
    )
}

export default function CircuitCanvas() {
    const numQubits = useCircuitStore((state) => state.numQubits)
    const qubits = Array.from({ length: numQubits }, (_, i) => i)
    const steps = Array.from({ length: NUM_STEPS }, (_, i) => i)

    const [pendingCX, setPendingCX] = useState<{ qubitIndex: number; stepIndex: number } | null>(null)
    const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
    const canvasRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (pendingCX && canvasRef.current) {
                const rect = canvasRef.current.getBoundingClientRect()
                setMousePos({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                })
            }
        }
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setPendingCX(null)
        }
        window.addEventListener("mousemove", handleMouseMove)
        window.addEventListener("keydown", handleKeyDown)

        return () => {
            window.removeEventListener("mousemove", handleMouseMove)
            window.removeEventListener("keydown", handleKeyDown)
        }
    }, [pendingCX])

    const getControlCenter = () => {
        if (!pendingCX || !canvasRef.current) return { x: 0, y: 0 }
        const cellEl = canvasRef.current.querySelector(`
            [data-qubit="${pendingCX.qubitIndex}"][data-step="${pendingCX.stepIndex}"]
        `) as HTMLElement
        if (!cellEl) return { x: 0, y: 0 }
        const cellRect = cellEl.getBoundingClientRect()
        const canvasRect = canvasRef.current.getBoundingClientRect()
        return {
            x: cellRect.left - canvasRect.left + cellRect.width / 2,
            y: cellRect.top - canvasRect.top + cellRect.height / 2
        }
    }

    const controlCenter = getControlCenter()

    return (
        <div ref={canvasRef} className="relative flex flex-col gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50 overflow-x-auto">
            <h3 className="font-semibold text-gray-700 select-none">Circuit Canvas</h3>

            {/*Dynamic Line overlay */}
            {pendingCX && (
                <svg className='absolute inset-0 pointer-events-none z-30 h-full w-full'>
                    <line x1={controlCenter.x} y1={controlCenter.y} x2={mousePos.x} y2={mousePos.y}
                        stroke="#2563eb"
                        strokeWidth="2"
                        strokeDasharray="4,4"
                        strokeLinecap='round'
                    />
                </svg>
            )}

            <div className="flex flex-col gap-3">
                {qubits.map((qubitIndex) => (
                    <div key={qubitIndex} className="flex items-center gap-2">
                        {/* Wire label */}
                        <span className="w-12 text-right font-mono text-sm font-medium text-gray-600 select-none">
                            q[{qubitIndex}]
                        </span>

                        {/* Wire drop zone cells */}
                        <div className="flex items-center">
                            {steps.map((stepIndex) => (
                                <DropCell
                                    key={stepIndex}
                                    qubitIndex={qubitIndex}
                                    stepIndex={stepIndex}
                                    pendingCX={pendingCX}
                                    setPendingCX={setPendingCX}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}