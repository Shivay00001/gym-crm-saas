'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSettings } from '@/lib/hooks/useSettings'
import { useAuth } from '@/lib/hooks/useAuth'

export default function SettingsPage() {
    const { settings, refreshSettings, loading: settingsLoading } = useSettings()
    const { profile } = useAuth()
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const supabase = createClient()

    const [formData, setFormData] = useState({
        inactive_threshold_days: 7,
        reminder_days: "7, 3, 1",
        default_trainer_commission_rate: 10,
        enable_whatsapp_notifications: true,
        currency_symbol: '₹'
    })

    useEffect(() => {
        if (settings) {
            setFormData({
                inactive_threshold_days: settings.inactive_threshold_days,
                reminder_days: settings.reminder_days.join(', '),
                default_trainer_commission_rate: settings.default_trainer_commission_rate,
                enable_whatsapp_notifications: settings.enable_whatsapp_notifications,
                currency_symbol: settings.currency_symbol
            })
        }
    }, [settings])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setMessage(null)

        try {
            const reminderDaysArray = formData.reminder_days
                .split(',')
                .map(d => parseInt(d.trim()))
                .filter(d => !isNaN(d))
                .sort((a, b) => b - a)

            const { error } = await supabase
                .from('gym_settings')
                .update({
                    inactive_threshold_days: formData.inactive_threshold_days,
                    reminder_days: JSON.stringify(reminderDaysArray),
                    default_trainer_commission_rate: formData.default_trainer_commission_rate,
                    enable_whatsapp_notifications: formData.enable_whatsapp_notifications,
                    currency_symbol: formData.currency_symbol
                })
                .eq('gym_id', profile!.gym_id!)

            if (error) throw error

            await refreshSettings()
            setMessage({ type: 'success', text: 'Settings updated successfully' })
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message })
        } finally {
            setSaving(false)
        }
    }

    if (settingsLoading) return <div>Loading settings...</div>

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Gym Settings</h1>
            <p className="text-gray-600">
                Configure your business rules dynamically. These settings control how the entire system behaves.
            </p>

            {message && (
                <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border space-y-6">
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Business Rules</h2>

                    <div>
                        <label htmlFor="inactive_threshold" className="block text-sm font-medium text-gray-700 mb-1">
                            Inactive Member Threshold (Days)
                        </label>
                        <p className="text-xs text-gray-500 mb-2">
                            Members who haven't attended for this many days will be marked as "Inactive".
                        </p>
                        <input
                            id="inactive_threshold"
                            type="number"
                            value={formData.inactive_threshold_days}
                            onChange={e => setFormData(prev => ({ ...prev, inactive_threshold_days: parseInt(e.target.value) }))}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label htmlFor="reminder_days" className="block text-sm font-medium text-gray-700 mb-1">
                            Expiry Reminder Days
                        </label>
                        <p className="text-xs text-gray-500 mb-2">
                            Comma-separated list of days before expiry to show alerts and enable WhatsApp reminders.
                        </p>
                        <input
                            id="reminder_days"
                            type="text"
                            value={formData.reminder_days}
                            onChange={e => setFormData(prev => ({ ...prev, reminder_days: e.target.value }))}
                            placeholder="e.g. 7, 3, 1"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label htmlFor="commission_rate" className="block text-sm font-medium text-gray-700 mb-1">
                            Default Trainer Commission (%)
                        </label>
                        <input
                            id="commission_rate"
                            type="number"
                            step="0.5"
                            value={formData.default_trainer_commission_rate}
                            onChange={e => setFormData(prev => ({ ...prev, default_trainer_commission_rate: parseFloat(e.target.value) }))}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>

                <div className="space-y-4 pt-4">
                    <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Configuration</h2>

                    <div>
                        <label htmlFor="currency_symbol" className="block text-sm font-medium text-gray-700 mb-1">
                            Currency Symbol
                        </label>
                        <input
                            id="currency_symbol"
                            type="text"
                            value={formData.currency_symbol}
                            onChange={e => setFormData(prev => ({ ...prev, currency_symbol: e.target.value }))}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            id="whatsapp"
                            checked={formData.enable_whatsapp_notifications}
                            onChange={e => setFormData(prev => ({ ...prev, enable_whatsapp_notifications: e.target.checked }))}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="whatsapp" className="text-sm font-medium text-gray-700">
                            Enable WhatsApp Features
                        </label>
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                    >
                        {saving ? 'Saving Changes...' : 'Save Settings'}
                    </button>
                </div>
            </form>
        </div>
    )
}
