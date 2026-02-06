import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
    const supabase = await createClient()

    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
        redirect('/login')
    }

    // Get user profile to determine role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

    // Redirect to appropriate panel based on role
    if (profile) {
        switch (profile.role) {
            case 'OWNER':
                redirect('/owner/dashboard')
            case 'SUPERADMIN':
                redirect('/superadmin/dashboard')
            case 'TRAINER':
                redirect('/trainer/dashboard')
            case 'MEMBER':
                redirect('/member/dashboard')
            default:
                redirect('/login')
        }
    }

    redirect('/login')
}
