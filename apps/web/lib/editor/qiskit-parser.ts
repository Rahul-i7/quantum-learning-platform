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

        if (numQubits < 1) {
            return {
                success: false,
                error: 'QuantumCircuit must contain at least one qubit.',
            }
        }

        const gates: Gate[] = []
        let step = 0

        for (const line of lines) {
            // Ignore imports, comments and the circuit declaration.
            if (
                line.startsWith('from ') ||
                line.startsWith('import ') ||
                line.startsWith('#') ||
                /^qc\s*=\s*QuantumCircuit\s*\(/.test(line)
            ) {
                continue
            }

            const h = line.match(/^qc\.h\(\s*(\d+)\s*\)$/)
            const x = line.match(/^qc\.x\(\s*(\d+)\s*\)$/)
            const cx = line.match(
                /^qc\.cx\(\s*(\d+)\s*,\s*(\d+)\s*\)$/
            )
            const y = line.match(/^qc\.y\(\s*(\d+)\s*\)$/)
            const z = line.match(/^qc\.z\(\s*(\d+)\s*\)$/)

            if (h) {
                const qubit = Number(h[1])

                if (qubit >= numQubits) {
                    return {
                        success: false,
                        error: `Qubit index ${qubit} is out of range for a ${numQubits}-qubit circuit.`,
                    }
                }

                gates.push({
                    id: `editor-h-${step}`,
                    type: 'h',
                    qubits: [qubit],
                    step,
                })

                step++
                continue
            }

            if (x) {
                const qubit = Number(x[1])

                if (qubit >= numQubits) {
                    return {
                        success: false,
                        error: `Qubit index ${qubit} is out of range for a ${numQubits}-qubit circuit.`,
                    }
                }

                gates.push({
                    id: `editor-x-${step}`,
                    type: 'x',
                    qubits: [qubit],
                    step,
                })

                step++
                continue
            }

            if (cx) {
                const control = Number(cx[1])
                const target = Number(cx[2])

                if (
                    control >= numQubits ||
                    target >= numQubits
                ) {
                    return {
                        success: false,
                        error: `CX gate references a qubit outside the ${numQubits}-qubit circuit.`,
                    }
                }

                if (control === target) {
                    return {
                        success: false,
                        error: 'A CX gate requires two different qubits.',
                    }
                }

                gates.push({
                    id: `editor-cx-${step}`,
                    type: 'cx',
                    qubits: [control, target],
                    step,
                })

                step++
                continue
            }

            if (y) {
                const qubit = Number(y[1])

                if (qubit >= numQubits) {
                    return {
                        success: false,
                        error: `Qubit index ${qubit} is out of range for a ${numQubits}-qubit circuit.`,
                    }
                }

                gates.push({
                    id: `editor-y-${step}`,
                    type: 'y',
                    qubits: [qubit],
                    step,
                })

                step++
                continue
            }

            if (z) {
                const qubit = Number(z[1])

                if (qubit >= numQubits) {
                    return {
                        success: false,
                        error: `Qubit index ${qubit} is out of range for a ${numQubits}-qubit circuit.`,
                    }
                }

                gates.push({
                    id: `editor-z-${step}`,
                    type: 'z',
                    qubits: [qubit],
                    step,
                })

                step++
                continue
            }

            if (line === 'qc.measure_all()') {
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
                continue
            }

            /*
             * Any other qc.* operation is unsupported.
             *
             * We deliberately check this after the supported
             * operations so ordinary Python/import lines can
             * still exist in the editor.
             */
            if (/^qc\./.test(line)) {
                const operation = line.match(/^qc\.([a-zA-Z_][a-zA-Z0-9_]*)/)

                return {
                    success: false,
                    error: `Unsupported Qiskit operation: qc.${operation?.[1] ?? 'unknown'}`,
                }
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