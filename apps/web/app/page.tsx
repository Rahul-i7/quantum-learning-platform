import Link from "next/link";
import { ArrowRight, Blocks, Sparkles, Waves } from "lucide-react";
import NavBar from "@/components/nav/NavBar";
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

export default function Home() {
    return (
        <main className="flex flex-1 flex-col items-center bg-gray-50">
            <NavBar />
            <section className="mx-auto flex w-full max-w-4xl flex-col items-center px-6 py-24 text-center">
                <span className="mb-4 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-blue-700">
                    AI-Based Interactive Quantum Algorithm Learning Platform
                </span>
                <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight text-gray-900 sm:text-5xl">
                    Learn quantum computing by building it.
                </h1>
                <p className="mt-5 max-w-xl text-lg leading-8 text-gray-600">
                    Design circuits with drag-and-drop gates, simulate them in real time,
                    and visualize the quantum states behind the math — no hardware, no
                    heavy theory required to get started.
                </p>

                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                    <Link
                        href="/builder"
                        className="group flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                    >
                        Open the Circuit Builder
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                </div>
            </section>

            <section className="w-full border-t border-gray-200 bg-white">
                <div className="mx-auto grid max-w-4xl gap-8 px-6 py-16 sm:grid-cols-3">
                    {FEATURES.map(({ icon: Icon, title, description }) => (
                        <div key={title} className="flex flex-col items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                                <Icon className="h-5 w-5 text-blue-600" />
                            </div>
                            <h3 className="font-semibold text-gray-800">{title}</h3>
                            <p className="text-sm leading-6 text-gray-600">{description}</p>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
}
