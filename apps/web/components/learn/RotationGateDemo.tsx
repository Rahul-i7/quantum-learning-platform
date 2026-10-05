'use client'

import { useMemo, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import BlochSphereVisualizer from '@/components/visualizations/BlochSphereVisualizer'

type Complex = [number, number]
type Axis = 'x' | 'y' | 'z'

// RX and RY start from |0⟩ — the north pole sits off both the X and Y
// axes, so rotating around either one visibly sweeps the point across
// the sphere. RZ rotates around Z, and |0⟩ sits ON the Z axis (rotating
// it would show nothing), so RZ starts from |+⟩ instead, which sits on
// the equator and visibly sweeps around it.
const ZERO_STATE: Complex[] = [[1, 0], [0, 0]]
const PLUS_STATE: Complex[] = [
    [1 / Math.sqrt(2), 0],
    [1 / Math.sqrt(2), 0],
]

const AXIS_INFO: Record<
    Axis,
    { label: string; input: Complex[]; inputLabel: string; tex: string }
> = {
    x: {
        label: 'RX',
        input: ZERO_STATE,
        inputLabel: '|0⟩',
        tex: 'R_x(\\theta)=\\begin{pmatrix}\\cos\\frac{\\theta}{2} & -i\\sin\\frac{\\theta}{2}\\\\ -i\\sin\\frac{\\theta}{2} & \\cos\\frac{\\theta}{2}\\end{pmatrix}',
    },
    y: {
        label: 'RY',
        input: ZERO_STATE,
        inputLabel: '|0⟩',
        tex: 'R_y(\\theta)=\\begin{pmatrix}\\cos\\frac{\\theta}{2} & -\\sin\\frac{\\theta}{2}\\\\ \\sin\\frac{\\theta}{2} & \\cos\\frac{\\theta}{2}\\end{pmatrix}',
    },
    z: {
        label: 'RZ',
        input: PLUS_STATE,
        inputLabel: '|+⟩',
        tex: 'R_z(\\theta)=\\begin{pmatrix}e^{-i\\theta/2} & 0\\\\ 0 & e^{i\\theta/2}\\end{pmatrix}',
    },
}

function applyRotation(axis: Axis, thetaDeg: number, state: Complex[]): Complex[] {
    const half = (thetaDeg * Math.PI) / 180 / 2
    const c = Math.cos(half)
    const s = Math.sin(half)
    const [aRe, aIm] = state[0]
    const [bRe, bIm] = state[1]

    if (axis === 'x') {
        return [
            [c * aRe + s * bIm, c * aIm - s * bRe],
            [s * aIm + c * bRe, -s * aRe + c * bIm],
        ]
    }

    if (axis === 'y') {
        return [
            [c * aRe - s * bRe, c * aIm - s * bIm],
            [s * aRe + c * bRe, s * aIm + c * bIm],
        ]
    }

    // z
    return [
        [c * aRe + s * aIm, c * aIm - s * aRe],
        [c * bRe - s * bIm, c * bIm + s * bRe],
    ]
}

function fmt(n: number) {
    if (Math.abs(n) < 0.001) return '0'
    if (Math.abs(n - 1) < 0.001) return '1'
    if (Math.abs(n + 1) < 0.001) return '-1'
    return n.toFixed(2)
}

export default function RotationGateDemo({ axis }: { axis: Axis }) {
    const [theta, setTheta] = useState(90)
    const info = AXIS_INFO[axis]

    const outputState = useMemo(
        () => applyRotation(axis, theta, info.input),
        [axis, theta, info.input]
    )

    const inputData = { num_qubits: 1, statevector: info.input }
    const outputData = { num_qubits: 1, statevector: outputState }

    return (
        <section className="my-10 max-w-5xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#111111]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-5 py-4 sm:px-6 dark:border-zinc-800">
                <div>
                    <div className="mb-1 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
                        Interactive
                    </div>
                    <h3 className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-100">
                        Sweep the {info.label}(θ) angle
                    </h3>
                </div>

                <button
                    onClick={() => setTheta(90)}
                    className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-zinc-400 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                    <RotateCcw className="h-3 w-3" />
                    Reset
                </button>
            </div>

            <div className="border-b border-zinc-200 px-5 py-4 sm:px-6 dark:border-zinc-800">
                <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                    <span>θ — starting from {info.inputLabel}</span>
                    <span className="text-zinc-900 dark:text-zinc-100">{theta}°</span>
                </div>
                <input
                    type="range"
                    min={0}
                    max={360}
                    value={theta}
                    onChange={(e) => setTheta(Number(e.target.value))}
                    className="w-full accent-blue-600"
                />
            </div>

            <div className="grid md:grid-cols-2">
                <div className="h-64 border-b border-zinc-200 md:border-b-0 md:border-r dark:border-zinc-800">
                    <BlochSphereVisualizer
                        data={inputData}
                        qubitIndex={0}
                        numQubits={1}
                        variant="hero"
                    />
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
            </div>

            <div className="border-t border-zinc-200 bg-[#0b0d10] px-5 py-4 sm:px-6">
                <div className="mb-3 flex items-center justify-between">
                    <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
                        Statevector after {info.label}({theta}°)
                    </span>
                </div>
                <div className="overflow-x-auto font-mono text-sm text-emerald-400">
                    [ [{fmt(outputState[0][0])}{outputState[0][1] >= 0 ? '+' : '-'}{fmt(Math.abs(outputState[0][1]))}i],{' '}
                    [{fmt(outputState[1][0])}{outputState[1][1] >= 0 ? '+' : '-'}{fmt(Math.abs(outputState[1][1]))}i] ]
                </div>
            </div>
        </section>
    )
}