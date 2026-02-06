'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { getInitials } from '@/lib/utils/formatters'

interface Member {
    id: string
    full_name: string
    email: string | null
    phone: string
    is_active: boolean
    join_date: string
}

export default function MembersPage() {
    const [members, setMembers] = useState<Member[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const { profile } = useAuth()
    const supabase = createClient()

    useEffect(() => {
        if (profile?.gym_id) {
            fetchMembers()
        }
    }, [profile?.gym_id])

    const fetchMembers = async () => {
        const { data } = await supabase
            .from('members')
            .select('id, full_name, email, phone, is_active, join_date')
            .eq('gym_id', profile!.gym_id!)
            .order('created_at', { ascending: false })

        setMembers(data || [])
        setLoading(false)
    }

    const filteredMembers = members.filter(m =>
        m.full_name.toLowerCase().includes(search.toLowerCase()) ||
        m.phone.includes(search)
    )

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Members</h1>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
                    + Add Member
                </button>
            </div>

            <div className="bg-white p-4 rounded-xl border shadow-sm">
                <input
                    type="text"
                    placeholder="Search by name or phone..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>

            {loading ? (
                <div className="text-center py-12">Loading members...</div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Member</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Contact</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Joined</th>
                                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredMembers.map(member => (
                                <tr key={member.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm mr-3">
                                                {getInitials(member.full_name)}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">{member.full_name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900">{member.phone}</div>
                                        <div className="text-sm text-gray-500">{member.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${member.is_active
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                            }`}>
                                            {member.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(member.join_date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
