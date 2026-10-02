import { Gate } from "../store/circuit-store"

export interface CircuitState {
    numQubits: number
    gates: Gate[]
}

function formatQiskitAngle(theta?: number): string {
    if (theta === undefined) {
        return 'pi/2'
    }

    if (Math.abs(theta - Math.PI / 2) < 0.000001) {
        return 'pi/2'
    }

    if (Math.abs(theta - Math.PI) < 0.000001) {
        return 'pi'
    }

    if (Math.abs(theta - (3 * Math.PI) / 2) < 0.000001) {
        return '3*pi/2'
    }

    if (Math.abs(theta - 2 * Math.PI) < 0.000001) {
        return '2*pi'
    }

    return theta.toString()
}

export function circuitToQiskitCode(circuit: CircuitState): string {
    const { numQubits, gates } = circuit

    let code = `from qiskit import QuantumCircuit\n\n`
    code += `# Initialize a Quantum Circuit with ${numQubits} qubits\n`
    code += `qc = QuantumCircuit(${numQubits})\n\n`

    if (gates.length === 0) {
        code += `# Add gates by dragging them onto the canvas\n`
        return code
    }

    const sortedGates = [...gates].sort((a, b) => a.step - b.step)

    sortedGates.forEach((gate) => {
        const type = gate.type.toLowerCase()

        switch (type) {
            case 'h':
                code += `qc.h(${gate.qubits[0]})\n`
                break

            case 'x':
                code += `qc.x(${gate.qubits[0]})\n`
                break

            case 'cx':
                if (gate.qubits.length >= 2) {
                    code += `qc.cx(${gate.qubits[0]}, ${gate.qubits[1]})\n`
                }
                break

            case 'cz':
                if (gate.qubits.length >= 2) {
                    code += `qc.cz(${gate.qubits[0]}, ${gate.qubits[1]})\n`
                }
                break

            case 'swap':
                if (gate.qubits.length >= 2) {
                    code += `qc.swap(${gate.qubits[0]}, ${gate.qubits[1]})\n`
                }
                break
            case 'ccx':
                if (gate.qubits.length >= 3) {
                    code += `qc.ccx(${gate.qubits[0]}, ${gate.qubits[1]}, ${gate.qubits[2]})\n`
                }
                break
            case 'cswap':
                if (gate.qubits.length >= 3) {
                    code += `qc.cswap(${gate.qubits[0]}, ${gate.qubits[1]}, ${gate.qubits[2]})\n`
                }
                break

            case 'y':
                code += `qc.y(${gate.qubits[0]})\n`
                break

            case 'z':
                code += `qc.z(${gate.qubits[0]})\n`
                break

            case 's':
                code += `qc.s(${gate.qubits[0]})\n`
                break

            case 'sdg':
                code += `qc.sdg(${gate.qubits[0]})\n`
                break

            case 't':
                code += `qc.t(${gate.qubits[0]})\n`
                break

            case 'tdg':
                code += `qc.tdg(${gate.qubits[0]})\n`
                break

            case 'rx':
                code += `qc.rx(${formatQiskitAngle(gate.params?.theta)}, ${gate.qubits[0]})\n`
                break

            case 'ry':
                code += `qc.ry(${formatQiskitAngle(gate.params?.theta)}, ${gate.qubits[0]})\n`
                break

            case 'rz':
                code += `qc.rz(${formatQiskitAngle(gate.params?.theta)}, ${gate.qubits[0]})\n`
                break

            case 'measure':
                code += `qc.measure_all()\n`
                break
            default:
                code += `# Unsupported gate type: ${gate.type}\n`
        }
    })


    return code
}