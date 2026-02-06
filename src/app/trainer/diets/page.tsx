'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter, useSearchParams } from 'next/navigation'

interface Meal {
    meal_name: string
    meal_time: string
    food_items: string
    calories: number
    protein_g: number
}

export default function DietPlanner() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const memberId = searchParams.get('memberId')

    const [loading, setLoading] = useState(false)
    const [meals, setMeals] = useState<Meal[]>([])
    const [planName, setPlanName] = useState('')
    const [targets, setTargets] = useState({ calories: 2000, protein: 150 })
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
        if (data) setPlanName(`${data.full_name}'s Diet Plan`)
    }

    const fetchExistingPlan = async () => {
        const { data: plan } = await supabase
            .from('diet_plans')
            .select('*, items:diet_plan_items(*)')
            .eq('member_id', memberId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (plan) {
            setPlanName(plan.name)
            setTargets({ calories: plan.target_calories || 2000, protein: plan.target_protein_g || 150 })
            if (plan.items) {
                setMeals(plan.items.map((i: any) => ({
                    meal_name: i.meal_name,
                    meal_time: i.meal_time || '08:00',
                    food_items: i.food_items,
                    calories: i.calories || 0,
                    protein_g: i.protein_g || 0
                })))
            }
        }
    }

    const addMeal = () => {
        setMeals([...meals, {
            meal_name: 'Meal ' + (meals.length + 1),
            meal_time: '12:00',
            food_items: '',
            calories: 0,
            protein_g: 0
        }])
    }

    const updateMeal = (index: number, field: keyof Meal, value: any) => {
        const newMeals = [...meals]
        newMeals[index] = { ...newMeals[index], [field]: value }
        setMeals(newMeals)
    }

    const removeMeal = (index: number) => {
        setMeals(meals.filter((_, i) => i !== index))
    }

    const handleSave = async () => {
        if (!memberId || !profile?.gym_id) return
        setLoading(true)

        try {
            // 1. Upsert Diet Plan
            const { data: plan, error: planError } = await supabase
                .from('diet_plans')
                .upsert({
                    gym_id: profile.gym_id,
                    member_id: memberId,
                    trainer_id: profile.id,
                    name: planName,
                    target_calories: targets.calories,
                    target_protein_g: targets.protein,
                    is_template: false
                })
                .select()
                .single()

            if (planError) throw planError

            // 2. Delete old items
            await supabase.from('diet_plan_items').delete().eq('diet_plan_id', plan.id)

            // 3. Insert new items
            const itemsToInsert = meals.map(m => ({
                diet_plan_id: plan.id,
                meal_name: m.meal_name,
                meal_time: m.meal_time,
                food_items: m.food_items,
                calories: m.calories,
                protein_g: m.protein_g
            }))

            const { error: itemsError } = await supabase.from('diet_plan_items').insert(itemsToInsert)
            if (itemsError) throw itemsError

            alert('Diet plan saved successfully!')
            router.push('/trainer/members')
        } catch (error: any) {
            alert('Error: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    if (!memberId) return <div className="p-8">Please select a member first.</div>

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Diet Planner</h1>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
                >
                    {loading ? 'Saving...' : 'Save Plan'}
                </button>
            </div>

            <div className="bg-white p-6 rounded-xl border shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <label htmlFor="target_calories" className="block text-sm font-medium text-gray-700">Target Calories</label>
                    <input
                        id="target_calories"
                        type="number"
                        value={targets.calories}
                        onChange={(e) => setTargets({ ...targets, calories: parseInt(e.target.value) })}
                        className="w-full mt-1 px-3 py-2 border rounded-lg"
                    />
                </div>
                <div className="md:col-span-1">
                    <label htmlFor="target_protein" className="block text-sm font-medium text-gray-700">Target Protein (g)</label>
                    <input
                        id="target_protein"
                        type="number"
                        value={targets.protein}
                        onChange={(e) => setTargets({ ...targets, protein: parseInt(e.target.value) })}
                        className="w-full mt-1 px-3 py-2 border rounded-lg"
                    />
                </div>
                <div className="md:col-span-1 flex items-end">
                    <div className="text-sm text-gray-500 pb-3">
                        Member: <span className="font-semibold text-gray-900">{member?.full_name}</span>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {meals.map((meal, index) => (
                    <div key={index} className="bg-white p-4 rounded-xl border shadow-sm relative group">
                        <button
                            onClick={() => removeMeal(index)}
                            className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                        >
                            🗑️
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className="md:col-span-2">
                                <label className="text-xs font-medium text-gray-500">Meal Name</label>
                                <input
                                    type="text"
                                    value={meal.meal_name}
                                    onChange={(e) => updateMeal(index, 'meal_name', e.target.value)}
                                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs font-medium text-gray-500">Time</label>
                                <input
                                    type="time"
                                    value={meal.meal_time}
                                    onChange={(e) => updateMeal(index, 'meal_time', e.target.value)}
                                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                                />
                            </div>
                            <div className="md:col-span-6">
                                <label className="text-xs font-medium text-gray-500">Foods (e.g. 2 Eggs, Toast)</label>
                                <textarea
                                    rows={2}
                                    value={meal.food_items}
                                    onChange={(e) => updateMeal(index, 'food_items', e.target.value)}
                                    className="w-full mt-1 px-3 py-2 border rounded-lg resize-none"
                                />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <div>
                                    <input
                                        type="number"
                                        placeholder="Cals"
                                        value={meal.calories || ''}
                                        onChange={(e) => updateMeal(index, 'calories', parseInt(e.target.value))}
                                        className="w-full px-2 py-1 border rounded text-sm"
                                        aria-label="Calories"
                                    />
                                </div>
                                <div>
                                    <input
                                        type="number"
                                        placeholder="Prot (g)"
                                        value={meal.protein_g || ''}
                                        onChange={(e) => updateMeal(index, 'protein_g', parseInt(e.target.value))}
                                        className="w-full px-2 py-1 border rounded text-sm"
                                        aria-label="Protein content in grams"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                <button
                    onClick={addMeal}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-500 transition font-medium"
                >
                    + Add Meal
                </button>
            </div>
        </div>
    )
}
