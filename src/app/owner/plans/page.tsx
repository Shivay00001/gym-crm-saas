'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useSettings } from '@/lib/hooks/useSettings'
import { formatCurrency } from '@/lib/utils/formatters'

interface Plan {
    id: string
    name: string
    duration_days: number
    price: number
    description: string | null
    is_active: boolean
}

export default function PlansPage() {
    const [plans, setPlans] = useState<Plan[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null)

    const { profile } = useAuth()
    const { settings } = useSettings()
    const supabase = createClient()

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
            .order('price', { ascending: true })

        setPlans(data || [])
        setLoading(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure? This will hide the plan from new signups.')) return

        const { error } = await supabase
            .from('membership_plans')
            .update({ is_active: false })
            .eq('id', id)

        if (!error) fetchPlans()
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Membership Plans</h1>
                    <p className="text-gray-600 mt-1">Manage dynamic pricing and durations</p>
                </div>
                <button
                    onClick={() => { setEditingPlan(null); setIsModalOpen(true) }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
                >
                    + Create Plan
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div>Loading plans...</div>
                ) : plans.map(plan => (
                    <div key={plan.id} className={`bg-white p-6 rounded-xl border shadow-sm relative ${!plan.is_active ? 'opacity-60 grayscale' : ''}`}>
                        {!plan.is_active && (
                            <div className="absolute top-2 right-2 px-2 py-1 bg-gray-100 text-xs text-gray-500 rounded">
                                Inactive
                            </div>
                        )}
                        <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                        <div className="mt-2 flex items-baseline text-gray-900">
                            <span className="text-3xl font-bold">
                                {formatCurrency(plan.price, settings?.currency_symbol)}
                            </span>
                            <span className="ml-1 text-gray-500">
                                / {Math.round(plan.duration_days / 30)} mo
                            </span>
                        </div>

                        <div className="mt-4 space-y-2 text-sm text-gray-600">
                            <p>📅 Duration: <span className="font-medium text-gray-900">{plan.duration_days} days</span></p>
                            {plan.description && <p>📝 {plan.description}</p>}
                        </div>

                        <div className="mt-6 flex space-x-3">
                            <button
                                onClick={() => { setEditingPlan(plan); setIsModalOpen(true) }}
                                className="flex-1 bg-gray-50 text-blue-600 px-3 py-2 rounded-lg border hover:bg-blue-50 font-medium text-sm"
                            >
                                Edit
                            </button>
                            {plan.is_active && (
                                <button
                                    onClick={() => handleDelete(plan.id)}
                                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm"
                                >
                                    Disable
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <PlanModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    plan={editingPlan}
                    gymId={profile!.gym_id!}
                    onSuccess={() => { setIsModalOpen(false); fetchPlans() }}
                />
            )}
        </div>
    )
}

function PlanModal({
    isOpen, onClose, plan, gymId, onSuccess
}: {
    isOpen: boolean; onClose: () => void; plan: Plan | null; gymId: string; onSuccess: () => void
}) {
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const data = {
            name: formData.get('name') as string,
            price: parseFloat(formData.get('price') as string),
            duration_days: parseInt(formData.get('duration_days') as string),
            description: formData.get('description') as string,
            gym_id: gymId
        }

        let error
        if (plan) {
            const { error: err } = await supabase
                .from('membership_plans')
                .update(data)
                .eq('id', plan.id)
            error = err
        } else {
            const { error: err } = await supabase
                .from('membership_plans')
                .insert(data)
            error = err
        }

        setLoading(false)
        if (!error) onSuccess()
        else alert(error.message)
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
                <h2 className="text-xl font-bold mb-4">{plan ? 'Edit Plan' : 'New Plan'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Plan Name</label>
                        <input
                            name="name"
                            defaultValue={plan?.name}
                            required
                            placeholder="e.g. Gold Membership"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Price</label>
                            <input
                                name="price"
                                type="number"
                                defaultValue={plan?.price}
                                required
                                placeholder="0.00"
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Duration (Days)</label>
                            <input
                                name="duration_days"
                                type="number"
                                defaultValue={plan?.duration_days}
                                required
                                placeholder="e.g. 30, 90, 365"
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                            name="description"
                            defaultValue={plan?.description || ''}
                            rows={3}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div className="flex space-x-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save Plan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
