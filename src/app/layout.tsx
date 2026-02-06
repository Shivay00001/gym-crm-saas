import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/hooks/useAuth'
import { SettingsProvider } from '@/lib/hooks/useSettings'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Gym CRM SaaS - Manage Your Gym Business',
    description: 'Production-ready Gym CRM platform with role-based access for owners, trainers, and members',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <AuthProvider>
                    <SettingsProvider>
                        {children}
                    </SettingsProvider>
                </AuthProvider>
            </body>
        </html>
    )
}
