import { useDrop } from 'react-dnd'
import { useCircuitStore } from '@/lib/store/circuit-store'
import { X } from 'lucide-react'
import { useState } from 'react'

interface CellProps {
    qubitIndex: number
    stepIndex: number
    pendingGate: {
        type: 'cx' | 'cz' | 'swap' | 'ccx' | 'cswap'
        qubitIndex: number
        stepIndex: number
        selectedQubits: number[]
    } | null
    setPendingGate: React.Dispatch<
        React.SetStateAction<{
            type: 'cx' | 'cz' | 'swap' | 'ccx' | 'cswap'
            qubitIndex: number
            stepIndex: number
            selectedQubits: number[]
        } | null>
    >
}

//helper for better display
function formatAngle(theta?: number) {
    if (theta === undefined) return '?'

    if (Math.abs(theta - Math.PI / 2) < 0.000001) return 'π/2'
    if (Math.abs(theta - Math.PI) < 0.000001) return 'π'
    if (Math.abs(theta - (3 * Math.PI) / 2) < 0.000001) return '3π/2'
    if (Math.abs(theta - 2 * Math.PI) < 0.000001) return '2π'

    return theta.toFixed(2)
}

function parseAngle(value: string): number | null {
    const input = value
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/°$/, '')

    if (!input) return null

    // Direct number: radians
    const numeric = Number(input)
    if (!Number.isNaN(numeric)) {
        return numeric
    }

    // π expressions
    const normalized = input.replace(/π/g, 'pi')

    if (normalized === 'pi') return Math.PI
    if (normalized === '-pi') return -Math.PI

    const match = normalized.match(/^(-?\d*\.?\d*)\/?pi?$/)

    if (match) {
        const numerator = match[1]

        if (!numerator || numerator === '+') {
            return Math.PI
        }

        if (numerator === '-') {
            return -Math.PI
        }

        return Number(numerator) * Math.PI
    }

    // e.g. pi/2, 3pi/4, -pi/2
    const piMatch = normalized.match(/^(-?\d*\.?\d*)pi\/(\d*\.?\d+)$/)

    if (piMatch) {
        const numerator =
            piMatch[1] === '' || piMatch[1] === '+'
                ? 1
                : piMatch[1] === '-'
                    ? -1
                    : Number(piMatch[1])

        const denominator = Number(piMatch[2])

        if (denominator === 0) return null

        return (numerator * Math.PI) / denominator
    }

    return null
}

