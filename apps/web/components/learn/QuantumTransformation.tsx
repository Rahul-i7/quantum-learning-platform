'use client'

import { useMemo, useState, useEffect } from 'react'
import { ArrowRight, RotateCcw } from 'lucide-react'

import BlochSphereVisualizer from '@/components/visualizations/BlochSphereVisualizer'

type Gate = 'I' | 'X' | 'Y' | 'Z' | 'H' | 'S' | 'S†' | 'T' | 'T†'

type Complex = [number, number]

interface GateInfo {
    label: Gate
    name: string
    description: string
}

const GATES: GateInfo[] = [
    {
        label: 'I',
        name: 'Identity',
        description:
            'The identity gate leaves the quantum state unchanged.',
    },
    {
        label: 'X',
        name: 'Pauli-X',
        description:
            'The X gate flips the qubit from |0⟩ to |1⟩.',
    },
    {
        label: 'Y',
        name: 'Pauli-Y',
        description:
            'The Y gate flips the qubit and adds a phase of i.',
    },
    {
        label: 'Z',
        name: 'Pauli-Z',
        description:
            'The Z gate changes the phase of |1⟩ without changing computational-basis probabilities.',
    },
    {
        label: 'H',
        name: 'Hadamard',
        description:
            'The Hadamard gate places the qubit into an equal superposition of |0⟩ and |1⟩.',
    },
    {
        label: 'S',
        name: 'Phase (S)',
        description:
            'The S gate rotates the relative phase by π/2 — a quarter turn around the equator.',
    },
    {
        label: 'S†',
        name: 'S Dagger',
        description:
            'The inverse of S: rotates the relative phase by -π/2.',
    },
    {
        label: 'T',
        name: 'T Gate',
        description:
            'The T gate rotates the relative phase by π/4 — half of what S does.',
    },
    {
        label: 'T†',
        name: 'T Dagger',
        description:
            'The inverse of T: rotates the relative phase by -π/4.',
    },
]

// Phase gates (S, S†, T, T†) only change the RELATIVE phase between |0⟩
// and |1⟩ — applied to a pure |0⟩ they'd look like nothing happened.
// Starting those from |+⟩ instead makes the rotation visible as the
// point sweeping around the Bloch sphere's equator.
const PHASE_ONLY_GATES: Gate[] = ['S', 'S†', 'T', 'T†']

const ZERO_STATE: Complex[] = [[1, 0], [0, 0]]
const PLUS_STATE: Complex[] = [
    [1 / Math.sqrt(2), 0],
    [1 / Math.sqrt(2), 0],
]

function applyGate(
    gate: Gate,
    state: Complex[]
): Complex[] {
    const [aRe, aIm] = state[0]
    const [bRe, bIm] = state[1]

    switch (gate) {
        case 'I':
            return [
                [aRe, aIm],
                [bRe, bIm],
            ]

        case 'X':
            return [
                [bRe, bIm],
                [aRe, aIm],
            ]

        case 'Y':
            // Y = [[0, -i], [i, 0]]
            return [
                [bIm, -bRe],
                [-aIm, aRe],
            ]

        case 'Z':
            return [
                [aRe, aIm],
                [-bRe, -bIm],
            ]

        case 'H': {
            const factor = 1 / Math.sqrt(2)

            return [
                [
                    (aRe + bRe) * factor,
                    (aIm + bIm) * factor,
                ],
                [
                    (aRe - bRe) * factor,
                    (aIm - bIm) * factor,
                ],
            ]
        }

        // S, S†, T, T† only touch the |1⟩ amplitude — they multiply it
        // by a unit-magnitude phase factor e^{i*angle} and leave |0⟩'s
        // amplitude untouched.
        case 'S':
            return [[aRe, aIm], [-bIm, bRe]] // ×i

        case 'S†':
            return [[aRe, aIm], [bIm, -bRe]] // ×-i

        case 'T': {
            const f = 1 / Math.sqrt(2) // cos(π/4) = sin(π/4)
            return [
                [aRe, aIm],
                [(bRe - bIm) * f, (bRe + bIm) * f],
            ]
        }

        case 'T†': {
            const f = 1 / Math.sqrt(2)
            return [
                [aRe, aIm],
                [(bRe + bIm) * f, (bIm - bRe) * f],
            ]
        }
    }
}

function formatComplex(
    [re, im]: Complex
) {
    const epsilon = 0.0001

    if (Math.abs(re) < epsilon && Math.abs(im) < epsilon) {
        return '0'
    }

    if (Math.abs(im) < epsilon) {
        return formatNumber(re)
    }

    if (Math.abs(re) < epsilon) {
        return `${formatNumber(im)}i`
    }

    const sign = im >= 0 ? '+' : '-'

    return `${formatNumber(re)} ${sign} ${formatNumber(
        Math.abs(im)
    )}i`
}

