-- ============================================
-- GYM CRM SAAS - COMPLETE DATABASE SCHEMA
-- Supabase PostgreSQL Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- RESET (CAUTION: DELETES ALL DATA)
-- ============================================

DROP TABLE IF EXISTS message_templates CASCADE;
DROP TABLE IF EXISTS lead_followups CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS diet_plan_items CASCADE;
DROP TABLE IF EXISTS diet_plans CASCADE;
DROP TABLE IF EXISTS workout_plan_items CASCADE;
DROP TABLE IF EXISTS workout_plans CASCADE;
DROP TABLE IF EXISTS trainers CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS member_memberships CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS membership_plans CASCADE;
DROP TABLE IF EXISTS gym_settings CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS gym_subscriptions CASCADE;
DROP TABLE IF EXISTS gyms CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;

DROP TYPE IF EXISTS message_template_type CASCADE;
DROP TYPE IF EXISTS subscription_tier CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS membership_status CASCADE;
DROP TYPE IF EXISTS lead_source CASCADE;
DROP TYPE IF EXISTS lead_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('SUPERADMIN', 'OWNER', 'TRAINER', 'MEMBER');
CREATE TYPE lead_status AS ENUM ('NEW', 'CONTACTED', 'TRIAL', 'CONVERTED', 'LOST');
CREATE TYPE lead_source AS ENUM ('WALK_IN', 'REFERRAL', 'WEBSITE', 'SOCIAL_MEDIA', 'ADVERTISEMENT', 'OTHER');
CREATE TYPE membership_status AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');
CREATE TYPE payment_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
CREATE TYPE payment_method AS ENUM ('CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'OTHER');
CREATE TYPE subscription_tier AS ENUM ('FREE', 'STARTER', 'PRO', 'ENTERPRISE');
CREATE TYPE message_template_type AS ENUM ('EXPIRY_REMINDER', 'INACTIVE_MEMBER', 'TRIAL_FOLLOWUP', 'BIRTHDAY_WISH', 'PAYMENT_REMINDER', 'CUSTOM');

-- ============================================
-- CORE TABLES
-- ============================================

-- Subscription Plans (SaaS Layer)
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  tier subscription_tier NOT NULL UNIQUE,
  price_monthly DECIMAL(10,2),
  price_annual DECIMAL(10,2),
  max_members INTEGER, -- NULL = unlimited
  max_trainers INTEGER,
  max_branches INTEGER DEFAULT 1,
  features JSONB DEFAULT '{}', -- {"analytics": true, "whatsapp": true, "ai_insights": false}
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gyms (Multi-tenant root)
CREATE TABLE gyms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_plan_id UUID REFERENCES subscription_plans(id),
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  pincode TEXT,
  logo_url TEXT,
  website TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gym Subscriptions (Billing)
CREATE TABLE gym_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  subscription_plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active', -- active, expired, cancelled
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'MEMBER',
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
  avatar_url TEXT,
  date_of_birth DATE,
  gender TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gym Settings (All dynamic configuration)
CREATE TABLE gym_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL UNIQUE REFERENCES gyms(id) ON DELETE CASCADE,
  
  -- Business Rules (NO HARDCODED VALUES)
  inactive_threshold_days INTEGER DEFAULT 7,
  reminder_days JSONB DEFAULT '[7, 3, 1]', -- Array of days before expiry
  default_trainer_commission_rate DECIMAL(5,2) DEFAULT 10.00, -- Percentage
  
  -- Attendance Settings
  allow_multiple_checkins_per_day BOOLEAN DEFAULT false,
  
  -- Membership Settings
  allow_membership_freeze BOOLEAN DEFAULT true,
  max_freeze_days_per_year INTEGER DEFAULT 15,
  
  -- Notification Settings
  enable_whatsapp_notifications BOOLEAN DEFAULT true,
  enable_email_notifications BOOLEAN DEFAULT true,
  enable_sms_notifications BOOLEAN DEFAULT false,
  
  -- Currency and Locale
  currency_code TEXT DEFAULT 'INR',
  currency_symbol TEXT DEFAULT '₹',
  timezone TEXT DEFAULT 'Asia/Kolkata',
  
  -- Custom Settings (extensible)
  custom_settings JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Membership Plans (Dynamic durations and prices)
CREATE TABLE membership_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "Monthly", "Quarterly", "Annual"
  description TEXT,
  duration_days INTEGER NOT NULL, -- DYNAMIC: 30, 90, 180, 365, etc.
  price DECIMAL(10,2) NOT NULL, -- DYNAMIC: No hardcoded prices
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  features JSONB DEFAULT '[]', -- ["Access to all equipment", "Free trainer consultation"]
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_gym_plan_name UNIQUE(gym_id, name)
);

