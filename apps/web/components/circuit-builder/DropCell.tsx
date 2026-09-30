import { useDrop } from 'react-dnd'
import { useCircuitStore } from '@/lib/store/circuit-store'
import { X } from 'lucide-react'

interface CellProps {
    qubitIndex: number
    stepIndex: number
    pendingGate: {
        type: 'cx' | 'cz' | 'swap'
        qubitIndex: number
        stepIndex: number
    } | null
    setPendingGate: React.Dispatch<
        React.SetStateAction<{
            type: 'cx' | 'cz' | 'swap'
            qubitIndex: number
            stepIndex: number
        } | null>
    >
}

//helper for better display
function formatAngle(theta?: number) {
    if (theta === undefined) return 'π/2'

    if (Math.abs(theta - Math.PI / 2) < 0.000001) return 'π/2'
    if (Math.abs(theta - Math.PI) < 0.000001) return 'π'
    if (Math.abs(theta - (3 * Math.PI) / 2) < 0.000001) return '3π/2'
    if (Math.abs(theta - 2 * Math.PI) < 0.000001) return '2π'

    return theta.toFixed(2)
}

export default function DropCell({
    qubitIndex,
    stepIndex,
    pendingGate,
    setPendingGate,
}: CellProps) {
    const addGate = useCircuitStore((state) => state.addGate)
    const removeGate = useCircuitStore((state) => state.removeGate)

    const gate = useCircuitStore((state) =>
        state.gates.find(
            (g) =>
                g.qubits.includes(qubitIndex) &&
                g.step === stepIndex
        )
    )

    const cxGate = useCircuitStore((state) =>
        state.gates.find(
            (g) =>
                g.type === 'cx' &&
                g.step === stepIndex &&
                g.qubits.includes(qubitIndex)
        )
    )
    const swapGate = useCircuitStore((state) =>
        state.gates.find(
            (g) =>
                g.type === 'swap' &&
                g.step === stepIndex &&
                g.qubits.includes(qubitIndex)
        )
    )

    const [{ isOver, canDrop }, drop] = useDrop(() => ({
        accept: 'GATE',

        drop: (item: {
            type: string
            gateType: string
        }) => {
            if (item.gateType === 'cx' || item.gateType === 'cz' || item.gateType === 'swap') {
                setPendingGate({
                    type: item.gateType,
                    qubitIndex,
                    stepIndex,
                })
            } else {
                addGate({
                    id: `${item.gateType}-q${qubitIndex}-s${stepIndex}-${Date.now()}`,
                    type: item.gateType,
                    qubits: [qubitIndex],
                    step: stepIndex,
                    ...(item.gateType === 'rx' || item.gateType === 'ry' || item.gateType === 'rz'
                        ? {
                            params: {
                                theta: Math.PI / 2
                            }
                        } : {}),
                })
            }
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

    const isPendingTarget =
        pendingGate?.stepIndex === stepIndex &&
        pendingGate?.qubitIndex !== qubitIndex

    const isCX =
        cxGate?.type === 'cx' &&
        cxGate.qubits.includes(qubitIndex)
    const isCXControl =
        isCX &&
        cxGate?.qubits[0] === qubitIndex

    const isCXTarget =
        isCX &&
        cxGate?.qubits[1] === qubitIndex

    const czGate = useCircuitStore((state) =>
        state.gates.find(
            (g) =>
                g.type === 'cz' &&
                g.step === stepIndex &&
                g.qubits.includes(qubitIndex)
        )
    )

    const isCZ = czGate?.type === 'cz'

    const isSwapGate = swapGate?.type === 'swap'

    const handleCellClick = () => {
        if (
            pendingGate &&
            pendingGate.stepIndex === stepIndex &&
            pendingGate.qubitIndex !== qubitIndex
        ) {
            addGate({
                id: `${pendingGate.type}-q${pendingGate.qubitIndex}-q${qubitIndex}-s${stepIndex}-${Date.now()}`,
                type: pendingGate.type,
                qubits: [
                    pendingGate.qubitIndex,
                    qubitIndex,
                ],
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
            transition-colors
            ${isOver && canDrop ? 'bg-blue-50' : ''}
            ${isPendingTarget
                    ? 'cursor-pointer bg-blue-50/70'
                    : ''
                }
            `}
        >
            {/* Quantum wire */}
            <div className="absolute inset-x-0 top-1/2 z-0 h-px bg-zinc-300" />


            {/* Pending multi-qubit gate indicator */}
            {isPendingTarget && !gate && (
                <div className="absolute z-10 h-3 w-3 rounded-full border-2 border-blue-500 bg-white" />
            )}

            {/* Standard gate */}
            {gate && !['cx', 'cz', 'swap'].includes(gate.type) && (
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
                        className="absolute -right-1.5 -top-1.5 hidden h-4 w-4 items-center justify-center border border-white bg-red-500 text-white group-hover:flex">
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
                        className="absolute -right-1.5 -top-1.5 hidden h-4 w-4 items-center justify-center border border-white bg-red-500 text-white group-hover:flex">
                        <X size={10} />
                    </button>
                </div>
            )}

            {/* CX target */}
            {isCXTarget && (
                <div
                    className="group relative z-20 flex h-8 w-8 items-center justify-center">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-blue-600 bg-white font-mono text-sm font-semibold text-blue-600">+</div>
                    <button
                        onClick={handleRemove}
                        className="absolute -right-1.5 -top-1.5 hidden h-4 w-4 items-center justify-center border border-white bg-red-500 text-white group-hover:flex">
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
                        className="absolute -right-1.5 -top-1.5 hidden h-4 w-4 items-center justify-center border border-white bg-red-500 text-white group-hover:flex">
                        <X size={10} />
                    </button>
                </div>
            )}

            {/* Swap gate */}
            {isSwapGate && (
                <div
                    className="group relative z-20 flex h-8 w-8 items-center justify-center">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-blue-600 bg-white font-mono text-sm font-semibold text-blue-600">×</div>
                    <button
                        onClick={handleRemove}
                        className="absolute -right-1.5 -top-1.5 hidden h-4 w-4 items-center justify-center border border-white bg-red-500 text-white group-hover:flex">
                        <X size={10} />
                    </button>
                </div>
            )}

            {/* Drop feedback */}
            {isOver && !gate && (
                <div className="absolute inset-1 z-10 border border-blue-400 bg-blue-100/30" />
            )}
        </div>
    )
}