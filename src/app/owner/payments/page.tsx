'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { formatCurrency } from '@/lib/utils/formatters'

export default function PaymentsPage() {
    const [payments, setPayments] = useState<any[]>([])
    const { profile } = useAuth()
    const supabase = createClient()

    useEffect(() => {
        if (profile?.gym_id) {
            fetchPayments()
        }
    }, [profile?.gym_id])

    const fetchPayments = async () => {
        const { data } = await supabase
            .from('payments')
            .select(`
        *,
        member:members (full_name)
      `)
            .eq('gym_id', profile!.gym_id!)
            .order('payment_date', { ascending: false })

        setPayments(data || [])
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Member</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Method</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {payments.map(payment => (
                            <tr key={payment.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900">{payment.member.full_name}</td>
                                <td className="px-6 py-4 text-sm font-bold text-gray-900">
                                    {formatCurrency(payment.amount)}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">{payment.payment_method}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${payment.payment_status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {payment.payment_status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right text-sm text-gray-500">
                                    {new Date(payment.payment_date).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                        {payments.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    No payment records found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
