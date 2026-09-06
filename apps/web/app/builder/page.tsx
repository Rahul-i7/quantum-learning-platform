'use client'

import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import GatePalette from '@/components/circuit-builder/GatePalette'
import CircuitCanvas from '@/components/circuit-builder/CircuitCanvas'
import QiskitPreview from '@/components/circuit-builder/QiskitPreview'

export default function BuilderPage() {
  return (
    <DndProvider backend={HTML5Backend}>
      <main className="min-h-screen p-8 bg-gray-100">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          Quantum Circuit Builder
        </h1>

        <div className="flex gap-6 items-start">
          {/* Gate Selection Palette */}
          <div className="w-48 shrink-0 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <GatePalette />
          </div>

          {/* Interactive Circuit Canvas */}
          <div className="flex-1 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <CircuitCanvas />
          </div>
          <QiskitPreview />
        </div>
      </main>
    </DndProvider>
  )
}