'use client'

import { ArrowRight } from 'lucide-react'
import { useState } from 'react'

type GateType = 'cx' | 'cz' | 'swap'
type Bits = '00' | '01' | '10' | '11'

const INPUTS: Bits[] = ['00', '01', '10', '11']

const GATE_INFO: Record<
    GateType,
    { label: string; name: string; blurb: string }
> = {
    cx: {
        label: 'CX',
        name: 'q0 is the control, q1 is the target',
        blurb: 'Pick a basis-state input and watch when the target actually flips.',
    },
    cz: {
        label: 'CZ',
        name: 'either qubit can be read as the control — CZ is symmetric',
        blurb: 'The bits never change — only the relative phase does, and only when both qubits are |1⟩.',
    },
    swap: {
        label: 'SWAP',
        name: 'q0 and q1 trade places',
        blurb: 'Pick a basis-state input and watch the two bits swap positions.',
    },
}

function applyGate(
    gateType: GateType,
    input: Bits
): { bits: string; phase: 1 | -1 } {
    if (gateType === 'cx') {
        const control = input[0]
        const target = input[1]
        const newTarget = control === '1' ? (target === '1' ? '0' : '1') : target
        return { bits: control + newTarget, phase: 1 }
    }

    if (gateType === 'cz') {
        return { bits: input, phase: input === '11' ? -1 : 1 }
    }

    // swap
    return { bits: input[1] + input[0], phase: 1 }
}

export default function TwoQubitGateDemo({
    gateType = 'cx',
}: {
    gateType?: GateType
}) {
    const [input, setInput] = useState<Bits>('10')
    const info = GATE_INFO[gateType]
    const { bits: outputBits, phase } = applyGate(gateType, input)
    const changed = outputBits !== input || phase === -1

    return (
        <section className="my-10 max-w-3xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#111111]">
            <div className="border-b border-zinc-200 px-5 py-4 sm:px-6 dark:border-zinc-800">
                <div className="mb-1 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
                    Interactive
                </div>
                <h3 className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-100">
                    Try every {info.label} input
                </h3>
            </div>

            <div className="px-5 py-6 sm:px-6">
                <p className="mb-1 max-w-xl text-xs leading-6 text-zinc-500 dark:text-zinc-400">
                    {info.name}.
                </p>
                <p className="mb-5 max-w-xl text-xs leading-6 text-zinc-500 dark:text-zinc-400">
                    {info.blurb}
                </p>

                <div className="mb-6 flex flex-wrap gap-1.5">
                    {INPUTS.map((i) => (
                        <button
                            key={i}
                            onClick={() => setInput(i)}
                            className={`border px-3 py-2 font-mono text-xs font-semibold transition-all ${
                                input === i
                                    ? 'border-zinc-950 bg-zinc-950 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950'
                                    : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-400 hover:text-zinc-950 dark:border-zinc-800 dark:bg-[#111111] dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-100'
                            }`}
                        >
                            |{i}⟩
                        </button>
                    ))}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-6">
                    <div className="border border-zinc-200 bg-zinc-50 px-6 py-4 text-center dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="font-mono text-[9px] uppercase tracking-wider text-zinc-400">
                            Input (q0 q1)
                        </div>
                        <div className="mt-1 font-mono text-2xl font-bold text-zinc-950 dark:text-zinc-100">
                            |{input}⟩
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-1 text-center">
                        <ArrowRight className="h-5 w-5 text-zinc-300" />
                        <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-400">
                            {info.label}
                        </span>
                    </div>

                    <div
                        className={`border-2 px-6 py-4 text-center transition-colors ${
                            changed
                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                                : 'border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900'
                        }`}
                    >
                        <div className="font-mono text-[9px] uppercase tracking-wider text-zinc-400">
                            Output (q0 q1)
                        </div>
                        <div className="mt-1 font-mono text-2xl font-bold text-zinc-950 dark:text-zinc-100">
                            {phase === -1 ? '−' : ''}|{outputBits}⟩
                        </div>
                    </div>
                </div>

                <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                    {gateType === 'cx' &&
                        (outputBits[1] !== input[1]
                            ? 'Control was |1⟩ — target flipped'
                            : 'Control was |0⟩ — target unchanged')}
                    {gateType === 'cz' &&
                        (phase === -1
                            ? 'Both qubits were |1⟩ — relative phase flipped to −'
                            : 'Phase unchanged (+)')}
                    {gateType === 'swap' &&
                        (outputBits !== input
                            ? 'Bits swapped positions'
                            : 'Input was symmetric — swapping changed nothing visible')}
                </p>
            </div>
        </section>
    )
}