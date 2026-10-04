import Link from 'next/link'
import { Lock } from 'lucide-react'
import NavBar from '@/components/nav/NavBar'

interface DemoUnavailableProps {
    title: string
    description: string
    preview: 'profile' | 'settings'
}

const bar = 'rounded-sm bg-zinc-200/80'

function ProfileGhost() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-zinc-200/80" />
                <div className="space-y-2">
                    <div className={`h-3 w-32 ${bar}`} />
                    <div className={`h-2.5 w-44 ${bar}`} />
                </div>
            </div>
            {[0, 1, 2].map((i) => (
                <div key={i} className="space-y-2">
                    <div className={`h-2.5 w-20 ${bar}`} />
                    <div className="h-9 w-full rounded-md border border-zinc-200" />
                </div>
            ))}
        </div>
    )
}

function SettingsGhost() {
    return (
        <div className="divide-y divide-zinc-200">
            {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                    <div className="space-y-2">
                        <div className={`h-3 w-28 ${bar}`} />
                        <div className={`h-2.5 w-40 ${bar}`} />
                    </div>
                    <div className="h-5 w-9 rounded-full bg-zinc-200/80" />
                </div>
            ))}
        </div>
    )
}

export default function DemoUnavailable({ title, description, preview }: DemoUnavailableProps) {
    return (
        <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-[#fafafa] text-zinc-950">
            <NavBar />
            <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-start justify-center gap-12 px-6 py-16 md:flex-row md:items-center md:gap-20">
                <div className="flex-1">
                    <h1 className="max-w-md text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
                        {title}
                    </h1>
                    <p className="mt-4 max-w-md text-base leading-7 text-zinc-600">{description}</p>
                    <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                        <Link
                            href="/dashboard"
                            className="flex h-10 items-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                        >
                            Back to dashboard
                        </Link>
                        <Link
                            href="/builder"
                            className="text-sm font-medium text-zinc-700 underline-offset-4 transition-colors hover:text-zinc-950 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
                        >
                            Open the builder
                        </Link>
                    </div>
                </div>

                {/* Faded outline of the page that exists in the full version */}
                <div
                    aria-hidden="true"
                    className="relative w-full select-none rounded-md border border-dashed border-zinc-300 bg-white/60 p-6 md:w-85"
                >
                    <div className="opacity-70">
                        {preview === 'profile' ? <ProfileGhost /> : <SettingsGhost />}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 bg-white">
                            <Lock className="h-5 w-5 text-zinc-500" strokeWidth={1.7} />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}