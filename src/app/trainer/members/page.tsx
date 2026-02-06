'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'

export default function TrainerMembersPage() {
    const [members, setMembers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const { profile } = useAuth()
    const supabase = createClient()

    useEffect(() => {
        if (profile?.id) {
            fetchMyMembers()
        }
    }, [profile?.id])

    const fetchMyMembers = async () => {
        const { data } = await supabase
            .from('members')
            .select('*')
            .eq('assigned_trainer_id', profile!.id)
            .eq('is_active', true)

        setMembers(data || [])
        setLoading(false)
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">My Members</h1>

            {loading ? (
                <div>Loading...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {members.map(member => (
                        <div key={member.id} className="bg-white p-6 rounded-xl border shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{member.full_name}</h3>
                                    <p className="text-sm text-gray-600">{member.phone}</p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                                    {member.full_name[0]}
                                </div>
                            </div>

                            <div className="mt-4 space-y-2">
                                <div className="text-sm text-gray-600">
                                    <span className="font-medium">Goal:</span> {member.fitness_goal || 'Not set'}
                                </div>
                                <div className="text-sm text-gray-600">
                                    <span className="font-medium">Conditions:</span> {member.medical_conditions || 'None'}
                                </div>
                            </div>

                            <div className="mt-6 flex space-x-2">
                                <a
                                    href={`/trainer/workouts?memberId=${member.id}`}
                                    className="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium text-center hover:bg-blue-100"
                                >
                                    Workout
                                </a>
                                <a
                                    href={`/trainer/diets?memberId=${member.id}`}
                                    className="flex-1 bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm font-medium text-center hover:bg-green-100"
                                >
                                    Diet
                                </a>
                            </div>
                        </div>
                    ))}
                    {members.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-500">
                            No members assigned to you yet.
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
