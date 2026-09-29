'use client';
import InstructorDashboard from '@/components/visualizations/InstructorDashboard';
import NavBar from '@/components/nav/NavBar';

export default function DashboardPage() {
    return (
        <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-[#fafafa] text-zinc-950">
            <NavBar />
            <InstructorDashboard />
        </div>
    );
}
