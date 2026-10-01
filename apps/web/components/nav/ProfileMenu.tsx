'use client'

import { useRouter } from 'next/navigation'
import { LogOut, User as UserIcon, Settings } from 'lucide-react'
import { useAuth } from '@/lib/supabase/AuthProvider'
import Link from 'next/link'

export default function ProfileMenu() {
    const { user, profile, role, signOut, configured } = useAuth()
    const router = useRouter()

    const items = [
        { "href": "/profile", "label": "Profile", "icon": UserIcon },
        { "href": "/settings", "label": "Settings", "icon": Settings }
    ]

    return (
        <div className="flex flex-col">
            <div className='px-4 py-2'>
                <div className="flex items-center justify-between">
                    <div className="text-zinc-800">
                        {profile?.name}
                    </div>
                    <div className={`border text-xs flex justify-center items-center rounded-full px-3 ${role === 'instructor' || role === 'admin'
                        ? 'border-purple-200 bg-purple-300/10 text-purple-400'
                        : role === 'guest'
                            ? 'border-amber-200 bg-amber-300/10 text-amber-400'
                            : 'border-blue-200 bg-blue-300/10 text-blue-400'
                        }`}>
                        <p>{(profile?.role || 'guest').charAt(0).toUpperCase() + (profile?.role || 'guest').slice(1)}</p>
                    </div>
                </div>
                <div className='text-zinc-400 text-xs'>
                    {user?.email}
                </div>
            </div>
            <div className="w-full h-px bg-zinc-200" />
            <div className='flex flex-col p-1'>
                {items.map((item) => (
                    <Link key={item.label} href={item.href} className="px-3 py-2 rounded-md flex text-sm cursor-pointer hover:bg-zinc-100 items-center gap-4 text-zinc-600">
                        <item.icon className="h-4 w-4" strokeWidth={1.7} />
                        <span>{item.label}</span>
                    </Link>
                ))}
            </div>
            <div className="w-full h-px bg-zinc-200" />
            <div className="p-1">
                <button
                    onClick={() => signOut()}
                    className="cursor-pointer flex h-9 w-full items-center gap-2 rounded-md px-3 py-2  text-sm text-zinc-600 transition-color hover:bg-zinc-100"
                    title={user?.email ?? undefined}
                >
                    <LogOut
                        className="h-4 w-4"
                        strokeWidth={1.7}
                    />

                    <span className="hidden sm:inline">
                        Sign out
                    </span>
                </button>
            </div>
        </div>
    )
}