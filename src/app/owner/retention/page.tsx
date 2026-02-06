'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useSettings } from '@/lib/hooks/useSettings'
import { generateWhatsAppLink, MessageVariables } from '@/lib/utils/whatsapp'
import { formatDate, getDaysUntilExpiry, isBirthdayToday } from '@/lib/utils/dates'

interface MemberRetention {
    id: string
    full_name: string
    phone: string
    email: string | null
    date_of_birth: string | null
    category: 'expiring' | 'inactive' | 'birthday' | 'trial'
    days_remaining?: number
    last_attendance?: string | null
    end_date?: string
    plan_name?: string
}

export default function RetentionPage() {
    const [members, setMembers] = useState<MemberRetention[]>([])
    const [templates, setTemplates] = useState<any[]>([])
    const [category, setCategory] = useState<'expiring' | 'inactive' | 'birthday' | 'trial'>('expiring')
    const [loading, setLoading] = useState(true)
    const { profile } = useAuth()
    const { settings } = useSettings()
    const supabase = createClient()

    useEffect(() => {
        if (profile?.gym_id) {
            fetchData()
        }
    }, [profile?.gym_id, category])

    const fetchData = async () => {
        setLoading(true)

        // Fetch message templates
        const { data: templatesData } = await supabase
            .from('message_templates')
            .select('*')
            .eq('gym_id', profile!.gym_id!)
            .eq('is_active', true)

        setTemplates(templatesData || [])

        // Fetch members based on category
        if (category === 'expiring') {
            await fetchExpiringMembers()
        } else if (category === 'inactive') {
            await fetchInactiveMembers()
        } else if (category === 'birthday') {
            await fetchBirthdayMembers()
        }

        setLoading(false)
    }

    const fetchExpiringMembers = async () => {
        const reminderDays = settings?.reminder_days || [7, 3, 1]
        const today = new Date().toISOString().split('T')[0]
        const maxDays = Math.max(...reminderDays)
        const endDate = new Date(Date.now() + maxDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

        const { data } = await supabase
            .from('member_memberships')
            .select(`
        id,
        end_date,
        member:members (
          id,
          full_name,
          phone,
          email
        ),
        plan:membership_plans (
          name
        )
      `)
            .eq('status', 'ACTIVE')
            .gte('end_date', today)
            .lte('end_date', endDate)

        const formatted: MemberRetention[] = (data || []).map((m: any) => ({
            id: m.member.id,
            full_name: m.member.full_name,
            phone: m.member.phone,
            email: m.member.email,
            date_of_birth: null,
            category: 'expiring' as const,
            days_remaining: getDaysUntilExpiry(m.end_date),
            end_date: m.end_date,
            plan_name: m.plan.name
        }))

        setMembers(formatted.filter(m => reminderDays.includes(m.days_remaining!)))
    }

    const fetchInactiveMembers = async () => {
        const thresholdDays = settings?.inactive_threshold_days || 7
        const thresholdDate = new Date(Date.now() - thresholdDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

        // Get members with last attendance older than threshold
        const { data } = await supabase
            .from('members')
            .select(`
        id,
        full_name,
        phone,
        email,
        attendance (
          date
        )
      `)
            .eq('gym_id', profile!.gym_id!)
            .eq('is_active', true)
            .order('date', { foreignTable: 'attendance', ascending: false })
            .limit(1, { foreignTable: 'attendance' })

        const formatted: MemberRetention[] = (data || [])
            .filter((m: any) => {
                const lastDate = m.attendance?.[0]?.date
                return !lastDate || lastDate < thresholdDate
            })
            .map((m: any) => ({
                id: m.id,
                full_name: m.full_name,
                phone: m.phone,
                email: m.email,
                date_of_birth: null,
                category: 'inactive' as const,
                last_attendance: m.attendance?.[0]?.date || null
            }))

        setMembers(formatted)
    }

    const fetchBirthdayMembers = async () => {
        const { data } = await supabase
            .from('members')
            .select('id, full_name, phone, email, date_of_birth')
            .eq('gym_id', profile!.gym_id!)
            .eq('is_active', true)
            .not('date_of_birth', 'is', null)

        const formatted: MemberRetention[] = (data || [])
            .filter(m => isBirthdayToday(m.date_of_birth))
            .map(m => ({
                ...m,
                category: 'birthday' as const
            }))

        setMembers(formatted)
    }

    const getTemplate = (type: string) => {
        return templates.find(t => t.type === type && t.channel === 'whatsapp')
    }

    const handleWhatsAppClick = (member: MemberRetention) => {
        let template
        let variables: MessageVariables = {
            member_name: member.full_name,
            gym_name: 'Your Gym' // TODO: Get from gym settings
        }

        if (member.category === 'expiring') {
            template = getTemplate('EXPIRY_REMINDER')
            variables = {
                ...variables,
                expiry_date: member.end_date ? formatDate(member.end_date) : '',
                days_remaining: member.days_remaining?.toString() || '',
                plan_name: member.plan_name || ''
            }
        } else if (member.category === 'inactive') {
            template = getTemplate('INACTIVE_MEMBER')
        } else if (member.category === 'birthday') {
            template = getTemplate('BIRTHDAY_WISH')
        }

        if (!template) {
            alert('No template configured for this category. Please add templates in Settings.')
            return
        }

        const link = generateWhatsAppLink(member.phone, template, variables)
        window.open(link, '_blank')
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">WhatsApp Retention</h1>
                <a href="/owner/settings#templates" className="text-sm text-blue-600 hover:underline">
                    Manage Templates →
                </a>
            </div>

            {/* Category Tabs */}
            <div className="border-b">
                <div className="flex space-x-8">
                    {[
                        { id: 'expiring', label: 'Expiring Soon', icon: '⏰' },
                        { id: 'inactive', label: 'Inactive Members', icon: '😴' },
                        { id: 'birthday', label: 'Birthdays Today', icon: '🎂' }
                    ].map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setCategory(cat.id as any)}
                            className={`pb-4 px-2 border-b-2 transition ${category === cat.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <span className="mr-2">{cat.icon}</span>
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Members List */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="text-gray-500">Loading...</div>
                </div>
            ) : members.length === 0 ? (
                <div className="bg-gray-50 rounded-xl p-12 text-center">
                    <div className="text-4xl mb-4">✅</div>
                    <div className="text-gray-900 font-medium mb-2">All good!</div>
                    <div className="text-gray-600 text-sm">No members in this category</div>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Member</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Phone</th>
                                {category === 'expiring' && (
                                    <>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Plan</th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Days Left</th>
                                    </>
                                )}
                                {category === 'inactive' && (
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Last Seen</th>
                                )}
                                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {members.map(member => (
                                <tr key={member.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{member.full_name}</div>
                                        {member.email && <div className="text-sm text-gray-500">{member.email}</div>}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{member.phone}</td>
                                    {category === 'expiring' && (
                                        <>
                                            <td className="px-6 py-4 text-sm text-gray-600">{member.plan_name}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${member.days_remaining! <= 1
                                                        ? 'bg-red-100 text-red-700'
                                                        : member.days_remaining! <= 3
                                                            ? 'bg-yellow-100 text-yellow-700'
                                                            : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {member.days_remaining} days
                                                </span>
                                            </td>
                                        </>
                                    )}
                                    {category === 'inactive' && (
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {member.last_attendance ? formatDate(member.last_attendance) : 'Never'}
                                        </td>
                                    )}
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleWhatsAppClick(member)}
                                            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                                        >
                                            <span className="mr-2">📱</span>
                                            WhatsApp
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
