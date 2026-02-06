import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function TrainerLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
        redirect('/login')
    }

    // Verify user has TRAINER role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', session.user.id)
        .single()

    if (!profile || profile.role !== 'TRAINER') {
        redirect('/login')
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold text-gray-900">Trainer Panel</h1>
                            <span className="ml-4 text-sm text-gray-600">Hello, {profile.full_name}</span>
                        </div>
                        <div className="flex items-center">
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
                <aside className="w-64 bg-white border-r min-h-[calc(100vh-4rem)]">
                    <nav className="p-4 space-y-2">
                        <a href="/trainer/dashboard" className="block px-4 py-2 rounded-lg hover:bg-gray-100">
                            Dashboard
                        </a>
                        <a href="/trainer/members" className="block px-4 py-2 rounded-lg hover:bg-gray-100">
                            My Members
                        </a>
                        <a href="/trainer/workouts" className="block px-4 py-2 rounded-lg hover:bg-gray-100">
                            Workout Plans
                        </a>
                        <a href="/trainer/diets" className="block px-4 py-2 rounded-lg hover:bg-gray-100">
                            Diet Plans
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
