import LearnContent from '@/components/learn/LearnContent'
import NavBar from '@/components/nav/NavBar'
import LearnHero from '@/components/learn/LearnHero'

export default function LearnPage() {
  return (<div className="bg-gray-50 w-screen">
  <NavBar />
  <LearnHero />
  <LearnContent />
  </div>)
}
