'use client'

import { useState, useEffect, useRef } from 'react'
import { useDrop } from 'react-dnd'
import { useCircuitStore } from '@/lib/store/circuit-store'
import { X } from 'lucide-react'

const NUM_STEPS = 8

interface CellProps {
  qubitIndex: number
  stepIndex: number
  pendingCX: {
    qubitIndex: number
    stepIndex: number
  } | null
  setPendingCX: React.Dispatch<
    React.SetStateAction<{
      qubitIndex: number
      stepIndex: number
    } | null>
  >
}

function DropCell({
  qubitIndex,
  stepIndex,
  pendingCX,
  setPendingCX,
}: CellProps) {
  const addGate = useCircuitStore((state) => state.addGate)
  const removeGate = useCircuitStore((state) => state.removeGate)

  const gate = useCircuitStore((state) =>
    state.gates.find(
      (g) =>
        g.qubits.includes(qubitIndex) &&
        g.step === stepIndex
    )
  )

  const cxGate = useCircuitStore((state) =>
    state.gates.find(
      (g) =>
        g.type === 'cx' &&
        g.step === stepIndex &&
        g.qubits.includes(qubitIndex)
    )
  )

  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'GATE',

    drop: (item: {
      type: string
      gateType: string
    }) => {
      if (item.gateType === 'cx') {
        setPendingCX({
          qubitIndex,
          stepIndex,
        })
      } else {
        addGate({
          id: `${item.gateType}-q${qubitIndex}-s${stepIndex}-${Date.now()}`,
          type: item.gateType,
          qubits: [qubitIndex],
          step: stepIndex,
        })
      }
    },

    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }))

  const handleRemove = (
    e: React.MouseEvent
  ) => {
    e.stopPropagation()

    if (gate) {
      removeGate(gate.id)
    }
  }

  const isPendingTarget =
    pendingCX?.stepIndex === stepIndex &&
    pendingCX?.qubitIndex !== qubitIndex

  const isCX =
    cxGate?.type === 'cx' &&
    cxGate.qubits.includes(qubitIndex)
const isCXControl =
  isCX &&
  cxGate?.qubits[0] === qubitIndex

const isCXTarget =
  isCX &&
  cxGate?.qubits[1] === qubitIndex

  const handleCellClick = () => {
    if (
      pendingCX &&
      pendingCX.stepIndex === stepIndex &&
      pendingCX.qubitIndex !== qubitIndex
    ) {
      addGate({
        id: `cx-q${pendingCX.qubitIndex}-q${qubitIndex}-s${stepIndex}-${Date.now()}`,
        type: 'cx',
        qubits: [
          pendingCX.qubitIndex,
          qubitIndex,
        ],
        step: stepIndex,
      })

      setPendingCX(null)
    }
  }

  return (
    <div
      ref={(node) => {
        drop(node)
      }}
      onClick={handleCellClick}
      data-qubit={qubitIndex}
      data-step={stepIndex}
      className={`
        relative flex h-14 w-14 shrink-0
        items-center justify-center
        border-l border-zinc-100
        transition-colors
        ${isOver && canDrop ? 'bg-blue-50' : ''}
        ${
          isPendingTarget
            ? 'cursor-pointer bg-blue-50/70'
            : ''
        }
      `}
    >
      {/* Quantum wire */}
      <div className="absolute inset-x-0 top-1/2 z-0 h-px bg-zinc-300" />


      {/* Pending CX target indicator */}
      {isPendingTarget && !gate && (
        <div className="absolute z-10 h-3 w-3 rounded-full border-2 border-blue-500 bg-white" />
      )}

      {/* Standard gate */}
      {gate && gate.type !== 'cx' && (
        <div
          className="
            group relative z-20
            flex h-9 w-9
            items-center justify-center
            border border-blue-600
            bg-blue-600
            font-mono text-[11px]
            font-semibold text-white
            shadow-[0_2px_8px_rgba(37,99,235,0.18)]
          "
        >
          {gate.type === 'measure'
            ? 'M'
            : gate.type.toUpperCase()}

          <button
            onClick={handleRemove}
            className="
              absolute -right-1.5 -top-1.5
              hidden h-4 w-4
              items-center justify-center
              border border-white
              bg-red-500
              text-white
              group-hover:flex
            "
          >
            <X size={10} />
          </button>
        </div>
      )}

      {/* CX control */}
      {isCXControl && (
        <div
          className="
            group relative z-20
            flex h-8 w-8
            items-center justify-center
          "
        >
          <div className="h-3.5 w-3.5 rounded-full bg-blue-600" />

          <button
            onClick={handleRemove}
            className="
              absolute -right-1.5 -top-1.5
              hidden h-4 w-4
              items-center justify-center
              border border-white
              bg-red-500
              text-white
              group-hover:flex
            "
          >
            <X size={10} />
          </button>
        </div>
      )}

      {/* CX target */}
      {isCXTarget && (
        <div
          className="
            group relative z-20
            flex h-8 w-8
            items-center justify-center
          "
        >
          <div
            className="
              flex h-6 w-6
              items-center justify-center
              rounded-full
              border-2 border-blue-600
              bg-white
              font-mono text-sm
              font-semibold text-blue-600
            "
          >
            +
          </div>

          <button
            onClick={handleRemove}
            className="
              absolute -right-1.5 -top-1.5
              hidden h-4 w-4
              items-center justify-center
              border border-white
              bg-red-500
              text-white
              group-hover:flex
            "
          >
            <X size={10} />
          </button>
        </div>
      )}

      {/* Drop feedback */}
      {isOver && !gate && (
        <div className="absolute inset-1 z-10 border border-blue-400 bg-blue-100/30" />
      )}
    </div>
  )
}

