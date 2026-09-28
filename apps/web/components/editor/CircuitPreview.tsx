'use client'

import { useCircuitStore } from '@/lib/store/circuit-store'

const NUM_STEPS = 8

export default function CircuitPreview() {
  const numQubits = useCircuitStore((state) => state.numQubits)
  const gates = useCircuitStore((state) => state.gates)

  const qubits = Array.from(
    { length: numQubits },
    (_, index) => index
  )

  const steps = Array.from(
    { length: NUM_STEPS },
    (_, index) => index
  )

  const cxGates = gates.filter(
    (gate) =>
      gate.type === 'cx' &&
      gate.qubits.length === 2
  )

  return (
    <div className="overflow-x-auto bg-white">
      <div className="min-w-max">
        {/* Header */}
        <div className="flex border-b border-zinc-200 bg-zinc-50/70">
          <div className="flex h-8 w-16 shrink-0 items-center justify-center border-r border-zinc-200">
            <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.15em] text-zinc-400">
              Qubit
            </span>
          </div>

          {steps.map((stepIndex) => (
            <div
              key={stepIndex}
              className="flex h-8 w-14 shrink-0 items-center justify-center border-l border-zinc-100"
            >
              <span className="font-mono text-[8px] text-zinc-400">
                {String(stepIndex + 1).padStart(2, '0')}
              </span>
            </div>
          ))}
        </div>

        {/* Register */}
        <div className="relative">
          {qubits.map((qubitIndex) => (
            <div
              key={qubitIndex}
              className="flex"
            >
              {/* Qubit label */}
              <div className="flex h-14 w-16 shrink-0 items-center justify-center border-r border-zinc-200 bg-zinc-50/50">
                <span className="font-mono text-xs font-medium text-zinc-500">
                  q[{qubitIndex}]
                </span>
              </div>

              {/* Cells */}
              <div className="flex">
                {steps.map((stepIndex) => {
                  const gate = gates.find(
                    (item) =>
                      item.step === stepIndex &&
                      item.qubits.includes(qubitIndex)
                  )

                  const isCXControl =
                    gate?.type === 'cx' &&
                    gate.qubits[0] === qubitIndex

                  const isCXTarget =
                    gate?.type === 'cx' &&
                    gate.qubits[1] === qubitIndex

                  return (
                    <div
                      key={stepIndex}
                      className="relative flex h-14 w-14 shrink-0 items-center justify-center border-l border-zinc-100"
                    >
                      {/* Quantum wire */}
                      <div className="absolute inset-x-0 top-1/2 z-0 h-px bg-zinc-300" />

                      {/* Standard gate */}
                      {gate && gate.type !== 'cx' && (
                        <div className="relative z-20 flex h-9 w-9 items-center justify-center border border-blue-600 bg-blue-600 font-mono text-[11px] font-semibold text-white shadow-[0_2px_8px_rgba(37,99,235,0.18)]">
                          {gate.type === 'measure'
                            ? 'M'
                            : gate.type.toUpperCase()}
                        </div>
                      )}

                      {/* CX control */}
                      {isCXControl && (
                        <div className="relative z-20 flex h-8 w-8 items-center justify-center">
                          <div className="h-3.5 w-3.5 rounded-full bg-blue-600" />
                        </div>
                      )}

                      {/* CX target */}
                      {isCXTarget && (
                        <div className="relative z-20 flex h-8 w-8 items-center justify-center">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-blue-600 bg-white font-mono text-sm font-semibold text-blue-600">
                            +
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* CX connections */}
          {cxGates.map((gate) => {
            const control = gate.qubits[0]
            const target = gate.qubits[1]

            const min = Math.min(control, target)
            const max = Math.max(control, target)

            return (
              <div
                key={`${gate.id}-connection`}
                className="pointer-events-none absolute z-10 w-px bg-blue-500"
                style={{
                  left: 64 + gate.step * 56 + 28,
                  top: 32 + min * 56 + 28,
                  height: (max - min) * 56,
                }}
              />
            )
          })}
        </div>

        {/* Empty state */}
        {gates.length === 0 && (
          <div className="border-t border-zinc-100 px-5 py-6 text-center">
            <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-zinc-400">
              No gates in circuit
            </p>
          </div>
        )}
      </div>
    </div>
  )
}