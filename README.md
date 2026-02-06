# Gym CRM SaaS

A production-ready, multi-tenant Gym CRM built with Next.js 14, Supabase, and Tailwind CSS.

## Features

- 🏗 **Multi-Tenant Architecture**: Single codebase supports multiple isolated gyms.
- 🔐 **Role-Based Access**: Separate panels for Owners, Trainers, and Members.
- ⚙️ **Dynamic Configuration**: ZERO hardcoded business numbers. All rules (pricing, duration, reminders) are configurable.
- 📱 **WhatsApp Integration**: "Tap-to-send" retention system with dynamic localized templates.
- 🛡 **Row Level Security**: robust data isolation using Postgres RLS policies.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Styling**: Tailwind CSS
- **State**: React Context + Server Components

## Getting Started

1. **Setup Database**: Run `supabase/schema.sql` in your Supabase SQL Editor.
2. **Configure Env**: Copy `.env.example` to `.env.local` and add credentials.
3. **Run Locally**: `npm run dev`.

See [DEPLOYMENT.md](DEPLOYMENT.md) for full setup and deployment instructions.
