'use client'

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
    ArrowUpRight,
    Blocks,
    Sparkles,
    Waves,
    Play,
    Atom,
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
                                            className={`h-9 min-w-14 px-4 font-mono text-xs transition-all cursor-pointer ${activePreset === state.id ? "bg-white text-black" : "text-zinc-500 hover:text-white"
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

            {/* ================================================================ */}
            {/* INTRO — WHY QMENTOR                                              */}
            {/* ================================================================ */}

            <section className="border-b border-zinc-200 bg-white">
                <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={staggerContainer}
                        className="grid gap-16 lg:grid-cols-12 lg:items-center"
                    >
                        {/* Section label */}
                        <motion.div
                            variants={fadeInUp}
                            className="lg:col-span-4"
                        >
                            <div className="font-mono text-xs uppercase tracking-[0.2em] text-blue-600">
                                / 01 — Why this exists
                            </div>

                            <div className="mt-8 hidden lg:block">
                                <div className="h-px w-16 bg-zinc-200" />
                                <div className="mt-4 font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                                    abstraction → interaction
                                </div>
                            </div>
                        </motion.div>

                        {/* Main copy */}
                        <motion.div
                            variants={fadeInUp}
                            className="lg:col-span-7 lg:col-start-6"
                        >
                            <h2 className="max-w-3xl text-3xl font-medium leading-[1.1] tracking-[-0.035em] text-zinc-950 sm:text-4xl lg:text-[2.75rem]">
                                Quantum computing becomes easier to understand when you can
                                <span className="text-zinc-400"> see what the mathematics is doing.</span>
                            </h2>

                            <p className="mt-7 max-w-2xl text-base leading-7 text-zinc-500">
                                Instead of jumping between equations, documentation and
                                simulators, experiment directly. Change a gate. Watch the
                                state change. Run the circuit. See the result.
                            </p>
                        </motion.div>
                    </motion.div>

                    {/* Interactive-looking explanation */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={staggerContainer}
                        className="mt-20 grid border border-zinc-200 bg-[#f5f5f3] lg:grid-cols-12"
                    >
                        {/* Circuit side */}
                        <motion.div
                            variants={fadeInUp}
                            className="relative overflow-hidden border-b border-zinc-200 p-6 sm:p-8 lg:col-span-7 lg:border-b-0 lg:border-r"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CircleDot className="h-4 w-4 text-blue-600" strokeWidth={1.5} />
                                    <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                                        Circuit state
                                    </span>
                                </div>

                                <span className="font-mono text-[10px] text-zinc-400">
                                    01 QUBIT
                                </span>
                            </div>

                            <div className="relative mt-12 overflow-hidden border-y border-zinc-200 bg-white py-10">
                                {/* horizontal wire */}
                                <div className="absolute left-8 right-8 top-1/2 h-px bg-zinc-300" />

                                <div className="relative flex items-center justify-center gap-10 sm:gap-16">
                                    <div className="font-mono text-xs text-zinc-400">
                                        q₀
                                    </div>

                                    <div className="flex h-12 w-12 items-center justify-center border border-zinc-300 bg-white font-mono text-sm text-zinc-900 shadow-sm">
                                        H
                                    </div>

                                    <div className="flex h-12 w-12 items-center justify-center border border-blue-200 bg-blue-50 font-mono text-sm text-blue-600">
                                        ×
                                    </div>

                                    <div className="flex h-12 w-12 items-center justify-center border border-zinc-300 bg-white font-mono text-sm text-zinc-900 shadow-sm">
                                        M
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest">
                                <span className="text-zinc-400">
                                    H → X → Measure
                                </span>

                                <span className="text-blue-600">
                                    ready
                                </span>
                            </div>
                        </motion.div>

                        {/* State side */}
                        <motion.div
                            variants={fadeInUp}
                            className="lg:col-span-5"
                        >
                            <div className="border-b border-zinc-200 p-6 sm:p-8">
                                <div className="flex items-center justify-between">
                                    <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                                        State representation
                                    </span>

                                    <Activity
                                        className="h-4 w-4 text-blue-500"
                                        strokeWidth={1.5}
                                    />
                                </div>

                                <div className="mt-10">
                                    <div className="font-mono text-2xl tracking-tight text-zinc-950">
                                        |ψ⟩ = α|0⟩ + β|1⟩
                                    </div>

                                    <p className="mt-4 text-sm leading-6 text-zinc-500">
                                        The state is no longer just an equation.
                                        It becomes something you can inspect.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2">
                                <div className="p-6 sm:p-8">
                                    <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                                        P(|0⟩)
                                    </div>

                                    <div className="mt-3 font-mono text-2xl text-zinc-950">
                                        50.0%
                                    </div>

                                    <div className="mt-4 h-1 bg-zinc-200">
                                        <div className="h-full w-1/2 bg-blue-500" />
                                    </div>
                                </div>

                                <div className="border-l border-zinc-200 p-6 sm:p-8">
                                    <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                                        P(|1⟩)
                                    </div>

                                    <div className="mt-3 font-mono text-2xl text-zinc-950">
                                        50.0%
                                    </div>

                                    <div className="mt-4 h-1 bg-zinc-200">
                                        <div className="h-full w-1/2 bg-blue-500" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>


            {/* ================================================================ */}
            {/* WORKFLOW — BUILD / VISUALIZE / UNDERSTAND                        */}
            {/* ================================================================ */}

            <section className="border-b border-zinc-200 bg-[#f5f5f3]">
                <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={fadeInUp}
                        className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"
                    >
                        <div>
                            <div className="font-mono text-xs uppercase tracking-[0.2em] text-blue-600">
                                / 02 — Workflow
                            </div>

                            <h2 className="mt-4 max-w-xl text-3xl font-medium tracking-[-0.035em] text-zinc-950 sm:text-4xl">
                                From idea to circuit.
                            </h2>
                        </div>

                        <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                            BUILD / RUN / UNDERSTAND
                        </div>
                    </motion.div>


                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                        variants={staggerContainer}
                        className="mt-14 grid border-l border-t border-zinc-300 md:grid-cols-3"
                    >
                        {FEATURES.map(({ number, icon: Icon, title, description }, index) => (
                            <motion.div
                                key={title}
                                variants={fadeInUp}
                                className="group relative min-h-90 overflow-hidden border-b border-r border-zinc-300 bg-[#f5f5f3] p-8 transition-colors duration-300 hover:bg-white"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between">
                                    <span className="font-mono text-xs text-zinc-400">
                                        {number}
                                    </span>

                                    <Icon
                                        className="h-5 w-5 text-zinc-400 transition-colors duration-300 group-hover:text-blue-500"
                                        strokeWidth={1.5}
                                    />
                                </div>


                                {/* Mini visual */}
                                <div className="mt-10 h-24">
                                    {index === 0 && (
                                        <div className="relative h-full">
                                            <div className="absolute left-0 right-0 top-1/2 h-px bg-zinc-300" />

                                            <div className="absolute left-[18%] top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-zinc-300 bg-white font-mono text-xs transition-transform duration-300 group-hover:translate-y-[-65%]">
                                                H
                                            </div>

                                            <div className="absolute left-[52%] top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-blue-200 bg-blue-50 font-mono text-xs text-blue-600 transition-transform duration-300 group-hover:translate-y-[-65%]">
                                                X
                                            </div>

                                            <div className="absolute right-[10%] top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-zinc-300 bg-white font-mono text-xs transition-transform duration-300 group-hover:translate-y-[-65%]">
                                                M
                                            </div>
                                        </div>
                                    )}

                                    {index === 1 && (
                                        <div className="flex h-full items-center gap-2">
                                            {[28, 48, 72, 55, 84, 42, 66, 35].map((height, i) => (
                                                <div
                                                    key={i}
                                                    className="flex-1 bg-zinc-300 transition-all duration-500 group-hover:bg-blue-400"
                                                    style={{ height: `${height}%` }}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {index === 2 && (
                                        <div className="relative flex h-full items-center justify-center">
                                            <div className="absolute h-20 w-20 rounded-full border border-zinc-300 transition-all duration-500 group-hover:h-24 group-hover:w-24 group-hover:border-blue-300" />

                                            <div className="absolute h-2 w-2 rounded-full bg-blue-500" />

                                            <div className="absolute h-28 w-28 rotate-45 border border-dashed border-zinc-300 transition-transform duration-500 group-hover:rotate-90" />
                                        </div>
                                    )}
                                </div>


                                {/* Content */}
                                <div className="mt-10">
                                    <h3 className="text-2xl font-medium tracking-tight text-zinc-950">
                                        {title}
                                    </h3>

                                    <p className="mt-4 max-w-sm text-sm leading-6 text-zinc-500">
                                        {description}
                                    </p>
                                </div>

                                {/* Bottom interaction */}
                                <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-blue-500 transition-all duration-500 group-hover:w-full" />
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>


            {/* ================================================================ */}
            {/* TECHNICAL SECTION                                                 */}
            {/* ================================================================ */}

            <section className="bg-[#0b0d10] text-white">
                <div className="mx-auto max-w-7xl px-6 py-24 lg:py-28">

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={staggerContainer}
                    >
                        <motion.div
                            variants={fadeInUp}
                            className="flex flex-col justify-between gap-5 border-b border-zinc-800 pb-8 sm:flex-row sm:items-end"
                        >
                            <div>
                                <div className="font-mono text-xs uppercase tracking-[0.2em] text-blue-400">
                                    / 03 — Under the surface
                                </div>

                                <h2 className="mt-4 text-3xl font-medium tracking-[-0.035em] sm:text-4xl">
                                    Learn the abstraction.
                                    <br />
                                    <span className="text-zinc-500">
                                        Then look underneath it.
                                    </span>
                                </h2>
                            </div>

                            <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">
                                QMENTOR / SIMULATOR
                            </div>
                        </motion.div>


                        <div className="grid md:grid-cols-3">

                            {/* CODE */}
                            <motion.div
                                variants={fadeInUp}
                                className="border-b border-zinc-800 py-10 md:border-b-0 md:border-r md:pr-10"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Code2
                                            className="h-4 w-4 text-blue-400"
                                            strokeWidth={1.5}
                                        />

                                        <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                                            Circuit → Code
                                        </span>
                                    </div>

                                    <span className="font-mono text-[9px] text-zinc-700">
                                        QISKIT
                                    </span>
                                </div>

                                <div className="mt-8 border border-zinc-800 bg-[#080a0d] p-5 font-mono text-xs leading-7">
                                    <div className="text-zinc-600">
                                        01
                                    </div>

                                    <div>
                                        <span className="text-blue-400">qc</span>
                                        <span className="text-zinc-500">.</span>
                                        <span className="text-zinc-300">h</span>
                                        <span className="text-zinc-600">(</span>
                                        <span className="text-emerald-400">0</span>
                                        <span className="text-zinc-600">)</span>
                                    </div>

                                    <div>
                                        <span className="text-blue-400">qc</span>
                                        <span className="text-zinc-500">.</span>
                                        <span className="text-zinc-300">measure_all</span>
                                        <span className="text-zinc-600">()</span>
                                    </div>

                                    <div className="mt-3 text-zinc-600">
                            
                                    </div>
                                </div>
                            </motion.div>


                            {/* STATE */}
                            <motion.div
                                variants={fadeInUp}
                                className="border-b border-zinc-800 py-10 md:border-b-0 md:border-r md:px-10"
                            >
                                <div className="flex items-center gap-2">
                                    <Activity
                                        className="h-4 w-4 text-blue-400"
                                        strokeWidth={1.5}
                                    />

                                    <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                                        Quantum state
                                    </span>
                                </div>

                                <div className="mt-8">
                                    <div className="font-mono text-2xl text-zinc-200">
                                        |ψ⟩
                                    </div>

                                    <div className="mt-5 space-y-4">
                                        <div>
                                            <div className="mb-2 flex justify-between font-mono text-[10px]">
                                                <span className="text-zinc-500">
                                                    |0⟩
                                                </span>

                                                <span className="text-zinc-400">
                                                    50.0%
                                                </span>
                                            </div>

                                            <div className="h-1 bg-zinc-800">
                                                <div className="h-full w-1/2 bg-blue-500" />
                                            </div>
                                        </div>

                                        <div>
                                            <div className="mb-2 flex justify-between font-mono text-[10px]">
                                                <span className="text-zinc-500">
                                                    |1⟩
                                                </span>

                                                <span className="text-zinc-400">
                                                    50.0%
                                                </span>
                                            </div>

                                            <div className="h-1 bg-zinc-800">
                                                <div className="h-full w-1/2 bg-blue-500" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>


                            {/* EXPERIMENT */}
                            <motion.div
                                variants={fadeInUp}
                                className="py-10 md:pl-10"
                            >
                                <div className="flex items-center gap-2">
                                    <Braces
                                        className="h-4 w-4 text-blue-400"
                                        strokeWidth={1.5}
                                    />

                                    <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                                        Experiment
                                    </span>
                                </div>

                                <div className="mt-8">
                                    <div className="flex items-end gap-1.5">
                                        {[32, 48, 38, 70, 55, 82, 64, 42, 76].map(
                                            (height, i) => (
                                                <div
                                                    key={i}
                                                    className="w-2 bg-zinc-700"
                                                    style={{ height: `${height}px` }}
                                                />
                                            )
                                        )}
                                    </div>

                                    <div className="mt-6 font-mono text-xs text-zinc-400">
                                        measurement distribution
                                    </div>

                                    <p className="mt-3 max-w-xs text-sm leading-6 text-zinc-500">
                                        Change the circuit and immediately see how
                                        the resulting state behaves.
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </section>


            {/* ================================================================ */}
            {/* FINAL CTA                                                          */}
            {/* ================================================================ */}

            <section className="bg-white">
                <div className="mx-auto max-w-7xl px-6 py-28 lg:py-36">

                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                        className="group relative overflow-hidden border border-zinc-200 bg-[#f5f5f3]"
                    >
                        {/* Technical grid */}
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

                        {/* Subtle radial accent */}
                        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-400/10 blur-3xl transition-transform duration-700 group-hover:scale-125" />

                        <div className="relative grid lg:grid-cols-12">

                            <div className="px-8 py-16 sm:px-14 lg:col-span-8 lg:py-20">
                                <div className="font-mono text-xs uppercase tracking-[0.2em] text-blue-600">
                                    / Start experimenting
                                </div>

                                <h2 className="mt-5 max-w-3xl text-4xl font-medium leading-[1.05] tracking-[-0.045em] text-zinc-950 sm:text-5xl lg:text-6xl">
                                    Do not just learn what a qubit is.
                                    <br />
                                    <span className="text-zinc-400">
                                        Put one to work.
                                    </span>
                                </h2>

                                <div className="mt-9">
                                    <Link
                                        href="/builder"
                                        className="group/btn inline-flex items-center gap-3 bg-zinc-950 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-blue-600"
                                    >
                                        Launch the builder

                                        <ArrowUpRight
                                            className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5"
                                        />
                                    </Link>
                                </div>
                            </div>

                            {/* CTA visual */}
                            <div className="relative hidden overflow-hidden border-l border-zinc-200 lg:col-span-4 lg:block">

                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="relative h-52 w-52">

                                        <div className="absolute inset-0 rounded-full border border-zinc-300" />

                                        <div className="absolute inset-8 rounded-full border border-zinc-300" />

                                        <div className="absolute left-1/2 top-1/2 h-px w-full -translate-x-1/2 bg-zinc-300" />

                                        <div className="absolute left-1/2 top-1/2 h-full w-px -translate-y-1/2 bg-zinc-300" />

                                        <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500 shadow-[0_0_0_6px_rgba(59,130,246,0.08)]" />

                                        <div className="absolute left-[20%] top-[25%] font-mono text-[10px] text-zinc-400">
                                            |0⟩
                                        </div>

                                        <div className="absolute right-[18%] bottom-[24%] font-mono text-[10px] text-zinc-400">
                                            |1⟩
                                        </div>
                                    </div>
                                </div>

                                <div className="absolute bottom-6 left-6 font-mono text-[9px] uppercase tracking-widest text-zinc-400">
                                    READY / Q[0]
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>


            {/* ================================================================ */}
            {/* FOOTER                                                             */}
            {/* ================================================================ */}

            <footer className="border-t border-zinc-200 bg-white">
                <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">

                    <div className="flex items-center gap-2">
                        <Atom className="h-4 w-4 text-blue-600" />

                        <span className="font-medium text-sm text-zinc-800">
                            QMentor
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                        <span>Learn</span>
                        <span>Experiment</span>
                        <span>Understand</span>
                    </div>

                    <span className="font-mono text-[10px] text-zinc-400">
                        QUANTUM LAB / 2026
                    </span>
                </div>
            </footer>
        </main>
    );
}