'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Atom, LayoutGrid, Gauge, BookOpen, LogOut, LogIn } from 'lucide-react'
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
    <header className="sticky w-[100vw] top-0 z-40 border-b border-gray-200 backdrop-blur-2xl">
      <div className="mx-auto flex h-16 w-full items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-gray-800">
          <Atom className="h-5 w-5 text-blue-600" />
          <span className="hidden sm:inline">QMentor</span>
          <span className="sm:hidden">QM</span>
        </Link>

        <nav className="flex items-center gap-1">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname?.startsWith(`${href}/`)
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            )
          })}

          <div className="ml-2 border-l border-gray-200 pl-3">
            {!configured ? (
              <span className="text-xs text-gray-400" title="Supabase not configured">
                Guest
              </span>
            ) : user ? (
              <button
                onClick={() => signOut()}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                title={user.email ?? undefined}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Sign in</span>
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}