-- Members
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL if not registered
  
  -- Personal Info
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT,
  blood_group TEXT,
  
  -- Address
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  
  -- Emergency Contact
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relation TEXT,
  
  -- Health Info
  height_cm DECIMAL(5,2),
  weight_kg DECIMAL(5,2),
  medical_conditions TEXT,
  allergies TEXT,
  fitness_goal TEXT,
  
  -- Membership Info
  assigned_trainer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  join_date DATE DEFAULT CURRENT_DATE,
  profile_photo_url TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Member Memberships (Links members to plans)
CREATE TABLE member_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  membership_plan_id UUID NOT NULL REFERENCES membership_plans(id),
  
  -- Dates (calculated from plan.duration_days)
  start_date DATE NOT NULL,
  end_date DATE NOT NULL, -- start_date + plan.duration_days
  
  -- Payment Info
  amount_paid DECIMAL(10,2) NOT NULL,
  discount_applied DECIMAL(10,2) DEFAULT 0,
  
  -- Status
  status membership_status DEFAULT 'ACTIVE',
  is_frozen BOOLEAN DEFAULT false,
  freeze_start_date DATE,
  freeze_end_date DATE,
  
  -- Metadata
  created_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  check_in_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  check_out_time TIMESTAMPTZ,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  membership_id UUID REFERENCES member_memberships(id) ON DELETE SET NULL,
  
  amount DECIMAL(10,2) NOT NULL,
  payment_method payment_method NOT NULL,
  payment_status payment_status DEFAULT 'PENDING',
  transaction_id TEXT,
  
  payment_date DATE DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  notes TEXT,
  
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trainers (Extended profile info)
CREATE TABLE trainers (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  
  specialization TEXT[],
  certifications TEXT[],
  experience_years INTEGER,
  bio TEXT,
  
  -- Commission (from settings, but can override per trainer)
  commission_rate DECIMAL(5,2), -- If NULL, use gym_settings.default_trainer_commission_rate
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workout Plans
CREATE TABLE workout_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  trainer_id UUID REFERENCES trainers(id) ON DELETE SET NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  is_template BOOLEAN DEFAULT false, -- true = reusable template
  
  start_date DATE,
  end_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workout Plan Items (Day-wise exercises)
CREATE TABLE workout_plan_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_plan_id UUID NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
  
  day_number INTEGER, -- 1-7 or NULL for all days
  day_name TEXT, -- "Monday" or "Day 1"
  exercise_name TEXT NOT NULL,
  sets INTEGER,
  reps TEXT, -- "10-12" or "AMRAP"
  weight_kg DECIMAL(5,2),
  duration_minutes INTEGER,
  rest_seconds INTEGER,
  notes TEXT,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Diet Plans
CREATE TABLE diet_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  trainer_id UUID REFERENCES trainers(id) ON DELETE SET NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  is_template BOOLEAN DEFAULT false,
  
  target_calories INTEGER,
  target_protein_g INTEGER,
  target_carbs_g INTEGER,
  target_fat_g INTEGER,
  
  start_date DATE,
  end_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Diet Plan Items (Meal-wise)
CREATE TABLE diet_plan_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  diet_plan_id UUID NOT NULL REFERENCES diet_plans(id) ON DELETE CASCADE,
  
  meal_name TEXT NOT NULL, -- "Breakfast", "Lunch", "Dinner", "Snack 1"
  meal_time TIME,
  food_items TEXT NOT NULL, -- "2 eggs, 2 bread slices, 1 banana"
  calories INTEGER,
  protein_g INTEGER,
  carbs_g INTEGER,
  fat_g INTEGER,
  notes TEXT,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads (CRM)
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  source lead_source DEFAULT 'WALK_IN',
  status lead_status DEFAULT 'NEW',
  
  interested_in TEXT, -- "Weight Loss", "Muscle Gain", etc.
  budget DECIMAL(10,2),
  
  trial_start_date DATE,
  trial_end_date DATE,
  
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Owner/Trainer
  converted_to_member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  
  next_followup_date DATE,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lead Follow-ups
CREATE TABLE lead_followups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  
  followup_date DATE NOT NULL DEFAULT CURRENT_DATE,
  followup_type TEXT, -- "Call", "WhatsApp", "Email", "In-person"
  notes TEXT NOT NULL,
  next_followup_date DATE,
  
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Message Templates (WhatsApp, Email, SMS)
CREATE TABLE message_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  type message_template_type NOT NULL,
  channel TEXT DEFAULT 'whatsapp', -- whatsapp, email, sms
  
  subject TEXT, -- For email
  content TEXT NOT NULL, -- Supports placeholders: {member_name}, {expiry_date}, {gym_name}, etc.
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_gym_template_type UNIQUE(gym_id, type, channel)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_profiles_gym_id ON profiles(gym_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_members_gym_id ON members(gym_id);
CREATE INDEX idx_members_assigned_trainer ON members(assigned_trainer_id);
CREATE INDEX idx_members_phone ON members(phone);
CREATE INDEX idx_member_memberships_member_id ON member_memberships(member_id);
CREATE INDEX idx_member_memberships_status ON member_memberships(status);
CREATE INDEX idx_member_memberships_end_date ON member_memberships(end_date);
CREATE INDEX idx_attendance_member_date ON attendance(member_id, date);
CREATE INDEX idx_attendance_gym_date ON attendance(gym_id, date);
CREATE INDEX idx_payments_member_id ON payments(member_id);
CREATE INDEX idx_payments_gym_id ON payments(gym_id);
CREATE INDEX idx_leads_gym_status ON leads(gym_id, status);
CREATE INDEX idx_leads_next_followup ON leads(next_followup_date) WHERE status != 'CONVERTED' AND status != 'LOST';
CREATE INDEX idx_workout_plans_member ON workout_plans(member_id);
CREATE INDEX idx_diet_plans_member ON diet_plans(member_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

-- Subscription Plans (public read, admin write)
CREATE POLICY "Anyone can view subscription plans"
ON subscription_plans FOR SELECT
USING (is_active = true);

-- Gyms Policies
CREATE POLICY "Owners can view their gyms"
ON gyms FOR SELECT
USING (owner_id = auth.uid());

CREATE POLICY "Owners can update their gyms"
ON gyms FOR UPDATE
USING (owner_id = auth.uid());

CREATE POLICY "Authenticated users can create gyms"
ON gyms FOR INSERT
WITH CHECK (owner_id = auth.uid());

-- Profiles Policies
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (id = auth.uid());

CREATE POLICY "Owners can view profiles in their gym"
ON profiles FOR SELECT
USING (
  gym_id IN (SELECT id FROM gyms WHERE owner_id = auth.uid())
);

-- Gym Settings Policies
CREATE POLICY "Owners can view their gym settings"
ON gym_settings FOR ALL
USING (
  gym_id IN (SELECT id FROM gyms WHERE owner_id = auth.uid())
);

-- Membership Plans Policies
CREATE POLICY "Owners can manage their gym plans"
ON membership_plans FOR ALL
USING (
  gym_id IN (SELECT id FROM gyms WHERE owner_id = auth.uid())
);

CREATE POLICY "Members can view active plans in their gym"
ON membership_plans FOR SELECT
USING (
  is_active = true 
  AND gym_id = (SELECT gym_id FROM profiles WHERE id = auth.uid())
);

-- Members Policies
CREATE POLICY "Owners can manage members in their gym"
ON members FOR ALL
USING (
  gym_id IN (SELECT id FROM gyms WHERE owner_id = auth.uid())
);

CREATE POLICY "Trainers can view assigned members"
ON members FOR SELECT
USING (
  assigned_trainer_id = auth.uid()
  AND gym_id = (SELECT gym_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Members can view their own profile"
ON members FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Members can update their own profile"
ON members FOR UPDATE
USING (user_id = auth.uid());

-- Member Memberships Policies
CREATE POLICY "Owners can manage memberships in their gym"
ON member_memberships FOR ALL
USING (
  member_id IN (
    SELECT id FROM members WHERE gym_id IN (
      SELECT id FROM gyms WHERE owner_id = auth.uid()
    )
  )
);

CREATE POLICY "Trainers can view assigned members' memberships"
ON member_memberships FOR SELECT
USING (
  member_id IN (
    SELECT id FROM members WHERE assigned_trainer_id = auth.uid()
  )
);

CREATE POLICY "Members can view their own memberships"
ON member_memberships FOR SELECT
USING (
  member_id IN (SELECT id FROM members WHERE user_id = auth.uid())
);

-- Attendance Policies
CREATE POLICY "Owners can manage attendance in their gym"
ON attendance FOR ALL
USING (
  gym_id IN (SELECT id FROM gyms WHERE owner_id = auth.uid())
);

CREATE POLICY "Trainers can view assigned members' attendance"
ON attendance FOR SELECT
USING (
  member_id IN (
    SELECT id FROM members WHERE assigned_trainer_id = auth.uid()
  )
);

CREATE POLICY "Members can view their own attendance"
ON attendance FOR SELECT
USING (
  member_id IN (SELECT id FROM members WHERE user_id = auth.uid())
);

-- Payments Policies
CREATE POLICY "Owners can manage payments in their gym"
ON payments FOR ALL
USING (
  gym_id IN (SELECT id FROM gyms WHERE owner_id = auth.uid())
);

CREATE POLICY "Members can view their own payments"
ON payments FOR SELECT
USING (
  member_id IN (SELECT id FROM members WHERE user_id = auth.uid())
);

-- Trainers Policies
CREATE POLICY "Owners can manage trainers in their gym"
ON trainers FOR ALL
USING (
  gym_id IN (SELECT id FROM gyms WHERE owner_id = auth.uid())
);

CREATE POLICY "Trainers can view their own profile"
ON trainers FOR SELECT
USING (id = auth.uid());

-- Workout Plans Policies
CREATE POLICY "Owners can manage workout plans in their gym"
ON workout_plans FOR ALL
USING (
  gym_id IN (SELECT id FROM gyms WHERE owner_id = auth.uid())
);

CREATE POLICY "Trainers can manage workout plans for assigned members"
ON workout_plans FOR ALL
USING (
  trainer_id = auth.uid()
  OR member_id IN (SELECT id FROM members WHERE assigned_trainer_id = auth.uid())
);

CREATE POLICY "Members can view their own workout plans"
ON workout_plans FOR SELECT
USING (
  member_id IN (SELECT id FROM members WHERE user_id = auth.uid())
);

-- Workout Plan Items Policies
CREATE POLICY "Workout plan items inherit plan permissions"
ON workout_plan_items FOR ALL
USING (
  workout_plan_id IN (
    SELECT id FROM workout_plans WHERE
      gym_id IN (SELECT id FROM gyms WHERE owner_id = auth.uid())
      OR trainer_id = auth.uid()
      OR member_id IN (SELECT id FROM members WHERE user_id = auth.uid())
  )
);

-- Diet Plans Policies (same pattern as workout plans)
CREATE POLICY "Owners can manage diet plans in their gym"
ON diet_plans FOR ALL
USING (
  gym_id IN (SELECT id FROM gyms WHERE owner_id = auth.uid())
);

CREATE POLICY "Trainers can manage diet plans for assigned members"
ON diet_plans FOR ALL
USING (
  trainer_id = auth.uid()
  OR member_id IN (SELECT id FROM members WHERE assigned_trainer_id = auth.uid())
);

CREATE POLICY "Members can view their own diet plans"
ON diet_plans FOR SELECT
USING (
  member_id IN (SELECT id FROM members WHERE user_id = auth.uid())
);

-- Diet Plan Items Policies
CREATE POLICY "Diet plan items inherit plan permissions"
ON diet_plan_items FOR ALL
USING (
  diet_plan_id IN (
    SELECT id FROM diet_plans WHERE
      gym_id IN (SELECT id FROM gyms WHERE owner_id = auth.uid())
      OR trainer_id = auth.uid()
      OR member_id IN (SELECT id FROM members WHERE user_id = auth.uid())
  )
);

-- Leads Policies
CREATE POLICY "Owners can manage leads in their gym"
ON leads FOR ALL
USING (
  gym_id IN (SELECT id FROM gyms WHERE owner_id = auth.uid())
);

-- Lead Follow-ups Policies
CREATE POLICY "Lead followups inherit lead permissions"
ON lead_followups FOR ALL
USING (
  lead_id IN (
    SELECT id FROM leads WHERE gym_id IN (
      SELECT id FROM gyms WHERE owner_id = auth.uid()
    )
  )
);

-- Message Templates Policies
CREATE POLICY "Owners can manage message templates in their gym"
ON message_templates FOR ALL
USING (
  gym_id IN (SELECT id FROM gyms WHERE owner_id = auth.uid())
);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables
CREATE TRIGGER update_gyms_updated_at BEFORE UPDATE ON gyms
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gym_settings_updated_at BEFORE UPDATE ON gym_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_membership_plans_updated_at BEFORE UPDATE ON membership_plans
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_member_memberships_updated_at BEFORE UPDATE ON member_memberships
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trainers_updated_at BEFORE UPDATE ON trainers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-create gym_settings when gym is created
CREATE OR REPLACE FUNCTION create_gym_settings_on_gym_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO gym_settings (gym_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_gym_settings
AFTER INSERT ON gyms
FOR EACH ROW
EXECUTE FUNCTION create_gym_settings_on_gym_insert();

-- Function to auto-create profile when user signs up
CREATE OR REPLACE FUNCTION create_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'MEMBER'::user_role)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_profile_on_signup();

-- ============================================
-- SEED DATA (Default Subscription Plans)
-- ============================================

INSERT INTO subscription_plans (name, tier, price_monthly, price_annual, max_members, max_trainers, max_branches, features)
VALUES
  ('Free Plan', 'FREE', 0, 0, 50, 2, 1, '{"analytics": false, "whatsapp": true, "advanced_reports": false}'),
  ('Starter Plan', 'STARTER', 999, 9990, 200, 5, 2, '{"analytics": true, "whatsapp": true, "advanced_reports": false}'),
  ('Pro Plan', 'PRO', 2999, 29990, NULL, NULL, 5, '{"analytics": true, "whatsapp": true, "advanced_reports": true, "api_access": true}'),
  ('Enterprise Plan', 'ENTERPRISE', NULL, NULL, NULL, NULL, NULL, '{"analytics": true, "whatsapp": true, "advanced_reports": true, "api_access": true, "custom_branding": true, "dedicated_support": true}');

-- ============================================
-- VIEWS (Helpful for common queries)
-- ============================================

-- Active Memberships View
CREATE OR REPLACE VIEW active_memberships AS
SELECT 
  mm.*,
  m.full_name as member_name,
  m.phone,
  m.gym_id,
  mp.name as plan_name,
  (mm.end_date - CURRENT_DATE) as days_remaining
FROM member_memberships mm
JOIN members m ON mm.member_id = m.id
JOIN membership_plans mp ON mm.membership_plan_id = mp.id
WHERE mm.status = 'ACTIVE'
  AND mm.end_date >= CURRENT_DATE;

-- Expiring Soon View (uses gym_settings for reminder_days)
CREATE OR REPLACE VIEW expiring_memberships AS
SELECT 
  mm.*,
  m.full_name as member_name,
  m.phone,
  m.email,
  m.gym_id,
  mp.name as plan_name,
  (mm.end_date - CURRENT_DATE) as days_remaining
FROM member_memberships mm
JOIN members m ON mm.member_id = m.id
JOIN membership_plans mp ON mm.membership_plan_id = mp.id
WHERE mm.status = 'ACTIVE'
  AND mm.end_date >= CURRENT_DATE
  AND (mm.end_date - CURRENT_DATE) <= 7; -- Default, should be filtered by app using gym_settings

-- ============================================
-- COMPLETION
-- ============================================

-- Schema creation complete
-- Next steps:
-- 1. Run this script in Supabase SQL Editor
-- 2. Configure Supabase Auth settings (email/phone)
-- 3. Set up Storage buckets for profile photos, receipts
-- 4. Deploy frontend and connect via environment variables
