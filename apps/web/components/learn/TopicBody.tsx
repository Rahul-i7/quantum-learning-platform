'use client'

import { Lightbulb } from 'lucide-react'
import type { TopicBlock } from '@/lib/content/quantum-theory'
import QuantumTransformation from './QuantumTransformation'
import MathBlock from './Math'
import BlochExplorer from './BlochExplorer'
import ProbabilityCollapseDemo from './ProbabilityCollapseDemo'
import TwoQubitCorrelationDemo from './TwoQubitCorrelationDemo'
import TwoQubitGateDemo from './TwoQubitGateDemo'
import CircuitDiagramView from './CircuitDiagramView'
import ShorsPeriodicityChart from './ShorsPeriodicityChart'

export default function TopicBody({
    blocks,
}: {
    blocks: TopicBlock[]
}) {
    return (
        <div className="flex flex-col gap-8 py-8">
            {blocks.map((block, i) => {
                if (block.type === 'p') {
                    return (
                        <p
                            key={i}
                            className="max-w-3xl text-[15px] leading-8 text-zinc-600"
                        >
                            {block.text}
                        </p>
                    )
                }

                if (block.type === 'matrix') {
                    return (
                        <div
                            key={i}
                            className="max-w-3xl overflow-hidden border border-zinc-800 bg-[#0b0d10]"
                        >
                            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
                                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400">
                                    {block.label}
                                </span>

                                <span className="font-mono text-[9px] uppercase tracking-wider text-blue-400">
                                    Matrix
                                </span>
                            </div>

                            <pre className="overflow-x-auto px-4 py-5 font-mono text-sm leading-7 text-emerald-400">
                                {block.rows.join('\n')}
                            </pre>
                        </div>
                    )
                }

                if (block.type === 'math') {
                    return (
                        <div key={i} className="max-w-3xl">
                            <MathBlock tex={block.tex} display />
                            {block.caption && (
                                <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                                    {block.caption}
                                </p>
                            )}
                        </div>
                    )
                }

                if (block.type === 'interactive') {
                    if (block.component === 'qubit-transformation') {
                        return (
                            <QuantumTransformation
                                key={i}
                                defaultGate={block.defaultGate}
                            />
                        )
                    }
                    if (block.component === 'bloch-explorer') {
                        return <BlochExplorer key={i} />
                    }
                    if (block.component === 'measurement-demo') {
                        return <ProbabilityCollapseDemo key={i} />
                    }
                    if (block.component === 'entanglement-demo') {
                        return <TwoQubitCorrelationDemo key={i} />
                    }
                    if (block.component === 'two-qubit-gate-demo') {
                        return <TwoQubitGateDemo key={i} />
                    }
                    if (block.component === 'shors-periodicity') {
                        return <ShorsPeriodicityChart key={i} />
                    }
                    if (block.component === 'circuit-diagram') {
                        return (
                            <CircuitDiagramView
                                key={i}
                                templateIds={block.templateIds}
                            />
                        )
                    }
                }

                if (block.type === 'note') {
                    return (
                        <div
                            key={i}
                            className="flex max-w-3xl items-start gap-4 border-l-2 border-blue-500 bg-blue-50/40 px-5 py-4 text-sm leading-7 text-blue-950"
                        >
                            <Lightbulb className="mt-1 h-4 w-4 shrink-0 text-blue-600" />

                            <div>
                                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-blue-600">
                                    Try it
                                </span>

                                <p className="mt-1">
                                    {block.text}
                                </p>
                            </div>
                        </div>
                    )
                }

                return null
            })}
        </div>
    )
}