'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SuperAdminDashboard() {
    const [gyms, setGyms] = useState<any[]>([])
    const [stats, setStats] = useState({ totalGyms: 0, totalUsers: 0, activeSubs: 0 })
    const supabase = createClient()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        // Fetch Gyms
        const { data: gymsData, count: gymsCount } = await (supabase
            .from('gyms') as any)
            .select('*, owner:profiles!owner_id(full_name, email)', { count: 'exact' })

        // Fetch total profiles count
        const { count: usersCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })

        setGyms(gymsData || [])
        setStats({
            totalGyms: gymsCount || 0,
            totalUsers: usersCount || 0,
            activeSubs: 0 // Would need a SaaS subscriptions table query here
        })
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Platform Overview</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="text-sm font-medium text-gray-500">Total Gyms</div>
                    <div className="text-3xl font-bold text-gray-900 mt-2">{stats.totalGyms}</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="text-sm font-medium text-gray-500">Total Users on Platform</div>
                    <div className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="text-sm font-medium text-gray-500">SaaS Revenue (Mo)</div>
                    <div className="text-3xl font-bold text-gray-900 mt-2">$0.00</div>
                    <div className="text-xs text-gray-400 mt-1">Mock Value</div>
                </div>
            </div>

            {/* Gyms List */}
            <h2 className="text-xl font-bold text-gray-900 pt-6">Registered Gyms</h2>
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Gym Name</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Owner</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Created At</th>
                            <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {gyms.map(gym => (
                            <tr key={gym.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900">{gym.name}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    {gym.owner?.full_name} <br />
                                    <span className="text-xs text-gray-400">{gym.owner?.email}</span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    {new Date(gym.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                        Active
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {gyms.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                    No gyms registered yet. Use the DB to create the first one.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
