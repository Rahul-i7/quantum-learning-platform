import type { Gate } from '@/lib/store/circuit-store'

export interface ParsedCircuit {
  numQubits: number
  gates: Gate[]
}

export interface ParseResult {
  success: boolean
  circuit?: ParsedCircuit
  error?: string
}

export function parseQiskitCode(code: string): ParseResult {
  try {
    const lines = code
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    const circuitLine = lines.find((line) =>
      /^qc\s*=\s*QuantumCircuit\s*\(/.test(line)
    )

    if (!circuitLine) {
      return {
        success: false,
        error: 'Could not find a QuantumCircuit declaration.',
      }
    }

    const match = circuitLine.match(
      /^qc\s*=\s*QuantumCircuit\s*\(\s*(\d+)\s*\)/
    )

    if (!match) {
      return {
        success: false,
        error: 'QuantumCircuit must specify the number of qubits.',
      }
    }

    const numQubits = Number(match[1])
    const gates: Gate[] = []

    let step = 0

    for (const line of lines) {
      const h = line.match(/^qc\.h\(\s*(\d+)\s*\)/)
      const x = line.match(/^qc\.x\(\s*(\d+)\s*\)/)
      const cx = line.match(
        /^qc\.cx\(\s*(\d+)\s*,\s*(\d+)\s*\)/
      )

      if (h) {
        gates.push({
          id: `editor-h-${step}`,
          type: 'h',
          qubits: [Number(h[1])],
          step,
        })

        step++
        continue
      }

      if (x) {
        gates.push({
          id: `editor-x-${step}`,
          type: 'x',
          qubits: [Number(x[1])],
          step,
        })

        step++
        continue
      }

      if (cx) {
        gates.push({
          id: `editor-cx-${step}`,
          type: 'cx',
          qubits: [Number(cx[1]), Number(cx[2])],
          step,
        })

        step++
        continue
      }

      if (line.startsWith('qc.measure_all()')) {
        gates.push({
          id: `editor-measure-${step}`,
          type: 'measure',
          qubits: Array.from(
            { length: numQubits },
            (_, index) => index
          ),
          step,
        })

        step++
      }
    }

    return {
      success: true,
      circuit: {
        numQubits,
        gates,
      },
    }
  } catch {
    return {
      success: false,
      error: 'Unable to parse the Qiskit code.',
    }
  }
}