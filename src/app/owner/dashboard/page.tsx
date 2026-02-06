import { createClient } from '@/lib/supabase/server'

export default async function OwnerDashboard() {
    const supabase = await createClient()

    const { data: { session } } = await supabase.auth.getSession()

    // Get gym_id from profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('gym_id')
        .eq('id', session!.user.id)
        .single()

    // Fetch key metrics
    const { data: members, count: totalMembers } = await supabase
        .from('members')
        .select('*', { count: 'exact' })
        .eq('gym_id', profile!.gym_id!)
        .eq('is_active', true)

    const { count: activeMembers } = await supabase
        .from('member_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ACTIVE')
        .gte('end_date', new Date().toISOString().split('T')[0])

    const { count: expiringCount } = await supabase
        .from('member_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ACTIVE')
        .gte('end_date', new Date().toISOString().split('T')[0])
        .lte('end_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])

    const { data: todayAttendance, count: todayCount } = await supabase
        .from('attendance')
        .select('*', { count: 'exact' })
        .eq('gym_id', profile!.gym_id!)
        .eq('date', new Date().toISOString().split('T')[0])

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <div className="text-sm font-medium text-gray-600">Total Members</div>
                    <div className="text-3xl font-bold text-gray-900 mt-2">{totalMembers || 0}</div>
                    <div className="text-xs text-gray-500 mt-1">Active members in gym</div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <div className="text-sm font-medium text-gray-600">Active Memberships</div>
                    <div className="text-3xl font-bold text-green-600 mt-2">{activeMembers || 0}</div>
                    <div className="text-xs text-gray-500 mt-1">Current valid memberships</div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <div className="text-sm font-medium text-gray-600">Expiring Soon</div>
                    <div className="text-3xl font-bold text-yellow-600 mt-2">{expiringCount || 0}</div>
                    <div className="text-xs text-gray-500 mt-1">Within next 7 days</div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <div className="text-sm font-medium text-gray-600">Today's Check-ins</div>
                    <div className="text-3xl font-bold text-blue-600 mt-2">{todayCount || 0}</div>
                    <div className="text-xs text-gray-500 mt-1">Attendance today</div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <a
                        href="/owner/members?action=add"
                        className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-center"
                    >
                        <div className="text-3xl mb-2">👤</div>
                        <div className="font-medium text-gray-900">Add Member</div>
                    </a>

                    <a
                        href="/owner/leads?action=add"
                        className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-center"
                    >
                        <div className="text-3xl mb-2">🎯</div>
                        <div className="font-medium text-gray-900">Add Lead</div>
                    </a>

                    <a
                        href="/owner/retention"
                        className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-center"
                    >
                        <div className="text-3xl mb-2">💬</div>
                        <div className="font-medium text-gray-900">WhatsApp Retention</div>
                    </a>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Check-ins</h2>
                {todayAttendance && todayAttendance.length > 0 ? (
                    <div className="space-y-2">
                        {todayAttendance.slice(0, 5).map(a => (
                            <div key={a.id} className="flex justify-between items-center py-2 border-b last:border-0">
                                <span className="text-sm text-gray-600">Member ID: {a.member_id.slice(0, 8)}</span>
                                <span className="text-sm text-gray-500">
                                    {new Date(a.check_in_time).toLocaleTimeString()}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-sm">No check-ins today yet</p>
                )}
            </div>
        </div>
    )
}
