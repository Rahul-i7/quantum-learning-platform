'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/supabase/AuthProvider'
import { LogIn, UserPlus, Mail, Lock, User, AlertCircle, Sparkles, UserRound } from 'lucide-react'

export default function LoginPage() {
  const { signInWithPassword, signUp, signInAsGuest, configured } = useAuth()
  const router = useRouter()

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
    <div className="flex h-screen w-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-xl">
        {/* Brand Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-inner">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {mode === 'signin' ? 'Welcome back' : 'Create an account'}
          </h1>
          <p className="mt-1 text-xs text-gray-500">
            Track your quantum lessons, quiz scores, and coding progress.
          </p>
        </div>


        {/* Supabase Unconfigured Warning */}
        {!configured && (
          <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>
              Supabase environment variables are missing. Authentication actions are disabled.
            </span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'signup' && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Alex Turing"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="email"
                required
                placeholder="alex@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs font-medium text-red-600">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {notice && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-xs text-green-800">
              {notice}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !configured}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <span>Please wait…</span>
            ) : mode === 'signin' ? (
              <>
                <LogIn className="h-4 w-4" />
                <span>Sign in</span>
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                <span>Create account</span>
              </>
            )}
          </button>
        </form>

        {/* Guest login */}
        <div className="mt-5">
          <div className="relative flex items-center">
            <div className="flex-grow border-t border-gray-200" />
            <span className="mx-3 text-[11px] uppercase tracking-wide text-gray-400">or</span>
            <div className="flex-grow border-t border-gray-200" />
          </div>
          <button
            type="button"
            onClick={handleGuest}
            disabled={submitting || !configured}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white py-2.5 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            <UserRound className="h-4 w-4" />
            <span>Continue as guest</span>
          </button>
          <p className="mt-2 text-center text-[11px] text-gray-400">
            Explore without an account. Sign up later to keep your progress.
          </p>
        </div>

        {/* Footer Toggle Text */}
        <div className="mt-6 text-center text-xs text-gray-500">
          {mode === 'signin' ? (
            <p>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => toggleMode('signup')}
                className="font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => toggleMode('signin')}
                className="font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}