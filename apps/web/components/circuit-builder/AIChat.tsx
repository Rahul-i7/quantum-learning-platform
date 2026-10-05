'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUp, Check, Sparkle } from 'lucide-react'
import AIExplanation from './AIExplanation'

export interface ProposedGate {
    type: string
    qubits: number[]
    params?: number[] | null
}

export interface ProposedCircuit {
    num_qubits: number
    gates: ProposedGate[]
}

export interface ChatMsg {
    id: string
    role: 'user' | 'model'
    content: string
    proposedCircuit?: ProposedCircuit | null
    applied?: boolean
    suggestions?: string[]
}

interface AIChatProps {
    messages: ChatMsg[]
    loading: boolean
    onSend: (text: string) => void
    onApply: (messageId: string, circuit: ProposedCircuit) => void
}

export default function AIChat({ messages, loading, onSend, onApply }: AIChatProps) {
    const [draft, setDraft] = useState('')
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }, [messages, loading])

    const submit = () => {
        const text = draft.trim()
        if (!text || loading) return
        setDraft('')
        onSend(text)
    }

    const lastModel = [...messages].reverse().find((m) => m.role === 'model')

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
                {messages.length === 0 && !loading && (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                        <div className="mb-5 flex h-10 w-10 items-center justify-center border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                            <Sparkle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <p className="max-w-55 text-sm font-medium leading-5 text-zinc-800 dark:text-zinc-200">
                            Ask QMentor anything, or have it build a circuit for you.
                        </p>
                        <div className="mt-4 flex flex-col gap-2">
                            {[
                                'Make a circuit that points the arrow along +X',
                                'Build a Bell state',
                            ].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => onSend(s)}
                                    className="cursor-pointer border border-zinc-200 bg-white px-3 py-2 text-left text-xs text-zinc-600 transition-colors hover:border-blue-300 hover:text-blue-600 dark:border-zinc-800 dark:bg-[#111111] dark:text-zinc-400 dark:hover:border-blue-700 dark:hover:text-blue-300"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((m) => (
                    <div key={m.id}>
                        {m.role === 'user' ? (
                            <div className="ml-6 border-l-2 border-zinc-900 bg-zinc-50 px-3 py-2 text-[13px] leading-6 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
                                {m.content}
                            </div>
                        ) : (
                            <div>
                                <AIExplanation content={m.content} />
                                {m.proposedCircuit && (
                                    <div className="mt-1 border border-blue-200 bg-blue-50/40 px-3 py-3 dark:border-blue-800 dark:bg-blue-500/10">
                                        <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">
                                            Circuit ready
                                        </div>
                                        <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                            {m.proposedCircuit.gates.length} gates on {m.proposedCircuit.num_qubits}{' '}
                                            qubit{m.proposedCircuit.num_qubits > 1 ? 's' : ''}
                                        </div>
                                        <button
                                            onClick={() => onApply(m.id, m.proposedCircuit!)}
                                            disabled={m.applied}
                                            className="cursor-pointer mt-3 flex h-8 items-center gap-2 bg-zinc-950 px-3 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-blue-600 disabled:cursor-default disabled:bg-emerald-600 dark:bg-zinc-100 dark:text-zinc-950"
                                        >
                                            {m.applied ? (
                                                <>
                                                    <Check className="h-3 w-3" /> Applied &amp; simulated
                                                </>
                                            ) : (
                                                'Apply to canvas'
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}

                {loading && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="h-px w-5 bg-blue-500" />
                            <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">
                                Thinking
                            </span>
                        </div>
                        <div className="h-2 w-3/4 animate-pulse bg-zinc-100 dark:bg-zinc-800" />
                        <div className="h-2 w-full animate-pulse bg-zinc-100 dark:bg-zinc-800" />
                        <div className="h-2 w-2/3 animate-pulse bg-zinc-100 dark:bg-zinc-800" />
                    </div>
                )}

                {!loading && lastModel?.suggestions && lastModel.suggestions.length > 0 && (
                    <div className="flex flex-col gap-2 pt-1">
                        {lastModel.suggestions.slice(0, 3).map((s) => (
                            <button
                                key={s}
                                onClick={() => onSend(s)}
                                className="cursor-pointer border border-zinc-200 bg-white px-3 py-2 text-left text-xs text-zinc-600 transition-colors hover:border-blue-300 hover:text-blue-600 dark:border-zinc-800 dark:bg-[#111111] dark:text-zinc-400 dark:hover:border-blue-700 dark:hover:text-blue-300"
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    submit()
                }}
                className="flex items-center gap-2 border-t border-zinc-200 px-3 py-3 dark:border-zinc-800"
            >
                <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Ask a follow-up or request a circuit…"
                    className="h-9 min-w-0 flex-1 border border-zinc-200 bg-white px-3 text-xs text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-blue-400 dark:border-zinc-800 dark:bg-[#111111] dark:text-zinc-100"
                />
                <button
                    type="submit"
                    disabled={loading || !draft.trim()}
                    aria-label="Send"
                    className="cursor-pointer flex h-9 w-9 items-center justify-center bg-zinc-950 text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-950"
                >
                    <ArrowUp className="h-4 w-4" />
                </button>
            </form>
        </div>
    )
}
