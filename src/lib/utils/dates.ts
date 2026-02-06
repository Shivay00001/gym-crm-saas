import { differenceInDays, format, addDays, parseISO } from 'date-fns'

/**
 * Calculate membership end date from start date and plan duration
 * This is the ONLY place where duration calculation happens
 * All business logic reads dynamically from membership_plans.duration_days
 */
export function calculateMembershipEndDate(
    startDate: Date | string,
    durationDays: number
): Date {
    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate
    return addDays(start, durationDays)
}

/**
 * Get days until expiry
 */
export function getDaysUntilExpiry(endDate: Date | string): number {
    const end = typeof endDate === 'string' ? parseISO(endDate) : endDate
    return differenceInDays(end, new Date())
}

/**
 * Check if member should receive expiry reminder
 * Uses gym_settings.reminder_days array (e.g., [7, 3, 1])
 */
export function shouldSendExpiryReminder(
    endDate: Date | string,
    reminderDays: number[]
): boolean {
    const daysRemaining = getDaysUntilExpiry(endDate)
    return reminderDays.includes(daysRemaining) && daysRemaining >= 0
}

/**
 * Check if member is inactive
 * Uses gym_settings.inactive_threshold_days
 */
export function isInactive(
    lastAttendanceDate: Date | string | null,
    inactiveThresholdDays: number
): boolean {
    if (!lastAttendanceDate) return false

    const lastDate = typeof lastAttendanceDate === 'string'
        ? parseISO(lastAttendanceDate)
        : lastAttendanceDate

    const daysSinceLastAttendance = differenceInDays(new Date(), lastDate)
    return daysSinceLastAttendance > inactiveThresholdDays
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string, formatStr = 'dd MMM yyyy'): string {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, formatStr)
}

/**
 * Check if today is member's birthday
 */
export function isBirthdayToday(dateOfBirth: Date | string | null): boolean {
    if (!dateOfBirth) return false

    const dob = typeof dateOfBirth === 'string' ? parseISO(dateOfBirth) : dateOfBirth
    const today = new Date()

    return dob.getDate() === today.getDate() && dob.getMonth() === today.getMonth()
}

/**
 * Get membership status
 */
export function getMembershipStatus(endDate: Date | string): 'active' | 'expiring_soon' | 'expired' {
    const daysRemaining = getDaysUntilExpiry(endDate)

    if (daysRemaining < 0) return 'expired'
    if (daysRemaining <= 7) return 'expiring_soon' // This 7 can also be from settings
    return 'active'
}
