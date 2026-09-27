'use client'

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
    ArrowUpRight,
    Blocks,
    Sparkles,
    Waves,
    Play,
    Terminal,
    Cpu,
    GitBranch,
    Code2,
    CircleDot,
    Activity,
    Braces,
} from "lucide-react";

import AnimatedQuantumGrid from "@/components/ui/AnimatedQuantumGrid";
import NavBar from "@/components/nav/NavBar";
import BlochSphereVisualizer from "@/components/visualizations/BlochSphereVisualizer";
import QuantumCursorTrail from "@/components/ui/QuantumCursorTrail";

// ============================================================================
// DATA & TYPES
// ============================================================================
const FEATURES = [
    {
        number: "01",
        icon: Blocks,
        title: "Build",
        description:
            "Compose quantum circuits gate by gate. See qubits, operations, and circuit structure as you build.",
    },
    {
        number: "02",
        icon: Waves,
        title: "Visualize",
        description:
            "Turn abstract quantum states into something you can actually see — from amplitudes to Bloch spheres.",
    },
    {
        number: "03",
        icon: Sparkles,
        title: "Understand",
        description:
            "Explore what each operation does instead of memorizing equations. Learn through experimentation.",
    },
];

const PRESET_STATES = {
    ground: {
        num_qubits: 1,
        statevector: [[1, 0], [0, 0]],
        probabilities: { "0": 1, "1": 0 },
    },
    superposition: {
        num_qubits: 1,
        statevector: [
            [1 / Math.SQRT2, 0],
            [1 / Math.SQRT2, 0],
        ],
        probabilities: { "0": 0.5, "1": 0.5 },
    },
    excited: {
        num_qubits: 1,
        statevector: [[0, 0], [1, 0]],
        probabilities: { "0": 0, "1": 1 },
    },
};

type Preset = keyof typeof PRESET_STATES;

// Framer Motion Animation Variants
const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.215, 0.61, 0.355, 1] as const } },
};

const staggerContainer = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.15,
        },
    },
};