export default function DropCell({
    qubitIndex,
    stepIndex,
    pendingGate,
    setPendingGate,
}: CellProps) {
    const addGate = useCircuitStore((state) => state.addGate)
    const removeGate = useCircuitStore((state) => state.removeGate)
    const [rotationGate, setRotationGate] = useState<{
        type: string
        qubitIndex: number
        stepIndex: number
    } | null>(null)

    const [angleInput, setAngleInput] = useState("π/2")

    const handleRotationSubmit = () => {
        if (!rotationGate) return

        const theta = parseAngle(angleInput)

        if (theta === null) {
            return
        }

        addGate({
            id: `${rotationGate.type}-q${rotationGate.qubitIndex}-s${rotationGate.stepIndex}-${Date.now()}`,
            type: rotationGate.type,
            qubits: [rotationGate.qubitIndex],
            step: rotationGate.stepIndex,
            params: {
                theta,
            },
        })

        setRotationGate(null)
    }

    const gate = useCircuitStore((state) =>
        state.gates.find(
            (g) =>
                g.qubits.includes(qubitIndex) &&
                g.step === stepIndex
        )
    )

    const [{ isOver, canDrop }, drop] = useDrop(() => ({
        accept: 'GATE',

        drop: (item: {
            type: string
            gateType: string
        }) => {
            if (
                item.gateType === 'cx' ||
                item.gateType === 'cz' ||
                item.gateType === 'swap' ||
                item.gateType === 'ccx' ||
                item.gateType === 'cswap'
            ) {
                setPendingGate({
                    type: item.gateType,
                    qubitIndex,
                    stepIndex,
                    selectedQubits: [qubitIndex],
                })

                return
            }

            if (
                item.gateType === 'rx' ||
                item.gateType === 'ry' ||
                item.gateType === 'rz'
            ) {
                setRotationGate({
                    type: item.gateType,
                    qubitIndex,
                    stepIndex,
                })

                setAngleInput('π/2')
                return
            }

            addGate({
                id: `${item.gateType}-q${qubitIndex}-s${stepIndex}-${Date.now()}`,
                type: item.gateType,
                qubits: [qubitIndex],
                step: stepIndex,
            })
        },

        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
            canDrop: !!monitor.canDrop(),
        }),
    }))

    const handleRemove = (
        e: React.MouseEvent
    ) => {
        e.stopPropagation()

        if (gate) {
            removeGate(gate.id)
        }
    }

    const isPendingSelected =
        pendingGate?.stepIndex === stepIndex &&
        pendingGate.selectedQubits.includes(qubitIndex)

    const isPendingTarget =
        pendingGate?.stepIndex === stepIndex &&
        !pendingGate.selectedQubits.includes(qubitIndex)

    const isCX =
        gate?.type === 'cx' &&
        gate.qubits.includes(qubitIndex)
    const isCXControl =
        isCX &&
        gate?.qubits[0] === qubitIndex

    const isCXTarget =
        isCX &&
        gate?.qubits[1] === qubitIndex

    const isCCXControl =
        gate?.type === 'ccx' &&
        (gate.qubits[0] === qubitIndex ||
            gate.qubits[1] === qubitIndex)

    const isCCXTarget =
        gate?.type === 'ccx' &&
        gate.qubits[2] === qubitIndex

    const isCSWAPControl =
        gate?.type === 'cswap' &&
        gate.qubits[0] === qubitIndex

    const isCSWAPTarget =
        gate?.type === 'cswap' &&
        (gate.qubits[1] === qubitIndex ||
            gate.qubits[2] === qubitIndex)

    const isCZ =
        gate?.type === 'cz'

    const isSwapGate =
        gate?.type === 'swap'

    const handleCellClick = () => {
        if (pendingGate) {
            if (pendingGate.stepIndex !== stepIndex) return

            if (pendingGate.selectedQubits.includes(qubitIndex)) {
                return
            }

            const selectedQubits = [
                ...pendingGate.selectedQubits,
                qubitIndex,
            ]

            const requiredQubits =
                pendingGate.type === 'ccx' || pendingGate.type === 'cswap'
                    ? 3
                    : 2

            if (selectedQubits.length < requiredQubits) {
                setPendingGate({
                    ...pendingGate,
                    selectedQubits,
                })

                return
            }
            addGate({
                id: `${pendingGate.type}-q${pendingGate.qubitIndex}-q${qubitIndex}-s${stepIndex}-${Date.now()}`,
                type: pendingGate.type,
                qubits: selectedQubits,
                step: stepIndex,
            })
            setPendingGate(null)
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
            className={`
            relative flex h-14 w-14 shrink-0
            items-center justify-center
            border-l border-zinc-100
            transition-colors dark:border-zinc-800
            ${isOver && canDrop ? 'bg-blue-50 dark:bg-blue-500/10' : ''}
            ${isPendingTarget
                    ? 'cursor-pointer bg-blue-50/70 dark:bg-blue-500/10'
                    : ''
                }
            `}
        >
            {rotationGate && (
                <div
                    className="absolute left-1/2 top-full z-50 w-44 -translate-x-1/2 border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-800 dark:bg-[#111111]"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="mb-2">
                        <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                            Rotation
                        </div>

                        <div className="mt-1 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                            {rotationGate.type.toUpperCase()}(θ)
                        </div>
                    </div>

                    <input
                        value={angleInput}
                        onChange={(e) => setAngleInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleRotationSubmit()
                            }

                            if (e.key === 'Escape') {
                                setRotationGate(null)
                            }
                        }}
                        autoFocus
                        className="h-8 w-full border border-zinc-200 bg-zinc-50 px-2 font-mono text-xs text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                        placeholder="π/2"
                    />

                    <div className="mt-2 flex gap-2">
                        <button
                            type="button"
                            onClick={() => setRotationGate(null)}
                            className="flex-1 border border-zinc-200 px-2 py-1.5 font-mono text-[9px] uppercase tracking-wider text-zinc-500 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={handleRotationSubmit}
                            className="flex-1 bg-zinc-950 px-2 py-1.5 font-mono text-[9px] uppercase tracking-wider text-white hover:bg-blue-600 dark:bg-zinc-100 dark:text-zinc-950"
                        >
                            Apply
                        </button>
                    </div>
                </div>
            )}
            {/* Quantum wire */}
            <div className="absolute inset-x-0 top-1/2 z-0 h-px bg-zinc-300 dark:bg-zinc-600" />


            {/* Pending multi-qubit gate indicator */}
            {isPendingTarget && !gate && (
                <div className="absolute z-10 h-3 w-3 rounded-full border-2 border-blue-500 bg-white dark:bg-[#111111]" />
            )}
            {isPendingSelected && (
                <div className="absolute z-20 flex h-8 w-8 items-center justify-center">
                    <div className="h-3.5 w-3.5 rounded-full bg-blue-600" />
                </div>
            )}

            {/* Standard gate */}
            {gate && !['cx', 'cz', 'swap', 'ccx', 'cswap'].includes(gate.type) && (
                <div className="group relative z-20 flex h-9 w-9 items-center justify-center border border-blue-600 bg-blue-600 font-mono text-[11px] font-semibold text-white shadow-[0_2px_8px_rgba(37,99,235,0.18)]">
                    {['rx', 'ry', 'rz'].includes(gate.type) ? (
                        <span className='flex flex-col items-center justify-center'>
                            <p>{gate.type.toUpperCase()}</p>
                            <p className='-mt-1'>({formatAngle(gate.params?.theta)})</p>
                        </span>)
                        : gate.type === 'measure' ? (
                            'M'
                        ) : ['sdg', 'tdg'].includes(gate.type) ? (
                            gate.type.replace('dg', '†').toUpperCase()
                        ) :
                            gate.type.toUpperCase()
                    }

                    <button
                        onClick={handleRemove}
                        className="absolute -right-1.5 -top-1.5 hidden h-4 w-4 items-center justify-center border border-white bg-red-500 text-white group-hover:flex dark:border-zinc-800">
                        <X size={10} />
                    </button>
                </div>
            )}

            {/* CX control */}
            {isCXControl && (
                <div
                    className="group relative z-20 flex h-8 w-8 items-center justify-center">
                    <div className="h-3.5 w-3.5 rounded-full bg-blue-600" />

                    <button
                        onClick={handleRemove}
                        className="absolute -right-1.5 -top-1.5 hidden h-4 w-4 items-center justify-center border border-white bg-red-500 text-white group-hover:flex dark:border-zinc-800">
                        <X size={10} />
                    </button>
                </div>
            )}

            {/* CX target */}
            {isCXTarget && (
                <div
                    className="group relative z-20 flex h-8 w-8 items-center justify-center">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-blue-600 bg-white font-mono text-sm font-semibold text-blue-600 dark:bg-[#111111] dark:text-blue-400">+</div>
                    <button
                        onClick={handleRemove}
                        className="absolute -right-1.5 -top-1.5 hidden h-4 w-4 items-center justify-center border border-white bg-red-500 text-white group-hover:flex dark:border-zinc-800">
                        <X size={10} />
                    </button>
                </div>
            )}

            {/* CZ gate */}
            {isCZ && (
                <div
                    className="group relative z-20 flex h-8 w-8 items-center justify-center">
                    <div className="h-3.5 w-3.5 rounded-full bg-blue-600" />

                    <button
                        onClick={handleRemove}
                        className="absolute -right-1.5 -top-1.5 hidden h-4 w-4 items-center justify-center border border-white bg-red-500 text-white group-hover:flex dark:border-zinc-800">
                        <X size={10} />
                    </button>
                </div>
            )}

            {/* Swap gate */}
            {isSwapGate && (
                <div
                    className="group relative z-20 flex h-8 w-8 items-center justify-center">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-blue-600 bg-white font-mono text-sm font-semibold text-blue-600 dark:bg-[#111111] dark:text-blue-400">×</div>
                    <button
                        onClick={handleRemove}
                        className="absolute -right-1.5 -top-1.5 hidden h-4 w-4 items-center justify-center border border-white bg-red-500 text-white group-hover:flex dark:border-zinc-800">
                        <X size={10} />
                    </button>
                </div>
            )}

            {/* CCX gate */}
            {isCCXControl && (
                <div className="group relative z-20 flex h-8 w-8 items-center justify-center">
                    <div className="h-3.5 w-3.5 rounded-full bg-blue-600" />

                    <button
                        onClick={handleRemove}
                        className="absolute -right-1.5 -top-1.5 hidden h-4 w-4 items-center justify-center border border-white bg-red-500 text-white group-hover:flex dark:border-zinc-800"
                    >
                        <X size={10} />
                    </button>
                </div>
            )}
            {isCCXTarget && (
                <div className="group relative z-20 flex h-8 w-8 items-center justify-center">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-blue-600 bg-white font-mono text-sm font-semibold text-blue-600 dark:bg-[#111111] dark:text-blue-400">
                        +
                    </div>

                    <button
                        onClick={handleRemove}
                        className="absolute -right-1.5 -top-1.5 hidden h-4 w-4 items-center justify-center border border-white bg-red-500 text-white group-hover:flex dark:border-zinc-800"
                    >
                        <X size={10} />
                    </button>
                </div>
            )}

            {/* CSWAP gate */}
            {isCSWAPControl && (
                <div className="group relative z-20 flex h-8 w-8 items-center justify-center">
                    <div className="h-3.5 w-3.5 rounded-full bg-blue-600" />

                    <button
                        onClick={handleRemove}
                        className="absolute -right-1.5 -top-1.5 hidden h-4 w-4 items-center justify-center border border-white bg-red-500 text-white group-hover:flex dark:border-zinc-800"
                    >
                        <X size={10} />
                    </button>
                </div>
            )}
            {isCSWAPTarget && (
                <div className="group relative z-20 flex h-8 w-8 items-center justify-center">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-blue-600 bg-white font-mono text-sm font-semibold text-blue-600 dark:bg-[#111111] dark:text-blue-400">
                        ×
                    </div>

                    <button
                        onClick={handleRemove}
                        className="absolute -right-1.5 -top-1.5 hidden h-4 w-4 items-center justify-center border border-white bg-red-500 text-white group-hover:flex dark:border-zinc-800"
                    >
                        <X size={10} />
                    </button>
                </div>
            )}

            {/* Drop feedback */}
            {isOver && !gate && (
                <div className="absolute inset-1 z-10 border border-blue-400 bg-blue-100/30 dark:bg-blue-500/20" />
            )}
        </div>
    )
}