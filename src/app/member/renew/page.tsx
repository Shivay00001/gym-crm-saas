'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { formatCurrency } from '@/lib/utils/formatters'
import { useRouter } from 'next/navigation'
import { calculateMembershipEndDate } from '@/lib/utils/dates'

export default function RenewLink({ gymId }: { gymId: string }) {
    const router = useRouter()
    return (
        <button
            onClick={() => router.push('/member/renew')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
            Renew Membership
        </button>
    )
}

export default function RenewPage() {
    const [plans, setPlans] = useState<any[]>([])
    const [selectedPlan, setSelectedPlan] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)

    const { profile } = useAuth()
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        if (profile?.gym_id) {
            fetchPlans()
        }
    }, [profile?.gym_id])

    const fetchPlans = async () => {
        const { data } = await supabase
            .from('membership_plans')
            .select('*')
            .eq('gym_id', profile!.gym_id!)
            .eq('is_active', true)
            .order('price', { ascending: true })

        setPlans(data || [])
        setLoading(false)
    }

    const handleRenew = async () => {
        if (!selectedPlan || !profile) return
        setProcessing(true)

        try {
            // 1. Get Member ID
            const { data: member } = await supabase
                .from('members')
                .select('id')
                .eq('user_id', profile.id)
                .single()

            if (!member) throw new Error('Member not found')


            // 2. MOCK PAYMENT GATEWAY
            // In prod, integrating Razorpay/Stripe would happen here
            await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate network

            const startDate = new Date()
            const endDate = calculateMembershipEndDate(startDate, selectedPlan.duration_days)

            // 3. Insert Membership
            const { data: membership, error: memError } = await supabase
                .from('member_memberships')
                .insert({
                    member_id: member.id,
                    membership_plan_id: selectedPlan.id,
                    start_date: startDate.toISOString(),
                    end_date: endDate.toISOString(),
                    amount_paid: selectedPlan.price,
                    status: 'ACTIVE'
                })
                .select()
                .single()

            if (memError) throw memError

            // 4. Insert Payment Record
            const { error: payError } = await supabase
                .from('payments')
                .insert({
                    gym_id: profile.gym_id!,
                    member_id: member.id,
                    membership_id: membership.id,
                    amount: selectedPlan.price,
                    payment_method: 'UPI', // Mocked
                    payment_status: 'COMPLETED',
                    payment_date: new Date().toISOString()
                })

            if (payError) throw payError

            alert('Membership renewed successfully!')
            router.push('/member/dashboard')

        } catch (error: any) {
            alert('Renewal failed: ' + error.message)
        } finally {
            setProcessing(false)
        }
    }

    if (loading) return <div>Loading plans...</div>

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Renew Membership</h1>
            <p className="text-gray-600">Choose a plan to continue your fitness journey.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                {plans.map(plan => (
                    <div
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan)}
                        className={`cursor-pointer p-6 rounded-xl border-2 transition relative ${selectedPlan?.id === plan.id
                                ? 'border-blue-600 bg-blue-50'
                                : 'border-gray-200 bg-white hover:border-blue-300'
                            }`}
                    >
                        {selectedPlan?.id === plan.id && (
                            <div className="absolute top-2 right-2 text-blue-600">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            </div>
                        )}
                        <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                        <div className="mt-2 text-2xl font-bold text-blue-600">
                            {formatCurrency(plan.price)}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                            Valid for {plan.duration_days} days
                        </div>
                        <p className="text-sm text-gray-600 mt-4 border-t pt-4">
                            {plan.description || "Access to all gym facilities."}
                        </p>
                    </div>
                ))}
            </div>

            {selectedPlan && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
                    <div className="max-w-4xl mx-auto flex justify-between items-center">
                        <div>
                            <div className="text-sm text-gray-500">Total Amount</div>
                            <div className="text-2xl font-bold text-gray-900">{formatCurrency(selectedPlan.price)}</div>
                        </div>
                        <button
                            onClick={handleRenew}
                            disabled={processing}
                            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50"
                        >
                            {processing ? 'Processing Payment...' : `Pay ${formatCurrency(selectedPlan.price)}`}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
