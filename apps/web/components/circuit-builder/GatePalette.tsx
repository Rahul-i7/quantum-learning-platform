/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

{/*
    01  SINGLE QUBIT

H       Hadamard
X       Pauli-X
Y       Pauli-Y
Z       Pauli-Z
S       Phase
S†      S dagger
T       T gate
T†      T dagger


02  ROTATION

RX      Rotation around X
RY      Rotation around Y
RZ      Rotation around Z


03  MULTI QUBIT

CX      Controlled-X
CZ      Controlled-Z
SWAP    Swap


04  ADVANCED

CCX     Toffoli
CSWAP   Fredkin


05  MEASUREMENT

M       Measure
    */}

import { useDrag } from 'react-dnd'

interface Gate {
    label: string
    type: string
    category: string
    name: string
    description: string
}

const GATES = [
    {
        label: 'H',
        type: 'h',
        category: 'single',
        name: 'Hadamard',
        description: 'Creates an equal superposition.',
    },
    {
        label: 'X',
        type: 'x',
        category: 'single',
        name: 'Pauli-X',
        description: 'Flips the qubit state.',
    },
    {
        type: 'y',
        label: 'Y',
        category: 'single',
        name: 'Pauli-Y',
        description: 'Applies both a bit-flip and a phase-flip.',
    },
    {
        type: 'z',
        label: 'Z',
        category: 'single',
        name: 'Pauli-Z',
        description: 'Inverts the phase of state |1⟩ to -|1⟩.',
    },
    {
        type: 's',
        label: 'S',
        category: 'single',
        name: 'Phase',
        description: 'Rotates the state by π/2 around the Z axis',
    },
    {
        type: 'sdg',
        label: 'S†',
        category: 'single',
        name: 'S Dagger',
        description: 'Rotates the state by -π/2  around the Z axis.',
    },
    {
        type: 't',
        label: 'T',
        category: 'single',
        name: 'T Gate',
        description: 'Rotates the phase of state |1⟩ by π/4.',
    },
    {
        type: 'tdg',
        label: 'T†',
        category: 'single',
        name: 'T Dagger',
        description: 'Rotates the phase of state |1⟩ by -π/4.',
    },
    {
        label: 'CX',
        type: 'cx',
        category: 'multi',
        name: 'Controlled-X',
        description: 'Flips the target when control is |1⟩.',
    },
    {
        label: 'CZ',
        type: 'cz',
        category: 'multi',
        name: 'Controlled-Z',
        description: 'Flips the phase of the target when control is |1⟩.',
    },
    {
        label: 'X-X',
        type: 'swap',
        category: 'multi',
        name: 'SWAP',
        description: 'Swaps the states of the two qubits.',
    },
    {
        label: 'RX',
        type: 'rx',
        category: 'rotation',
        name: 'RX(θ)',
        description: 'Rotation around X axis.',
    },
    {
        label: 'RY',
        type: 'ry',
        category: 'rotation',
        name: 'RY(θ)',
        description: 'Rotation around Y axis.',
    },
    {
        label: 'RZ',
        type: 'rz',
        category: 'rotation',
        name: 'RZ(θ)',
        description: 'Rotation around Z axis.',
    },
    {
        label: 'M',
        type: 'measure',
        category: 'measurement',
        name: 'Measure',
        description: 'Collapses the qubit to a classical bit.',
    }
]

function DraggableGate({ gate }: { gate: Gate }) {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: 'GATE',
        item: {
            type: 'GATE',
            gateType: gate.type,
        },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }))

    return (
        <div className={`group relative ${isDragging ? 'opacity-40' : 'opacity-100'}`}>
            <div ref={drag as any} className="flex cursor-grab items-center gap-3 border-b border-zinc-200 px-1 py-3 transition-colors hover:bg-zinc-100/90 active:cursor-grabbing">
                {/* Gate symbol */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-zinc-300 bg-white font-mono text-xs font-semibold text-zinc-900 transition-all group-hover:border-blue-500 group-hover:text-blue-600">
                    {gate.label}
                </div>

                {/* Gate information */}
                <div className="min-w-0">
                    <div className="text-xs font-semibold text-zinc-800">
                        {gate.name}
                    </div>

                    <div className="mt-0.5 truncate text-[10px] leading-4 text-zinc-400">
                        {gate.description}
                    </div>
                </div>
            </div>

            {/* Drag indicator */}
            <div className="pointer-events-none absolute right-1 top-1/2 h-3 w-px -translate-y-1/2 bg-blue-500 opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
    )
}

export default function GatePalette() {
    const singleQubitGates = GATES.filter((gate) => gate.category === 'single')
    const rotationGates = GATES.filter((gate) => gate.category === 'rotation')
    const multiQubitGates = GATES.filter((gate) => gate.category === 'multi')
    const measurementGates = GATES.filter((gate) => gate.category === 'measurement')

    return (
        <div className="px-5 py-5">
            <div className="overflow-y-auto h-80">
                {/* Single qubit */}
                <section>
                    <div className="mb-2 flex items-center gap-2">
                        <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
                            01
                        </span>

                        <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                            Single Qubit
                        </span>
                    </div>

                    <div>
                        {singleQubitGates.map((gate) => (
                            <DraggableGate
                                key={gate.type}
                                gate={gate}
                            />
                        ))}
                    </div>
                </section>

                {/* Rotation gates */}
                <section className="mt-7">
                    <div className="mb-2 flex items-center gap-2">
                        <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
                            02
                        </span>

                        <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                            Rotation Gates
                        </span>
                    </div>

                    <div>
                        {rotationGates.map((gate) => (
                            <DraggableGate
                                key={gate.type}
                                gate={gate}
                            />
                        ))}
                    </div>
                </section>

                {/* Multi qubit */}
                <section className="mt-7">
                    <div className="mb-2 flex items-center gap-2">
                        <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
                            03
                        </span>

                        <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                            Multi Qubit
                        </span>
                    </div>

                    <div>
                        {multiQubitGates.map((gate) => (
                            <DraggableGate
                                key={gate.type}
                                gate={gate}
                            />
                        ))}
                    </div>
                </section>

                {/* Measurement */}
                <section className="mt-7">
                    <div className="mb-2 flex items-center gap-2">
                        <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
                            04
                        </span>

                        <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                            Measurement
                        </span>
                    </div>

                    <div>
                        {measurementGates.map((gate) => (
                            <DraggableGate
                                key={gate.type}
                                gate={gate}
                            />
                        ))}
                    </div>
                </section>
            </div>

            {/* Hint */}
            <div className="mt-2 border-t border-zinc-200 pt-4">
                <p className="font-mono text-[9px] leading-4 text-zinc-400">
                    DRAG AN OPERATION
                    <br />
                    ONTO THE REGISTER
                </p>
            </div>
        </div>
    )
}