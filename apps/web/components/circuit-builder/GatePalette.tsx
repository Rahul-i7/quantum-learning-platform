'use client'

import { useDrag } from 'react-dnd'

const GATES = [
  {
    label: "H",
    type: "h",
    description: "Hadamard Gate: Creates an equal superposition state (|0⟩ → |+⟩).",
  },
  {
    label: "X",
    type: "x",
    description: "Pauli-X Gate: Quantum NOT gate. Flips |0⟩ to |1⟩ and vice versa.",
  },
  {
    label: "CX",
    type: "cx",
    description: "CNOT (Controlled-NOT): Flips the target qubit if the control qubit is |1⟩.",
  },
  {
    label: "Measure",
    type: "measure",
    description: "Measurement: Collapses the qubit superposition into a classical bit (0 or 1).",
  },
];

function DraggableGate({
  gate,
}: {
  gate: { label: string; type: string; description: string }
}) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'GATE',
    item: { type: 'GATE', gateType: gate.type },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }))

  return (
    <div className="group relative w-full">
      <div
        ref={drag as any}
        className={`cursor-grab rounded border border-gray-300 p-2 font-mono text-sm text-gray-600 hover:bg-gray-100 active:cursor-grabbing ${
          isDragging ? 'opacity-50' : 'opacity-100'
        }`}
      >
        {gate.label}
      </div>

      {/* Hover Tooltip */}
      <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="w-48 rounded border border-gray-200 bg-white p-2 font-sans text-xs text-gray-600 shadow-md">
          <div className="font-semibold text-gray-700">{gate.label} Gate</div>
          <div>{gate.description}</div>
        </div>
      </div>
    </div>
  )
}

export default function GatePalette() {
  return (
    <div className="flex flex-col gap-2 p-4">
      <h3 className="font-semibold text-gray-700">Gates</h3>
      {GATES.map((gate) => (
        <DraggableGate key={gate.type} gate={gate} />
      ))}
    </div>
  )
}