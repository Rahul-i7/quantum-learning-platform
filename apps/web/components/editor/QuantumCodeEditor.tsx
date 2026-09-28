'use client'

import { useEffect, useState } from 'react'
import Editor from '@monaco-editor/react'
import { AlertCircle, Check, Play } from 'lucide-react'

import { useCircuitStore } from '@/lib/store/circuit-store'
import { parseQiskitCode } from '@/lib/editor/qiskit-parser'
import { circuitToQiskitCode } from '@/lib/utils/qiskit-exporter'

const DEFAULT_CODE = `from qiskit import QuantumCircuit

qc = QuantumCircuit(3)

qc.h(0)
qc.cx(0, 1)

qc.measure_all()
`

interface QuantumCodeEditorProps {
  onApply?: () => void
}

export default function QuantumCodeEditor({
  onApply,
}: QuantumCodeEditorProps) {
  const numQubits = useCircuitStore((state) => state.numQubits)
  const gates = useCircuitStore((state) => state.gates)

  const setNumQubits = useCircuitStore((state) => state.setNumQubits)
  const reset = useCircuitStore((state) => state.reset)
  const addGate = useCircuitStore((state) => state.addGate)

  const [code, setCode] = useState(() => {
    if (gates.length > 0) {
      return circuitToQiskitCode({
        numQubits,
        gates,
      })
    }

    return DEFAULT_CODE
  })

  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  /*
   * Keep the editor synchronized with changes made elsewhere
   * to the shared circuit store.
   */
  useEffect(() => {
    if (gates.length === 0) {
      return
    }

    const generatedCode = circuitToQiskitCode({
      numQubits,
      gates,
    })

    setCode(generatedCode)
    setStatus('idle')
    setError('')
  }, [numQubits, gates])

  const handleApply = () => {
    const result = parseQiskitCode(code)

    if (!result.success || !result.circuit) {
      setStatus('error')
      setError(result.error ?? 'Unable to parse circuit.')
      return
    }

    reset()
    setNumQubits(result.circuit.numQubits)

    for (const gate of result.circuit.gates) {
      addGate(gate)
    }

    setError('')
    setStatus('success')

    onApply?.()
  }

  return (
    <div className="flex h-[560px] flex-col bg-[#0b0d10]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 bg-blue-500" />

          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-500">
            Qiskit / Python
          </span>
        </div>

        <button
          onClick={handleApply}
          className="flex items-center gap-1.5 border border-white/10 px-3 py-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-300 transition-colors hover:border-blue-500 hover:bg-blue-600 hover:text-white"
        >
          <Play className="h-3 w-3" />
          Apply to Circuit
        </button>
      </div>

      <div className="min-h-0 flex-1">
        <Editor
          height="100%"
          language="python"
          value={code}
          onChange={(value) => {
            setCode(value ?? '')
            setStatus('idle')
            setError('')
          }}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineHeight: 22,
            fontFamily: 'monospace',
            padding: {
              top: 20,
              bottom: 20,
            },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            renderLineHighlight: 'line',
            automaticLayout: true,
            tabSize: 4,
          }}
        />
      </div>

      <div className="flex min-h-9 items-center border-t border-white/10 px-4">
        {status === 'success' && (
          <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-emerald-400">
            <Check className="h-3 w-3" />
            Circuit updated
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-red-400">
            <AlertCircle className="h-3 w-3" />
            {error}
          </div>
        )}

        {status === 'idle' && (
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-600">
            Unsaved changes
          </span>
        )}
      </div>
    </div>
  )
}