'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'

export default function MemberProfilePage() {
    const { profile } = useAuth()
    const [member, setMember] = useState<any>(null)
    const supabase = createClient()

    useEffect(() => {
        async function fetchMember() {
            const { data } = await supabase
                .from('members')
                .select('*')
                .eq('user_id', profile?.id)
                .single()
            setMember(data)
        }
        if (profile?.id) fetchMember()
    }, [profile?.id])

    if (!member) return <div>Loading...</div>

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
                <div className="flex items-center space-x-4">
                    <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold">
                        {member.full_name[0]}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">{member.full_name}</h2>
                        <p className="text-gray-500">{member.email}</p>
                        <p className="text-gray-500">{member.phone}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-500">Join Date</label>
                        <div className="mt-1">{new Date(member.join_date).toLocaleDateString()}</div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500">Status</label>
                        <div className="mt-1">
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                {member.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
