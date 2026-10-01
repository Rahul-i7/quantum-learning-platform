'use client'

import { useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, AppRole } from '@/lib/supabase/AuthProvider'

interface Props {
  children: ReactNode
  roles?: AppRole[]
}

export default function RequireAuth({ children, roles }: Props) {
  const { user, role, loading, configured } = useAuth()
  const router = useRouter()

  const signedOut = configured && !loading && !user
  const wrongRole = configured && !loading && !!user && !!role && !!roles && !roles.includes(role)

  useEffect(() => {
    if (signedOut) router.replace('/login')
    else if (wrongRole) router.replace('/learn')
  }, [signedOut, wrongRole, router])

  if (!configured) return <>{children}</>

  if (loading || signedOut || wrongRole) {
    return (
      <div className="flex flex-1 items-center justify-center p-12 text-sm text-zinc-400">
        Loading…
      </div>
    )
  }

  return <>{children}</>
}
