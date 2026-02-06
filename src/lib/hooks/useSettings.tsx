'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './useAuth'

interface GymSettings {
    id: string
    gym_id: string
    inactive_threshold_days: number
    reminder_days: number[]
    default_trainer_commission_rate: number
    allow_multiple_checkins_per_day: boolean
    allow_membership_freeze: boolean
    max_freeze_days_per_year: number
    enable_whatsapp_notifications: boolean
    enable_email_notifications: boolean
    enable_sms_notifications: boolean
    currency_code: string
    currency_symbol: string
    timezone: string
}

interface SettingsContextType {
    settings: GymSettings | null
    loading: boolean
    refreshSettings: () => Promise<void>
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<GymSettings | null>(null)
    const [loading, setLoading] = useState(true)
    const { profile } = useAuth()
    const supabase = createClient()

    const fetchSettings = async (gymId: string) => {
        const { data, error } = await supabase
            .from('gym_settings')
            .select('*')
            .eq('gym_id', gymId)
            .single()

        if (error || !data) {
            console.error('Error fetching settings:', error)
            return null
        }

        // Parse JSONB reminder_days and cast safely
        const reminder_days = Array.isArray(data.reminder_days)
            ? data.reminder_days
            : typeof data.reminder_days === 'string'
                ? JSON.parse(data.reminder_days)
                : []

        return {
            ...data,
            reminder_days
        } as unknown as GymSettings
    }

    useEffect(() => {
        const loadSettings = async () => {
            if (!profile?.gym_id) {
                setSettings(null)
                setLoading(false)
                return
            }

            const settingsData = await fetchSettings(profile.gym_id)
            setSettings(settingsData)
            setLoading(false)
        }

        loadSettings()
    }, [profile?.gym_id])

    const refreshSettings = async () => {
        if (profile?.gym_id) {
            const settingsData = await fetchSettings(profile.gym_id)
            setSettings(settingsData)
        }
    }

    return (
        <SettingsContext.Provider value={{ settings, loading, refreshSettings }}>
            {children}
        </SettingsContext.Provider>
    )
}

export function useSettings() {
    const context = useContext(SettingsContext)
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider')
    }
    return context
}
