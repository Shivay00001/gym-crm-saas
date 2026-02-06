'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'

export default function MemberAttendancePage() {
    const [logs, setLogs] = useState<any[]>([])
    const { profile } = useAuth()
    const supabase = createClient()

    useEffect(() => {
        async function fetchLogs() {
            const { data: member } = await supabase.from('members').select('id').eq('user_id', profile?.id).single()
            if (!member) return

            const { data } = await supabase
                .from('attendance')
                .select('*')
                .eq('member_id', member.id)
                .order('check_in_time', { ascending: false })

            setLogs(data || [])
        }
        if (profile?.id) fetchLogs()
    }, [profile?.id])

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">My Attendance</h1>
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Check In</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Check Out</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {logs.map(log => (
                            <tr key={log.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm text-gray-900">
                                    {new Date(log.check_in_time).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    {new Date(log.check_in_time).toLocaleTimeString()}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    {log.check_out_time ? new Date(log.check_out_time).toLocaleTimeString() : '-'}
                                </td>
                            </tr>
                        ))}
                        {logs.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                                    No attendance records found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
