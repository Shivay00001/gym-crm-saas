import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function OwnerLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
        redirect('/login')
    }

    // Verify user has OWNER role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, gym_id')
        .eq('id', session.user.id)
        .single()

    if (!profile || (profile.role !== 'OWNER' && profile.role !== 'SUPERADMIN')) {
        redirect('/login')
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold text-gray-900">Owner Panel</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">{session.user.email}</span>
                            <form action="/api/auth/signout" method="post">
                                <button className="text-sm text-red-600 hover:text-red-700">
                                    Sign Out
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="flex">
                {/* Sidebar */}
                <aside className="w-64 bg-white border-r min-h-[calc(100vh-4rem)]">
                    <nav className="p-4 space-y-2">
                        <a href="/owner/dashboard" className="block px-4 py-2 rounded-lg hover:bg-gray-100">
                            Dashboard
                        </a>
                        <a href="/owner/members" className="block px-4 py-2 rounded-lg hover:bg-gray-100">
                            Members
                        </a>
                        <a href="/owner/trainers" className="block px-4 py-2 rounded-lg hover:bg-gray-100">
                            Trainers
                        </a>
                        <a href="/owner/plans" className="block px-4 py-2 rounded-lg hover:bg-gray-100">
                            Membership Plans
                        </a>
                        <a href="/owner/leads" className="block px-4 py-2 rounded-lg hover:bg-gray-100">
                            Leads
                        </a>
                        <a href="/owner/attendance" className="block px-4 py-2 rounded-lg hover:bg-gray-100">
                            Attendance
                        </a>
                        <a href="/owner/payments" className="block px-4 py-2 rounded-lg hover:bg-gray-100">
                            Payments
                        </a>
                        <a href="/owner/retention" className="block px-4 py-2 rounded-lg hover:bg-gray-100">
                            WhatsApp Retention
                        </a>
                        <a href="/owner/settings" className="block px-4 py-2 rounded-lg hover:bg-gray-100">
                            Settings
                        </a>
                    </nav>
                </aside>

                {/* Main content */}
                <main className="flex-1 p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
