'use client'

import { ArrowRight } from 'lucide-react'
import { useState } from 'react'

const INPUTS: ('00' | '01' | '10' | '11')[] = ['00', '01', '10', '11']

function applyCX(input: string) {
    const control = input[0]
    const target = input[1]
    const newTarget = control === '1' ? (target === '1' ? '0' : '1') : target
    return control + newTarget
}

export default function TwoQubitGateDemo() {
    const [input, setInput] = useState<'00' | '01' | '10' | '11'>('10')
    const output = applyCX(input)
    const flipped = output[1] !== input[1]

    return (
        <section className="my-10 max-w-3xl border border-zinc-200 bg-white">
            <div className="border-b border-zinc-200 px-5 py-4 sm:px-6">
                <div className="mb-1 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-blue-600">
                    Interactive
                </div>
                <h3 className="text-sm font-semibold tracking-tight text-zinc-950">
                    Try every CX input
                </h3>
            </div>

            <div className="px-5 py-6 sm:px-6">
                <p className="mb-5 max-w-xl text-xs leading-6 text-zinc-500">
                    q0 is the control, q1 is the target. Pick a basis-state
                    input and watch when the target actually flips.
                </p>

                <div className="mb-6 flex flex-wrap gap-1.5">
                    {INPUTS.map((i) => (
                        <button
                            key={i}
                            onClick={() => setInput(i)}
                            className={`border px-3 py-2 font-mono text-xs font-semibold transition-all ${
                                input === i
                                    ? 'border-zinc-950 bg-zinc-950 text-white'
                                    : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-400 hover:text-zinc-950'
                            }`}
                        >
                            |{i}⟩
                        </button>
                    ))}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-6">
                    <div className="border border-zinc-200 bg-zinc-50 px-6 py-4 text-center">
                        <div className="font-mono text-[9px] uppercase tracking-wider text-zinc-400">
                            Input (q0 q1)
                        </div>
                        <div className="mt-1 font-mono text-2xl font-bold text-zinc-950">
                            |{input}⟩
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-1 text-center">
                        <ArrowRight className="h-5 w-5 text-zinc-300" />
                        <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-400">
                            CX
                        </span>
                    </div>

                    <div
                        className={`border-2 px-6 py-4 text-center transition-colors ${
                            flipped
                                ? 'border-emerald-500 bg-emerald-50'
                                : 'border-zinc-200 bg-zinc-50'
                        }`}
                    >
                        <div className="font-mono text-[9px] uppercase tracking-wider text-zinc-400">
                            Output (q0 q1)
                        </div>
                        <div className="mt-1 font-mono text-2xl font-bold text-zinc-950">
                            |{output}⟩
                        </div>
                    </div>
                </div>

                <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                    {flipped
                        ? 'Control was |1⟩ — target flipped'
                        : 'Control was |0⟩ — target unchanged'}
                </p>
            </div>
        </section>
    )
}