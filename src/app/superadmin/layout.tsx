'use client'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        checkRole()
    }, [])

    const checkRole = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) redirect('/login')

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()

        if (!profile || profile.role !== 'SUPERADMIN') {
            redirect('/login')
        }
        setLoading(false)
    }

    if (loading) return <div>Loading...</div>

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-gray-900 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                                GymCRM SaaS Admin
                            </h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-300">Superadmin Mode</span>
                            <form action="/api/auth/signout" method="post">
                                <button className="text-sm bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded border border-gray-700">
                                    Sign Out
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {children}
            </main>
        </div>
    )
}
