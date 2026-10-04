'use client'

import { useState } from 'react'
import { RotateCcw, Zap } from 'lucide-react'

type Outcome = '00' | '11'

export default function TwoQubitCorrelationDemo() {
    const [result, setResult] = useState<Outcome | null>(null)
    const [animating, setAnimating] = useState(false)
    const [history, setHistory] = useState<Outcome[]>([])

    const handleMeasure = () => {
        setAnimating(true)
        window.setTimeout(() => {
            const outcome: Outcome = Math.random() < 0.5 ? '00' : '11'
            setResult(outcome)
            setHistory((prev) => [...prev.slice(-23), outcome])
            setAnimating(false)
        }, 500)
    }

    const reset = () => {
        setResult(null)
        setHistory([])
    }

    const bitFor = (qubit: 0 | 1) => {
        if (animating) return '?'
        if (result === null) return '?'
        return result[qubit]
    }

    return (
        <section className="my-10 max-w-3xl border border-zinc-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-5 py-4 sm:px-6">
                <div>
                    <div className="mb-1 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-blue-600">
                        Interactive
                    </div>
                    <h3 className="text-sm font-semibold tracking-tight text-zinc-950">
                        Measure an entangled pair
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
                <p className="mb-6 max-w-xl text-xs leading-6 text-zinc-500">
                    q0 and q1 are in the Bell state (|00⟩ + |11⟩)/√2. Each
                    measurement is random — but q0 and q1 always agree.
                </p>

                <div className="flex items-center justify-center gap-6">
                    {([0, 1] as const).map((qubit) => (
                        <div
                            key={qubit}
                            className={`flex h-20 w-20 flex-col items-center justify-center border-2 font-mono transition-all duration-300 ${
                                animating
                                    ? 'animate-pulse border-blue-400 bg-blue-50'
                                    : result !== null
                                      ? 'border-emerald-500 bg-emerald-50'
                                      : 'border-zinc-200 bg-zinc-50'
                            }`}
                        >
                            <span className="text-[9px] uppercase tracking-wider text-zinc-400">
                                q{qubit}
                            </span>
                            <span className="text-2xl font-bold text-zinc-950">
                                {bitFor(qubit)}
                            </span>
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
                        Measure Both
                    </button>

                    {history.length > 0 && (
                        <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                            {history.length} run{history.length === 1 ? '' : 's'} — 100% matched
                        </span>
                    )}
                </div>

                {history.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1">
                        {history.map((h, i) => (
                            <span
                                key={i}
                                title={h}
                                className={`inline-block h-2.5 w-2.5 rounded-full ${
                                    h === '00' ? 'bg-blue-400' : 'bg-emerald-500'
                                }`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    )
}