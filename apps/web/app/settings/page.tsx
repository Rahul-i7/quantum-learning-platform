import type { Metadata } from 'next'
import DemoUnavailable from '@/components/ui/DemoUnavailable'

export const metadata: Metadata = { title: 'Settings | QMentor' }

export default function SettingsPage() {
    return (
        <DemoUnavailable
            preview="settings"
            title="Settings aren't available in this demo"
            description="Preferences and account settings are part of the full version. Everything else is open, so you can keep building circuits and learning."
        />
    )
}