export default function Home() {
    const [activePreset, setActivePreset] = useState<Preset>("superposition");

    return (
        <main className="min-h-screen bg-[#fafafa] text-zinc-950 overflow-x-hidden">
            {/* Interactive Particle Cursor Trail */}
            <QuantumCursorTrail />

            <NavBar />

            {/* HERO */}
            <section className="relative overflow-hidden border-b border-zinc-200 bg-[#0b0d10] text-white">
                {/* <div className="pointer-events-none absolute inset-0">
                    <div
                        className="absolute inset-0 opacity-[0.05]"
                        style={{
                            backgroundImage: `
                                linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)
                            `,
                            backgroundSize: "48px 48px",
                        }}
                    />
                </div> */}
                <AnimatedQuantumGrid />

                <div className="relative mx-auto max-w-7xl px-6">
                    <div className="grid min-h-180 grid-cols-1 lg:grid-cols-12">
                        {/* LEFT */}
                        <motion.div 
                            initial="hidden"
                            animate="visible"
                            variants={staggerContainer}
                            className="flex flex-col justify-center py-20 lg:col-span-7 lg:py-28 lg:pr-16"
                        >
                            <motion.div variants={fadeInUp} className="mb-8 flex items-center gap-3 text-xs font-mono uppercase tracking-[0.2em] text-zinc-400">
                                <span className="h-px w-8 bg-blue-500" />
                                Quantum computing, made tangible
                            </motion.div>

                            <motion.h1 variants={fadeInUp} className="max-w-4xl text-[clamp(3.5rem,7vw,6.8rem)] font-medium leading-[0.9] tracking-[-0.055em]">
                                Think in
                                <br />
                                <span className="text-blue-400">qubits.</span>
                            </motion.h1>

                            <motion.p variants={fadeInUp} className="mt-10 max-w-xl text-base leading-7 text-zinc-400 sm:text-lg">
                                A visual environment for learning quantum computing.
                                Build circuits, manipulate quantum states, and understand
                                the mathematics through interaction rather than abstraction.
                            </motion.p>

                            <motion.div variants={fadeInUp} className="mt-10 flex flex-wrap items-center gap-3">
                                <Link
                                    href="/builder"
                                    className="group inline-flex h-12 items-center gap-3 bg-white px-5 text-sm font-medium text-black transition hover:bg-blue-400"
                                >
                                    Open Circuit Builder
                                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                </Link>

                                <Link
                                    href="/learn"
                                    className="inline-flex h-12 items-center gap-3 border border-zinc-700 px-5 text-sm font-medium text-zinc-200 transition hover:border-zinc-400 hover:bg-white/5"
                                >
                                    <Play className="h-3.5 w-3.5 fill-current" />
                                    Explore the basics
                                </Link>
                            </motion.div>

                            <motion.div variants={fadeInUp} className="mt-16 grid max-w-lg grid-cols-3 border-y border-zinc-800">
                                <div className="py-5 pr-5">
                                    <div className="font-mono text-xl text-white">01</div>
                                    <div className="mt-1 text-[10px] uppercase tracking-widest text-zinc-500">Qubit</div>
                                </div>

                                <div className="border-l border-zinc-800 px-5 py-5">
                                    <div className="font-mono text-xl text-white">∞</div>
                                    <div className="mt-1 text-[10px] uppercase tracking-widest text-zinc-500">States</div>
                                </div>

                                <div className="border-l border-zinc-800 px-5 py-5">
                                    <div className="font-mono text-xl text-white">Q</div>
                                    <div className="mt-1 text-[10px] uppercase tracking-widest text-zinc-500">Powered</div>
                                </div>
                            </motion.div>
                        </motion.div>

                        {/* RIGHT — BLOCH SPHERE */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="relative min-w-0 w-full lg:col-span-5"
                        >
                            <div className="relative min-h-155 w-full overflow-hidden border-l border-zinc-800">
                                <div className="absolute left-6 top-8 z-10 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-zinc-600">
                                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                                    Live quantum state
                                </div>

                                <div className="absolute right-6 top-8 z-10 font-mono text-[10px] text-zinc-600">
                                    Q[0]
                                </div>

                                <div className="absolute inset-x-6 bottom-28 top-20 min-w-0">
                                    <BlochSphereVisualizer
                                        data={PRESET_STATES[activePreset]}
                                        qubitIndex={0}
                                        numQubits={1}
                                        variant="hero"
                                    />
                                </div>

                                <div className="absolute bottom-14 left-1/2 z-20 flex -translate-x-1/2 items-center border border-zinc-800 bg-[#0b0d10]/90 p-1 backdrop-blur-sm">
                                    {[
                                        { id: "ground" as Preset, label: "|0⟩" },
                                        { id: "superposition" as Preset, label: "|+⟩" },
                                        { id: "excited" as Preset, label: "|1⟩" },
                                    ].map((state) => (
                                        <button
                                            key={state.id}
                                            onClick={() => setActivePreset(state.id)}
                                            className={`h-9 min-w-14 px-4 font-mono text-xs transition-all cursor-pointer ${
                                                activePreset === state.id ? "bg-white text-black" : "text-zinc-500 hover:text-white"
                                            }`}
                                        >
                                            {state.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="absolute bottom-0 left-6 right-6 border-t border-zinc-800 py-4">
                                    <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest">
                                        <span className="text-zinc-600">Current state</span>
                                        <span className="text-zinc-400">
                                            {activePreset === "ground"
                                                ? "|0⟩ Ground"
                                                : activePreset === "excited"
                                                    ? "|1⟩ Excited"
                                                    : "|+⟩ Superposition"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* INTRO SECTION WITH SCROLL ANIMATION */}
            <section className="border-b border-zinc-200 bg-white">
                <div className="mx-auto max-w-7xl px-6 py-24">
                    <motion.div 
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={staggerContainer}
                        className="grid gap-12 lg:grid-cols-12"
                    >
                        <motion.div variants={fadeInUp} className="lg:col-span-4">
                            <div className="font-mono text-xs uppercase tracking-[0.2em] text-blue-600">
                                / 01 — Why this exists
                            </div>
                        </motion.div>

                        <motion.div variants={fadeInUp} className="lg:col-span-7 lg:col-start-6">
                            <h2 className="max-w-3xl text-3xl font-medium leading-tight tracking-tight text-zinc-950 sm:text-4xl">
                                Quantum computing becomes easier to understand when you can
                                see what the mathematics is doing.
                            </h2>

                            <p className="mt-7 max-w-2xl text-base leading-7 text-zinc-500">
                                Instead of jumping between equations, documentation and
                                simulators, experiment directly. Change a gate. Watch the
                                state change. Run the circuit. See the result.
                            </p>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* FEATURES SECTION WITH SCROLL ANIMATION */}
            <section className="border-b border-zinc-200 bg-[#f5f5f3]">
                <div className="mx-auto max-w-7xl px-6 py-24">
                    <motion.div 
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={fadeInUp}
                        className="mb-14 flex items-end justify-between"
                    >
                        <div>
                            <div className="font-mono text-xs uppercase tracking-[0.2em] text-blue-600">
                                / 02 — Workflow
                            </div>

                            <h2 className="mt-4 text-3xl font-medium tracking-tight text-zinc-950">
                                From idea to circuit.
                            </h2>
                        </div>

                        <div className="hidden font-mono text-xs text-zinc-400 sm:block">
                            BUILD / RUN / UNDERSTAND
                        </div>
                    </motion.div>

                    <motion.div 
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                        variants={staggerContainer}
                        className="grid border-l border-t border-zinc-300 md:grid-cols-3"
                    >
                        {FEATURES.map(({ number, icon: Icon, title, description }) => (
                            <motion.div
                                key={title}
                                variants={fadeInUp}
                                className="group relative min-h-75 border-b border-r border-zinc-300 bg-[#f5f5f3] p-8 transition-colors hover:bg-white"
                            >
                                <div className="flex items-start justify-between">
                                    <span className="font-mono text-xs text-zinc-400">{number}</span>
                                    <Icon className="h-5 w-5 text-zinc-400 transition-colors group-hover:text-blue-500" strokeWidth={1.5} />
                                </div>

                                <div className="mt-20">
                                    <h3 className="text-2xl font-medium tracking-tight text-zinc-950">{title}</h3>
                                    <p className="mt-4 max-w-sm text-sm leading-6 text-zinc-500">{description}</p>
                                </div>

                                <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-blue-500 transition-all duration-300 group-hover:w-full" />
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* TECHNICAL STRIP */}
            <section className="bg-[#0b0d10] text-white">
                <div className="mx-auto max-w-7xl px-6">
                    <motion.div 
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={staggerContainer}
                        className="grid md:grid-cols-3"
                    >
                        <motion.div variants={fadeInUp} className="border-b border-zinc-800 p-8 md:border-b-0 md:border-r">
                            <Terminal className="h-5 w-5 text-blue-400" strokeWidth={1.5} />
                            <div className="mt-8 font-mono text-xs uppercase tracking-widest text-zinc-500">Circuit → Code</div>
                            <p className="mt-3 text-sm leading-6 text-zinc-400">Build visually while keeping the underlying implementation visible.</p>
                        </motion.div>

                        <motion.div variants={fadeInUp} className="border-b border-zinc-800 p-8 md:border-b-0 md:border-r">
                            <Cpu className="h-5 w-5 text-blue-400" strokeWidth={1.5} />
                            <div className="mt-8 font-mono text-xs uppercase tracking-widest text-zinc-500">Simulation</div>
                            <p className="mt-3 text-sm leading-6 text-zinc-400">Experiment with quantum states and measurement outcomes without setting up a local environment.</p>
                        </motion.div>

                        <motion.div variants={fadeInUp} className="p-8">
                            <GitBranch className="h-5 w-5 text-blue-400" strokeWidth={1.5} />
                            <div className="mt-8 font-mono text-xs uppercase tracking-widest text-zinc-500">Experiment</div>
                            <p className="mt-3 text-sm leading-6 text-zinc-400">Start simple, modify the circuit and gradually work toward real quantum algorithms.</p>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* FINAL CTA */}
            <section className="bg-white">
                <div className="mx-auto max-w-7xl px-6 py-28">
                    <motion.div 
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                        className="relative overflow-hidden border border-zinc-200 bg-[#f5f5f3] px-8 py-16 sm:px-14"
                    >
                        <div
                            className="pointer-events-none absolute inset-0 opacity-[0.035]"
                            style={{
                                backgroundImage: `
                                    linear-gradient(#000 1px, transparent 1px),
                                    linear-gradient(90deg, #000 1px, transparent 1px)
                                `,
                                backgroundSize: "32px 32px",
                            }}
                        />

                        <div className="relative max-w-3xl">
                            <div className="font-mono text-xs uppercase tracking-[0.2em] text-blue-600">/ Start experimenting</div>
                            <h2 className="mt-5 text-4xl font-medium tracking-[-0.035em] text-zinc-950 sm:text-5xl">
                                Don't just learn what a qubit is.
                                <br />
                                <span className="text-zinc-400">Put one to work.</span>
                            </h2>

                            <div className="mt-8">
                                <Link
                                    href="/builder"
                                    className="group inline-flex items-center gap-3 bg-zinc-950 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-blue-600"
                                >
                                    Launch the builder
                                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="border-t border-zinc-200 bg-white">
                <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
                    <span className="font-mono text-xs text-zinc-400">QUANTUM LAB</span>
                    <span className="text-xs text-zinc-400">Learn · Experiment · Understand</span>
                </div>
            </footer>
        </main>
    );
}