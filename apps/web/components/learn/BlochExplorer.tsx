'use client'

import { useMemo, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import BlochSphereVisualizer from '@/components/visualizations/BlochSphereVisualizer'

const PRESETS: { label: string; theta: number; phi: number }[] = [
    { label: '|0⟩', theta: 0, phi: 0 },
    { label: '|1⟩', theta: 180, phi: 0 },
    { label: '|+⟩', theta: 90, phi: 0 },
    { label: '|−⟩', theta: 90, phi: 180 },
    { label: '|i⟩', theta: 90, phi: 90 },
    { label: '|−i⟩', theta: 90, phi: 270 },
]

function fmt(n: number) {
    if (Math.abs(n) < 0.001) return '0'
    if (Math.abs(n - 1) < 0.001) return '1'
    if (Math.abs(n + 1) < 0.001) return '-1'
    return n.toFixed(2)
}

export default function BlochExplorer() {
    const [theta, setTheta] = useState(90)
    const [phi, setPhi] = useState(0)

    const amplitudes = useMemo(() => {
        const th = (theta * Math.PI) / 180
        const ph = (phi * Math.PI) / 180
        const a0: [number, number] = [Math.cos(th / 2), 0]
        const a1: [number, number] = [
            Math.sin(th / 2) * Math.cos(ph),
            Math.sin(th / 2) * Math.sin(ph),
        ]
        return [a0, a1] as const
    }, [theta, phi])

    const data = {
        num_qubits: 1,
        statevector: amplitudes,
    }

    const matchedPreset = PRESETS.find(
        (p) => p.theta === theta && p.phi === phi
    )

    return (
        <section className="my-10 max-w-5xl border border-zinc-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-5 py-4 sm:px-6">
                <div>
                    <div className="mb-1 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-blue-600">
                        Interactive
                    </div>
                    <h3 className="text-sm font-semibold tracking-tight text-zinc-950">
                        Drag the angles, watch the state move
                    </h3>
                </div>

                <button
                    onClick={() => {
                        setTheta(90)
                        setPhi(0)
                    }}
                    className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-zinc-400 transition-colors hover:text-zinc-900"
                >
                    <RotateCcw className="h-3 w-3" />
                    Reset
                </button>
            </div>

            <div className="border-b border-zinc-200 px-5 py-4 sm:px-6">
                <div className="flex flex-wrap gap-1.5">
                    {PRESETS.map((p) => (
                        <button
                            key={p.label}
                            onClick={() => {
                                setTheta(p.theta)
                                setPhi(p.phi)
                            }}
                            className={`min-w-10 border px-3 py-2 font-mono text-xs font-semibold transition-all ${
                                matchedPreset?.label === p.label
                                    ? 'border-zinc-950 bg-zinc-950 text-white'
                                    : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-400 hover:text-zinc-950'
                            }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid md:grid-cols-[1fr_1fr]">
                <div className="h-72 border-b border-zinc-200 md:border-b-0 md:border-r">
                    <BlochSphereVisualizer
                        data={data}
                        qubitIndex={0}
                        numQubits={1}
                        variant="hero"
                        animated
                    />
                </div>

                <div className="flex flex-col justify-center gap-6 px-5 py-6 sm:px-6">
                    <div>
                        <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                            <span>θ (polar) — pole to pole</span>
                            <span className="text-zinc-900">{theta}°</span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={180}
                            value={theta}
                            onChange={(e) => setTheta(Number(e.target.value))}
                            className="w-full accent-blue-600"
                        />
                    </div>

                    <div>
                        <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                            <span>φ (azimuth) — around the equator</span>
                            <span className="text-zinc-900">{phi}°</span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={359}
                            value={phi}
                            onChange={(e) => setPhi(Number(e.target.value))}
                            disabled={theta === 0 || theta === 180}
                            className="w-full accent-blue-600 disabled:opacity-30"
                        />
                    </div>

                    <div className="border border-zinc-800 bg-[#0b0d10] px-4 py-3 font-mono text-xs text-emerald-400">
                        |ψ⟩ = [{fmt(amplitudes[0][0])}] |0⟩ + [{fmt(
                            amplitudes[1][0]
                        )}{amplitudes[1][1] >= 0 ? '+' : '-'}
                        {fmt(Math.abs(amplitudes[1][1]))}i] |1⟩
                    </div>
                </div>
            </div>
        </section>
    )
}