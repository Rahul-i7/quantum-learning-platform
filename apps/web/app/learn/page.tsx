import LearnContent from '@/components/learn/LearnContent'
import NavBar from '@/components/nav/NavBar'
import LearnHero from '@/components/learn/LearnHero'

export default function LearnPage() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gray-50">
      <NavBar />
      <LearnHero />
      <LearnContent />
    </div>
  )
}
