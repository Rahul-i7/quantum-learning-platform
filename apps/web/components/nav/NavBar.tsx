'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Atom, LayoutGrid, Gauge } from 'lucide-react'

const LINKS = [
  { href: '/builder', label: 'Builder', icon: LayoutGrid },
  { href: '/dashboard', label: 'Dashboard', icon: Gauge },
]

export default function NavBar() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-gray-800">
          <Atom className="h-5 w-5 text-blue-600" />
          <span className="hidden sm:inline">Quantum Learning Platform</span>
          <span className="sm:hidden">QLP</span>
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
        </nav>
      </div>
    </header>
  )
}
