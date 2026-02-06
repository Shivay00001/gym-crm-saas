# Gym CRM SaaS - Deployment Guide

This guide covers how to deploy the Gym CRM SaaS to production using Supabase and Vercel.

## 1. Supabase Setup (Backend)

1. **Create Project**: Go to [database.new](https://database.new) and create a new project.
2. **SQL Setup**:
    * Go to the **SQL Editor** in the Supabase Dashboard.
    * Open the `supabase/schema.sql` file from this project.
    * Copy the entire content and paste it into the SQL Editor.
    * Click **Run** to generate all tables, types, RLS policies, and seed data.
3. **Auth Configuration**:
    * Go to **Authentication** > **Providers**.
    * Enable **Email** (and optionally Phone if you have a provider).
    * Disable "Confirm email" if you want instant signups for testing (Recommended for dev).
4. **Storage Setup** (Optional for now):
    * Create a public bucket named `avatars`.
    * Add a policy to allow authenticated users to upload.

## 2. Environment Variables

Create a `.env.local` file in the root directory with the following keys from your Supabase Project Settings > API:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 3. Local Development

1. **Install Dependencies**:

    ```bash
    npm install
    ```

2. **Run Development Server**:

    ```bash
    npm run dev
    ```

3. **Verify**:
    * Open `http://localhost:3000`.
    * You should see the Login page.

## 4. Creating Your First Admin User

Since the system is protected by RLS, you need a Superadmin or Owner to start.

1. **Sign Up**: Go to `/login` and sign up a new user (or use Supabase Auth UI to create one).
2. **Assign Role**:
    * Go to Supabase Dashboard > **Table Editor** > `profiles`.
    * Find your user row.
    * Change `role` from `MEMBER` to `OWNER`.
    * **CRITICAL**: You must create a Gym for this owner.
3. **Create Gym**:
    * Go to `gyms` table.
    * Insert a new row:
        * `name`: "My Tech Gym"
        * `owner_id`: [Your User ID]
    * **Save**.
4. **Link Profile**:
    * Go back to `profiles`.
    * Update your row's `gym_id` to the ID of the gym you just created.

*Now you can log in as an Owner and access the dashboard.*

## 5. Deployment to Vercel (Frontend)

1. Push your code to a GitHub repository.
2. Go to [Vercel](https://vercel.com) and import the project.
3. **Environment Variables**:
    * Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel project settings.
4. **Deploy**: Click Deploy.

## 6. Verification Checklist

* [ ] **Login works**: User can sign in.
* [ ] **Role Redirect**: Owner goes to `/owner/dashboard`, Member to `/member/dashboard`.
* [ ] **Settings**: Owner can update "Inactive Threshold" in Settings and it saves.
* [ ] **Plans**: Owner can create a new Membership Plan (e.g., "Silver", 45 days, ₹2000).
* [ ] **WhatsApp**: Clicking "WhatsApp" on Retention page opens `wa.me` link with correct template.

## Troubleshooting

* **"Permission denied" errors**: Check RLS policies in `schema.sql`. Ensure your user has the correct `role` and `gym_id` in the `profiles` table.
* **Empty Dashboard**: Ensure your user is linked to a valid `gym_id`.
