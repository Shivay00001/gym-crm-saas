// Generated from Supabase schema
// Run: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/types.ts

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type UserRole = 'SUPERADMIN' | 'OWNER' | 'TRAINER' | 'MEMBER'
export type LeadStatus = 'NEW' | 'CONTACTED' | 'TRIAL' | 'CONVERTED' | 'LOST'
export type LeadSource = 'WALK_IN' | 'REFERRAL' | 'WEBSITE' | 'SOCIAL_MEDIA' | 'ADVERTISEMENT' | 'OTHER'
export type MembershipStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
export type PaymentMethod = 'CASH' | 'CARD' | 'UPI' | 'BANK_TRANSFER' | 'OTHER'
export type SubscriptionTier = 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE'
export type MessageTemplateType = 'EXPIRY_REMINDER' | 'INACTIVE_MEMBER' | 'TRIAL_FOLLOWUP' | 'BIRTHDAY_WISH' | 'PAYMENT_REMINDER' | 'CUSTOM'

export interface Database {
    public: {
        Tables: {
            gyms: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                    owner_id: string
                    subscription_plan_id: string | null
                    email: string | null
                    phone: string | null
                    address: string | null
                    city: string | null
                    state: string | null
                    country: string
                    pincode: string | null
                    logo_url: string | null
                    website: string | null
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    description?: string | null
                    owner_id: string
                    subscription_plan_id?: string | null
                    email?: string | null
                    phone?: string | null
                    address?: string | null
                    city?: string | null
                    state?: string | null
                    country?: string
                    pincode?: string | null
                    logo_url?: string | null
                    website?: string | null
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    description?: string | null
                    owner_id?: string
                    subscription_plan_id?: string | null
                    email?: string | null
                    phone?: string | null
                    address?: string | null
                    city?: string | null
                    state?: string | null
                    country?: string
                    pincode?: string | null
                    logo_url?: string | null
                    website?: string | null
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            profiles: {
                Row: {
                    id: string
                    email: string | null
                    phone: string | null
                    full_name: string
                    role: UserRole
                    gym_id: string | null
                    avatar_url: string | null
                    date_of_birth: string | null
                    gender: string | null
                    address: string | null
                    city: string | null
                    state: string | null
                    pincode: string | null
                    emergency_contact_name: string | null
                    emergency_contact_phone: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email?: string | null
                    phone?: string | null
                    full_name: string
                    role?: UserRole
                    gym_id?: string | null
                    avatar_url?: string | null
                    date_of_birth?: string | null
                    gender?: string | null
                    address?: string | null
                    city?: string | null
                    state?: string | null
                    pincode?: string | null
                    emergency_contact_name?: string | null
                    emergency_contact_phone?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string | null
                    phone?: string | null
                    full_name?: string
                    role?: UserRole
                    gym_id?: string | null
                    avatar_url?: string | null
                    date_of_birth?: string | null
                    gender?: string | null
                    address?: string | null
                    city?: string | null
                    state?: string | null
                    pincode?: string | null
                    emergency_contact_name?: string | null
                    emergency_contact_phone?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            gym_settings: {
                Row: {
                    id: string
                    gym_id: string
                    inactive_threshold_days: number
                    reminder_days: Json
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
                    custom_settings: Json
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    gym_id: string
                    inactive_threshold_days?: number
                    reminder_days?: Json
                    default_trainer_commission_rate?: number
                    allow_multiple_checkins_per_day?: boolean
                    allow_membership_freeze?: boolean
                    max_freeze_days_per_year?: number
                    enable_whatsapp_notifications?: boolean
                    enable_email_notifications?: boolean
                    enable_sms_notifications?: boolean
                    currency_code?: string
                    currency_symbol?: string
                    timezone?: string
                    custom_settings?: Json
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    gym_id?: string
                    inactive_threshold_days?: number
                    reminder_days?: Json
                    default_trainer_commission_rate?: number
                    allow_multiple_checkins_per_day?: boolean
                    allow_membership_freeze?: boolean
                    max_freeze_days_per_year?: number
                    enable_whatsapp_notifications?: boolean
                    enable_email_notifications?: boolean
                    enable_sms_notifications?: boolean
                    currency_code?: string
                    currency_symbol?: string
                    timezone?: string
                    custom_settings?: Json
                    created_at?: string
                    updated_at?: string
                }
            }
            membership_plans: {
                Row: {
                    id: string
                    gym_id: string
                    name: string
                    description: string | null
                    duration_days: number
                    price: number
                    discount_percentage: number
                    features: Json
                    is_active: boolean
                    display_order: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    gym_id: string
                    name: string
                    description?: string | null
                    duration_days: number
                    price: number
                    discount_percentage?: number
                    features?: Json
                    is_active?: boolean
                    display_order?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    gym_id?: string
                    name?: string
                    description?: string | null
                    duration_days?: number
                    price?: number
                    discount_percentage?: number
                    features?: Json
                    is_active?: boolean
                    display_order?: number
                    created_at?: string
                    updated_at?: string
                }
            }
            members: {
                Row: {
                    id: string
                    gym_id: string
                    user_id: string | null
                    full_name: string
                    email: string | null
                    phone: string
                    date_of_birth: string | null
                    gender: string | null
                    blood_group: string | null
                    address: string | null
                    city: string | null
                    state: string | null
                    pincode: string | null
                    emergency_contact_name: string | null
                    emergency_contact_phone: string | null
                    emergency_contact_relation: string | null
                    height_cm: number | null
                    weight_kg: number | null
                    medical_conditions: string | null
                    allergies: string | null
                    fitness_goal: string | null
                    assigned_trainer_id: string | null
                    join_date: string
                    profile_photo_url: string | null
                    is_active: boolean
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    gym_id: string
                    user_id?: string | null
                    full_name: string
                    email?: string | null
                    phone: string
                    date_of_birth?: string | null
                    gender?: string | null
                    blood_group?: string | null
                    address?: string | null
                    city?: string | null
                    state?: string | null
                    pincode?: string | null
                    emergency_contact_name?: string | null
                    emergency_contact_phone?: string | null
                    emergency_contact_relation?: string | null
                    height_cm?: number | null
                    weight_kg?: number | null
                    medical_conditions?: string | null
                    allergies?: string | null
                    fitness_goal?: string | null
                    assigned_trainer_id?: string | null
                    join_date?: string
                    profile_photo_url?: string | null
                    is_active?: boolean
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    gym_id?: string
                    user_id?: string | null
                    full_name?: string
                    email?: string | null
                    phone?: string
                    date_of_birth?: string | null
                    gender?: string | null
                    blood_group?: string | null
                    address?: string | null
                    city?: string | null
                    state?: string | null
                    pincode?: string | null
                    emergency_contact_name?: string | null
                    emergency_contact_phone?: string | null
                    emergency_contact_relation?: string | null
                    height_cm?: number | null
                    weight_kg?: number | null
                    medical_conditions?: string | null
                    allergies?: string | null
                    fitness_goal?: string | null
                    assigned_trainer_id?: string | null
                    join_date?: string
                    profile_photo_url?: string | null
                    is_active?: boolean
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            member_memberships: {
                Row: {
                    id: string
                    member_id: string
                    membership_plan_id: string
                    start_date: string
                    end_date: string
                    amount_paid: number
                    discount_applied: number
                    status: MembershipStatus
                    is_frozen: boolean
                    freeze_start_date: string | null
                    freeze_end_date: string | null
                    created_by: string | null
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    member_id: string
                    membership_plan_id: string
                    start_date: string
                    end_date: string
                    amount_paid: number
                    discount_applied?: number
                    status?: MembershipStatus
                    is_frozen?: boolean
                    freeze_start_date?: string | null
                    freeze_end_date?: string | null
                    created_by?: string | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    member_id?: string
                    membership_plan_id?: string
                    start_date?: string
                    end_date?: string
                    amount_paid?: number
                    discount_applied?: number
                    status?: MembershipStatus
                    is_frozen?: boolean
                    freeze_start_date?: string | null
                    freeze_end_date?: string | null
                    created_by?: string | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            attendance: {
                Row: {
                    id: string
                    gym_id: string
                    member_id: string
                    check_in_time: string
                    check_out_time: string | null
                    date: string
                    notes: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    gym_id: string
                    member_id: string
                    check_in_time?: string
                    check_out_time?: string | null
                    date?: string
                    notes?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    gym_id?: string
                    member_id?: string
                    check_in_time?: string
                    check_out_time?: string | null
                    date?: string
                    notes?: string | null
                    created_at?: string
                }
            }
            message_templates: {
                Row: {
                    id: string
                    gym_id: string
                    name: string
                    type: MessageTemplateType
                    channel: string
                    subject: string | null
                    content: string
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    gym_id: string
                    name: string
                    type: MessageTemplateType
                    channel?: string
                    subject?: string | null
                    content: string
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    gym_id?: string
                    name?: string
                    type?: MessageTemplateType
                    channel?: string
                    subject?: string | null
                    content?: string
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            // Additional tables omitted for brevity - add as needed
        }
        Views: {
            active_memberships: {
                Row: {
                    id: string
                    member_id: string
                    member_name: string
                    phone: string
                    gym_id: string
                    plan_name: string
                    days_remaining: number
                    // Additional fields
                }
            }
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            user_role: UserRole
            lead_status: LeadStatus
            lead_source: LeadSource
            membership_status: MembershipStatus
            payment_status: PaymentStatus
            payment_method: PaymentMethod
            subscription_tier: SubscriptionTier
            message_template_type: MessageTemplateType
        }
    }
}