export default function CircuitCanvas() {
  const numQubits = useCircuitStore(
    (state) => state.numQubits
  )

  const gates = useCircuitStore(
    (state) => state.gates
  )

  const qubits = Array.from(
    { length: numQubits },
    (_, i) => i
  )

  const steps = Array.from(
    { length: NUM_STEPS },
    (_, i) => i
  )

  const [pendingCX, setPendingCX] =
    useState<{
      qubitIndex: number
      stepIndex: number
    } | null>(null)

  const [mousePos, setMousePos] =
    useState({
      x: 0,
      y: 0,
    })

  const canvasRef =
    useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (
      e: MouseEvent
    ) => {
      if (
        pendingCX &&
        canvasRef.current
      ) {
        const rect =
          canvasRef.current.getBoundingClientRect()

        setMousePos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        })
      }
    }

    const handleKeyDown = (
      e: KeyboardEvent
    ) => {
      if (e.key === 'Escape') {
        setPendingCX(null)
      }
    }

    window.addEventListener(
      'mousemove',
      handleMouseMove
    )

    window.addEventListener(
      'keydown',
      handleKeyDown
    )

    return () => {
      window.removeEventListener(
        'mousemove',
        handleMouseMove
      )

      window.removeEventListener(
        'keydown',
        handleKeyDown
      )
    }
  }, [pendingCX])

  const getControlCenter = () => {
    if (
      !pendingCX ||
      !canvasRef.current
    ) {
      return {
        x: 0,
        y: 0,
      }
    }

    const cellEl =
      canvasRef.current.querySelector(
        `[data-qubit="${pendingCX.qubitIndex}"][data-step="${pendingCX.stepIndex}"]`
      ) as HTMLElement

    if (!cellEl) {
      return {
        x: 0,
        y: 0,
      }
    }

    const cellRect =
      cellEl.getBoundingClientRect()

    const canvasRect =
      canvasRef.current.getBoundingClientRect()

    return {
      x:
        cellRect.left -
        canvasRect.left +
        cellRect.width / 2,

      y:
        cellRect.top -
        canvasRect.top +
        cellRect.height / 2,
    }
  }

  const controlCenter =
    getControlCenter()

  /*
   * Find CX gates so we can show the
   * vertical connection between their
   * control and target qubits.
   */
  const cxGates = gates.filter(
    (gate) =>
      gate.type === 'cx' &&
      gate.qubits.length === 2
  )

  return (
    <div
      ref={canvasRef}
      className="
        relative
        overflow-x-auto
        bg-white
      "
    >
      {/* Pending CX guide */}
      {pendingCX && (
        <svg
          className="
            pointer-events-none
            absolute inset-0
            z-40 h-full w-full
          "
        >
          <line
            x1={controlCenter.x}
            y1={controlCenter.y}
            x2={mousePos.x}
            y2={mousePos.y}
            stroke="#2563eb"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            strokeLinecap="round"
          />
        </svg>
      )}

      {/* Circuit header */}
      <div
        className="
          flex items-center
          border-b border-zinc-200
          bg-zinc-50/70
        "
      >
        <div className="flex h-8 w-16 shrink-0 items-center justify-center border-r border-zinc-200">
          <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.15em] text-zinc-400">
            Qubit
          </span>
        </div>

        {steps.map((stepIndex) => (
          <div
            key={stepIndex}
            className="
              flex h-8 w-14
              shrink-0
              items-center justify-center
              border-l border-zinc-100
            "
          >
            <span className="font-mono text-[8px] text-zinc-400">
              {String(stepIndex + 1).padStart(
                2,
                '0'
              )}
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
            <div
              className="
                flex h-14 w-16
                shrink-0
                items-center
                justify-center
                border-r border-zinc-200
                bg-zinc-50/50
              "
            >
              <span className="font-mono text-xs font-medium text-zinc-500">
                q[{qubitIndex}]
              </span>
            </div>

            {/* Cells */}
            <div className="flex">
              {steps.map((stepIndex) => (
                <DropCell
                  key={stepIndex}
                  qubitIndex={qubitIndex}
                  stepIndex={stepIndex}
                  pendingCX={pendingCX}
                  setPendingCX={setPendingCX}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Active CX connections */}
        {cxGates.map((gate) => {
          const control =
            gate.qubits[0]

          const target =
            gate.qubits[1]

          const min =
            Math.min(control, target)

          const max =
            Math.max(control, target)

          return (
            <div
              key={`${gate.id}-connection`}
              className="
                pointer-events-none
                absolute
                z-10
                w-px
                bg-blue-500
              "
              style={{
                left:
                  64 +
                  gate.step * 56 +
                  28,

                top:
                  32 +
                  min * 56 +
                  28,

                height:
                  (max - min) * 56,
              }}
            />
          )
        })}
      </div>

      {/* Empty state */}
      {gates.length === 0 && (
        <div
          className="
            border-t border-zinc-100
            px-5 py-6
            text-center
          "
        >
          <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-zinc-400">
            Drag a gate onto the register
          </p>
        </div>
      )}
    </div>
  )
}