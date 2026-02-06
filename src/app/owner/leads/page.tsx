'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'

export default function LeadsPage() {
    const [leads, setLeads] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const { profile } = useAuth()
    const supabase = createClient()

    useEffect(() => {
        if (profile?.gym_id) {
            fetchLeads()
        }
    }, [profile?.gym_id])

    const fetchLeads = async () => {
        const { data } = await supabase
            .from('leads')
            .select('*')
            .eq('gym_id', profile!.gym_id!)
            .order('created_at', { ascending: false })

        setLeads(data || [])
        setLoading(false)
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'NEW': return 'bg-blue-100 text-blue-800'
            case 'CONTACTED': return 'bg-yellow-100 text-yellow-800'
            case 'TRIAL': return 'bg-purple-100 text-purple-800'
            case 'CONVERTED': return 'bg-green-100 text-green-800'
            case 'LOST': return 'bg-gray-100 text-gray-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Leads CRM</h1>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
                    + Add Lead
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Interest</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Source</th>
                            <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Added</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {leads.map(lead => (
                            <tr key={lead.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">{lead.full_name}</div>
                                    <div className="text-sm text-gray-500">{lead.phone}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(lead.status)}`}>
                                        {lead.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">{lead.interested_in || '-'}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{lead.source}</td>
                                <td className="px-6 py-4 text-right text-sm text-gray-500">
                                    {new Date(lead.created_at).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                        {leads.length === 0 && !loading && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    No leads found. Start tracking potential members!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
