import { createClient } from '@/lib/supabase/server'

export default async function TrainerDashboard() {
    const supabase = await createClient()

    const { data: { session } } = await supabase.auth.getSession()

    // Get assigned members count
    const { count: assignedCount } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_trainer_id', session!.user.id)
        .eq('is_active', true)

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Trainer Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <div className="text-sm font-medium text-gray-600">Assigned Members</div>
                    <div className="text-3xl font-bold text-gray-900 mt-2">{assignedCount || 0}</div>
                </div>

                <a href="/trainer/members" className="p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition flex flex-col items-center justify-center">
                    <div className="text-3xl mb-2">👥</div>
                    <div className="font-medium">View Members</div>
                </a>

                <a href="/trainer/workouts" className="p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition flex flex-col items-center justify-center">
                    <div className="text-3xl mb-2">💪</div>
                    <div className="font-medium">Workout Plans</div>
                </a>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <p className="text-gray-600">Welcome to your trainer panel. Manage your assigned members, create workout and diet plans.</p>
            </div>
        </div>
    )
}
