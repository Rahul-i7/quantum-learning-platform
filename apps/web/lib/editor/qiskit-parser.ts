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

function parseQiskitAngle(value: string): number | null {
    const angle = value.trim().replace(/\s+/g, '')

    // pi
    if (angle === 'pi') {
        return Math.PI
    }

    // -pi
    if (angle === '-pi') {
        return -Math.PI
    }

    // pi/2, -pi/2, 3*pi/2, -3*pi/2
    const fraction = angle.match(
        /^(-?\d+(?:\.\d+)?)?\*?pi\/(-?\d+(?:\.\d+)?)$/
    )

    if (fraction) {
        const numerator = fraction[1] === undefined
            ? 1
            : Number(fraction[1])

        const denominator = Number(fraction[2])

        if (denominator === 0) {
            return null
        }

        return (numerator * Math.PI) / denominator
    }

    // 2*pi, -2*pi
    const piMultiple = angle.match(
        /^(-?\d+(?:\.\d+)?)\*?pi$/
    )

    if (piMultiple) {
        return Number(piMultiple[1]) * Math.PI
    }

    // Plain numeric value, e.g. 0.231
    const numeric = Number(angle)

    if (Number.isFinite(numeric)) {
        return numeric
    }

    return null
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
            const cx = line.match(/^qc\.cx\(\s*(\d+)\s*,\s*(\d+)\s*\)$/)
            const cz = line.match(/^qc\.cz\(\s*(\d+)\s*,\s*(\d+)\s*\)$/)
            const ccx = line.match(/^qc\.ccx\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/)
            const cswap = line.match(/^qc\.cswap\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/)
            const swap = line.match(/^qc\.swap\(\s*(\d+)\s*,\s*(\d+)\s*\)$/)
            const y = line.match(/^qc\.y\(\s*(\d+)\s*\)$/)
            const z = line.match(/^qc\.z\(\s*(\d+)\s*\)$/)
            const s = line.match(/^qc\.s\(\s*(\d+)\s*\)$/)
            const sdg = line.match(/^qc\.sdg\(\s*(\d+)\s*\)$/)
            const t = line.match(/^qc\.t\(\s*(\d+)\s*\)$/)
            const tdg = line.match(/^qc\.tdg\(\s*(\d+)\s*\)$/)
            const rx = line.match(/^qc\.rx\(\s*([^,]+)\s*,\s*(\d+)\s*\)$/)
            const ry = line.match(/^qc\.ry\(\s*([^,]+)\s*,\s*(\d+)\s*\)$/)
            const rz = line.match(/^qc\.rz\(\s*([^,]+)\s*,\s*(\d+)\s*\)$/)

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

            if (cz) {
                const control = Number(cz[1])
                const target = Number(cz[2])

                if (
                    control >= numQubits ||
                    target >= numQubits
                ) {
                    return {
                        success: false,
                        error: `CZ gate references a qubit outside the ${numQubits}-qubit circuit.`,
                    }
                }

                if (control === target) {
                    return {
                        success: false,
                        error: 'A CZ gate requires two different qubits.',
                    }
                }

                gates.push({
                    id: `editor-cz-${step}`,
                    type: 'cz',
                    qubits: [control, target],
                    step,
                })

                step++
                continue
            }
            if (swap) {
                const control = Number(swap[1])
                const target = Number(swap[2])

                if (
                    control >= numQubits ||
                    target >= numQubits
                ) {
                    return {
                        success: false,
                        error: `Swap gate references a qubit outside the ${numQubits}-qubit circuit.`,
                    }
                }

                if (control === target) {
                    return {
                        success: false,
                        error: 'A Swap gate requires two different qubits.',
                    }
                }

                gates.push({
                    id: `editor-swap-${step}`,
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

            if (s) {
                const qubit = Number(s[1])

                if (qubit >= numQubits) {
                    return {
                        success: false,
                        error: `Qubit index ${qubit} is out of range for a ${numQubits}-qubit circuit.`,
                    }
                }

                gates.push({
                    id: `editor-s-${step}`,
                    type: 's',
                    qubits: [qubit],
                    step,
                })

                step++
                continue
            }
            if (t) {
                const qubit = Number(t[1])

                if (qubit >= numQubits) {
                    return {
                        success: false,
                        error: `Qubit index ${qubit} is out of range for a ${numQubits}-qubit circuit.`,
                    }
                }

                gates.push({
                    id: `editor-t-${step}`,
                    type: 't',
                    qubits: [qubit],
                    step,
                })

                step++
                continue
            }
            if (sdg) {
                const qubit = Number(sdg[1])

                if (qubit >= numQubits) {
                    return {
                        success: false,
                        error: `Qubit index ${qubit} is out of range for a ${numQubits}-qubit circuit.`,
                    }
                }

                gates.push({
                    id: `editor-sdg-${step}`,
                    type: 'sdg',
                    qubits: [qubit],
                    step,
                })

                step++
                continue
            }
            if (tdg) {
                const qubit = Number(tdg[1])

                if (qubit >= numQubits) {
                    return {
                        success: false,
                        error: `Qubit index ${qubit} is out of range for a ${numQubits}-qubit circuit.`,
                    }
                }

                gates.push({
                    id: `editor-tdg-${step}`,
                    type: 'tdg',
                    qubits: [qubit],
                    step,
                })

                step++
                continue
            }

            if (rx) {
                const theta = parseQiskitAngle(rx[1])
                const qubit = Number(rx[2])

                if (theta === null) {
                    return {
                        success: false,
                        error: `Invalid RX angle: ${rx[1]}`,
                    }
                }

                if (qubit >= numQubits) {
                    return {
                        success: false,
                        error: `Qubit index ${qubit} is out of range for a ${numQubits}-qubit circuit.`,
                    }
                }

                gates.push({
                    id: `editor-rx-${step}`,
                    type: 'rx',
                    qubits: [qubit],
                    step,
                    params: {
                        theta,
                    },
                })

                step++
                continue
            }
            if (ry) {
                const theta = parseQiskitAngle(ry[1])
                const qubit = Number(ry[2])

                if (theta === null) {
                    return {
                        success: false,
                        error: `Invalid RY angle: ${ry[1]}`,
                    }
                }

                if (qubit >= numQubits) {
                    return {
                        success: false,
                        error: `Qubit index ${qubit} is out of range for a ${numQubits}-qubit circuit.`,
                    }
                }

                gates.push({
                    id: `editor-ry-${step}`,
                    type: 'ry',
                    qubits: [qubit],
                    step,
                    params: {
                        theta,
                    },
                })

                step++
                continue
            }

            if (rz) {
                const theta = parseQiskitAngle(rz[1])
                const qubit = Number(rz[2])

                if (theta === null) {
                    return {
                        success: false,
                        error: `Invalid RZ angle: ${rz[1]}`,
                    }
                }

                if (qubit >= numQubits) {
                    return {
                        success: false,
                        error: `Qubit index ${qubit} is out of range for a ${numQubits}-qubit circuit.`,
                    }
                }

                gates.push({
                    id: `editor-rz-${step}`,
                    type: 'rz',
                    qubits: [qubit],
                    step,
                    params: {
                        theta,
                    },
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
            if (ccx) {
                const control1 = Number(ccx[1])
                const control2 = Number(ccx[2])
                const target = Number(ccx[3])

                if (
                    control1 >= numQubits ||
                    control2 >= numQubits ||
                    target >= numQubits
                ) {
                    return {
                        success: false,
                        error: `CCX gate references a qubit outside the ${numQubits}-qubit circuit.`,
                    }
                }

                if (control1 === control2 || control1 === target || control2 === target) {
                    return {
                        success: false,
                        error: 'A CCX gate requires three different qubits.',
                    }
                }

                gates.push({
                    id: `editor-ccx-${step}`,
                    type: 'ccx',
                    qubits: [control1, control2, target],
                    step,
                })

                step++
                continue
            }

            if (cswap) {
                const control1 = Number(cswap[1])
                const control2 = Number(cswap[2])
                const target = Number(cswap[3])

                if (
                    control1 >= numQubits ||
                    control2 >= numQubits ||
                    target >= numQubits
                ) {
                    return {
                        success: false,
                        error: `CSWAP gate references a qubit outside the ${numQubits}-qubit circuit.`,
                    }
                }

                if (control1 === control2 || control1 === target || control2 === target) {
                    return {
                        success: false,
                        error: 'A CSWAP gate requires three different qubits.',
                    }
                }

                gates.push({
                    id: `editor-cswap-${step}`,
                    type: 'ccx',
                    qubits: [control1, control2, target],
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