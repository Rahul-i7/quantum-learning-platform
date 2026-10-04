'use client'

import { useState } from 'react'
import { RotateCcw, Zap } from 'lucide-react'

// Fixed input state: |+⟩ = (|0⟩ + |1⟩)/√2 — 50/50, so the demo stays
// honest about randomness (reused as-is for both the measurement
// lesson and the Measure-gate lesson).
const P0 = 0.5
const P1 = 0.5

export default function ProbabilityCollapseDemo() {
    const [result, setResult] = useState<0 | 1 | null>(null)
    const [animating, setAnimating] = useState(false)
    const [runs, setRuns] = useState<(0 | 1)[]>([])

    const handleMeasure = () => {
        setAnimating(true)
        window.setTimeout(() => {
            const outcome: 0 | 1 = Math.random() < P0 ? 0 : 1
            setResult(outcome)
            setRuns((prev) => [...prev.slice(-19), outcome])
            setAnimating(false)
        }, 450)
    }

    const reset = () => {
        setResult(null)
        setRuns([])
    }

    const barWidth = (bit: 0 | 1) => {
        if (animating) return '50%'
        if (result === null) return `${(bit === 0 ? P0 : P1) * 100}%`
        return result === bit ? '100%' : '0%'
    }

    const count0 = runs.filter((r) => r === 0).length
    const count1 = runs.length - count0

    return (
        <section className="my-10 max-w-3xl border border-zinc-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-5 py-4 sm:px-6">
                <div>
                    <div className="mb-1 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-blue-600">
                        Interactive
                    </div>
                    <h3 className="text-sm font-semibold tracking-tight text-zinc-950">
                        Collapse a superposition
                    </h3>
                </div>

                <button
                    onClick={reset}
                    className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-zinc-400 transition-colors hover:text-zinc-900"
                >
                    <RotateCcw className="h-3 w-3" />
                    Reset
                </button>
            </div>

            <div className="px-5 py-6 sm:px-6">
                <p className="mb-5 max-w-xl text-xs leading-6 text-zinc-500">
                    Qubit starts in |+⟩ = (|0⟩ + |1⟩)/√2 — a true 50/50
                    superposition. Each measurement is an independent coin
                    flip; the bars below show the live probability, then
                    snap to whichever outcome actually happened.
                </p>

                <div className="flex flex-col gap-4">
                    {([0, 1] as const).map((bit) => (
                        <div key={bit}>
                            <div className="mb-1.5 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                                <span>|{bit}⟩</span>
                                <span className="text-zinc-900">
                                    {result === null && !animating
                                        ? '50%'
                                        : animating
                                          ? '…'
                                          : result === bit
                                            ? '100%'
                                            : '0%'}
                                </span>
                            </div>
                            <div className="h-6 w-full overflow-hidden border border-zinc-200 bg-zinc-50">
                                <div
                                    className={`h-full transition-all duration-300 ease-out ${
                                        result === bit
                                            ? 'bg-emerald-500'
                                            : 'bg-blue-400'
                                    }`}
                                    style={{ width: barWidth(bit) }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-4">
                    <button
                        onClick={handleMeasure}
                        disabled={animating}
                        className="flex items-center gap-2 border border-zinc-950 bg-zinc-950 px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
                    >
                        <Zap className="h-3 w-3" />
                        Measure
                    </button>

                    {result !== null && !animating && (
                        <span className="font-mono text-xs text-zinc-500">
                            Collapsed to <strong className="text-zinc-950">|{result}⟩</strong>
                        </span>
                    )}

                    {runs.length > 0 && (
                        <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                            {runs.length} run{runs.length === 1 ? '' : 's'} — {count0}×|0⟩, {count1}×|1⟩
                        </span>
                    )}
                </div>
            </div>
        </section>
    )
}