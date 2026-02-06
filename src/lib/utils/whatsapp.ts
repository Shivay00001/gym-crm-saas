import { MessageTemplateType } from '../supabase/types'

export interface MessageTemplate {
    id: string
    gym_id: string
    name: string
    type: MessageTemplateType
    channel: string
    content: string
    subject?: string | null
}

export interface MessageVariables {
    member_name?: string
    expiry_date?: string
    gym_name?: string
    plan_name?: string
    days_remaining?: string
    trainer_name?: string
    amount?: string
    [key: string]: string | undefined
}

/**
 * Generate WhatsApp tap-to-send link
 * Opens WhatsApp with pre-filled message from template
 * NO API integration - just generates wa.me link
 */
export function generateWhatsAppLink(
    phone: string,
    template: MessageTemplate,
    variables: MessageVariables
): string {
    // Clean phone number (remove spaces, dashes, etc.)
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')

    // Replace all placeholders in template with actual values
    let message = template.content
    Object.entries(variables).forEach(([key, value]) => {
        const placeholder = `{${key}}`
        message = message.replace(new RegExp(placeholder, 'g'), value || '')
    })

    // Encode message for URL
    const encodedMessage = encodeURIComponent(message)

    // Return WhatsApp link (international format)
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`
}

/**
 * Generate email mailto link with template
 */
export function generateEmailLink(
    email: string,
    template: MessageTemplate,
    variables: MessageVariables
): string {
    let subject = template.subject || template.name
    let body = template.content

    Object.entries(variables).forEach(([key, value]) => {
        const placeholder = `{${key}}`
        subject = subject.replace(new RegExp(placeholder, 'g'), value || '')
        body = body.replace(new RegExp(placeholder, 'g'), value || '')
    })

    const encodedSubject = encodeURIComponent(subject)
    const encodedBody = encodeURIComponent(body)

    return `mailto:${email}?subject=${encodedSubject}&body=${encodedBody}`
}

/**
 * Preview template with sample variables (for settings UI)
 */
export function previewTemplate(
    template: MessageTemplate,
    sampleVariables?: MessageVariables
): string {
    const defaultSamples: MessageVariables = {
        member_name: 'John Doe',
        expiry_date: '31st Dec 2024',
        gym_name: 'FitLife Gym',
        plan_name: 'Monthly Membership',
        days_remaining: '3',
        trainer_name: 'Mike Johnson',
        amount: '₹1500',
    }

    const vars = { ...defaultSamples, ...sampleVariables }
    let preview = template.content

    Object.entries(vars).forEach(([key, value]) => {
        const placeholder = `{${key}}`
        preview = preview.replace(new RegExp(placeholder, 'g'), value || '')
    })

    return preview
}