function formatNumber(value: number) {
    if (Math.abs(value - 1) < 0.001) return '1'
    if (Math.abs(value + 1) < 0.001) return '-1'

    return value.toFixed(2)
}

function getStateLabel(state: Complex[]) {
    const [a, b] = state

    const isZero = (value: Complex) =>
        Math.abs(value[0]) < 0.001 &&
        Math.abs(value[1]) < 0.001

    if (
        Math.abs(a[0] - 1) < 0.001 &&
        Math.abs(a[1]) < 0.001 &&
        isZero(b)
    ) {
        return '|0⟩'
    }

    if (
        Math.abs(b[0] - 1) < 0.001 &&
        Math.abs(b[1]) < 0.001 &&
        isZero(a)
    ) {
        return '|1⟩'
    }

    if (
        Math.abs(a[0] - 1 / Math.sqrt(2)) < 0.001 &&
        Math.abs(b[0] - 1 / Math.sqrt(2)) < 0.001 &&
        isZero([a[1], b[1]])
    ) {
        return '|+⟩'
    }

    if (
        Math.abs(a[0] - 1 / Math.sqrt(2)) < 0.001 &&
        Math.abs(b[0] + 1 / Math.sqrt(2)) < 0.001 &&
        isZero([a[1], b[1]])
    ) {
        return '|−⟩'
    }

    if (
        Math.abs(a[0] - 1 / Math.sqrt(2)) < 0.001 &&
        isZero([a[1], b[0]]) &&
        Math.abs(b[1] - 1 / Math.sqrt(2)) < 0.001
    ) {
        return '|i⟩'
    }

    if (
        Math.abs(a[0] - 1 / Math.sqrt(2)) < 0.001 &&
        isZero([a[1], b[0]]) &&
        Math.abs(b[1] + 1 / Math.sqrt(2)) < 0.001
    ) {
        return '|−i⟩'
    }

    return null
}

function probability(state: Complex) {
    return state[0] ** 2 + state[1] ** 2
}

