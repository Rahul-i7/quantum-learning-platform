'use client'

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Blocks, Sparkles, Waves, Play, RotateCw } from "lucide-react";
import NavBar from "@/components/nav/NavBar";
import BlochSphereVisualizer from "@/components/visualizations/BlochSphereVisualizer";

const FEATURES = [
  {
    icon: Blocks,
    title: "Drag-and-drop circuits",
    description:
      "Build quantum circuits visually — place gates on qubit wires and watch the Qiskit code generate itself.",
  },
  {
    icon: Waves,
    title: "Real-time simulation",
    description:
      "Run circuits on a Qiskit backend and see statevectors, measurement outcomes, and Bloch spheres update instantly.",
  },
  {
    icon: Sparkles,
    title: "AI-guided learning",
    description:
      "Get explanations, debugging help, and personalized guidance as you experiment with quantum algorithms.",
  },
];

// Sample mock data objects to feed into the Bloch visualizer
const PRESET_STATES = {
  ground: {
    num_qubits: 1,
    statevector: [[1, 0], [0, 0]], // |0> state
    probabilities: { '0': 1, '1': 0 },
  },
  superposition: {
    num_qubits: 1,
    statevector: [[1 / Math.SQRT2, 0], [1 / Math.SQRT2, 0]], // |+> state
    probabilities: { '0': 0.5, '1': 0.5 },
  },
  excited: {
    num_qubits: 1,
    statevector: [[0, 0], [1, 0]], // |1> state
    probabilities: { '0': 0, '1': 1 },
  },
};

export default function Home() {
  const [activePreset, setActivePreset] = useState<'ground' | 'superposition' | 'excited'>('superposition');

  return (
    <main className="min-h-screen w-full flex flex-col items-center bg-gray-50 overflow-x-hidden">
      <NavBar />

      {/* Hero Section */}
      <section className="w-full bg-linear-to-br from-purple-100 via-blue-50 to-indigo-100 px-6 pt-12 pb-20 border-b border-gray-200">
        <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Headline & CTA */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold tracking-wide text-blue-700 shadow-xs border border-blue-200/50 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Interactive Quantum Algorithm Platform
            </span>

            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Learn quantum computing by <span className="text-blue-600">building it.</span>
            </h1>

            <p className="mt-5 text-lg leading-relaxed text-gray-600 max-w-xl">
              Design circuits visually, simulate quantum states on demand, and visualize 
              the math on interactive Bloch spheres — zero installation required.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link
                href="/builder"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg active:scale-95 cursor-pointer"
              >
                Open Circuit Builder
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/learn"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-gray-700 shadow-sm border border-gray-200 transition-all hover:bg-gray-50 hover:text-gray-900 active:scale-95 cursor-pointer"
              >
                <Play className="h-4 w-4 text-blue-600 fill-blue-600" />
                Start Lessons
              </Link>
            </div>
          </div>

          {/* Right Column: Live Bloch Sphere Demo */}
          <div className="lg:col-span-5 w-full">
            <div className="relative rounded-2xl border border-gray-200/80 bg-white/90 p-4 shadow-xl backdrop-blur-md">
              <div className="mb-3 flex items-center justify-between px-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Live Interactive Demo
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setActivePreset('ground')}
                    className={`px-2 py-1 text-xs font-mono font-medium rounded transition-colors cursor-pointer ${
                      activePreset === 'ground'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    |0⟩
                  </button>
                  <button
                    onClick={() => setActivePreset('superposition')}
                    className={`px-2 py-1 text-xs font-mono font-medium rounded transition-colors cursor-pointer ${
                      activePreset === 'superposition'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    |+⟩ (Hadamard)
                  </button>
                  <button
                    onClick={() => setActivePreset('excited')}
                    className={`px-2 py-1 text-xs font-mono font-medium rounded transition-colors cursor-pointer ${
                      activePreset === 'excited'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    |1⟩
                  </button>
                </div>
              </div>

              {/* Bloch Sphere Component Container */}
              <div className="h-110 w-full">
                <BlochSphereVisualizer 
                  data={PRESET_STATES[activePreset]} 
                  qubitIndex={0} 
                  numQubits={1} 
                />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Feature Grid */}
      <section className="w-full bg-white py-20 border-t border-gray-100">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-10 sm:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="group flex flex-col items-start gap-4 rounded-xl p-6 transition-all hover:bg-blue-50/50 hover:shadow-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100/70 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}