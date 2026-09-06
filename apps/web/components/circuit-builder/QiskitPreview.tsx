'use client'

import { useState } from 'react'
import { useCircuitStore } from '@/lib/store/circuit-store'
import { circuitToQiskitCode } from '@/lib/utils/qiskit-exporter'

export default function QiskitPreview() {
  const store = useCircuitStore()
  const qiskitCode = circuitToQiskitCode(store)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(qiskitCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col rounded-lg border border-gray-800 bg-slate-900 text-slate-100 shadow-md">
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-2 bg-slate-950/50">
        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-400">
          Qiskit Python Code
        </span>
        <button
          onClick={handleCopy}
          className="rounded bg-slate-800 px-2 py-1 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700 active:bg-slate-600"
        >
          {copied ? 'Copied!' : 'Copy Code'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-sm leading-relaxed text-emerald-400">
        <code>{qiskitCode}</code>
      </pre>
    </div>
  )
}