export default function QuantumTransformation({
    defaultGate = 'H',
}: {
    // Lets gate lessons (H/X/Y/Z) preselect their own gate in the same
    // widget used on the qubits lesson, instead of duplicating it.
    defaultGate?: Gate
}) {
    const [gate, setGate] = useState<Gate>(defaultGate)
    const [isTransforming, setIsTransforming] = useState(false)

    const handleGateChange = (nextGate: Gate) => {
        if (nextGate === gate) return

        setGate(nextGate)
        setIsTransforming(true)
    }

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setIsTransforming(false)
        }, 550)

        return () => window.clearTimeout(timer)
    }, [gate])

    const currentGate =
        GATES.find((item) => item.label === gate) ?? GATES[0]

    const inputState = PHASE_ONLY_GATES.includes(gate)
        ? PLUS_STATE
        : ZERO_STATE
    const inputLabel = PHASE_ONLY_GATES.includes(gate) ? '|+⟩' : '|0⟩'
    const inputProbabilities = [
        probability(inputState[0]),
        probability(inputState[1]),
    ]

    const outputState = useMemo(
        () => applyGate(gate, inputState),
        [gate, inputState]
    )

    const outputProbabilities = useMemo(
        () => [
            probability(outputState[0]),
            probability(outputState[1]),
        ],
        [outputState]
    )

    const outputLabel = getStateLabel(outputState)

    const inputData = {
        num_qubits: 1,
        statevector: inputState,
    }

    const outputData = {
        num_qubits: 1,
        statevector: outputState,
    }

    return (
        <section className="my-10 max-w-5xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#111111]">
            {/* Header */}
            <div className="border-b border-zinc-200 px-5 py-4 sm:px-6 dark:border-zinc-800">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <div className="mb-1 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
                            Interactive
                        </div>

                        <h3 className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-100">
                            See a qubit transform
                        </h3>
                    </div>

                    <button
                        onClick={() => setGate(defaultGate)}
                        className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-zinc-400 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
                    >
                        <RotateCcw className="h-3 w-3" />
                        Reset
                    </button>
                </div>
            </div>

            {/* Gate selector */}
            <div className="border-b border-zinc-200 px-5 py-4 sm:px-6 dark:border-zinc-800">
                <div className="flex flex-wrap gap-1.5">
                    {GATES.map((item) => {
                        const selected = gate === item.label

                        return (
                            <button
                                key={item.label}
                                onClick={() => {
                                    if (item.label === gate) return
                                    setGate(item.label)
                                }}
                                className={`min-w-10 border px-3 py-2 font-mono text-xs font-semibold transition-all ${selected
                                    ? 'border-zinc-950 bg-zinc-950 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950'
                                    : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-400 hover:text-zinc-950 dark:border-zinc-800 dark:bg-[#111111] dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-100'
                                    }`}
                            >
                                {item.label}
                            </button>
                        )
                    })}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                    <p className="max-w-2xl text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                        {currentGate.description}
                    </p>

                    <div
                        className={`ml-auto shrink-0 font-mono text-[9px] font-semibold uppercase tracking-[0.15em] transition-all ${isTransforming
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                    >
                        <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-current align-middle" />
                        {isTransforming
                            ? `Applying ${gate}`
                            : 'Transformation complete'}
                    </div>
                </div>
            </div>

            {/* Transformation */}
            <div className="grid md:grid-cols-[1fr_auto_1fr]">
                {/* Input */}
                <div className="min-w-0 border-b border-zinc-200 md:border-b-0 md:border-r dark:border-zinc-800">
                    <div className="border-b border-zinc-100 px-5 py-3 sm:px-6 dark:border-zinc-800">
                        <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-zinc-400">
                            Input / Q[0]
                        </span>
                    </div>

                    <div className="h-64">
                        <BlochSphereVisualizer
                            data={inputData}
                            qubitIndex={0}
                            numQubits={1}
                            variant="hero"
                        />
                    </div>

                    <div className="border-t border-zinc-100 px-5 py-4 sm:px-6 dark:border-zinc-800">
                        <div className="flex items-end justify-between gap-4">
                            <div>
                                <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                                    State
                                </div>
                                <div className="mt-1 font-mono text-lg font-semibold text-zinc-950 dark:text-zinc-100">
                                    {inputLabel}
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="font-mono text-[9px] uppercase tracking-wider text-zinc-400">
                                    Probability
                                </div>
                                <div className="mt-1 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                                    {(inputProbabilities[0] * 100).toFixed(0)}% /{' '}
                                    {(inputProbabilities[1] * 100).toFixed(0)}%
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Gate */}
                <div className="flex items-center justify-center border-b border-zinc-200 px-6 py-5 md:border-b-0 md:border-r dark:border-zinc-800">
                    <div className="flex flex-col items-center gap-3">
                        <ArrowRight className="hidden h-4 w-4 text-zinc-300 md:block" />

                        <div className="flex h-12 w-12 items-center justify-center border border-blue-200 bg-blue-50 font-mono text-lg font-bold text-blue-600 dark:border-blue-800 dark:bg-blue-500/10 dark:text-blue-400">
                            {gate}
                        </div>

                        <div className="text-center">
                            <div className="font-mono text-[9px] font-semibold uppercase tracking-wider text-zinc-400">
                                Gate
                            </div>
                            <div className="mt-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                {currentGate.name}
                            </div>
                        </div>

                        <ArrowRight className="h-4 w-4 rotate-90 text-zinc-300 md:hidden" />
                    </div>
                </div>

                {/* Output */}
                <div className="min-w-0">
                    <div className="border-b border-zinc-100 px-5 py-3 sm:px-6 dark:border-zinc-800">
                        <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-zinc-400">
                            Output / Q[0]
                        </span>
                    </div>

                    <div className="h-64">
                        <BlochSphereVisualizer
                            data={outputData}
                            qubitIndex={0}
                            numQubits={1}
                            variant="hero"
                            animated
                        />
                    </div>

                    <div className="border-t border-zinc-100 px-5 py-4 sm:px-6 dark:border-zinc-800">
                        <div className="flex items-end justify-between gap-4">
                            <div>
                                <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                                    State
                                </div>
                                <div
                                    className={`mt-1 font-mono text-lg font-semibold text-zinc-950 transition-opacity duration-300 dark:text-zinc-100 ${isTransforming ? 'opacity-40' : 'opacity-100'
                                        }`}
                                >
                                    {outputLabel ?? 'Superposition'}
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="font-mono text-[9px] uppercase tracking-wider text-zinc-400">
                                    Probability
                                </div>
                                <div className="mt-1 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                                    {(outputProbabilities[0] * 100).toFixed(0)}% /{' '}
                                    {(outputProbabilities[1] * 100).toFixed(0)}%
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Statevector readout */}
            <div className="border-t border-zinc-200 bg-[#0b0d10] px-5 py-4 sm:px-6">
                <div className="mb-3 flex items-center justify-between">
                    <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
                        Statevector
                    </span>

                    <span className="font-mono text-[9px] uppercase tracking-wider text-blue-400">
                        After {gate}
                    </span>
                </div>

                <div className="overflow-x-auto font-mono text-sm text-emerald-400">
                    [
                    {outputState.map((amplitude, index) => (
                        <span key={index}>
                            {' '}
                            <span className="text-zinc-500">[</span>
                            {formatComplex(amplitude)}
                            <span className="text-zinc-500">]</span>
                            {index < outputState.length - 1 ? ',' : ''}
                        </span>
                    ))}
                    {' '}
                    ]
                </div>
            </div>
        </section>
    )
}