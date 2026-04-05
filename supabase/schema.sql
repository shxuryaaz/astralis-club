-- ============================================================
-- Astralis — Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- Safe to re-run: uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- Tables
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
  id         UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name       TEXT        NOT NULL DEFAULT '',
  email      TEXT        NOT NULL DEFAULT '',
  approved   BOOLEAN     NOT NULL DEFAULT FALSE,
  role       TEXT        NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add columns that may be missing if the table already existed
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name       TEXT        NOT NULL DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email      TEXT        NOT NULL DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS approved   BOOLEAN     NOT NULL DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role       TEXT        NOT NULL DEFAULT 'member';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Add the role CHECK constraint only if it doesn't exist yet
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_role_check' AND conrelid = 'profiles'::regclass
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
      CHECK (role IN ('admin', 'member'));
  END IF;
END;
$$;

-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hackathons (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT        NOT NULL,
  date        DATE        NOT NULL,
  mode        TEXT        NOT NULL CHECK (mode IN ('online', 'offline')),
  description TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sender_name TEXT        NOT NULL,
  content     TEXT        NOT NULL CHECK (char_length(content) <= 300),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS access_requests (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT        NOT NULL,
  email      TEXT        NOT NULL,
  reason     TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- Security-definer helpers (avoids RLS recursion)
-- Using plpgsql to prevent compile-time column validation errors
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT role FROM profiles WHERE id::text = auth.uid()::text);
END;
$$;

CREATE OR REPLACE FUNCTION is_approved()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  -- Admins bypass the approval flag so RLS matches the app (see ProtectedRoute).
  RETURN COALESCE(
    (SELECT (approved OR role = 'admin') FROM profiles WHERE id::text = auth.uid()::text),
    false
  );
END;
$$;

-- ────────────────────────────────────────────────────────────
-- Row Level Security
-- ────────────────────────────────────────────────────────────

ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathons      ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages        ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before recreating (safe re-run)
DROP POLICY IF EXISTS "profiles_select"               ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin"         ON profiles;
DROP POLICY IF EXISTS "hackathons_select"             ON hackathons;
DROP POLICY IF EXISTS "hackathons_write_admin"        ON hackathons;
DROP POLICY IF EXISTS "messages_select"               ON messages;
DROP POLICY IF EXISTS "messages_insert"               ON messages;
DROP POLICY IF EXISTS "access_requests_insert"        ON access_requests;
DROP POLICY IF EXISTS "access_requests_select_admin"  ON access_requests;
DROP POLICY IF EXISTS "access_requests_delete_admin"  ON access_requests;

-- profiles ───────────────────────────────────────────────────

CREATE POLICY "profiles_select"
  ON profiles FOR SELECT
  USING (auth.uid()::text = id::text OR get_my_role() = 'admin');

CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

-- hackathons ─────────────────────────────────────────────────

CREATE POLICY "hackathons_select"
  ON hackathons FOR SELECT
  USING (is_approved());

CREATE POLICY "hackathons_write_admin"
  ON hackathons FOR ALL
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

-- messages ───────────────────────────────────────────────────

CREATE POLICY "messages_select"
  ON messages FOR SELECT
  USING (is_approved());

CREATE POLICY "messages_insert"
  ON messages FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text AND is_approved());

-- access_requests ────────────────────────────────────────────

-- Anyone (including anonymous) can submit a request
CREATE POLICY "access_requests_insert"
  ON access_requests FOR INSERT
  WITH CHECK (true);

-- Only admins can read requests
CREATE POLICY "access_requests_select_admin"
  ON access_requests FOR SELECT
  USING (get_my_role() = 'admin');

-- Only admins can dismiss (delete) requests
CREATE POLICY "access_requests_delete_admin"
  ON access_requests FOR DELETE
  USING (get_my_role() = 'admin');

-- ────────────────────────────────────────────────────────────
-- Auto-create profile row on new signup
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, name, email)
  VALUES (
    NEW.id::text,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ────────────────────────────────────────────────────────────
-- Enable Realtime for the messages table
-- ────────────────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- ────────────────────────────────────────────────────────────
-- Notes
-- ────────────────────────────────────────────────────────────
-- 1. User flow:
--    a. User fills /request form (name, email, reason, password)
--    b. App calls supabase.auth.signUp() → trigger creates profile (approved=false)
--    c. Reason is stored in access_requests for admin context
--    d. Admin goes to /admin → Requests tab → clicks Approve
--    e. User can now sign in at /login
--
-- 2. To bootstrap YOUR admin account (first time only), run either:
--      UPDATE profiles SET approved = true, role = 'admin' WHERE email = 'your@email.com';
--    or (role = admin alone is enough for app + RLS once is_approved() includes admins):
--      UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
--
-- 3. IMPORTANT: Disable email confirmation in Supabase to avoid
--    users needing to confirm email before profile is usable:
--    Dashboard → Authentication → Email → Confirm email = OFF
--    (Optional but recommended for this approval-gated flow)
