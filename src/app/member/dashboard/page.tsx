import { createClient } from '@/lib/supabase/server'
import { formatDate, getDaysUntilExpiry } from '@/lib/utils/dates'

export default async function MemberDashboard() {
    const supabase = await createClient()

    const { data: { session } } = await supabase.auth.getSession()

    // Get member data
    const { data: member } = await supabase
        .from('members')
        .select('*')
        .eq('user_id', session!.user.id)
        .single()

    if (!member) {
        return <div>Loading...</div>
    }

    // Get active membership
    const { data: membership } = await supabase
        .from('member_memberships')
        .select(`
      *,
      plan:membership_plans (*)
    `)
        .eq('member_id', member.id)
        .eq('status', 'ACTIVE')
        .gte('end_date', new Date().toISOString().split('T')[0])
        .order('end_date', { ascending: false })
        .limit(1)
        .single()

    // Get attendance count
    const { count: attendanceCount } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .eq('member_id', member.id)
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])

    const daysRemaining = membership ? getDaysUntilExpiry(membership.end_date) : null

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Welcome back, {member.full_name}!</h1>

            {/* Membership Status */}
            {membership ? (
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-xl shadow-lg">
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="text-sm opacity-90 mb-1">Current Plan</div>
                            <div className="text-2xl font-bold">{membership.plan.name}</div>
                            <div className="text-sm mt-2 opacity-90">
                                Valid until: {formatDate(membership.end_date)}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-4xl font-bold">{daysRemaining}</div>
                            <div className="text-sm opacity-90">days left</div>
                            {daysRemaining && daysRemaining <= 7 && (
                                <div className="mt-2">
                                    <a href="/member/renew" className="inline-block bg-white text-blue-600 px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-50">
                                        Renew Now
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-yellow-50 border-2 border-yellow-200 p-6 rounded-xl">
                    <div className="font-medium text-yellow-900">No Active Membership</div>
                    <div className="text-sm text-yellow-700 mt-1">Please contact the gym to renew your membership</div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <div className="text-sm font-medium text-gray-600">Attendance (30 days)</div>
                    <div className="text-3xl font-bold text-blue-600 mt-2">{attendanceCount || 0}</div>
                    <div className="text-xs text-gray-500 mt-1">Check-ins this month</div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <div className="text-sm font-medium text-gray-600">Workout Plan</div>
                    <div className="text-xl font-bold text-gray-900 mt-2">
                        {member.assigned_trainer_id ? 'Active' : 'Not Assigned'}
                    </div>
                    <a href="/member/workout" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                        View Plan →
                    </a>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <div className="text-sm font-medium text-gray-600">Diet Plan</div>
                    <div className="text-xl font-bold text-gray-900 mt-2">
                        {member.assigned_trainer_id ? 'Active' : 'Not Assigned'}
                    </div>
                    <a href="/member/diet" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                        View Plan →
                    </a>
                </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <a href="/member/profile" className="p-4 bg-white rounded-lg border hover:shadow-md transition text-center">
                    <div className="text-3xl mb-2">👤</div>
                    <div className="font-medium text-sm">Edit Profile</div>
                </a>

                <a href="/member/attendance" className="p-4 bg-white rounded-lg border hover:shadow-md transition text-center">
                    <div className="text-3xl mb-2">📅</div>
                    <div className="font-medium text-sm">Attendance History</div>
                </a>

                <a href="/member/payments" className="p-4 bg-white rounded-lg border hover:shadow-md transition text-center">
                    <div className="text-3xl mb-2">💳</div>
                    <div className="font-medium text-sm">Payment History</div>
                </a>

                <a href="/member/workout" className="p-4 bg-white rounded-lg border hover:shadow-md transition text-center">
                    <div className="text-3xl mb-2">💪</div>
                    <div className="font-medium text-sm">Today's Workout</div>
                </a>
            </div>

            {/* Info */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h2 className="font-semibold text-gray-900 mb-2">Stay Consistent!</h2>
                <p className="text-gray-600 text-sm">
                    Track your progress, follow your workout and diet plans, and reach your fitness goals.
                </p>
            </div>
        </div>
    )
}
