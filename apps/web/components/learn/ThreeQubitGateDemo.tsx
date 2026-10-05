'use client'

import { ArrowRight } from 'lucide-react'
import { useState } from 'react'

type GateType = 'ccx' | 'cswap'
type Bits = string // 3-char '0'/'1' string

const INPUTS: Bits[] = [
    '000', '001', '010', '011', '100', '101', '110', '111',
]

const GATE_INFO: Record<GateType, { label: string; name: string; blurb: string }> = {
    ccx: {
        label: 'CCX',
        name: 'q0 and q1 are the controls, q2 is the target',
        blurb: 'The target only flips when BOTH controls are |1⟩.',
    },
    cswap: {
        label: 'Fredkin',
        name: 'q0 is the control, q1 and q2 can swap',
        blurb: 'q1 and q2 only swap when the control (q0) is |1⟩.',
    },
}

function applyGate(gateType: GateType, input: Bits): Bits {
    if (gateType === 'ccx') {
        const [c1, c2, t] = input
        const flipped = t === '1' ? '0' : '1'
        const newT = c1 === '1' && c2 === '1' ? flipped : t
        return c1 + c2 + newT
    }

    // cswap
    const [c, a, b] = input
    if (c === '1') return c + b + a
    return c + a + b
}

export default function ThreeQubitGateDemo({
    gateType = 'ccx',
}: {
    gateType?: GateType
}) {
    const [input, setInput] = useState<Bits>('110')
    const info = GATE_INFO[gateType]
    const output = applyGate(gateType, input)
    const changed = output !== input

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

                <div className="mb-6 grid grid-cols-4 gap-1.5 sm:flex sm:flex-wrap">
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
                            Input (q0 q1 q2)
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
                            Output (q0 q1 q2)
                        </div>
                        <div className="mt-1 font-mono text-2xl font-bold text-zinc-950 dark:text-zinc-100">
                            |{output}⟩
                        </div>
                    </div>
                </div>

                <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                    {gateType === 'ccx' &&
                        (changed
                            ? 'Both controls were |1⟩ — target flipped'
                            : 'At least one control was |0⟩ — target unchanged')}
                    {gateType === 'cswap' &&
                        (input[0] === '1'
                            ? changed
                                ? 'Control was |1⟩ — q1 and q2 swapped'
                                : 'Control was |1⟩ — but q1 and q2 already matched'
                            : 'Control was |0⟩ — nothing swapped')}
                </p>
            </div>
        </section>
    )
}