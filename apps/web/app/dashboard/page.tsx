/* 'use client';
import InstructorDashboard from '@/components/visualizations/InstructorDashboard';
import NavBar from '@/components/nav/NavBar';
export default function DashboardPage() {
    return <div className="w-screen bg-gray-50">
        <NavBar />
        <InstructorDashboard />
    </div>;
} */

'use client';
import InstructorDashboard from '@/components/visualizations/InstructorDashboard';
import NavBar from '@/components/nav/NavBar';
export default function DashboardPage() {
    return <div className="flex min-h-screen w-screen flex-col overflow-x-hidden bg-[#fafafa] text-zinc-950">
        <NavBar />
        <InstructorDashboard />
    </div>;
}    
