'use client'

import { useState, useRef, useEffect } from 'react'
import { BookMarked, ChevronDown } from 'lucide-react'
import { useCircuitStore } from '@/lib/store/circuit-store'
import {
    CIRCUIT_TEMPLATES,
    TEMPLATE_CATEGORY_LABELS,
    type CircuitTemplate,
} from '@/lib/content/circuit-templates'

export default function TemplateLoader({
    onLoad,
}: {
    // Called after a template is loaded into the store, so the caller can
    // clear any stale simulation/AI results from the previous circuit.
    onLoad?: () => void
}) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    const loadCircuit = useCircuitStore((state) => state.loadCircuit)

    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', onClick)
        return () => document.removeEventListener('mousedown', onClick)
    }, [])

    const handleLoad = (template: CircuitTemplate) => {
        loadCircuit(
            template.numQubits,
            template.gates.map((g, i) => ({
                id: `${g.type}-${g.qubits.join('-')}-s${g.step}-${i}-${Date.now()}`,
                type: g.type,
                qubits: g.qubits,
                step: g.step,
            }))
        )
        onLoad?.()
        setOpen(false)
    }

    const categories = Array.from(
        new Set(CIRCUIT_TEMPLATES.map((t) => t.category))
    )

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen((v) => !v)}
                className="cursor-pointer flex h-9 items-center gap-2 border border-zinc-200 bg-white px-4 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-700 transition-colors hover:border-blue-300 hover:text-blue-600 dark:border-zinc-800 dark:bg-[#111111] dark:text-zinc-300 dark:hover:border-blue-700 dark:hover:text-blue-300"
            >
                <BookMarked className="h-3.5 w-3.5" />
                Load Template
                <ChevronDown className="h-3 w-3" />
            </button>

            {open && (
                <div className="rounded-md absolute right-0 top-10 z-30 max-h-96 w-80 overflow-y-auto border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-[#111111]">
                    {categories.map((category) => (
                        <div key={category}>
                            <div className="border-b border-zinc-100 bg-zinc-50 px-4 py-2 font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900">
                                {TEMPLATE_CATEGORY_LABELS[category]}
                            </div>

                            {CIRCUIT_TEMPLATES.filter((t) => t.category === category).map(
                                (template) => (
                                    <button
                                        key={template.id}
                                        onClick={() => handleLoad(template)}
                                        className="cursor-pointer block w-full border-b border-zinc-50 px-4 py-3 text-left transition-colors hover:bg-blue-50/50 dark:border-zinc-800 dark:hover:bg-blue-500/10"
                                    >
                                        <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                                            {template.title}
                                        </div>
                                        <div className="mt-1 text-[11px] leading-5 text-zinc-500 dark:text-zinc-400">
                                            {template.description}
                                        </div>
                                    </button>
                                )
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}