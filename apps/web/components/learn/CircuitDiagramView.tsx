'use client'

import { useEffect, useState } from 'react'
import { CIRCUIT_TEMPLATES } from '@/lib/content/circuit-templates'

const CELL = 56

function Diagram({ templateId }: { templateId: string }) {
    const template = CIRCUIT_TEMPLATES.find((t) => t.id === templateId)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        const id = requestAnimationFrame(() => setMounted(true))
        return () => cancelAnimationFrame(id)
    }, [])

    if (!template) return null

    const numSteps = Math.max(...template.gates.map((g) => g.step)) + 1
    const width = numSteps * CELL + CELL
    const height = template.numQubits * CELL + 20

    return (
        <div className="border border-zinc-200 bg-white">
            <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-2.5">
                <span className="text-xs font-semibold text-zinc-900">
                    {template.title}
                </span>
                <span className="hidden font-mono text-[9px] uppercase tracking-wider text-zinc-400 sm:inline">
                    {template.description}
                </span>
            </div>

            <div className="overflow-x-auto px-4 py-5">
                <svg
                    width={width}
                    height={height}
                    viewBox={`0 0 ${width} ${height}`}
                    className="block"
                >
                    {/* Qubit wires + labels */}
                    {Array.from({ length: template.numQubits }).map((_, q) => (
                        <g key={`wire-${q}`}>
                            <text
                                x={0}
                                y={q * CELL + 15}
                                className="fill-zinc-400 font-mono text-[10px] uppercase"
                            >
                                q{q}
                            </text>
                            <line
                                x1={CELL - 10}
                                y1={q * CELL + 10}
                                x2={width - 10}
                                y2={q * CELL + 10}
                                stroke="#e4e4e7"
                                strokeWidth={1.5}
                            />
                        </g>
                    ))}

                    {/* Gates */}
                    {template.gates.map((gate, i) => {
                        const cx = CELL + gate.step * CELL
                        const style = {
                            transitionDelay: `${gate.step * 90}ms`,
                        }
                        const baseClass = `transition-all duration-300 ease-out ${
                            mounted
                                ? 'opacity-100 translate-y-0'
                                : 'opacity-0 translate-y-1'
                        }`

                        if (gate.qubits.length === 2) {
                            const [qa, qb] = gate.qubits
                            const y1 = qa * CELL + 10
                            const y2 = qb * CELL + 10
                            const isCx = gate.type === 'cx'

                            return (
                                <g key={i} className={baseClass} style={style}>
                                    <line
                                        x1={cx}
                                        y1={y1}
                                        x2={cx}
                                        y2={y2}
                                        stroke="#18181b"
                                        strokeWidth={1.5}
                                    />
                                    <circle cx={cx} cy={y1} r={5} fill="#18181b" />
                                    {isCx ? (
                                        <>
                                            <circle
                                                cx={cx}
                                                cy={y2}
                                                r={9}
                                                fill="white"
                                                stroke="#18181b"
                                                strokeWidth={1.5}
                                            />
                                            <line x1={cx - 6} y1={y2} x2={cx + 6} y2={y2} stroke="#18181b" strokeWidth={1.5} />
                                            <line x1={cx} y1={y2 - 6} x2={cx} y2={y2 + 6} stroke="#18181b" strokeWidth={1.5} />
                                        </>
                                    ) : (
                                        <>
                                            <circle cx={cx} cy={y2} r={5} fill="#18181b" />
                                            <rect
                                                x={cx - 12}
                                                y={(y1 + y2) / 2 - 8}
                                                width={24}
                                                height={16}
                                                fill="white"
                                                stroke="#18181b"
                                                strokeWidth={1}
                                            />
                                            <text
                                                x={cx}
                                                y={(y1 + y2) / 2 + 4}
                                                textAnchor="middle"
                                                className="fill-zinc-950 font-mono text-[9px] font-bold"
                                            >
                                                {gate.type.toUpperCase()}
                                            </text>
                                        </>
                                    )}
                                </g>
                            )
                        }

                        const q = gate.qubits[0]
                        const y = q * CELL + 10
                        const isMeasure = gate.type === 'measure'

                        return (
                            <g key={i} className={baseClass} style={style}>
                                <rect
                                    x={cx - 14}
                                    y={y - 14}
                                    width={28}
                                    height={28}
                                    fill={isMeasure ? '#fffbeb' : '#eff6ff'}
                                    stroke={isMeasure ? '#f59e0b' : '#2563eb'}
                                    strokeWidth={1.5}
                                />
                                <text
                                    x={cx}
                                    y={y + 4}
                                    textAnchor="middle"
                                    className={`font-mono text-[10px] font-bold ${
                                        isMeasure ? 'fill-amber-700' : 'fill-blue-700'
                                    }`}
                                >
                                    {isMeasure ? 'M' : gate.type.toUpperCase()}
                                </text>
                            </g>
                        )
                    })}
                </svg>
            </div>
        </div>
    )
}

export default function CircuitDiagramView({
    templateIds,
}: {
    templateIds: string[]
}) {
    return (
        <section className="my-10 max-w-5xl">
            <div className="mb-2 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-blue-600">
                Circuit Diagram
            </div>
            <div
                className={`grid gap-4 ${
                    templateIds.length > 1 ? 'md:grid-cols-2' : ''
                }`}
            >
                {templateIds.map((id) => (
                    <Diagram key={id} templateId={id} />
                ))}
            </div>
        </section>
    )
}