import { Atom } from "lucide-react"

export default function QuantumBasicsOverview() {
  return (
    <div className="mb-8 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 bg-linear-to-br from-indigo-50/60 via-purple-50/40 to-blue-50/50 dark:from-indigo-950/20 dark:via-purple-950/10 dark:to-blue-950/10 p-6 shadow-xs">
      <div className="mb-4 flex items-center gap-2">
        <Atom className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        <h2 className="text-base font-bold text-indigo-950 dark:text-indigo-200">Core Concepts at a Glance</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/60 p-4 shadow-xs backdrop-blur-xs">
          <div className="mb-1 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            01. Qubits
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-200">Superposition</h3>
          <p className="mt-1 text-xs text-gray-600 dark:text-zinc-400 leading-normal">
            Unlike classical bits (0 or 1), a qubit exists in a continuum of state $| \psi \rangle = \alpha|0\rangle + \beta|1\rangle$ until measured.
          </p>
        </div>

        <div className="rounded-xl border border-white/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/60 p-4 shadow-xs backdrop-blur-xs">
          <div className="mb-1 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            02. Circuits
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-200">Quantum Gates</h3>
          <p className="mt-1 text-xs text-gray-600 dark:text-zinc-400 leading-normal">
            Reversible matrix transformations (like Hadamard or CNOT) that rotate qubits across the Bloch Sphere.
          </p>
        </div>

        <div className="rounded-xl border border-white/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/60 p-4 shadow-xs backdrop-blur-xs">
          <div className="mb-1 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            03. Systems
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-200">Entanglement</h3>
          <p className="mt-1 text-xs text-gray-600 dark:text-zinc-400 leading-normal">
            Strong correlations where measuring Qubit A instantly specifies the state outcome of Qubit B.
          </p>
        </div>
      </div>
    </div>
  )
}