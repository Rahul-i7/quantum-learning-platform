'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ProfileMenu from './ProfileMenu'
import { AnimatePresence, motion } from 'motion/react'
import { Atom, LayoutGrid, Gauge, BookOpen, LogOut, LogIn, Code, Menu, X } from 'lucide-react'
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
    const [openProfile, setOpenProfile] = useState(false)

    const desktopProfileRef = useRef<HTMLDivElement>(null)
    const mobileProfileRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            const target = e.target as Node

            if (
                !desktopProfileRef.current?.contains(target) &&
                !mobileProfileRef.current?.contains(target)
            ) {
                setOpenProfile(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    return (
        <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/95 backdrop-blur-md">
            <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between px-4 sm:px-6">

                <div className="flex items-center gap-2 -ml-2">
                    {/* Hamburger */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden flex h-9 w-9 items-center justify-center rounded-md border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-100"
                        aria-label="Toggle navigation menu"
                    >
                        {mobileMenuOpen ? (
                            <X className="h-5 w-5" />
                        ) : (
                            <Menu className="h-5 w-5" />
                        )}
                    </button>
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
                </div>



                {/* Desktop Navigation */}
                <nav className="hidden items-center gap-1 md:flex">
                    {LINKS.map(({ href, label, icon: Icon }) => {
                        const isActive = pathname === href || pathname?.startsWith(`${href}/`)
                        return (
                            <Link key={href} href={href} className={`flex h-9 items-center gap-2 rounded-md px-3 text-sm transition-colors ${isActive ? 'bg-zinc-100 font-medium text-zinc-950' : 'font-normal text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950'}`}>
                                <Icon className="h-4 w-4" strokeWidth={1.7} />
                                {label}
                            </Link>
                        )
                    })}

                    {/* Account */}
                    <div ref={desktopProfileRef} className="relative ml-3 border-l border-zinc-200 pl-3">
                        {!configured ? (
                            <span className="flex h-9 items-center px-3 font-mono text-xs text-zinc-400" title="Supabase not configured">Guest</span>
                        ) : user ? (
                            <button onClick={() => setOpenProfile(!openProfile)} className={`text-white flex h-9 w-9 cursor-pointer items-center justify-center rounded-full ${role === 'instructor' || role === 'admin'
                                ? 'bg-purple-500'
                                : 'bg-blue-500'
                                }`}>
                                {profile?.name[0].toUpperCase()}
                            </button>
                        ) : (
                            <Link href="/login" className="flex h-9 items-center gap-2 rounded-md px-3 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-950">
                                <LogIn className="h-4 w-4" strokeWidth={1.7} />
                                <span className="hidden sm:inline">Sign in</span>
                            </Link>
                        )}
                        {(openProfile && user) && (
                            <AnimatePresence>
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, x: 10, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, x: 10, y: -10 }}
                                    className="absolute top-full right-0 mt-2 w-56 rounded-md bg-white/95 shadow-lg py-1 border border-zinc-200"
                                >
                                    <ProfileMenu />
                                </motion.div>
                            </AnimatePresence>
                        )}
                    </div>
                </nav>
                <div className="flex items-center gap-2 md:hidden">
                    {/* Profile */}
                    {configured && (
                        <div ref={mobileProfileRef} className="relative">
                            {user ? (<button
                                onClick={() => setOpenProfile(!openProfile)}
                                className={`flex cursor-pointer h-9 w-9 items-center justify-center rounded-full text-sm font-medium text-white ${role === 'instructor' || role === 'admin'
                                    ? 'bg-purple-500'
                                    : 'bg-blue-500'
                                    }`}
                                aria-label="Open profile menu"
                            >
                                {profile?.name?.[0]?.toUpperCase()}
                            </button>) : (
                                <Link href="/login" className="flex h-9 items-center gap-2 rounded-md px-3 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-950">
                                    <LogIn className="h-4 w-4" strokeWidth={1.7} />
                                    <span className="hidden sm:inline">Sign in</span>
                                </Link>
                            )}

                            {(openProfile && user) && <AnimatePresence>
                                {openProfile && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -6 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -6 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-lg"
                                    >
                                        <ProfileMenu />
                                    </motion.div>
                                )}
                            </AnimatePresence>}
                        </div>
                    )}

                </div>
            </div>

            {/* Mobile Menu Drawer */}
            {mobileMenuOpen && (
                <div className="border-t border-zinc-200 bg-white px-4 py-3 shadow-lg md:hidden">
                    <nav className="flex flex-col gap-1.5">
                        {LINKS.map(({ href, label, icon: Icon }) => {
                            const isActive = pathname === href || pathname?.startsWith(`${href}/`)
                            return (
                                <Link key={href} href={href} onClick={() => setMobileMenuOpen(false)} className={`flex h-10 items-center gap-3 rounded-md px-3.5 text-sm font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-600' : 'text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950'}`}>
                                    <Icon className="h-4 w-4" strokeWidth={1.7} />
                                    {label}
                                </Link>
                            )
                        })}
                    </nav>
                </div>
            )}
        </header>
    )
}