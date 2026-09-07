'use client';
import InstructorDashboard from '@/components/visualizations/InstructorDashboard';
import NavBar from '@/components/nav/NavBar';
export default function DashboardPage() {
    return <div className="h-screen w-screen bg-gray-50">
        <NavBar />
        <InstructorDashboard />
    </div>;
}
