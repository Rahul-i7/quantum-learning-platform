'use client';
import InstructorDashboard from '@/components/visualizations/InstructorDashboard';
import NavBar from '@/components/nav/NavBar';

export default function DashboardPage() {
    return (
        <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-[#fafafa] dark:bg-[#0a0a0a] text-zinc-950 dark:text-zinc-100">
            <NavBar />
            <InstructorDashboard />
        </div>
    );
}
