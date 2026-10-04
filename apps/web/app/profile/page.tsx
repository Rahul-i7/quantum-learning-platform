import type { Metadata } from 'next'
import DemoUnavailable from '@/components/ui/DemoUnavailable'

export const metadata: Metadata = { title: 'Profile | QMentor' }

export default function ProfilePage() {
    return (
        <DemoUnavailable
            preview="profile"
            title="Profile isn't available in this demo"
            description="Account details and profile editing are part of the full version. Everything else is open, from the lessons to the circuit builder and the AI tutor."
        />
    )
}