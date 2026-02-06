'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'

export default function MemberWorkoutPage() {
    const [plan, setPlan] = useState<any>(null)
    const { profile } = useAuth()
    const supabase = createClient()

    useEffect(() => {
        async function fetchPlan() {
            // Get member ID first
            const { data: member } = await supabase.from('members').select('id').eq('user_id', profile?.id).single()
            if (!member) return

            const { data } = await supabase
                .from('workout_plans')
                .select(`*, items:workout_plan_items(*)`)
                .eq('member_id', member.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single()

            setPlan(data)
        }
        if (profile?.id) fetchPlan()
    }, [profile?.id])

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">My Workout Plan</h1>
            {plan ? (
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <h2 className="text-xl font-bold mb-2">{plan.name}</h2>
                    <p className="text-gray-600 mb-6">{plan.description}</p>

                    <div className="space-y-4">
                        {plan.items?.map((item: any) => (
                            <div key={item.id} className="border-b last:border-0 pb-4 last:pb-0">
                                <div className="font-medium text-lg">{item.exercise_name}</div>
                                <div className="text-sm text-gray-600 mt-1">
                                    {item.sets} sets x {item.reps} reps • {item.weight_kg ? `${item.weight_kg}kg` : ''}
                                </div>
                                {item.notes && <div className="text-xs text-gray-500 mt-1 italic">{item.notes}</div>}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="bg-gray-50 p-12 text-center rounded-xl border border-dashed text-gray-500">
                    No workout plan assigned yet. Ask your trainer!
                </div>
            )}
        </div>
    )
}
