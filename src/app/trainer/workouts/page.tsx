'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter, useSearchParams } from 'next/navigation'

interface Exercise {
    id?: string
    day_number: number
    exercise_name: string
    sets: number
    reps: string
    weight_kg?: number
    notes?: string
}

export default function WorkoutBuilder() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const memberId = searchParams.get('memberId')

    const [loading, setLoading] = useState(false)
    const [exercises, setExercises] = useState<Exercise[]>([])
    const [planName, setPlanName] = useState('')
    const [member, setMember] = useState<any>(null)

    const { profile } = useAuth()
    const supabase = createClient()

    useEffect(() => {
        if (memberId) {
            fetchMember()
            fetchExistingPlan()
        }
    }, [memberId])

    const fetchMember = async () => {
        const { data } = await supabase.from('members').select('*').eq('id', memberId).single()
        setMember(data)
        if (data) setPlanName(`${data.full_name}'s Workout Plan`)
    }

    const fetchExistingPlan = async () => {
        // Check if plan exists
        const { data: plan } = await supabase
            .from('workout_plans')
            .select('*, items:workout_plan_items(*)')
            .eq('member_id', memberId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (plan) {
            setPlanName(plan.name)
            if (plan.items) {
                setExercises(plan.items.map((i: any) => ({
                    id: i.id,
                    day_number: i.day_number || 1,
                    exercise_name: i.exercise_name,
                    sets: i.sets,
                    reps: i.reps,
                    weight_kg: i.weight_kg,
                    notes: i.notes
                })))
            }
        }
    }

    const addExercise = () => {
        setExercises([...exercises, {
            day_number: 1,
            exercise_name: '',
            sets: 3,
            reps: '10-12',
        }])
    }

    const updateExercise = (index: number, field: keyof Exercise, value: any) => {
        const newExercises = [...exercises]
        newExercises[index] = { ...newExercises[index], [field]: value }
        setExercises(newExercises)
    }

    const removeExercise = (index: number) => {
        setExercises(exercises.filter((_, i) => i !== index))
    }

    const handleSave = async () => {
        if (!memberId || !profile?.gym_id) return
        setLoading(true)

        try {
            // 1. Upsert Plan
            const { data: plan, error: planError } = await supabase
                .from('workout_plans')
                .upsert({
                    gym_id: profile.gym_id,
                    member_id: memberId,
                    trainer_id: profile.id,
                    name: planName,
                    is_template: false
                }) // Upsert logic might need ID, but simplified for "latest plan" logic
                .select()
                .single()

            if (planError) throw planError

            // 2. Delete old items (brute force replacement for simplicity)
            await supabase.from('workout_plan_items').delete().eq('workout_plan_id', plan.id)

            // 3. Insert new items
            const itemsToInsert = exercises.map(ex => ({
                workout_plan_id: plan.id,
                day_number: ex.day_number,
                exercise_name: ex.exercise_name,
                sets: ex.sets,
                reps: ex.reps,
                weight_kg: ex.weight_kg,
                notes: ex.notes
            }))

            const { error: itemsError } = await supabase
                .from('workout_plan_items')
                .insert(itemsToInsert)

            if (itemsError) throw itemsError

            alert('Workout plan saved successfully!')
            router.push('/trainer/members')
        } catch (error: any) {
            alert('Error saving plan: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    if (!memberId) return <div className="p-8">Please select a member first.</div>

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Workout Builder</h1>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
                >
                    {loading ? 'Saving...' : 'Save Plan'}
                </button>
            </div>

            <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Plan Name</label>
                    <input
                        type="text"
                        value={planName}
                        onChange={(e) => setPlanName(e.target.value)}
                        className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                {member && (
                    <div className="text-sm text-gray-500">
                        Creating plan for: <span className="font-semibold text-gray-900">{member.full_name}</span>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                {exercises.map((exercise, index) => (
                    <div key={index} className="bg-white p-4 rounded-xl border shadow-sm relative group">
                        <button
                            onClick={() => removeExercise(index)}
                            className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                        >
                            🗑️
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                            <div className="md:col-span-1">
                                <label className="text-xs font-medium text-gray-500">Day</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="7"
                                    value={exercise.day_number}
                                    onChange={(e) => updateExercise(index, 'day_number', parseInt(e.target.value))}
                                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs font-medium text-gray-500">Exercise</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Bench Press"
                                    value={exercise.exercise_name}
                                    onChange={(e) => updateExercise(index, 'exercise_name', e.target.value)}
                                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500">Sets</label>
                                <input
                                    type="number"
                                    value={exercise.sets}
                                    onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value))}
                                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500">Reps</label>
                                <input
                                    type="text"
                                    value={exercise.reps}
                                    onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500">Weight (kg)</label>
                                <input
                                    type="number"
                                    placeholder="Opt"
                                    value={exercise.weight_kg || ''}
                                    onChange={(e) => updateExercise(index, 'weight_kg', parseFloat(e.target.value))}
                                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                                />
                            </div>
                        </div>
                        <div className="mt-2">
                            <input
                                type="text"
                                placeholder="Notes (optional)"
                                value={exercise.notes || ''}
                                onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                                className="w-full text-sm px-3 py-1 border-b focus:border-blue-500 outline-none bg-transparent"
                            />
                        </div>
                    </div>
                ))}

                <button
                    onClick={addExercise}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-500 transition font-medium"
                >
                    + Add Exercise
                </button>
            </div>
        </div>
    )
}
