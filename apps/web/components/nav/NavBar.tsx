'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
    Atom,
    LayoutGrid,
    Gauge,
    BookOpen,
    LogOut,
    LogIn,
    Code,
    Menu,
    X,
} from 'lucide-react'

import { useAuth } from '@/lib/supabase/AuthProvider'

const LINKS = [
    { href: '/learn', label: 'Learn', icon: BookOpen },
    { href: '/builder', label: 'Builder', icon: LayoutGrid },
    { href: '/editor', label: 'Editor', icon: Code },
    { href: '/dashboard', label: 'Dashboard', icon: Gauge },
]

export default function NavBar() {
    const pathname = usePathname()
    const { user, profile, role, signOut, configured } = useAuth()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    return (
        <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/95 backdrop-blur-md">
            <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between px-4 sm:px-6">

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

                {/* Identity badge */}
                <div
                    className="flex items-center justify-center gap-2 rounded-full border border-zinc-200 px-3.5 py-2"
                    title={
                        !configured
                            ? 'Demo mode: sign-in is not configured.'
                            : user
                              ? `Signed in as ${profile?.name ?? 'Learner'}`
                              : 'Not signed in'
                    }
                >
                    <span
                        className={`h-1.5 w-1.5 rounded-full ${
                            role === 'instructor' || role === 'admin'
                                ? 'bg-purple-500'
                                : role === 'guest'
                                  ? 'bg-amber-500'
                                  : 'bg-blue-500'
                        }`}
                    />
                    <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
                        {!configured
                            ? 'Demo'
                            : role === 'instructor' || role === 'admin'
                              ? 'Mentor'
                              : role === 'guest'
                                ? 'Guest'
                                : role === 'student'
                                  ? 'Student'
                                  : 'Signed out'}
                    </span>
                    {user && profile && (
                        <span className="text-xs text-zinc-500">{profile.name}</span>
                    )}
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden items-center gap-1 md:flex">
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
                  ${isActive
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
                                className="flex h-9 items-center px-3 font-mono text-xs text-zinc-400"
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

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="flex h-10 w-10 items-center justify-center rounded-md border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-100 md:hidden"
                    aria-label="Toggle navigation menu"
                >
                    {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
            </div>

            {/* Mobile Menu Drawer */}
            {mobileMenuOpen && (
                <div className="border-t border-zinc-200 bg-white px-4 py-3 shadow-lg md:hidden">
                    <nav className="flex flex-col gap-1.5">
                        {LINKS.map(({ href, label, icon: Icon }) => {
                            const isActive =
                                pathname === href ||
                                pathname?.startsWith(`${href}/`)

                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`
                    flex h-10 items-center gap-3 rounded-md px-3.5
                    text-sm font-medium transition-colors
                    ${isActive
                                            ? 'bg-blue-50 text-blue-600'
                                            : 'text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950'
                                        }
                  `}
                                >
                                    <Icon className="h-4 w-4" strokeWidth={1.7} />
                                    {label}
                                </Link>
                            )
                        })}

                        <div className="mt-2 border-t border-zinc-100 pt-2">
                            {!configured ? (
                                <div className="px-3.5 py-2 font-mono text-xs text-zinc-400">
                                    Guest Mode
                                </div>
                            ) : user ? (
                                <button
                                    onClick={() => {
                                        signOut()
                                        setMobileMenuOpen(false)
                                    }}
                                    className="flex h-10 w-full items-center gap-3 rounded-md px-3.5 text-sm font-medium text-red-600 hover:bg-red-50"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Sign out
                                </button>
                            ) : (
                                <Link
                                    href="/login"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex h-10 items-center gap-3 rounded-md px-3.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                                >
                                    <LogIn className="h-4 w-4" />
                                    Sign in
                                </Link>
                            )}
                        </div>
                    </nav>
                </div>
            )}
        </header>
    )
}