export interface Gate {
    id: string
    type: string
    qubits: number[]
    step: number
}

export interface CircuitState {
    numQubits: number
    gates: Gate[]
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

            case 'measure':
                code += `qc.measure_all()\n`
                break
            default:
                code += `# Unsupported gate type: ${gate.type}\n`
        }
    })


    return code
}