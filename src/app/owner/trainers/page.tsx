'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { getInitials } from '@/lib/utils/formatters'

export default function TrainersPage() {
    const [trainers, setTrainers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const { profile } = useAuth()
    const supabase = createClient()

    useEffect(() => {
        if (profile?.gym_id) {
            fetchTrainers()
        }
    }, [profile?.gym_id])

    const fetchTrainers = async () => {
        // Join profiles to get name/email/phone from auth profile
        const { data } = await supabase
            .from('trainers')
            .select(`
        *,
        profile:profiles (
          full_name,
          email,
          phone,
          avatar_url
        )
      `)
            .eq('gym_id', profile!.gym_id!)

        setTrainers(data || [])
        setLoading(false)
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Trainers</h1>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
                    + Add Trainer
                </button>
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trainers.map(trainer => (
                        <div key={trainer.id} className="bg-white p-6 rounded-xl border shadow-sm flex items-center space-x-4">
                            <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xl font-bold">
                                {getInitials(trainer.profile.full_name)}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">{trainer.profile.full_name}</h3>
                                <p className="text-sm text-gray-500">{trainer.specialization?.join(', ') || 'General Fitness'}</p>
                                <div className="mt-1 text-xs text-gray-400">
                                    {trainer.experience_years ? `${trainer.experience_years} years exp` : 'New Trainer'}
                                </div>
                            </div>
                            <div className="ml-auto">
                                {/* Actions dropdown could go here */}
                            </div>
                        </div>
                    ))}
                    {trainers.length === 0 && (
                        <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border border-dashed">
                            <p className="text-gray-500">No trainers found. Add your first trainer!</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
