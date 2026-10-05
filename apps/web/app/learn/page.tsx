import LearnContent from '@/components/learn/LearnContent'
import NavBar from '@/components/nav/NavBar'
import LearnHero from '@/components/learn/LearnHero'

export default function LearnPage() {
    return (
        <div className="min-h-screen w-full overflow-x-clip bg-gray-50 dark:bg-[#0a0a0a]">
            <NavBar />
            <LearnHero />
            <div className="relative z-10 border-t border-zinc-200 bg-gray-50 dark:border-zinc-800 dark:bg-[#0a0a0a]">
                <LearnContent />
            </div>
        </div>
    )
}
