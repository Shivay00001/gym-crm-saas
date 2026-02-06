'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'

export default function AttendancePage() {
    const [logs, setLogs] = useState<any[]>([])
    const { profile } = useAuth()
    const supabase = createClient()

    useEffect(() => {
        if (profile?.gym_id) {
            fetchAttendance()
        }
    }, [profile?.gym_id])

    const fetchAttendance = async () => {
        const { data } = await supabase
            .from('attendance')
            .select(`
        id,
        check_in_time,
        check_out_time,
        member:members (
          full_name,
          phone
        )
      `)
            .eq('gym_id', profile!.gym_id!)
            .order('check_in_time', { ascending: false })
            .limit(50)

        setLogs(data || [])
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Attendance Log</h1>
                {/* Manual check-in button could go here */}
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Member</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Check In</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Check Out</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {logs.map(log => (
                            <tr key={log.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900">{log.member.full_name}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">
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
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                    No attendance records found yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
