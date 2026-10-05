'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/supabase/AuthProvider'
import { LogIn, UserPlus, Mail, Lock, User, AlertCircle, Sparkles, UserRound, EyeClosed, Eye } from 'lucide-react'

export default function LoginPage() {
    const { signInWithPassword, signUp, signInAsGuest, configured } = useAuth()
    const router = useRouter()

    const [mode, setMode] = useState<'signin' | 'signup'>('signin')
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [notice, setNotice] = useState<string | null>(null)

    // Mentors land on the dashboard; everyone else starts in Learn.
    function goHome(role?: string) {
        router.push(role === 'instructor' || role === 'admin' ? '/dashboard' : '/learn')
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)
        setNotice(null)
        setSubmitting(true)

        const result =
            mode === 'signin'
                ? await signInWithPassword(email, password)
                : await signUp(email, password, name)

        setSubmitting(false)

        if (result.error) {
            setError(result.error)
            return
        }
        if (result.needsConfirmation) {
            setNotice('Account created. Check your email and click the confirmation link, then sign in.')
            setMode('signin')
            return
        }
        goHome(result.role)
    }

    async function handleGuest() {
        setError(null)
        setNotice(null)
        setSubmitting(true)
        const result = await signInAsGuest()
        setSubmitting(false)
        if (result.error) {
            setError(result.error)
            return
        }
        goHome('guest')
    }

    const toggleMode = (newMode: 'signin' | 'signup') => {
        setMode(newMode)
        setError(null)
    }

    return (
        <div className="min-h-screen bg-[#fafafa] text-zinc-950 lg:grid lg:grid-cols-[1.05fr_0.95fr] dark:bg-[#0a0a0a] dark:text-zinc-100">

            {/* ========================================================= */}
            {/* LEFT — QMentor identity / quantum visual                  */}
            {/* ========================================================= */}

            <section className="relative hidden min-h-screen overflow-hidden bg-[#0b0d10] text-white lg:flex lg:flex-col">

                {/* Technical grid */}
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.09]"
                    style={{
                        backgroundImage: `
            linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
          `,
                        backgroundSize: '48px 48px',
                    }}
                />

                {/* Blue glow */}
                <div className="pointer-events-none absolute -left-32 top-1/4 h-125 w-125 rounded-full bg-blue-600/10 blur-[120px]" />

                {/* Header */}
                <div className="relative z-10 flex items-center justify-between px-12 py-8">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center border border-blue-500/30 bg-blue-500/10">
                            <Sparkles className="h-4 w-4 text-blue-400" />
                        </div>

                        <span className="text-lg font-semibold tracking-tight">
                            QMentor
                        </span>
                    </div>

                    <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                        Quantum Learning System
                    </div>
                </div>

                {/* Main visual */}
                <div className="relative z-10 flex flex-1 flex-col justify-center px-12 pb-20">

                    <div className="mb-5 flex items-center gap-3">
                        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-400">
                            Quantum Computing
                        </span>

                        <span className="h-px w-16 bg-zinc-700" />
                    </div>

                    <h2 className="max-w-xl text-6xl font-semibold leading-[0.95] tracking-[-0.055em] xl:text-7xl">
                        Learn to
                        <br />
                        <span className="text-blue-500">think</span>
                        <br />
                        in qubits.
                    </h2>

                    <p className="mt-8 max-w-md text-sm leading-7 text-zinc-400">
                        Explore quantum concepts, build circuits, write Qiskit code,
                        and understand what happens to the quantum state.
                    </p>

                    {/* Quantum visual */}
                    <div className="relative mt-16 h-57.5 w-full max-w-xl">

                        {/* horizontal axis */}
                        <div className="absolute left-0 right-0 top-1/2 h-px bg-zinc-800" />

                        {/* vertical axis */}
                        <div className="absolute bottom-0 left-1/2 top-0 w-px bg-zinc-800" />

                        {/* orbit 1 */}
                        <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-zinc-700" />

                        {/* orbit 2 */}
                        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-zinc-800" />

                        {/* state vector */}
                        <div className="absolute left-1/2 top-1/2 h-24 w-px origin-bottom -translate-x-1/2 -translate-y-full rotate-38 bg-blue-500">
                            <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.8)]" />
                        </div>

                        {/* center */}
                        <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500 shadow-[0_0_18px_rgba(59,130,246,0.7)]" />

                        {/* labels */}
                        <span className="absolute left-1/2 top-1 -translate-x-1/2 font-mono text-[9px] text-zinc-600">
                            |0⟩
                        </span>

                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 font-mono text-[9px] text-zinc-600">
                            |1⟩
                        </span>

                        <span className="absolute right-0 top-1/2 -translate-y-1/2 font-mono text-[9px] text-zinc-600">
                            +X
                        </span>

                        <span className="absolute left-0 top-1/2 -translate-y-1/2 font-mono text-[9px] text-zinc-600">
                            −X
                        </span>

                        {/* metadata */}
                        <div className="absolute bottom-0 right-0 font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-600">
                            STATE / 01
                        </div>
                    </div>

                    {/* Bottom metadata */}
                    <div className="mt-auto flex gap-10 pt-12">
                        <div>
                            <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-600">
                                Learn
                            </div>
                            <div className="mt-1 text-xs text-zinc-400">
                                Quantum fundamentals
                            </div>
                        </div>

                        <div>
                            <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-600">
                                Build
                            </div>
                            <div className="mt-1 text-xs text-zinc-400">
                                Interactive circuits
                            </div>
                        </div>

                        <div>
                            <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-600">
                                Explore
                            </div>
                            <div className="mt-1 text-xs text-zinc-400">
                                Qiskit + simulation
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            {/* ========================================================= */}
            {/* RIGHT — Authentication                                     */}
            {/* ========================================================= */}

            <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10 sm:px-8">

                {/* subtle mobile/background grid */}
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.45] dark:invert"
                    style={{
                        backgroundImage: `
            linear-gradient(rgba(24,24,27,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(24,24,27,0.035) 1px, transparent 1px)
          `,
                        backgroundSize: '48px 48px',
                    }}
                />

                <div className="relative z-10 w-full max-w-107.5">

                    {/* Mobile brand */}
                    <div className="mb-10 flex items-center justify-between lg:hidden">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-500/10">
                                <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>

                            <span className="text-lg font-semibold tracking-tight">
                                QMentor
                            </span>
                        </div>

                        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-400">
                            Quantum Learning
                        </span>
                    </div>

                    {/* Auth header */}
                    <div className="mb-8">

                        <div className="mb-4 flex items-center gap-3">
                            <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
                                {mode === 'signin' ? '01 / Sign in' : '01 / Create account'}
                            </span>

                            <span className="h-px w-10 bg-zinc-200 dark:bg-zinc-700" />
                        </div>

                        <h1 className="text-4xl font-semibold tracking-[-0.04em] text-zinc-950 dark:text-zinc-100">
                            {mode === 'signin'? 'Welcome back.' : 'Start learning.'}
                        </h1>

                        <p className="mt-3 max-w-sm text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                            {mode === 'signin'
                                ? 'Continue your quantum learning journey.'
                                : 'Create your QMentor account and begin exploring quantum computing.'}
                        </p>
                    </div>


                    {/* Supabase warning */}
                    {!configured && (
                        <div className="mb-5 flex items-start gap-3 border-l-2 border-amber-500 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />

                            <span className="leading-5">
                                Supabase environment variables are missing.
                                Authentication actions are disabled.
                            </span>
                        </div>
                    )}


                    {/* Auth form */}
                    <form
                        onSubmit={handleSubmit}
                        className="rounded-md border border-zinc-200 bg-white p-6 shadow-[0_18px_60px_rgba(0,0,0,0.05)] sm:p-7 dark:border-zinc-800 dark:bg-[#111111]"
                    >

                        <div className="space-y-5">

                            {/* Name */}
                            {mode === 'signup' && (
                                <div>
                                    <label className="mb-2 block font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                                        Full name
                                    </label>

                                    <div className="relative">
                                        <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

                                        <input
                                            type="text"
                                            placeholder="Your Name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="
                      h-11 w-full border border-zinc-200 bg-zinc-50/50
                      pl-10 pr-3 text-sm text-zinc-900
                      placeholder:text-zinc-400
                      outline-none transition
                      focus:border-blue-500 focus:bg-white
                      focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100 dark:focus:bg-zinc-800
                    "
                                        />
                                    </div>
                                </div>
                            )}


                            {/* Email */}
                            <div>
                                <label className="mb-2 block font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                                    Email address
                                </label>

                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

                                    <input
                                        type="email"
                                        required
                                        placeholder="your-email@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="
                    h-11 w-full border border-zinc-200 bg-zinc-50/50
                    pl-10 pr-3 text-sm text-zinc-900
                    placeholder:text-zinc-400
                    outline-none transition
                    focus:border-blue-500 focus:bg-white
                    focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100 dark:focus:bg-zinc-800
                  "
                                    />
                                </div>
                            </div>


                            {/* Password */}
                            <div>
                                <div className="mb-2 flex items-center justify-between">
                                    <label className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                                        Password
                                    </label>

                                    {mode === 'signin' && (
                                        <button
                                            type="button"
                                            className="cursor-pointer hover:underline font-mono text-[9px] uppercase tracking-[0.12em] text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                        >
                                            Forgot?
                                        </button>
                                    )}
                                </div>

                                <div className="transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 px-3 border border-zinc-200 bg-zinc-50/50 w-full relative flex justify-between items-center dark:focus:bg-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/50">
                                    <div className="flex grow justify-center items-center gap-3">
                                        <Lock className="h-4 w-4 text-zinc-400" />

                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            minLength={6}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="h-11 w-full text-sm text-zinc-900 placeholder:text-zinc-400 outline-none dark:text-zinc-100"
                                        />
                                    </div>
                                    <button
                                        type='button'
                                        onClick={() => setShowPassword(!showPassword)}
                                        className='flex h-5 w-5 justify-center items-center text-zinc-400 cursor-pointer'>
                                        {showPassword ? <EyeClosed /> : <Eye />}
                                    </button>
                                </div>
                            </div>


                            {/* Error */}
                            {error && (
                                <div className="flex items-start gap-2 border-l-2 border-red-500 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700 dark:bg-red-500/10 dark:text-red-400">
                                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}


                            {/* Success */}
                            {notice && (
                                <div className="border-l-2 border-emerald-500 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                                    {notice}
                                </div>
                            )}


                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={submitting || !configured}
                                className="cursor-pointer 
                group mt-1 flex h-11 w-full items-center justify-center
                gap-2 bg-zinc-950 px-4 text-sm font-medium text-white
                transition-all hover:bg-blue-600
                active:bg-blue-700
                disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-950
              "
                            >
                                {submitting ? (
                                    <>
                                        <span className="h-3.5 w-3.5 animate-spin rounded-full border border-white/30 border-t-white dark:border-zinc-950/30 dark:border-t-zinc-950" />
                                        <span>Authenticating…</span>
                                    </>
                                ) : mode === 'signin' ? (
                                    <>
                                        <LogIn className="h-4 w-4" />
                                        <span>Sign in to QMentor</span>
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="h-4 w-4" />
                                        <span>Create QMentor account</span>
                                    </>
                                )}
                            </button>

                        </div>


                        {/* Guest */}
                        <div className="mt-6">

                            <div className="flex items-center gap-3">
                                <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />

                                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-400">
                                    or
                                </span>

                                <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
                            </div>

                            <button
                                type="button"
                                onClick={handleGuest}
                                disabled={submitting || !configured}
                                className="cursor-pointer 
                mt-5 flex h-11 w-full items-center justify-center gap-2
                border border-zinc-200 bg-white text-sm font-medium
                text-zinc-700 transition-colors
                hover:border-zinc-300 hover:bg-zinc-50
                disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-[#111111] dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800
              "
                            >
                                <UserRound className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                                <span>Continue as guest</span>
                            </button>

                            <p className="mt-2.5 text-center text-[10px] leading-5 text-zinc-400">
                                Explore QMentor without an account.
                                <br />
                                Sign up later to keep your progress.
                            </p>
                        </div>

                    </form>


                    {/* Mode toggle */}
                    <div className="mt-7 text-center text-xs text-zinc-500 dark:text-zinc-400">
                        {mode === 'signin' ? (
                            <p>
                                Don't have an account?{' '}
                                <button
                                    type="button"
                                    onClick={() => toggleMode('signup')}
                                    className="cursor-pointer font-semibold text-blue-600 transition-colors hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                    Create one
                                </button>
                            </p>
                        ) : (
                            <p>
                                Already have an account?{' '}
                                <button
                                    type="button"
                                    onClick={() => toggleMode('signin')}
                                    className="cursor-pointer font-semibold text-blue-600 transition-colors hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                    Sign in
                                </button>
                            </p>
                        )}
                    </div>


                    {/* Footer metadata */}
                    <div className="mt-10 flex items-center justify-center gap-4 font-mono text-[8px] uppercase tracking-[0.16em] text-zinc-400">
                        <span>QMentor</span>
                        <span className="h-1 w-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                        <span>Quantum Learning</span>
                        <span className="h-1 w-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                        <span>v1.0</span>
                    </div>

                </div>
            </section>
        </div>
    )
}