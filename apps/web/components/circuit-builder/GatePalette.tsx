import { useDrag } from 'react-dnd'



const GATES = [
  { label: "H", type: "h" },
  { label: "X", type: "x" },
  { label: "CX", type: "cx" },
  { label: "Measure", type: "measure" },
];

function DraggableGate({ gateType }: { gateType: string }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'GATE',
    item: { type: 'GATE', gateType },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }))

  return (
    <div
      ref={drag as any}
      className={`cursor-grab rounded border border-gray-300 p-2 font-mono text-sm text-gray-600 hover:bg-gray-100 active:cursor-grabbing ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
    >
      {gateType}
    </div>
  )
}

export default function GatePalette() {
  return (
    <div className="flex flex-col gap-2 p-4">
      <h3 className="font-semibold text-gray-700">Gates</h3>
      {GATES.map((gate) => (
        <DraggableGate key={gate.label} gateType={gate.label} />
      ))}
    </div>
  )
}