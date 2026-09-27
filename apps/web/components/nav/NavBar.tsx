'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
  Atom,
  LayoutGrid,
  Gauge,
  BookOpen,
  LogOut,
  LogIn,
} from 'lucide-react'

import { useAuth } from '@/lib/supabase/AuthProvider'

const LINKS = [
  { href: '/learn', label: 'Learn', icon: BookOpen },
  { href: '/builder', label: 'Builder', icon: LayoutGrid },
  { href: '/dashboard', label: 'Dashboard', icon: Gauge },
]

export default function NavBar() {
  const pathname = usePathname()
  const { user, signOut, configured } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-16 w-full items-center justify-between px-6">

        {/* Logo */}
        <Link
          href="/"
          className="group flex items-center gap-2.5"
        >
          <Atom
            className="h-5 w-5 text-blue-600 transition-colors group-hover:text-blue-500"
            strokeWidth={2}
          />

          <span className="text-[16px] font-semibold tracking-[-0.02em] text-zinc-900">
            QMentor
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1">

          {LINKS.map(({ href, label, icon: Icon }) => {
            const isActive =
              pathname === href ||
              pathname?.startsWith(`${href}/`)

            return (
              <Link
                key={href}
                href={href}
                className={`
                  flex h-9 items-center gap-2 rounded-md px-3
                  text-sm transition-colors
                  ${
                    isActive
                      ? 'bg-zinc-100 font-medium text-zinc-950'
                      : 'font-normal text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950'
                  }
                `}
              >
                <Icon
                  className="h-4 w-4"
                  strokeWidth={1.7}
                />
                {label}
              </Link>
            )
          })}

          {/* Account */}
          <div className="ml-3 border-l border-zinc-200 pl-3">

            {!configured ? (
              <span
                className="flex h-9 items-center px-3 text-xs font-mono text-zinc-400"
                title="Supabase not configured"
              >
                Guest
              </span>

            ) : user ? (
              <button
                onClick={() => signOut()}
                className="
                  flex h-9 items-center gap-2 rounded-md px-3
                  text-sm text-zinc-600
                  transition-colors
                  hover:bg-zinc-50 hover:text-zinc-950
                "
                title={user.email ?? undefined}
              >
                <LogOut
                  className="h-4 w-4"
                  strokeWidth={1.7}
                />

                <span className="hidden sm:inline">
                  Sign out
                </span>
              </button>

            ) : (
              <Link
                href="/login"
                className="
                  flex h-9 items-center gap-2 rounded-md px-3
                  text-sm text-zinc-600
                  transition-colors
                  hover:bg-zinc-50 hover:text-zinc-950
                "
              >
                <LogIn
                  className="h-4 w-4"
                  strokeWidth={1.7}
                />

                <span className="hidden sm:inline">
                  Sign in
                </span>
              </Link>
            )}

          </div>
        </nav>
      </div>
    </header>
  )
}