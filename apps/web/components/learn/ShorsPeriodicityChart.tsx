'use client'

import { useMemo, useState } from 'react'

const PRESETS = [
    { label: 'a = 2, N = 15', a: 2, n: 15 },
    { label: 'a = 7, N = 15', a: 7, n: 15 },
    { label: 'a = 4, N = 15', a: 4, n: 15 },
]

const X_MAX = 11

function findPeriod(values: number[]) {
    for (let r = 1; r < values.length; r++) {
        if (values[r] === values[0]) return r
    }
    return values.length
}

export default function ShorsPeriodicityChart() {
    const [preset, setPreset] = useState(PRESETS[0])
    const [mounted, setMounted] = useState(true)

    const handlePresetChange = (nextPreset: (typeof PRESETS)[number]) => {
        setMounted(false)
        setPreset(nextPreset)
        const id = requestAnimationFrame(() => setMounted(true))
        return () => cancelAnimationFrame(id)
    }

    const values = useMemo(() => {
        const out: number[] = []
        let v = 1
        for (let x = 0; x <= X_MAX; x++) {
            out.push(v)
            v = (v * preset.a) % preset.n
        }
        return out
    }, [preset])

    const period = findPeriod(values)
    const max = Math.max(...values)

    return (
        <section className="my-10 max-w-3xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#111111]">
            <div className="border-b border-zinc-200 px-5 py-4 sm:px-6 dark:border-zinc-800">
                <div className="mb-1 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
                    Interactive
                </div>
                <h3 className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-100">
                    The periodicity Shors looks for
                </h3>
            </div>

            <div className="px-5 py-6 sm:px-6">
                <p className="mb-5 max-w-xl text-xs leading-6 text-zinc-500 dark:text-zinc-400">
                    This is the classical sequence a<sup>x</sup> mod N — the
                    exact pattern the quantum part finds exponentially faster
                    via the Quantum Fourier Transform. Watch the period
                    change with a and N.
                </p>

                <div className="mb-6 flex flex-wrap gap-1.5">
                    {PRESETS.map((p) => (
                        <button
                            key={p.label}
                            onClick={() => setPreset(p)}
                            className={`border px-3 py-2 font-mono text-[11px] font-semibold transition-all ${
                                preset.label === p.label
                                    ? 'border-zinc-950 bg-zinc-950 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950'
                                    : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-400 hover:text-zinc-950 dark:border-zinc-800 dark:bg-[#111111] dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-100'
                            }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>

                <div className="flex h-40 items-end gap-2">
                    {values.map((v, x) => (
                        <div
                            key={x}
                            className="flex flex-1 flex-col items-center gap-1.5"
                        >
                            <div className="flex h-32 w-full items-end">
                                <div
                                    className={`w-full transition-all duration-500 ease-out ${
                                        x % period === 0
                                            ? 'bg-blue-600'
                                            : 'bg-blue-300'
                                    }`}
                                    style={{
                                        height: mounted
                                            ? `${(v / max) * 100}%`
                                            : '0%',
                                        transitionDelay: `${x * 45}ms`,
                                    }}
                                    title={`a^${x} mod N = ${v}`}
                                />
                            </div>
                            <span className="font-mono text-[9px] text-zinc-400">
                                {v}
                            </span>
                        </div>
                    ))}
                </div>

                <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                    Period r = {period} — the dark bars mark where the pattern repeats
                </p>
            </div>
        </section>
    )
}