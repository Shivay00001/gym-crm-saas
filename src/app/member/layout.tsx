import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function MemberLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
        redirect('/login')
    }

    // Verify user has MEMBER role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', session.user.id)
        .single()

    if (!profile || profile.role !== 'MEMBER') {
        redirect('/login')
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold">My Fitness Portal</h1>
                            <span className="ml-4 text-sm opacity-90">Hi, {profile.full_name}!</span>
                        </div>
                        <div className="flex items-center">
                            <form action="/api/auth/signout" method="post">
                                <button className="text-sm hover:underline">Sign Out</button>
                            </form>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="flex">
                <aside className="w-64 bg-white border-r min-h-[calc(100vh-4rem)]">
                    <nav className="p-4 space-y-2">
                        <a href="/member/dashboard" className="block px-4 py-2 rounded-lg hover:bg-gray-100">
                            🏠 Dashboard
                        </a>
                        <a href="/member/profile" className="block px-4 py-2 rounded-lg hover:bg-gray-100">
                            👤 My Profile
                        </a>
                        <a href="/member/workout" className="block px-4 py-2 rounded-lg hover:bg-gray-100">
                            💪 Workout Plan
                        </a>
                        <a href="/member/diet" className="block px-4 py-2 rounded-lg hover:bg-gray-100">
                            🥗 Diet Plan
                        </a>
                        <a href="/member/attendance" className="block px-4 py-2 rounded-lg hover:bg-gray-100">
                            📅 Attendance
                        </a>
                        <a href="/member/payments" className="block px-4 py-2 rounded-lg hover:bg-gray-100">
                            💳 Payments
                        </a>
                    </nav>
                </aside>

                <main className="flex-1 p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
