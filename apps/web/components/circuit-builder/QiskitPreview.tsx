'use client'

import { useState } from 'react'
import { Check, Copy, Terminal } from 'lucide-react'

import { useCircuitStore } from '@/lib/store/circuit-store'
import { circuitToQiskitCode } from '@/lib/utils/qiskit-exporter'

export default function QiskitPreview() {
  const store = useCircuitStore()
  const qiskitCode = circuitToQiskitCode(store)

  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(qiskitCode)

    setCopied(true)

    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  return (
    <div className="overflow-hidden bg-[#0b0d10] text-zinc-100">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
        <div className="flex items-center gap-3">
          <Terminal className="h-3.5 w-3.5 text-blue-400" />

          <div>
            <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
              Qiskit / Python
            </div>

            <div className="mt-0.5 text-xs font-medium text-zinc-200">
              Generated circuit
            </div>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="
            flex items-center gap-1.5
            border border-white/10
            bg-white/5
            px-3 py-1.5
            font-mono text-[9px]
            font-semibold uppercase
            tracking-[0.12em]
            text-zinc-400
            transition-colors
            hover:border-blue-400/40
            hover:bg-blue-400/10
            hover:text-blue-300
          "
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy
            </>
          )}
        </button>
      </div>

      {/* Code */}
      <div className="relative">
        <div className="absolute left-0 top-0 h-full w-10 border-r border-white/5 bg-white/[0.02]" />

        <pre className="overflow-x-auto py-5 pl-14 pr-5 font-mono text-[12px] leading-6 text-zinc-300">
          <code>{qiskitCode}</code>
        </pre>
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 px-5 py-2.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-zinc-600">
            Python / Qiskit
          </span>

          <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-zinc-600">
            Live preview
          </span>
        </div>
      </div>
    </div>
  )
}