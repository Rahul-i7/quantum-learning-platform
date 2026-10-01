'use client'

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from './client'

export type AppRole = 'student' | 'instructor' | 'admin' | 'guest'

export interface Profile {
  name: string
  role: AppRole
}

interface AuthResult {
  error: string | null
  role?: AppRole
  needsConfirmation?: boolean
}

interface AuthContextValue {
  user: User | null
  session: Session | null
  profile: Profile | null
  role: AppRole | null
  loading: boolean
  configured: boolean
  signInWithPassword: (email: string, password: string) => Promise<AuthResult>
  signUp: (email: string, password: string, name?: string) => Promise<AuthResult>
  signInAsGuest: () => Promise<AuthResult>
  /** Turns the current guest into a permanent student account, keeping their progress. */
  upgradeGuest: (email: string, password: string, name?: string) => Promise<AuthResult>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const isConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
)

async function fetchProfile(user: User): Promise<Profile> {
  const fallback: Profile = {
    name: (user.user_metadata?.name as string) || 'Learner',
    role: user.is_anonymous ? 'guest' : 'student',
  }
  try {
    const { data } = await getSupabaseBrowserClient()
      .from('profiles')
      .select('name, role')
      .eq('user_id', user.id)
      .maybeSingle()
    return data ? { name: data.name, role: data.role as AppRole } : fallback
  } catch {
    return fallback
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(isConfigured)

  useEffect(() => {
    if (!isConfigured) return // Supabase not wired up yet — render as "signed out" everywhere.

    const supabase = getSupabaseBrowserClient()

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (!data.session) setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      if (!newSession) {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  // Load the profile (name + role) whenever the signed-in user changes.
  const userId = session?.user?.id
  useEffect(() => {
    if (!isConfigured || !session?.user) return
    let cancelled = false
    fetchProfile(session.user).then((p) => {
      if (!cancelled) {
        setProfile(p)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, session?.user?.is_anonymous])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      profile,
      role: profile?.role ?? null,
      loading,
      configured: isConfigured,

      async signInWithPassword(email, password) {
        if (!isConfigured) return { error: 'Supabase is not configured yet.' }
        const { data, error } = await getSupabaseBrowserClient().auth.signInWithPassword({ email, password })
        if (error || !data.user) return { error: error?.message ?? 'Sign-in failed.' }
        const p = await fetchProfile(data.user)
        return { error: null, role: p.role }
      },

      async signUp(email, password, name) {
        if (!isConfigured) return { error: 'Supabase is not configured yet.' }
        // Role is NOT sent from the client; the database trigger always creates a 'student'.
        const { data, error } = await getSupabaseBrowserClient().auth.signUp({
          email,
          password,
          options: { data: { name: name || 'Learner' } },
        })
        if (error) return { error: error.message }
        // With "Confirm email" ON in Supabase there is no session until the link is clicked.
        if (!data.session) return { error: null, needsConfirmation: true }
        return { error: null, role: 'student' }
      },

      async signInAsGuest() {
        if (!isConfigured) return { error: 'Supabase is not configured yet.' }
        const { error } = await getSupabaseBrowserClient().auth.signInAnonymously()
        if (error) return { error: error.message }
        return { error: null, role: 'guest' }
      },

      async upgradeGuest(email, password, name) {
        if (!isConfigured) return { error: 'Supabase is not configured yet.' }
        const supabase = getSupabaseBrowserClient()
        const { error } = await supabase.auth.updateUser({
          email,
          password,
          data: { name: name || 'Learner' },
        })
        if (error) return { error: error.message }
        // Refresh so the new (non-anonymous) session and profile are picked up.
        await supabase.auth.refreshSession()
        return { error: null, role: 'student' }
      },

      async signOut() {
        if (!isConfigured) return
        await getSupabaseBrowserClient().auth.signOut()
      },
    }),
    [session, profile, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
